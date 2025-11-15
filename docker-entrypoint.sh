#!/bin/sh
set -e

echo "🚀 Starting Canadian Retirement Planning App..."

# Wait a moment for filesystem to be ready
sleep 2

# Check if database exists
if [ ! -f "/app/prisma/dev.db" ]; then
  echo "📊 Database not found. Initializing..."

  # Run Prisma migrations to create database
  npx prisma migrate deploy

  echo "✅ Database initialized successfully!"
else
  echo "📊 Database found. Running migrations..."

  # Run any pending migrations
  npx prisma migrate deploy

  echo "✅ Migrations completed!"
fi

# Generate Prisma Client (ensure it's up to date)
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "✅ Setup complete! Starting application..."
echo ""

# Execute the main command (passed as arguments)
exec "$@"
