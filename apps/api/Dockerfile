FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/probe/package.json apps/probe/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/i18n/package.json packages/i18n/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/tool-core/package.json packages/tool-core/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci --ignore-scripts
COPY packages/shared packages/shared
COPY packages/tool-core packages/tool-core
COPY apps/api apps/api
RUN npm run build --workspace @sfrankey/api
RUN npm prune --omit=dev --ignore-scripts
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S sfrankey && adduser -S -G sfrankey sfrankey
COPY --from=base /app/apps/api/dist apps/api/dist
COPY --from=base /app/apps/api/package.json apps/api/package.json
COPY --from=base /app/node_modules node_modules
USER sfrankey
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["node", "apps/api/dist/server.js"]
