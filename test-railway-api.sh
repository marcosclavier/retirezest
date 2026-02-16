#!/bin/bash

# Test script for Railway API deployment
# Usage: ./test-railway-api.sh <railway-url>

if [ -z "$1" ]; then
    echo "Usage: ./test-railway-api.sh <railway-url>"
    echo "Example: ./test-railway-api.sh https://your-app.up.railway.app"
    exit 1
fi

API_URL="$1"

echo "Testing Railway API at: $API_URL"
echo "================================"

# Test root endpoint
echo "1. Testing root endpoint..."
curl -s "$API_URL/" | python3 -m json.tool

echo -e "\n2. Testing API docs..."
curl -s -o /dev/null -w "Docs endpoint: %{http_code}\n" "$API_URL/docs"

echo -e "\n3. Testing health endpoint..."
curl -s "$API_URL/api/health" | python3 -m json.tool

echo -e "\nAPI deployment test complete!"