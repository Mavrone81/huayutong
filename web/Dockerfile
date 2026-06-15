# Multi-stage build for the MandaMix Next.js app (container: mandamix-web).
# Deploy builds it with the deployed commit baked in for /api/v1/version:
#   GIT_SHA=$(git rev-parse --short HEAD) docker compose build web
# .git is not in the build context (see .dockerignore); next.config.mjs falls
# back to this GIT_SHA arg, so the live commit is reported without needing git.

FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA
# Build, then drop dev-only deps (typescript/tailwind/etc.) to shrink the image.
RUN npm run build && npm prune --omit=dev

FROM node:20-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
EXPOSE 3000
# `npm start` == `next start`, listens on $PORT (3000).
CMD ["npm", "start"]
