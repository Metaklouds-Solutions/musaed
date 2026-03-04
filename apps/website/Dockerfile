# Build context: repository root
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/website/package.json ./apps/website/
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/website/node_modules ./apps/website/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm -F @musaed/website build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/apps/website/.next/standalone ./
COPY --from=build /app/apps/website/.next/static ./apps/website/.next/static
COPY --from=build /app/apps/website/public ./apps/website/public
EXPOSE 8080
CMD ["node", "apps/website/server.js"]
