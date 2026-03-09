# Production-Grade Cursor Rules
> Applies to every project. Zero tolerance for code that crashes in production.

---

## RULE 0 — THE SENIOR ENGINEER MINDSET

Before writing a single line, answer these:
1. **What breaks this at runtime?** — null, undefined, empty arrays, network errors, race conditions
2. **What breaks this at scale?** — re-renders, memory leaks, unsubscribed listeners, stale closures
3. **What breaks this for the next dev?** — implicit assumptions, unclear naming, magic values

If you can't answer all three, you are not ready to write the code.

---

## 1. TypeScript — Types Are Contracts, Not Decorations

### Hard Rules
- **No `any`** — ever. Use `unknown` and narrow it.
- **No non-null assertion (`!`)** — if you use `!`, you own the crash.
- **No `as SomeType` casts** without a preceding type guard that proves it.
- **No implicit `any` from missing generics** — type every function parameter and return value.

```typescript
// ❌ CRASHES IN PRODUCTION
const name = user!.profile.name;
const data = response as ApiResponse;
function process(items: any[]) { ... }

// ✅ SAFE
if (!user?.profile) return null;
function isApiResponse(x: unknown): x is ApiResponse {
  return typeof x === 'object' && x !== null && 'data' in x;
}
const data = isApiResponse(response) ? response : null;
```

### Discriminated Unions — Use Them Everywhere

```typescript
// ❌ BAD — forces runtime checks everywhere
type Result = { data?: User; error?: string; loading?: boolean };

// ✅ GOOD — compiler tells you what's safe to access
type Result =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: string };
```

### Null Handling Policy
- APIs return `T | null`. Handle both. **Always.**
- Arrays from APIs are `T[] | undefined`. Default them: `items ?? []`.
- Dates from APIs are strings. Parse them. Validate them.

---

## 2. Error Handling — Errors Are First-Class

### Every Async Operation Has Error State

```typescript
// ❌ BAD — unhandled rejection silently swallows the error
const data = await fetchUser(id);
setUser(data);

// ✅ GOOD
try {
  const data = await fetchUser(id);
  setUser(data);
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  setError(message);
  logger.error('fetchUser failed', { id, err });
}
```

### Error Boundaries Are Not Optional
Wrap every route-level component in an `<ErrorBoundary>`. Production errors must degrade gracefully, not white-screen.

```typescript
// Every page component
<ErrorBoundary fallback={<ErrorFallback />}>
  <PageComponent />
</ErrorBoundary>
```

### Network Errors
- Always handle `401` (redirect to login), `403` (show permission denied), `404` (show not found), `5xx` (retry or surface).
- Never assume a successful HTTP status means valid data. Validate the shape.

---

## 3. React — Performance Is Correctness

### Component Size Budget

| Size | Action |
|------|--------|
| < 80 lines | Fine |
| 80–150 lines | Review — extract candidates |
| > 150 lines | **Must extract.** No exceptions. |

### Memoization Rules
- `useMemo` — for computed values that are expensive or used as stable references (passed as deps)
- `useCallback` — for handlers passed to memoized children
- `React.memo` — for pure presentational components that receive stable props
- **Do not memoize everything blindly.** Premature memoization hides bugs.

```typescript
// ❌ BAD — new array reference every render breaks memoized children
const options = items.map(toOption);

// ✅ GOOD
const options = useMemo(() => items.map(toOption), [items]);
```

### Avoid Render-Causing Anti-Patterns

```typescript
// ❌ BAD — inline object is new reference every render
<Component style={{ marginTop: 8 }} />

// ❌ BAD — inline function recreated every render
<Button onClick={() => handleClick(item.id)} />

// ✅ GOOD
const MARGIN_STYLE = { marginTop: 8 } as const;
const handleItemClick = useCallback(() => handleClick(item.id), [item.id, handleClick]);
```

