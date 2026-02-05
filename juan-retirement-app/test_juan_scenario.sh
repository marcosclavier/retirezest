#!/bin/bash

echo "========================================"
echo "Testing Juan's Realistic Scenario"
echo "Assets: $800k (TFSA=$150k, RRIF=$450k, NonReg=$200k)"
echo "Strategy: rrif-frontload (should deplete RRIF too early)"
echo "Expected: May trigger optimization to tfsa-first"
echo "========================================"
echo ""

curl -s -X POST http://localhost:8000/api/run-simulation \
  -H "Content-Type: application/json" \
  -d @test_juan_realistic.json | python3 parse_optimization_result.py

echo ""
echo "========================================"
