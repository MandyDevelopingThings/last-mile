FROM node:22-slim AS base

WORKDIR /app

COPY package*.json ./

FROM base AS development

RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

FROM development AS builder

RUN npm run build
RUN npm prune --production

FROM base AS production

USER node

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