### State — Keep It Minimal and Local
- Derive state from existing state instead of duplicating it.
- Lift state only as high as needed — no higher.
- Use `useReducer` when state transitions are complex or related.

```typescript
// ❌ BAD — isLoading is derivable, not independent state
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(false); // Now must be kept in sync manually

// ✅ GOOD — single source of truth
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
const isLoading = status === 'loading'; // Derived, always correct
```

---

## 4. Data Fetching — Never in Components

### Architecture
```
Component → Custom Hook → Adapter → API client
```
Components **never** directly call `fetch`, `axios`, or query functions. They consume hooks.

```typescript
// ❌ BAD — data fetching in component body
function UserProfile({ id }: { id: string }) {
  useEffect(() => {
    fetch(`/api/users/${id}`).then(r => r.json()).then(setUser);
  }, [id]);
}

// ✅ GOOD — hook encapsulates all data logic
function UserProfile({ id }: { id: string }) {
  const { user, isLoading, error } = useUser(id);
  ...
}
```

### Race Conditions — Handle Stale Fetches

```typescript
useEffect(() => {
  let cancelled = false;
  fetchUser(id).then(data => {
    if (!cancelled) setUser(data);
  });
  return () => { cancelled = true; }; // Cleanup on unmount or id change
}, [id]);
```

---

## 5. Side Effects — Cleanup Is Mandatory

Every `useEffect` that:
- Subscribes → must unsubscribe
- Sets an interval/timeout → must clear it
- Adds event listeners → must remove them
- Starts an async operation → must handle cancellation

```typescript
// ❌ MEMORY LEAK
useEffect(() => {
  const sub = store.subscribe(handler);
  // No cleanup — leaks forever
}, []);

// ✅ CORRECT
useEffect(() => {
  const sub = store.subscribe(handler);
  return () => sub.unsubscribe();
}, []);
```

---

## 6. Checks and Conditionals — Logic Must Be Obvious

### Eliminate Redundant Guards
If a parent branches on a condition, the child must not re-check it.
Passing `user` as a prop to `<UserCard>` implies `user` is defined. No null check inside.

### Named Booleans Over Inline Expressions

```typescript
// ❌ HARD TO REASON ABOUT
if (user.role === 'admin' && !user.suspended && permissions.includes('write')) { ... }

// ✅ OBVIOUS
const canEdit = user.role === 'admin' && !user.suspended && permissions.includes('write');
if (canEdit) { ... }
```

### Early Return Guard Pattern

```typescript
// ❌ BAD — deep nesting, hard to follow
function render() {
  if (user) {
    if (user.profile) {
      if (user.profile.avatar) {
        return <Avatar src={user.profile.avatar} />;
      }
    }
  }
  return null;
}

// ✅ GOOD — flat, obvious
function render() {
  if (!user?.profile?.avatar) return null;
  return <Avatar src={user.profile.avatar} />;
}
```

---

## 7. Constants — No Magic Values

```typescript
// ❌ BAD — what is 86400000? Why 3?
setTimeout(refresh, 86400000);
if (retries > 3) throw new Error('failed');

// ✅ GOOD — self-documenting
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RETRIES = 3;
setTimeout(refresh, ONE_DAY_MS);
if (retries > MAX_RETRIES) throw new Error('failed');
```

All magic strings, numbers, and config values → module-level `const` or a dedicated `constants.ts`.

---

## 8. Separation of Concerns

### File Structure (Enforce This)

```
src/
  app/            → Routing, layout, guards, providers
  modules/
    <feature>/
      pages/      → Route-level components (thin wrappers)
      components/ → Feature-specific UI components
      hooks/      → Data and state hooks
      types.ts    → Feature-local types
  adapters/       → ALL data access (API calls, transforms). No fetch() outside here.
  shared/
    ui/           → Reusable components (Button, Card, Table, Badge, PageHeader...)
    hooks/        → Cross-feature hooks
    types/        → Global types
  components/     → App-wide singletons (CommandPalette, Toast, ErrorBoundary)
```

