#!/bin/sh
set -e

echo "=== Game Twenti Docker Entrypoint ==="

# Wait for database to be ready
echo "Waiting for database..."
sleep 5

# Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Check if seed is needed (first run)
echo "Checking if seeding is needed..."
npx prisma db seed || echo "Seeding skipped (already seeded or no seed script)"

# Start the application
echo "Starting application..."
exec node server.js
