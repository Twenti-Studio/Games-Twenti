#!/bin/sh
set -e

echo "=== Game Twenti - Starting ==="

# Run Prisma migrations (safe for existing databases - only applies pending migrations)
echo "Running database migrations..."
npx prisma migrate deploy
echo "✓ Migrations completed"

# Run seed (uses upsert, so it's safe for existing data)
echo "Seeding database..."
npx prisma db seed || echo "⚠ Seeding skipped or failed (existing data preserved)"
echo "✓ Seed completed"

# Start the application
echo "Starting application server..."
exec node server.js
