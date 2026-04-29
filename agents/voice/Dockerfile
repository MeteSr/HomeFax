# Build context: repo root  (docker build -f agents/voice/Dockerfile .)
#
# tsconfig rootDir is ".." (= agents/), so tsc needs both agents/voice/ and
# agents/maintenance/ present side-by-side.  The compiled output lands at
# agents/voice/dist/voice/server.js (mirror of the rootDir-relative path).

# ── Stage 1: compile ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first (better layer caching)
COPY agents/voice/package.json agents/voice/package-lock.json ./voice/
RUN cd voice && npm ci

# Copy source — both voice/ and maintenance/ must mirror the on-disk layout
# so TypeScript can resolve ../maintenance/* imports.
COPY agents/voice/ ./voice/
COPY agents/maintenance/ ./maintenance/

RUN cd voice && npm run build
# Output: /app/voice/dist/voice/server.js  (rootDir=.. → voice/server.ts)

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

COPY agents/voice/package.json agents/voice/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/voice/dist ./dist

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/voice/server.js"]
