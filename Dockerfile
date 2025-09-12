# =====================================
# FILE: Dockerfile (root directory)
# =====================================
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage for client
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build stage for server
FROM base AS server
WORKDIR /app
COPY server/ ./server/
COPY database/ ./database/
COPY --from=client-builder /app/client/dist ./client/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set permissions
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001
CMD ["node", "server/index.js"]