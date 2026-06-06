# Build
FROM node:lts-alpine AS build
WORKDIR /app

# Habilita pnpm vía corepack
RUN corepack enable

# VITE_API_URL se inyecta como build-arg desde el workflow de CI/CD.
# Queda embebido en el bundle de JS por Vite al momento de compilar.
# Default: vacío → el frontend usa URLs relativas (/api/v1/...).
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

# Copia manifests primero (para aprovechar cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instala dependencias (usa lockfile)
RUN pnpm install --frozen-lockfile

# Copia el resto y valida antes de buildear
COPY . .
RUN pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build

# Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
