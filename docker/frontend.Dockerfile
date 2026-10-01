FROM node:20.20.2-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

ARG VITE_AZURE_REDIRECT_URI
ARG VITE_ENTRA_CLIENT_ID
ARG VITE_ENTRA_TENANT_ID
ARG VITE_API_BASE_URL

COPY . ./
RUN if [ -n "$VITE_AZURE_REDIRECT_URI" ]; then export VITE_AZURE_REDIRECT_URI; fi; \
    if [ -n "$VITE_ENTRA_CLIENT_ID" ]; then export VITE_ENTRA_CLIENT_ID; fi; \
    if [ -n "$VITE_ENTRA_TENANT_ID" ]; then export VITE_ENTRA_TENANT_ID; fi; \
    if [ -n "$VITE_API_BASE_URL" ]; then export VITE_API_BASE_URL; fi; \
    npm run build:ci

FROM nginx:1.27-alpine
ARG NGINX_API_TARGET=ca-song-site-api-dev.internal.proudtree-05898de0.southeastasia.azurecontainerapps.io
ARG NGINX_API_SCHEME=https
ARG NGINX_API_SSL_NAME=ca-song-site-api-dev.internal.proudtree-05898de0.southeastasia.azurecontainerapps.io
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s|NGINX_API_TARGET|${NGINX_API_TARGET}|g; s|NGINX_API_SCHEME|${NGINX_API_SCHEME}|g; s|NGINX_API_SSL_NAME|${NGINX_API_SSL_NAME}|g" /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/song-site/browser /usr/share/nginx/html

EXPOSE 80
