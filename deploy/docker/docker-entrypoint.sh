#!/bin/sh
set -e

echo "🚀 Starting Finance App container..."

# Wait a bit for database to be fully ready (docker-compose healthcheck should handle this, but give it a moment)
echo "⏳ Waiting for database connection..."
sleep 3

# Run migrations (Prisma will retry on connection errors)
echo "📦 Running database migrations..."
npx prisma migrate deploy || {
  echo "⚠️  Migration command completed (may have failed or already applied)"
  echo "Continuing with application startup..."
}
echo "✅ Database setup completed"

# Start the application
echo "🎯 Starting Next.js dev server..."
exec "$@"

