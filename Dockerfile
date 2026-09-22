# syntax=docker/dockerfile:1

# ==========================================
# Etapa 1: Construcción (builder)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Capa de dependencias: copiar únicamente manifiestos para maximizar caché de capas
COPY package.json package-lock.json ./

# Instalar dependencias limpias utilizando BuildKit cache mount para acelerar re-builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Copiar código fuente respetando las exclusiones de .dockerignore
COPY . .

# Argumentos de construcción consumidos por Vite durante el build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_TRACCAR_URL
ENV VITE_TRACCAR_URL=$VITE_TRACCAR_URL
ARG VITE_TRACCAR_TOKEN
ENV VITE_TRACCAR_TOKEN=$VITE_TRACCAR_TOKEN

# Construir los artefactos de producción (tsc && vite build -> dist)
RUN npm run build

# ==========================================
# Etapa 2: Servidor de producción (runner)
# ==========================================
FROM nginx:alpine-slim AS runner

# Metadatos
LABEL maintainer="Perifoneo Team"
LABEL description="Perifoneo Panel SPA Nginx Distribution"

# Eliminar archivos demo/default de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar artefactos estáticos con propietario no root nginx:nginx
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copiar configuración optimizada de Nginx
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

# Puerto del servicio HTTP
EXPOSE 80

# Cierre ordenado y limpio de conexiones activas
STOPSIGNAL SIGQUIT

# Monitoreo de salud para Dokploy / Docker Swarm / Kubernetes
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
