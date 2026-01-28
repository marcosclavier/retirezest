# GIS Strategy Assessment - Developer Documentation

## Overview

The GIS Strategy Assessment feature provides AI-powered analysis and personalized recommendations for users selecting the "minimize-income" withdrawal strategy. This feature helps users understand their GIS eligibility, strategy effectiveness, and receive actionable recommendations to optimize their retirement plan.

**Status:** ✅ Production (Deployed January 2026)

---

## Architecture

### Backend (Python - FastAPI)

**Location:** `/juan-retirement-app/`

#### Core Module
**File:** `modules/strategy_insights.py`

The main module responsible for generating comprehensive GIS insights:

- `calculate_gis_feasibility()` - Performs 30-year GIS eligibility projection
- `generate_minimize_income_insights()` - Main function that orchestrates insight generation
- Helper functions for generating specific sections (recommendations, milestones, etc.)

**Key Functions:**

```python
def calculate_gis_feasibility(
    person1_rrif: float,
    person2_rrif: float,
    current_age: int,
    projection_results: dict
) -> dict:
    """
    Analyzes GIS feasibility by projecting eligibility over 30 years.

    Returns:
    - status: 'good', 'moderate', 'limited', 'not_eligible'
    - rating: 0-10 score
    - eligible_years: Number of years with GIS
    - total_projected_gis: Total GIS benefits over projection period
    - max_rrif_for_gis_at_71: Maximum RRIF balance that preserves GIS at age 71
    """

def generate_minimize_income_insights(
    user_profile: dict,
    projection_results: dict,
    input_data: dict
) -> StrategyInsights:
    """
    Generates comprehensive strategy insights including:
    - GIS feasibility assessment
    - Strategy effectiveness rating (0-10)
    - Main message and eligibility summary
    - Personalized recommendations
    - Optimization opportunities
    - Key milestones timeline
    """
```

#### Response Models
**File:** `api/models/responses.py`

Pydantic models defining the structure of strategy insights:

```python
class GISFeasibility(BaseModel):
    status: str  # 'good' | 'moderate' | 'limited' | 'not_eligible'
    rating: int  # 0-10
    eligible_years: int
    total_projected_gis: float
    max_rrif_for_gis_at_71: float
    current_rrif_p1: float
    current_rrif_p2: float
    combined_rrif: float

class StrategyRecommendation(BaseModel):
    priority: str  # 'high' | 'medium' | 'low'
    title: str
    description: str
    action: str
    expected_benefit: str

class StrategyMilestone(BaseModel):
    age: str
    event: str
    description: str
    status: str  # 'active' | 'upcoming' | 'critical' | 'future' | 'past'

class StrategyInsights(BaseModel):
    gis_feasibility: GISFeasibility
    strategy_effectiveness: dict  # Contains rating, level, message, is_good_fit, reasons
    main_message: str
    gis_eligibility_summary: str
    gis_eligibility_explanation: str
    recommendations: list[StrategyRecommendation]
    optimization_opportunities: list[str]
    key_milestones: list[StrategyMilestone]
    summary_metrics: dict  # Contains total_gis, years_with_gis, final_net_worth, etc.
```

#### Integration Point
**File:** `api/routes/simulation.py`

Strategy insights are conditionally included in simulation responses:

```python
# In run_simulation() endpoint
if strategy == "minimize-income":
    strategy_insights = generate_minimize_income_insights(
        user_profile=user_profile,
        projection_results=projection_results,
        input_data=input_data
    )
    response_data["strategy_insights"] = strategy_insights
```

---

### Frontend (Next.js/TypeScript)

#### Type Definitions
**File:** `lib/types/simulation.ts` (lines 392-469)

Complete TypeScript interfaces mirroring the Python backend models:

