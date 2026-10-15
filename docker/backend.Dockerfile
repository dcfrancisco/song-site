FROM node:20.20.2-bookworm-slim

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY backend/migrations-postgres/ ./migrations-postgres/
COPY docker/postgres/init/001-schema.sql ./postgres-init/001-schema.sql

ENV NODE_ENV=production
EXPOSE 5001
CMD ["node", "server.js"]
