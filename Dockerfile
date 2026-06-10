# Self-contained demo image for Soft Split: Postgres + NestJS API + Next.js frontend
# in a single container. Build: `docker build -t softsplit .`
# Run:   `docker run --rm -p 3000:3000 -p 7000:7000 softsplit`
# Then open http://localhost:3000.

FROM node:20-alpine

# --- Postgres + helpers ---
RUN apk add --no-cache postgresql postgresql-contrib su-exec bash

ENV PGDATA=/var/lib/postgresql/data \
    POSTGRES_USER=soft \
    POSTGRES_PASSWORD=softpass \
    POSTGRES_DB=expense_sharing

RUN mkdir -p /run/postgresql "$PGDATA" \
 && chown -R postgres:postgres /run/postgresql "$PGDATA"

# --- Build API (keep dev deps: migration:run uses typeorm-ts-node-commonjs) ---
WORKDIR /app/api
COPY soft-split-api/package*.json ./
RUN npm install
COPY soft-split-api/ ./
RUN npm run build

# --- Build Frontend (NEXT_PUBLIC_* must be inlined at build time) ---
WORKDIR /app/frontend
COPY soft-split-frontend/package*.json ./
# --legacy-peer-deps: react-day-picker@8.10.1 still declares peer react@^18
# even though it works fine with React 19 at runtime.
RUN npm install --legacy-peer-deps
COPY soft-split-frontend/ ./
ARG NEXT_PUBLIC_API_URL=http://localhost:7000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# --- API runtime env (talks to Postgres on the same loopback) ---
ENV DB_HOST=localhost \
    DB_PORT=5432 \
    DB_USERNAME=soft \
    DB_PASSWORD=softpass \
    DB_DATABASE=expense_sharing \
    DB_SSL=false \
    JWT_SECRET=dev_jwt_secret_change_in_production \
    ADMIN_SECRET=dev_admin_secret_change_in_production \
    PORT=7000 \
    NODE_ENV=development

WORKDIR /app
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000 7000

CMD ["docker-entrypoint.sh"]
