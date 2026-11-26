# syntax=docker/dockerfile:1

# ---- build: install everything, typecheck, build the frontend and compile the server ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run build:server

# ---- runtime: production dependencies, the built frontend and the compiled server (plain node, no TypeScript) ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    PGLITE_DIR=/app/.data/pglite
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: `prepare` installs git hooks (husky, a dev dependency) — nothing to do in an image.
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/build/server ./build/server
# The embedded database (used when DATABASE_URL is empty) lives here; mount a volume to keep it.
RUN mkdir -p /app/.data && chown -R node:node /app/.data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/system/health" > /dev/null || exit 1
# Run node directly (not npm) so SIGTERM reaches the server and it shuts down gracefully.
CMD ["node", "--enable-source-maps", "build/server/server.mjs"]
