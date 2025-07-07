# Build stage: compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
# Copy templates folder into dist (static files)
COPY internal/web/templates ./dist/internal/web/templates

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/cmd/expenseowl/main.mjs"]
