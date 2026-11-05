# NUSKA_etno API — production image.
# Build context is the repository root:
#   docker build -f apps/api/Dockerfile -t nuska-api .

# ---- build ------------------------------------------------------------------
FROM node:22-slim AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Bundle the Prisma migration engine for the runtime platform (Debian 12, OpenSSL 3) so
# `migrate deploy` never downloads anything at release time.
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
COPY packages/validators/package.json packages/validators/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile --filter @nuska/api...

COPY tsconfig.base.json ./
COPY packages packages
COPY apps/api apps/api
# The Prisma engine for the runtime image is pinned in schema.prisma (binaryTargets).
RUN pnpm --filter @nuska/api exec prisma generate \
  && pnpm --filter @nuska/api build \
  && pnpm --filter @nuska/api deploy --prod /out \
  && cd /out && ./node_modules/.bin/prisma generate

# ---- runtime ----------------------------------------------------------------
# Distroless: Node.js + glibc + libssl only, no shell or package manager, runs as non-root.
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runtime
ENV NODE_ENV=production PORT=4000
WORKDIR /app
COPY --from=build --chown=nonroot:nonroot /out/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /out/package.json ./package.json
COPY --from=build --chown=nonroot:nonroot /out/prisma ./prisma
COPY --from=build --chown=nonroot:nonroot /repo/apps/api/dist ./dist
EXPOSE 4000
# The image entrypoint is `node`.
# Migrations: run `node_modules/prisma/build/index.js migrate deploy` (Fly.io release_command).
CMD ["dist/main.js"]