```typescript
export interface GISFeasibility {
  status: 'not_eligible' | 'limited' | 'moderate' | 'good';
  rating: number;
  eligible_years: number;
  total_projected_gis: number;
  max_rrif_for_gis_at_71: number;
  current_rrif_p1: number;
  current_rrif_p2: number;
  combined_rrif: number;
}

export interface StrategyRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  expected_benefit: string;
}

export interface StrategyMilestone {
  age: string;
  event: string;
  description: string;
  status: 'active' | 'upcoming' | 'critical' | 'future' | 'past';
}

export interface StrategyInsights {
  gis_feasibility: GISFeasibility;
  strategy_effectiveness: {
    rating: number;
    level: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    message: string;
    is_good_fit: boolean;
    reasons: string[];
  };
  main_message: string;
  gis_eligibility_summary: string;
  gis_eligibility_explanation: string;
  recommendations: StrategyRecommendation[];
  optimization_opportunities: string[];
  key_milestones: StrategyMilestone[];
  summary_metrics: {
    total_gis: number;
    years_with_gis: number;
    final_net_worth: number;
    total_tax: number;
    plan_years: number;
    tfsa_usage: number;
    rrif_usage: number;
  };
}

export interface SimulationResponse {
  // ... existing fields ...
  strategy_insights?: StrategyInsights;  // Optional, only for minimize-income
}
```

#### UI Component
**File:** `components/simulation/GISInsightsCard.tsx`

A comprehensive React component that displays GIS strategy insights with:

**Visual Design:**
- Color-coded status indicators (green/orange/yellow/red)
- Effectiveness rating badge
- Metric cards with key financial data
- Priority-based recommendation cards
- Timeline visualization for milestones

**Component Structure:**
```typescript
export function GISInsightsCard({ insights }: GISInsightsCardProps) {
  // Sections rendered:
  // 1. Main Strategy Assessment
  //    - Title, effectiveness rating badge
  //    - Main alert with status color
  //    - GIS Eligibility Analysis with metrics
  //    - Strategy effectiveness reasons

  // 2. Personalized Recommendations (if any)
  //    - Priority-based recommendation cards
  //    - Action items with expected benefits

  // 3. Optimization Opportunities (if any)
  //    - List of identified improvements

  // 4. Key Milestones Timeline (if any)
  //    - Age-based milestone cards with status indicators
}
```

**Color Coding:**
- `good` status: Green (text-green-600, bg-green-50)
- `moderate` status: Orange (text-orange-600, bg-orange-50)
- `limited` status: Yellow (text-yellow-600, bg-yellow-50)
- `not_eligible` status: Red (text-red-600, bg-red-50)

**Accessibility:**
- All titles use `text-gray-900` for maximum contrast
- Subtitles use `text-gray-700` for readability
- Icon indicators for different priority levels
- Semantic HTML structure

#### Integration
**File:** `components/simulation/ResultsDashboard.tsx` (lines 184-187)

Conditional rendering based on presence of strategy_insights:

```typescript
{/* GIS Strategy Insights (only for minimize-income strategy) */}
{result.strategy_insights && (
  <GISInsightsCard insights={result.strategy_insights} />
)}
```

---

## Data Flow

### 1. User Initiates Simulation
1. User completes profile (assets, income, expenses)
2. User selects "minimize-income" withdrawal strategy
3. User submits simulation request

### 2. Backend Processing
1. **API Route** (`/api/simulation/run`) receives request
2. **Python Backend** (FastAPI) performs simulation
3. **Strategy Insights Module** generates GIS analysis:
   - Calculates 30-year GIS projection
   - Analyzes RRIF balance impact on GIS eligibility
   - Generates effectiveness rating (0-10)
   - Creates personalized recommendations based on:
     - Current RRIF balances
     - Other income sources
     - Age and timing considerations
     - GIS eligibility thresholds
   - Identifies optimization opportunities
   - Maps key milestones (age 65, 71, 75, etc.)
4. **Response** includes `strategy_insights` field

