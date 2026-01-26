"""
Test that the API endpoint returns strategy insights correctly.
"""

import json
from fastapi.testclient import TestClient
from api.main import app

# Load tax config for test client (TestClient doesn't trigger lifespan events)
from modules.config import load_tax_config
app.state.tax_cfg = load_tax_config('tax_config_canada_2025.json')

client = TestClient(app)


def test_minimize_income_insights_in_api():
    """Test that minimize-income strategy returns insights through API."""
    print("=" * 80)
    print("API INTEGRATION TEST: Strategy Insights in API Response")
    print("=" * 80)

    # Load test scenario
    with open('api/test_rafael_lucy_minimize_income.json', 'r') as f:
        data = json.load(f)

    # Flatten the structure for API (household fields at top level)
    payload = {
        'p1': data['p1'],
        'p2': data['p2'],
        **data['household']  # Spread household fields to top level
    }

    print(f'\nSending request to /api/run-simulation')
    print(f'Strategy: {payload["strategy"]}')
    print(f'Province: {payload["province"]}')

    # Make API request
    response = client.post('/api/run-simulation', json=payload)

    print(f'\nResponse status: {response.status_code}')

    if response.status_code != 200:
        print(f'❌ API request failed: {response.text}')
        return False

    result = response.json()

    # Validate response structure
    if not result.get('success'):
        print(f"Error: {result.get('error')}")
        print(f"Message: {result.get('message')}")
        print(f"Details: {result.get('error_details')}")
    assert result['success'] is True, "Simulation should succeed"
    assert 'strategy_insights' in result, "Response should include strategy_insights"

    insights = result['strategy_insights']

    if insights is None:
        print('❌ strategy_insights is null')
        return False

    print('\n✓ Strategy insights returned in API response!')

    # Validate insights structure
    print('\n' + '=' * 80)
    print('INSIGHTS VALIDATION')
    print('=' * 80)

    # GIS Feasibility
    assert 'gis_feasibility' in insights, "Missing gis_feasibility"
    gis_feas = insights['gis_feasibility']
    print(f'\n✓ GIS Feasibility:')
    print(f'  Status: {gis_feas["status"]}')
    print(f'  Eligible Years: {gis_feas["eligible_years"]}')
    print(f'  Total Projected GIS: ${gis_feas["total_projected_gis"]:,.0f}')
    print(f'  Combined RRIF: ${gis_feas["combined_rrif"]:,.0f}')
    print(f'  Max RRIF for GIS at 71: ${gis_feas["max_rrif_for_gis_at_71"]:,.0f}')

    # Strategy Effectiveness
    assert 'strategy_effectiveness' in insights, "Missing strategy_effectiveness"
    effectiveness = insights['strategy_effectiveness']
    print(f'\n✓ Strategy Effectiveness:')
    print(f'  Rating: {effectiveness["rating"]}/10')
    print(f'  Level: {effectiveness["level"]}')
    print(f'  Good Fit: {effectiveness.get("is_good_fit", "N/A")}')

    # Main Messages
    assert 'main_message' in insights, "Missing main_message"
    print(f'\n✓ Main Message:')
    print(f'  {insights["main_message"][:100]}...')

    # Recommendations
    assert 'recommendations' in insights, "Missing recommendations"
    print(f'\n✓ Recommendations: {len(insights["recommendations"])} action items')
    for rec in insights['recommendations'][:2]:
        print(f'  [{rec["priority"]}] {rec["action"][:60]}...')

    # Milestones
    assert 'key_milestones' in insights, "Missing key_milestones"
    print(f'\n✓ Key Milestones: {len(insights["key_milestones"])} events')
    for milestone in insights['key_milestones'][:3]:
        print(f'  Age {milestone["age"]}: {milestone["event"][:60]}...')

    # Summary Metrics
    assert 'summary_metrics' in insights, "Missing summary_metrics"
    metrics = insights['summary_metrics']
    print(f'\n✓ Summary Metrics:')
    print(f'  Total GIS: ${metrics["total_gis"]:,.0f}')
    print(f'  Final Net Worth: ${metrics["final_net_worth"]:,.0f}')
    print(f'  Total Tax: ${metrics["total_tax"]:,.0f}')
    print(f'  Years with GIS: {metrics["years_with_gis"]}')

    print('\n' + '=' * 80)
    print('✓ ALL VALIDATIONS PASSED')
    print('=' * 80)

    return True


if __name__ == "__main__":
    import sys
    try:
        success = test_minimize_income_insights_in_api()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f'\n❌ TEST FAILED: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
