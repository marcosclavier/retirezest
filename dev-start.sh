#!/bin/bash

# Development Server Starter
# Starts both frontend and backend servers

echo "🚀 Starting RetireZest Development Servers..."
echo ""

# Check if servers are already running
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠️  Port 3000 already in use. Stopping existing Next.js server..."
  pkill -f "next dev"
  sleep 1
fi

if lsof -ti:8000 > /dev/null 2>&1; then
  echo "⚠️  Port 8000 already in use. Stopping existing Python API..."
  lsof -ti:8000 | xargs kill -9 2>/dev/null
  sleep 1
fi

# Start Python API in background
echo "📊 Starting Python API on port 8000..."
cd juan-retirement-app
python3 -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000 > ../logs/python-api.log 2>&1 &
PYTHON_PID=$!
echo "   Python API started (PID: $PYTHON_PID)"
cd ..

# Wait a moment for Python API to start
sleep 2

# Start Next.js frontend
echo "⚛️  Starting Next.js frontend on port 3000..."
cd webapp
npm run dev > ../logs/nextjs.log 2>&1 &
NEXT_PID=$!
echo "   Next.js started (PID: $NEXT_PID)"
cd ..

echo ""
echo "✅ All servers started!"
echo ""
echo "   Frontend:  http://localhost:3000"
echo "   API:       http://localhost:8000"
echo ""
echo "💡 To stop servers, run: ./dev-stop.sh"
echo "📊 Logs are in ./logs/"
echo ""
