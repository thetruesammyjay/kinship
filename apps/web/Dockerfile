# Build from the monorepo root: docker build -f apps/web/Dockerfile .
FROM node:22-slim AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --filter @kinship/web --frozen-lockfile=false
COPY apps/web apps/web
# NEXT_PUBLIC_* vars are inlined at build time — pass the API URL as a build arg.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN pnpm --filter @kinship/web build

FROM node:22-slim
WORKDIR /repo
RUN corepack enable
ENV NODE_ENV=production
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/web ./apps/web
EXPOSE 3000
CMD ["pnpm", "--filter", "@kinship/web", "start"]
