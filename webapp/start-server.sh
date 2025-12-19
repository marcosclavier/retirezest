#!/bin/sh
set -e

echo "=== Railway Deployment Debug ==="
echo "Current directory: $(pwd)"
echo "Contents:"
ls -la

echo ""
echo "Checking .next/standalone exists..."
if [ ! -d ".next/standalone" ]; then
  echo "ERROR: .next/standalone directory not found!"
  exit 1
fi

cd .next/standalone
echo "Changed to: $(pwd)"
echo "Contents of standalone:"
ls -la

echo ""
echo "Checking server.js exists..."
if [ ! -f "server.js" ]; then
  echo "ERROR: server.js not found!"
  exit 1
fi

echo ""
echo "Setting environment variables..."
export HOSTNAME="0.0.0.0"
export PORT="${PORT:-3000}"
export NODE_ENV="${NODE_ENV:-production}"

echo "HOSTNAME=$HOSTNAME"
echo "PORT=$PORT"
echo "NODE_ENV=$NODE_ENV"
echo "DATABASE_URL=${DATABASE_URL:0:30}..." # Show first 30 chars only

echo ""
echo "Starting Next.js server..."
exec node server.js
