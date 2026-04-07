# ── React Frontend — multi-stage build ────────────────────────────────────────

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Передаём Google Client ID во время сборки
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine

# Удаляем дефолтный конфиг
RUN rm /etc/nginx/conf.d/default.conf

# Nginx конфиг для Docker (проксирование на backend-контейнер)
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf

# Собранный фронт
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
