FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ ./
# Канон AD-2: YAML живёт в backend/; в образ копируем только для codegen на build.
COPY backend/openapi/openapi.yaml /backend/openapi/openapi.yaml
RUN test -f /backend/openapi/openapi.yaml

RUN npm run build

FROM nginx:1.27-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