### One File, One Responsibility

| Layer | Allowed to... | NOT allowed to... |
|-------|--------------|-------------------|
| Component | Render JSX, use hooks | Call API, access seed/mock data |
| Hook | Manage state, call adapters | Return JSX, contain business logic |
| Adapter | Call API, transform data | Import React, manage state |
| Constants | Export values | Import anything except types |

---

## 9. Accessibility — Not Optional

- All interactive elements: keyboard accessible (Enter/Space).
- `aria-label` on icon-only buttons.
- `aria-expanded` + `aria-controls` on toggles/accordions.
- `role` on non-semantic interactive elements.
- Touch targets ≥ 44×44px on mobile (WCAG 2.5.5).
- Color is never the only indicator of state.

---

## 10. Performance Budget

- **No layout thrashing.** Animations use `transform` / `opacity` only — never `width`, `height`, `top`, `left`.
- **Lazy-load routes.** Every route-level component: `const Page = lazy(() => import('./pages/Page'))`.
- **No synchronous localStorage/sessionStorage in the render path.** Read once in an initializer.
- **Images have `width` + `height`** to prevent layout shift (CLS).
- **`key` props must be stable unique IDs** — never array index when the list can reorder or filter.

```typescript
// ❌ INDEX KEY — breaks reconciliation on reorder/filter
items.map((item, i) => <Row key={i} item={item} />)

// ✅ STABLE UNIQUE KEY
items.map(item => <Row key={item.id} item={item} />)
```

---

## 11. Documentation Contract

Every **exported** function, component, hook, and adapter method must have a JSDoc block:

```typescript
/**
 * Returns paginated patient records filtered by clinic.
 *
 * @param clinicId - The clinic's UUID
 * @param page - 1-indexed page number
 * @returns Paginated result with `data`, `total`, `page`
 * @throws {ApiError} When the user lacks `patients:read` permission
 */
export async function getPatients(clinicId: string, page: number): Promise<Paginated<Patient>> { ... }
```

Non-obvious logic gets an inline comment that explains **why**, not **what**.

```typescript
// ❌ USELESS — tells us what the code already says
// Multiply by 1000
timestamp * 1000

// ✅ USEFUL — tells us WHY
// API returns UNIX seconds; JS Date expects milliseconds
new Date(timestamp * 1000)
```

---

## 12. Pre-Commit Checklist

Before every PR, the author must verify:

- [ ] No `any`, `!`, or unchecked `as` casts
- [ ] Every async call has error handling
- [ ] Every `useEffect` has cleanup if it subscribes/listens
- [ ] No `key={index}` on dynamic lists
- [ ] No data fetching inside component bodies
- [ ] No magic strings or numbers
- [ ] Every exported symbol has JSDoc
- [ ] New components are < 150 lines
- [ ] No direct access to mock/seed data from components
- [ ] `npm run build` and `npm run type-check` pass locally

---

## Appendix: Anti-Patterns That Crash Production

| Anti-pattern | Why it crashes | Fix |
|---|---|---|
| `value!` | `null` at runtime = unhandled exception | Narrow the type |
| `as T` without guard | Wrong shape = silent corruption | Write a type guard |
| `key={index}` | Stale state after reorder/filter | Use stable IDs |
| Fetch in component body | Race conditions, memory leaks | Extract to hook |
| Missing cleanup in `useEffect` | Memory leaks, stale event handlers | Return cleanup function |
| Inline object/function as prop | Infinite re-render loops | `useMemo` / `useCallback` |
| Swallowed `catch` | Silent failures, broken UI | Log + set error state |
| Direct mutation of state | Missed re-renders | Return new object/array |
| `parseInt` without radix | `parseInt('010')` = 8 in some engines | Always pass `10`: `parseInt(s, 10)` |
| `==` instead of `===` | `null == undefined` is `true` | Always use `===` |
