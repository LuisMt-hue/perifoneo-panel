# syntax=docker/dockerfile:1

# ==========================================
# Etapa 1: Construcción (builder)
# ==========================================
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Capa de dependencias: copiar únicamente manifiestos para maximizar caché de capas
COPY package.json bun.lock ./

# Instalar dependencias utilizando BuildKit cache mount para acelerar re-builds
# (el caché de Bun persiste entre builds y solo se invalida si cambian los manifiestos)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

# Copiar código fuente respetando las exclusiones de .dockerignore
COPY . .

# Argumentos de construcción consumidos por Vite durante el build
ARG VITE_TRACCAR_URL
ENV VITE_TRACCAR_URL=$VITE_TRACCAR_URL

# Construir los artefactos de producción (tsc && vite build -> dist)
RUN bun run build

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

# Variables de entorno para proxy dinámico de Traccar en tiempo de ejecución
ENV TRACCAR_BACKEND_URL=http://traccar:8082
ENV NGINX_ENVSUBST_FILTER="TRACCAR_BACKEND_URL"

# Copiar configuración predeterminada de Nginx y plantilla para sustitución dinámica (envsubst)
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx nginx.conf.template /etc/nginx/templates/default.conf.template

# Puerto del servicio HTTP
EXPOSE 80

# Cierre ordenado y limpio de conexiones activas
STOPSIGNAL SIGQUIT

# Monitoreo de salud para Dokploy / Docker Swarm / Kubernetes
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
