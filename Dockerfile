FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY index.ts ./
COPY src ./src
RUN npm run build \
 && cp src/db/*.sql dist/src/db/ \
 && mkdir -p dist/src/db/migrations \
 && cp src/db/migrations/*.sql dist/src/db/migrations/ \
 && mkdir -p dist/src/db/seed \
 && cp src/db/seed/*.sql dist/src/db/seed/


FROM node:20-alpine
RUN apk add --no-cache dumb-init curl
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 appuser

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads && chown -R appuser:nodejs /app
USER appuser

EXPOSE 6002
ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "node dist/src/db/migrate.js && node dist/index.js"]
