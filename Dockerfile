FROM node:20-alpine
RUN apk add --no-cache dumb-init curl
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 appuser

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY index.js ./
COPY src ./src

RUN mkdir -p uploads && chown -R appuser:nodejs /app
USER appuser

EXPOSE 6002
ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
