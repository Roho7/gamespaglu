# Build context is the REPO ROOT, not server/ — the build needs shared/ too.
#   fly deploy --config server/fly.toml --dockerfile server/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app

COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci

COPY server/tsconfig.json ./server/
COPY shared ./shared
COPY server/src ./server/src
RUN cd server && npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/server/dist ./dist

EXPOSE 8080
USER node
CMD ["node", "dist/server/src/index.js"]
