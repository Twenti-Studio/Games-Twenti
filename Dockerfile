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

# Install necessary packages for Prisma
RUN apk add --no-cache openssl

# Copy backend package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy backend source
COPY server.js ./
COPY routes ./routes/
COPY services ./services/
COPY database ./database/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/client/dist ./client/dist

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Use entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