### 3. Frontend Display
1. **ResultsDashboard** receives simulation response
2. Checks for presence of `strategy_insights`
3. Renders **GISInsightsCard** component if present
4. Component displays:
   - Color-coded GIS feasibility status
   - Effectiveness rating badge
   - Four key metrics cards
   - Eligibility explanation
   - Prioritized recommendations
   - Optimization opportunities
   - Milestone timeline

---

## Key Algorithms

### GIS Eligibility Calculation

The system performs a 30-year projection to determine GIS eligibility:

```python
for year in range(30):
    # Get data for this year
    year_data = projection_results['yearly_data'][year]

    # Calculate taxable income (excludes GIS, TFSA withdrawals)
    taxable_income = (
        year_data['rrif_withdrawal'] +
        year_data['nonreg_withdrawal'] +
        year_data['cpp'] +
        year_data['oas'] +
        year_data['other_income'] -
        year_data['rrsp_contribution']
    )

    # Check GIS eligibility thresholds
    if age >= 65:
        if is_couple:
            if taxable_income <= 26_496:  # 2025 threshold
                eligible_years += 1
                total_gis += year_data.get('gis', 0)
        else:
            if taxable_income <= 21_624:  # 2025 threshold
                eligible_years += 1
                total_gis += year_data.get('gis', 0)
```

### Strategy Effectiveness Rating

The system generates a 0-10 rating based on multiple factors:

```python
rating = 5  # Base rating
reasons = []

# Factor 1: GIS Benefits (+3 points max)
if total_gis > 400_000:
    rating += 3
    reasons.append("✓ Substantial GIS benefits captured")
elif total_gis > 200_000:
    rating += 2
    reasons.append("✓ Significant GIS benefits captured")
elif total_gis > 50_000:
    rating += 1
    reasons.append("✓ Moderate GIS benefits captured")

# Factor 2: RRIF Balance (-2 points if too high)
if combined_rrif > max_rrif_threshold * 2:
    rating -= 2
    reasons.append("⚠️ RRIF balance significantly exceeds GIS-friendly threshold")

# Factor 3: Other Income Impact
if annual_other_income > 15_000:
    rating -= 1
    reasons.append("⚠️ Other income reduces GIS eligibility")

# Factor 4: Years of Eligibility
if eligible_years >= 20:
    rating += 2
    reasons.append("✓ Long-term GIS eligibility (20+ years)")

# Clamp to 0-10 range
rating = max(0, min(10, rating))
```

### Recommendation Generation

Recommendations are generated based on user's specific situation:

**High Priority:**
- RRIF balance > 2x threshold → "Consider accelerated RRIF withdrawals before age 65"
- High other income → "Review income sources that may impact GIS"
- Age < 60 → "Start withdrawal planning early"

**Medium Priority:**
- Partner considerations
- TFSA optimization
- Timing of CPP/OAS start

**Low Priority:**
- Estate planning considerations
- Tax bracket management
- Annual reviews

---

## GIS Eligibility Thresholds (2025)

### Maximum Income Thresholds
- **Single:** $21,624 annual income (excluding OAS/GIS)
- **Couple (combined):** $26,496 annual income (excluding OAS/GIS)

### Maximum RRIF Balance at Age 71
The system calculates the maximum RRIF balance that preserves GIS eligibility at age 71 based on:
- CRA minimum withdrawal rate at age 71: 5.28%
- GIS income threshold
- Other income sources

**Formula:**
```python
rrif_withdrawal_rate_at_71 = 0.0528
available_income_for_rrif = gis_threshold - other_income - cpp - oas
max_rrif_balance = available_income_for_rrif / rrif_withdrawal_rate_at_71
```

