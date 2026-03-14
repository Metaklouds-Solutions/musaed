# Build context: repository root
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/prototype/package.json ./apps/prototype/
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

FROM base AS build
WORKDIR /app
COPY --from=deps /app ./
COPY . .
ARG VITE_API_URL
ARG VITE_DATA_MODE=api
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DATA_MODE=$VITE_DATA_MODE
RUN pnpm -F @musaed/prototype build

FROM nginx:alpine AS runtime
COPY --from=build /app/apps/prototype/dist /usr/share/nginx/html
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
