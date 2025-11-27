#!/bin/sh
set -e

echo "🚀 Starting Canadian Retirement Planning App..."

# Note: Database migrations should be run separately before starting the app
# You can run: docker exec retirement-app npx prisma migrate deploy
# Or run from the host: cd webapp && npx prisma migrate deploy

echo "✅ Starting server..."

# Execute the main command (passed as arguments)
exec "$@"
