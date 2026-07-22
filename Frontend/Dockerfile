# ─── Stage 1: Build the React/Vite frontend ──────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Build context is the project root (set in docker-compose.yml)
COPY Frontend/package*.json ./
RUN npm ci

COPY Frontend/ .
RUN npm run build

# ─── Stage 2: Serve with nginx ────────────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our Docker-ready nginx config (path relative to project root context)
COPY nginx-production.conf /etc/nginx/conf.d/app.conf

# Copy Vite build output into nginx's default serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

