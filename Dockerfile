# ============================================================================
# Talenti frontend — build multi-stage + nginx
#
#   Stage 1 (build):  npm install + `vite build` → /app/dist
#   Stage 2 (serve):  nginx sirve el bundle estático y hace de proxy de la
#                     API del backend (BD_Bolsa_Trabajo) manteniendo el
#                     mismo origen para el navegador (sin CORS).
#
# El upstream de la API se configura con la variable API_UPSTREAM en runtime
# (ver nginx.conf / docker-compose.yml); no hace falta rebuild.
# ============================================================================

# --- Stage 1: build --------------------------------------------------------- #
FROM node:22-alpine AS build

WORKDIR /app

# Dependencias primero (mejor cache de capas). El repo usa bun.lock, así que
# no hay package-lock para `npm ci`; se instala desde package.json.
COPY package.json ./
RUN npm install --no-audit --no-fund

# resto del proyecto + build (sin env: el frontend habla same-origin y el
# proxy de nginx resuelve la API en runtime)
COPY . .
RUN npm run build

# --- Stage 2: serve --------------------------------------------------------- #
FROM nginx:1.27-alpine

# Plantilla nginx: nginx-template → /etc/nginx/conf.d/default.conf con
# envsubst de las variables definidas (API_UPSTREAM) al arrancar.
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Upstream por defecto del proxy de nginx (sobreescribible en runtime con
# `docker run -e API_UPSTREAM=web:8000` o en docker-compose.yml).
ENV API_UPSTREAM=host.docker.internal:8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
