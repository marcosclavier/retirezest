#!/usr/bin/env python3
"""Parse and display auto-optimization test results"""

import sys
import json

try:
    data = json.load(sys.stdin)
except json.JSONDecodeError as e:
    print(f"ERROR: Invalid JSON - {e}")
    sys.exit(1)

print('SUCCESS:', data.get('success'))
print('MESSAGE:', data.get('message'))
print()

if 'summary' in data:
    s = data['summary']
    print('SIMULATION RESULTS:')
    print(f"  Years Funded: {s.get('years_funded')}/{s.get('years_simulated')}")
    print(f"  Success Rate: {s.get('success_rate') * 100:.1f}%")
    print()

if 'optimization_result' in data and data['optimization_result']:
    opt = data['optimization_result']
    print('✨ AUTO-OPTIMIZATION TRIGGERED!')
    print(f"  From: {opt.get('original_strategy')}")
    print(f"  To: {opt.get('optimized_strategy')}")
    print(f"  Gaps Eliminated: {opt.get('gaps_eliminated')} years")
    print(f"  Original Success Rate: {opt.get('original_success_rate') * 100:.1f}%")
    print(f"  Optimized Success Rate: {opt.get('optimized_success_rate') * 100:.1f}%")
    print(f"  Tax Impact: {opt.get('tax_increase_pct'):+.1f}% (${opt.get('tax_increase_amount'):+,.0f})")
    print(f"  Score Improvement: +{opt.get('score_improvement'):.1f} points")
    print(f"  Reason: {opt.get('optimization_reason')}")
else:
    print('⚠️ NO OPTIMIZATION OCCURRED')
