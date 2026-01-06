# Build
FROM node:alpine AS build
WORKDIR /app

# Habilita pnpm vía corepack
RUN corepack enable

# Copia manifests primero (para aprovechar cache)
COPY package.json pnpm-lock.yaml ./

# Instala dependencias (usa lockfile)
RUN pnpm install --frozen-lockfile

# Copia el resto y compila
COPY . .
RUN pnpm build

# Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
