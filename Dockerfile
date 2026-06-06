# Build
FROM node:lts-alpine AS build
WORKDIR /app

# Habilita pnpm vía corepack
RUN corepack enable

# Copia manifests primero (para aprovechar cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instala dependencias (usa lockfile)
RUN pnpm install --frozen-lockfile

# Copia el resto y valida antes de buildear
COPY . .
RUN pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build

# Serve
# nginx:alpine ejecuta `envsubst` automáticamente sobre archivos en
# /etc/nginx/templates/*.template, copiando el resultado a /etc/nginx/conf.d/.
# API_BACKEND_URL se inyecta como variable de entorno del container.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV API_BACKEND_URL=
EXPOSE 80
