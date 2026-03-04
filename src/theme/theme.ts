/**
 * Design tokens from .cursor/Design.json — Dark Glass Analytics Dashboard System.
 * Single source of truth for colors, typography, spacing, shadows, layout.
 * Use these in components and keep index.css CSS variables in sync.
 */

export const designSystemName = 'DarkGlass Analytics Dashboard System';
export const version = '1.0.0';

// ─── Color system ───────────────────────────────────────────────────────────
export const colors = {
  background: {
    primary: '#0B0F19',
    secondary: '#111827',
    elevated: '#151B2C',
    sidebar: '#0D1322',
  },
  surface: {
    card: 'rgba(255,255,255,0.03)',
    glass: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
    borderCard: 'rgba(255,255,255,0.06)',
  },
  accent: {
    primaryGradient: ['#7C5CFF', '#B47CFF'] as const,
    primaryGradientCss: 'linear-gradient(135deg, #7C5CFF 0%, #B47CFF 100%)',
    secondaryAccent: '#4F46E5',
    highlightGlow: 'rgba(124,92,255,0.4)',
  },
  status: {
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.7)',
    muted: 'rgba(255,255,255,0.5)',
  },
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────
export const fontFamily = 'Inter, SF Pro, system-ui, sans-serif';

export const typography = {
  display: { fontSize: '32px', fontWeight: 600, letterSpacing: '-0.5px' },
  heading: { fontSize: '20px', fontWeight: 600 },
  subheading: { fontSize: '16px', fontWeight: 500 },
  body: { fontSize: '14px', fontWeight: 400 },
  caption: { fontSize: '12px', fontWeight: 400 },
} as const;

// ─── Layout ─────────────────────────────────────────────────────────────────
export const layout = {
  grid: { type: '12-column' as const, maxWidth: '1440px', gutter: '24px', margin: '32px' },
  topBar: { height: '64px' },
  sidebar: { width: '240px' },
  mainContent: { padding: '32px' },
} as const;

// ─── Component system ───────────────────────────────────────────────────────
export const component = {
  card: {
    borderRadius: '16px',
    background: 'glass surface',
    border: '1px solid rgba(255,255,255,0.06)',
    shadow: '0 8px 30px rgba(0,0,0,0.4)',
    shadowHover: '0 12px 40px rgba(0,0,0,0.6)',
    padding: '20px',
    hoverTranslateY: '-2px',
  },
  button: {
    borderRadius: '12px',
    padding: '10px 16px',
    fontWeight: 500,
    primary: {
      shadow: '0 4px 20px rgba(124,92,255,0.4)',
    },
    secondary: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: 'white',
    },
  },
  input: {
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  navigationItem: {
    borderRadius: '10px',
    padding: '10px 14px',
    activeBackground: 'rgba(255,255,255,0.08)',
    hoverBackground: 'rgba(255,255,255,0.05)',
  },
  badge: {
    borderRadius: '999px',
    padding: '4px 10px',
    background: 'rgba(255,255,255,0.08)',
    fontSize: '12px',
  },
} as const;

// ─── Spacing scale (base 4) ─────────────────────────────────────────────────
export const spacing = {
  baseUnit: 4,
  scale: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const,
  /** Token names for use in CSS */
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Responsive breakpoints ───────────────────────────────────────────────────
export const breakpoints = {
  mobile: 768,
  tablet: 768,
  desktop: 1280,
} as const;

export const media = {
  mobile: `(max-width: ${breakpoints.mobile - 1}px)`,
  tablet: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  desktop: `(min-width: ${breakpoints.desktop}px)`,
  tabletOrDesktop: `(min-width: ${breakpoints.tablet}px)`,
} as const;

// ─── Animation ───────────────────────────────────────────────────────────────
export const animation = {
  duration: '250ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
