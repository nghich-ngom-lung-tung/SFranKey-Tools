FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/probe/package.json apps/probe/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/i18n/package.json packages/i18n/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/tool-core/package.json packages/tool-core/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci --ignore-scripts
COPY apps/probe apps/probe
RUN npm run build --workspace @sfrankey/probe
RUN npm prune --omit=dev --ignore-scripts
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S sfrankey && adduser -S -G sfrankey sfrankey
COPY --from=build /app/apps/probe/dist apps/probe/dist
COPY --from=build /app/node_modules node_modules
USER sfrankey
EXPOSE 53/udp 53/tcp 4050 4060
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- --header="Authorization: Bearer ${PROBE_CONTROL_TOKEN}" http://127.0.0.1:4050/health || exit 1
CMD ["node", "apps/probe/dist/server.js"]
