#!/bin/bash

# Development Server Stopper
# Stops both frontend and backend servers to save battery

echo "🛑 Stopping RetireZest Development Servers..."
echo ""

# Stop Next.js
if pgrep -f "next dev" > /dev/null; then
  echo "⚛️  Stopping Next.js..."
  pkill -f "next dev"
  pkill -f "next-server"
  echo "   ✓ Next.js stopped"
else
  echo "   Next.js not running"
fi

# Stop Python API
if lsof -ti:8000 > /dev/null 2>&1; then
  echo "📊 Stopping Python API..."
  lsof -ti:8000 | xargs kill -9 2>/dev/null
  echo "   ✓ Python API stopped"
else
  echo "   Python API not running"
fi

echo ""
echo "✅ All servers stopped - battery drain reduced!"
echo ""
echo "💡 To start servers again, run: ./dev-start.sh"
echo ""