**Example (Single, no other income):**
- GIS threshold: $21,624
- CPP at 65: $15,000
- OAS at 65: $8,500
- Available for RRIF: $21,624 - $15,000 = $6,624 (OAS doesn't count)
- Max RRIF at 71: $6,624 / 0.0528 = ~$125,455

---

## Testing

### Backend Testing
**File:** `juan-retirement-app/tests/test_strategy_insights.py`

Test coverage includes:
- GIS eligibility calculation accuracy
- Strategy rating algorithm
- Recommendation generation logic
- Edge cases (very high RRIF, no other income, couples)

### Frontend Testing

**Manual Testing Checklist:**
1. Run simulation with "minimize-income" strategy
2. Verify GISInsightsCard displays correctly
3. Check color coding matches status
4. Verify all metrics display with proper formatting
5. Confirm recommendations appear with correct priority
6. Test responsive layout on mobile/tablet
7. Verify accessibility (contrast, screen reader support)

**Test Cases:**
- Low RRIF balance (<$100k) → Should show "good" status
- Medium RRIF balance ($100k-$300k) → Should show "moderate" status
- High RRIF balance (>$300k) → Should show "limited" or "not_eligible"
- With/without other income
- Single vs. couple scenarios
- Different age ranges (55-70)

---

## Deployment

### Production Checklist

✅ **Backend (Railway - Python):**
- Strategy insights module deployed
- Response models updated
- Simulation endpoint includes conditional logic
- Environment variables configured

✅ **Frontend (Vercel - Next.js):**
- TypeScript interfaces added
- GISInsightsCard component created
- ResultsDashboard integration complete
- UI contrast improvements applied
- Build successful with no TypeScript errors

### Deployment History

**Commit:** `4b78963` - "fix: Improve text contrast in GIS Strategy Assessment card"
- Fixed title contrast issues (text-gray-900 for titles)
- Fixed subtitle contrast issues (text-gray-700 for descriptions)
- Improved accessibility across all sections

**Commit:** `4d5070e` - "feat: Add GIS Strategy Assessment UI component"
- Added TypeScript interfaces for strategy insights
- Created GISInsightsCard component
- Integrated into ResultsDashboard with conditional rendering

---

## Future Enhancements

### Planned Features
- [ ] Export GIS analysis as PDF section
- [ ] Historical GIS eligibility tracking over multiple simulations
- [ ] "What-if" scenarios for GIS optimization
- [ ] Comparison view (current vs. optimized strategy)
- [ ] Email alerts when GIS eligibility is at risk

### Potential Improvements
- [ ] Machine learning for personalized recommendations
- [ ] Integration with CRA data (MyAccount)
- [ ] Provincial GIS supplements analysis
- [ ] Multi-year tax optimization modeling
- [ ] Inheritance and estate impact on GIS

---

## Troubleshooting

### Issue: Strategy insights not displaying

**Symptoms:** GISInsightsCard doesn't appear after simulation

**Diagnosis:**
1. Check if strategy selected is "minimize-income"
2. Verify Python backend is running and reachable
3. Check browser console for TypeScript errors
4. Inspect network tab for API response

**Solution:**
- Ensure strategy is exactly "minimize-income" (case-sensitive in some contexts)
- Verify Python backend endpoint returns `strategy_insights` field
- Check for TypeScript interface mismatches

### Issue: Incorrect GIS eligibility calculation

**Symptoms:** GIS status doesn't match expected outcome

**Diagnosis:**
1. Review projection_results yearly_data
2. Check taxable income calculation
3. Verify GIS thresholds are current (2025 values)
4. Examine other income sources

**Solution:**
- Update GIS thresholds if outdated
- Verify RRIF minimum withdrawal calculations
- Check for income sources that should/shouldn't count toward GIS

### Issue: UI rendering issues

**Symptoms:** Cards not displaying correctly, text too light, layout broken

**Diagnosis:**
1. Check browser console for React errors
2. Verify Tailwind CSS classes are compiling
3. Test responsive breakpoints

**Solution:**
- Rebuild Next.js application (`npm run build`)
- Clear browser cache
- Check for conflicting CSS classes
- Verify all text uses explicit color classes (text-gray-900, etc.)

---

## API Reference

### SimulationResponse with Strategy Insights

**Endpoint:** `POST /api/simulation/run`

**Request Body:**
```json
{
  "strategy": "minimize-income",
  // ... other simulation parameters
}
```

**Response (partial):**
```json
{
  "yearly_data": [...],
  "summary": {...},
  "strategy_insights": {
    "gis_feasibility": {
      "status": "moderate",
      "rating": 7,
      "eligible_years": 15,
      "total_projected_gis": 437035,
      "max_rrif_for_gis_at_71": 256666,
      "current_rrif_p1": 328000,
      "current_rrif_p2": 0,
      "combined_rrif": 328000
    },
    "strategy_effectiveness": {
      "rating": 6,
      "level": "Good",
      "message": "This strategy provides moderate GIS benefits",
      "is_good_fit": true,
      "reasons": [
        "✓ Moderate GIS benefits captured ($437,035 total)",
        "✓ Strategy captures available GIS in early retirement years",
        "⚠️ RRIF balance limits sustained GIS eligibility"
      ]
    },
    "main_message": "Moderate GIS opportunity (6 years, $437,035 total)",
    "gis_eligibility_summary": "The strategy captures available GIS in early retirement years.",
    "gis_eligibility_explanation": "GIS eligibility ends at age 71 due to RRIF mandatory minimums...",
    "recommendations": [
      {
        "priority": "high",
        "title": "Accelerate RRIF Withdrawals Before Age 65",
        "description": "Your RRIF balance ($328,000) exceeds optimal levels...",
        "action": "Consider withdrawing additional funds...",
        "expected_benefit": "Extended GIS eligibility, lower lifetime taxes"
      }
    ],
    "optimization_opportunities": [
      "Maximize TFSA contributions to create tax-free income",
      "Consider delaying CPP to age 70 for 42% increase"
    ],
    "key_milestones": [
      {
        "age": "65",
        "event": "OAS & GIS Eligibility Begins",
        "description": "You become eligible for both OAS and GIS benefits",
        "status": "upcoming"
      }
    ],
    "summary_metrics": {
      "total_gis": 437035,
      "years_with_gis": 6,
      "final_net_worth": 850000,
      "total_tax": 125000,
      "plan_years": 30,
      "tfsa_usage": 45.2,
      "rrif_usage": 78.5
    }
  }
}
```

---

## Code References

### Key Files and Lines

**Backend:**
- `juan-retirement-app/modules/strategy_insights.py` - Core logic
- `juan-retirement-app/api/models/responses.py:311-370` - Response models
- `juan-retirement-app/api/routes/simulation.py:307` - Integration point

**Frontend:**
- `webapp/lib/types/simulation.ts:392-469` - TypeScript interfaces
- `webapp/components/simulation/GISInsightsCard.tsx` - UI component
- `webapp/components/simulation/ResultsDashboard.tsx:184-187` - Integration

---

## Changelog

### Version 1.1 (January 27, 2026)
- **Fixed:** Improved text contrast for better accessibility
- All titles now use text-gray-900
- All subtitles now use text-gray-700
- Enhanced visual consistency across all sections

### Version 1.0 (January 25, 2026)
- **Initial Release:** GIS Strategy Assessment feature
- AI-powered GIS eligibility analysis
- Strategy effectiveness rating system
- Personalized recommendations engine
- Visual GIS feasibility indicators
- Key milestones timeline
- Full TypeScript type safety

---

## Contact & Support

For questions or issues related to the GIS Strategy Assessment feature:

**Backend (Python):** Check `juan-retirement-app/modules/strategy_insights.py`
**Frontend (UI):** Check `webapp/components/simulation/GISInsightsCard.tsx`
**Type Definitions:** Check `webapp/lib/types/simulation.ts`

**Production Issues:** Check Vercel deployment logs and Railway Python backend logs

---

**Last Updated:** January 27, 2026
**Author:** Development Team
**Status:** Production Ready ✅
