#!/bin/bash

echo "========================================"
echo "US-044 Auto-Optimization Test"
echo "Scenario: RRIF-heavy with rrif-frontload strategy"
echo "Expected: Should switch to tfsa-first to eliminate gaps"
echo "========================================"
echo ""

curl -s -X POST http://localhost:8000/api/run-simulation \
  -H "Content-Type: application/json" \
  -d @test_optimization_simple.json | python3 parse_optimization_result.py

echo ""
echo "========================================"
