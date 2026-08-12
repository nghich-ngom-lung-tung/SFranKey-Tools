FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile=false
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @sfrankey/api build
FROM node:22-alpine
WORKDIR /app
COPY --from=base /app/apps/api/dist apps/api/dist
COPY --from=base /app/apps/api/package.json apps/api/package.json
COPY --from=base /app/node_modules node_modules
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
