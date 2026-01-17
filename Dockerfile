# ================================
# Stage 1: Build Frontend
# ================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci

# Copy client source
COPY client/ ./

# Build the frontend
RUN npm run build

# ================================
# Stage 2: Production Backend
# ================================
FROM node:20-alpine AS production

WORKDIR /app

# Install necessary packages for Prisma and shell script
RUN apk add --no-cache openssl

# Copy backend package files
COPY package*.json ./

# Install all dependencies (including prisma for migrations)
RUN npm ci

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy backend source
COPY server.js ./
COPY routes ./routes/
COPY database ./database/

# Copy built frontend from previous stage (includes public folder assets)
COPY --from=frontend-builder /app/client/dist ./client/dist

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/public/categories || exit 1

# Use entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
