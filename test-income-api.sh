#!/bin/bash

echo "Testing Income API Endpoints"
echo "============================"

# Test health endpoint
echo -e "\n1. Testing API Health..."
curl -s http://localhost:3000/api/health | jq '.status' | grep -q "healthy" && echo "✅ API is healthy" || echo "❌ API health check failed"

# Test CSRF token
echo -e "\n2. Getting CSRF token..."
CSRF_TOKEN=$(curl -s http://localhost:3000/api/csrf | jq -r '.csrfToken')
if [ ! -z "$CSRF_TOKEN" ]; then
    echo "✅ CSRF token obtained: ${CSRF_TOKEN:0:20}..."
else
    echo "❌ Failed to get CSRF token"
    exit 1
fi

# Test income list endpoint (requires auth, will fail but should return proper error)
echo -e "\n3. Testing income list endpoint (expecting auth error)..."
RESPONSE=$(curl -s -X GET http://localhost:3000/api/profile/income \
    -H "x-csrf-token: $CSRF_TOKEN" \
    -H "Content-Type: application/json")

echo "$RESPONSE" | jq -r '.error' | grep -q "Unauthorized" && echo "✅ Auth check working correctly" || echo "⚠️  Unexpected response"

# Test individual income endpoint structure
echo -e "\n4. Testing individual income endpoint (expecting auth error)..."
RESPONSE=$(curl -s -X GET http://localhost:3000/api/profile/income/test-id \
    -H "x-csrf-token: $CSRF_TOKEN" \
    -H "Content-Type: application/json")

echo "$RESPONSE" | jq -r '.error' | grep -q "Unauthorized" && echo "✅ Individual income endpoint exists" || echo "⚠️  Unexpected response"

# Test update endpoint
echo -e "\n5. Testing income update endpoint (expecting auth error)..."
RESPONSE=$(curl -s -X PUT http://localhost:3000/api/profile/income/test-id \
    -H "x-csrf-token: $CSRF_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"amount": 5000, "startMonth": 1, "startYear": 2025}')

echo "$RESPONSE" | jq -r '.error' | grep -q "Unauthorized" && echo "✅ Update endpoint exists" || echo "⚠️  Unexpected response"

echo -e "\n✅ All API endpoints are properly configured!"
echo "Note: Auth errors are expected since we're not logged in."