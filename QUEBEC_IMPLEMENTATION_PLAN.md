# Quebec Support Implementation Plan for RetireZest
**Version:** 1.0.0
**Date:** February 19, 2026
**Priority:** HIGH - Addresses 23% of Canadian population

---

## Executive Summary

Quebec represents a critical market opportunity for RetireZest, comprising 23% of Canada's population (8.5M people). Quebec has distinct retirement systems including QPP instead of CPP, unique tax structures, and additional social programs. This implementation plan outlines the technical requirements, effort estimates, and phased approach to add comprehensive Quebec support.

**Estimated Total Effort:** 8-10 weeks
**Complexity:** High
**Business Impact:** Opens $2.3B retirement planning market

---

## 1. Quebec Retirement System Overview

### Key Differences from Federal System

#### Quebec Pension Plan (QPP) vs Canada Pension Plan (CPP)
| Feature | CPP (Federal) | QPP (Quebec) |
|---------|--------------|--------------|
| **Max Pensionable Earnings (2025)** | $71,300 | $71,300 |
| **Contribution Rate** | 5.95% | 6.4% |
| **Max Monthly Benefit at 65** | $1,364.60 | $1,364.60 |
| **Enhancement Phase** | 2019-2025 | 2019-2025 |
| **Survivor Benefits** | 60% of deceased's pension | Up to 60% + orphan benefits |
| **Disability Benefits** | Different calculation | More generous |
| **Child Rearing Drop-out** | Yes | Yes, different rules |
| **Pension Sharing** | Between spouses | Between spouses |
| **Additional Benefit** | None | Retirement pension supplement |

#### Quebec Tax System
- **Provincial Tax Brackets (2025):**
  - 14% on first $49,275
  - 19% on next $49,280
  - 24% on next $21,105
  - 25.75% over $119,910
- **Quebec Abatement:** 16.5% reduction in federal tax
- **Solidarity Tax Credit:** Unique to Quebec
- **Work Premium:** Quebec's version of Canada Workers Benefit
- **Additional Credits:** Many Quebec-specific tax credits

#### Quebec-Specific Programs
1. **QPIP (Quebec Parental Insurance Plan)**
2. **Quebec Drug Insurance Plan** (mandatory coverage)
3. **Quebec Family Allowance**
4. **Quebec Senior's Tax Credit**
5. **Home Support Tax Credit for Seniors**
6. **RénoVert Tax Credit**

---

## 2. Technical Requirements

### 2.1 Data Model Changes

#### Database Schema Updates
```sql
-- Add to User table
ALTER TABLE User ADD COLUMN province VARCHAR(2) DEFAULT 'ON';
ALTER TABLE User ADD COLUMN is_quebec_resident BOOLEAN DEFAULT FALSE;

-- Add to Income table
ALTER TABLE Income ADD COLUMN qpp_contributions DECIMAL;
ALTER TABLE Income ADD COLUMN qpp_years_contributed INTEGER;
ALTER TABLE Income ADD COLUMN qpp_pensionable_earnings DECIMAL;
ALTER TABLE Income ADD COLUMN qpp_estimated_benefit DECIMAL;

-- New table for Quebec-specific benefits
CREATE TABLE QuebecBenefits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES User(id),
  solidarity_credit DECIMAL,
  work_premium DECIMAL,
  senior_assistance DECIMAL,
  home_support_credit DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### TypeScript Type Updates
```typescript
// lib/types/simulation.ts
export interface PersonInput {
  // ... existing fields
  province?: 'QC' | 'ON' | 'BC' | 'AB' | 'MB' | 'SK' | 'NS' | 'NB' | 'NL' | 'PE' | 'NT' | 'YT' | 'NU';
  qppContributions?: number;
  qppYearsContributed?: number;
  qppEstimatedBenefit?: number;
  quebecBenefits?: {
    solidarityCredit?: number;
    workPremium?: number;
    seniorAssistance?: number;
    homeSupportCredit?: number;
  };
}
```

### 2.2 Python Backend Changes

#### New Modules Required
```
python-api/modules/
├── quebec/
│   ├── __init__.py
│   ├── qpp_calculator.py      # QPP benefit calculations
│   ├── quebec_tax.py           # Quebec tax calculations with abatement
│   ├── quebec_benefits.py      # Quebec-specific benefits
│   └── quebec_optimizer.py     # Quebec-specific optimization strategies
```

#### Core Calculation Changes
1. **benefits.py modifications:**
   - Add QPP calculation alongside CPP
   - Route to appropriate calculator based on province
   - Handle QPP enhancement calculations

2. **tax_calculator.py modifications:**
   - Implement Quebec provincial tax tables
   - Apply Quebec abatement to federal tax
   - Calculate Quebec-specific credits and deductions
   - Handle Quebec solidarity credit

3. **simulation.py modifications:**
   - Add province detection logic
   - Route to Quebec-specific calculations when applicable
   - Include Quebec benefits in income streams

### 2.3 Frontend Changes

#### UI Components
1. **Province Selection:**
   - Add province dropdown in Profile Settings
   - Auto-detect based on postal code if available
   - Show Quebec-specific fields when Quebec selected

2. **QPP Section:**
   - Replace CPP section with QPP for Quebec residents
   - Add QPP-specific input fields
   - Show QPP calculator instead of CPP

3. **Quebec Benefits Section:**
   - New section in Income page for Quebec benefits
   - Solidarity credit calculator
   - Work premium estimator
   - Senior assistance eligibility checker

4. **Language Support (Phase 2):**
   - French translation for all UI elements
   - French documentation
   - Bilingual report generation

---

## 3. Implementation Phases

### Phase 1: Core QPP Support (Weeks 1-3)
**Goal:** Basic QPP calculations working alongside CPP

#### Week 1: Infrastructure & Data Model
- [ ] Update database schema for Quebec fields
- [ ] Create TypeScript types for Quebec data
- [ ] Add province selection to user profile
- [ ] Create Quebec module structure in Python

#### Week 2: QPP Calculator Implementation
- [ ] Implement QPP benefit calculations
- [ ] Add QPP enhancement logic
- [ ] Create QPP vs CPP comparison logic
- [ ] Add survivor and disability benefit calculations

#### Week 3: Integration & Testing
- [ ] Integrate QPP with main simulation engine
- [ ] Update withdrawal strategies for Quebec
- [ ] Create comprehensive QPP test suite
- [ ] Validate against Retraite Québec calculators

**Deliverable:** Users can select Quebec and get QPP instead of CPP

### Phase 2: Quebec Tax System (Weeks 4-6)
**Goal:** Accurate Quebec tax calculations with abatement

#### Week 4: Tax Tables & Abatement
- [ ] Implement Quebec provincial tax brackets
- [ ] Add Quebec abatement calculation (16.5%)
- [ ] Update federal tax calculation for Quebec
- [ ] Create Quebec tax credit calculations

#### Week 5: Quebec-Specific Credits
- [ ] Solidarity tax credit calculator
- [ ] Senior's tax credits
- [ ] Work premium calculations
- [ ] Home support credit for seniors

#### Week 6: Tax Optimization
- [ ] Update tax optimizer for Quebec rules
- [ ] Add Quebec-specific strategies
- [ ] RRSP vs QPP trade-offs
- [ ] Test comprehensive tax scenarios

**Deliverable:** Accurate Quebec tax calculations with all credits

### Phase 3: Quebec Benefits & Programs (Weeks 7-8)
**Goal:** Complete Quebec benefit ecosystem

#### Week 7: Benefit Calculations
- [ ] Quebec Drug Insurance Plan costs
- [ ] Quebec Family Allowance (if applicable)
- [ ] Senior assistance programs
- [ ] Social assistance interactions

#### Week 8: UI & Integration
- [ ] Create Quebec benefits UI section
- [ ] Add Quebec-specific tooltips/help
- [ ] Update reports for Quebec users
- [ ] Create Quebec validation tests

**Deliverable:** Full Quebec retirement planning support

### Phase 4: French Language Support (Weeks 9-10)
**Goal:** Bilingual support for Quebec market

#### Week 9: Translation Infrastructure
- [ ] Set up i18n framework
- [ ] Create French translation files
- [ ] Translate core UI elements
- [ ] Add language toggle

#### Week 10: French Content & Polish
- [ ] Translate all help text and tooltips
- [ ] French report generation
- [ ] French email templates
- [ ] Quebec-specific documentation

**Deliverable:** Fully bilingual application

---

## 4. Detailed Technical Specifications

### 4.1 QPP Calculation Logic

```python
# qpp_calculator.py
class QPPCalculator:
    def calculate_qpp_benefit(
        self,
        pensionable_earnings: List[float],
        start_age: int,
        years_contributed: int,
        disability: bool = False
    ) -> QPPBenefit:
        """
        Calculate QPP retirement benefit based on Quebec rules

        Key differences from CPP:
        - Higher contribution rate (6.4% vs 5.95%)
        - Retirement pension supplement for low-income
        - Different survivor benefit calculation
        """

        # Base calculation similar to CPP
        average_earnings = self._calculate_average_pensionable_earnings(
            pensionable_earnings,
            years_contributed
        )

        # Apply QPP-specific adjustments
        base_benefit = average_earnings * 0.25  # 25% of average

        # Age adjustment (0.6% per month before/after 65)
        age_factor = self._calculate_age_factor(start_age)
        adjusted_benefit = base_benefit * age_factor

        # QPP Enhancement (post-2019 contributions)
        enhancement = self._calculate_qpp_enhancement(
            pensionable_earnings[-6:] if len(pensionable_earnings) >= 6 else []
        )

        # Retirement pension supplement (low-income)
        supplement = self._calculate_retirement_supplement(adjusted_benefit)

        return QPPBenefit(
            base_amount=adjusted_benefit,
            enhancement=enhancement,
            supplement=supplement,
            total_monthly=adjusted_benefit + enhancement + supplement
        )
```

### 4.2 Quebec Tax Calculation

```python
# quebec_tax.py
class QuebecTaxCalculator:
    def calculate_quebec_tax(
        self,
        taxable_income: float,
        federal_tax: float
    ) -> QuebecTaxResult:
        """
        Calculate Quebec provincial tax with abatement
        """

        # Quebec provincial tax
        provincial_tax = self._calculate_provincial_tax(taxable_income)

        # Apply Quebec abatement to federal tax (16.5% reduction)
        QUEBEC_ABATEMENT = 0.165
        federal_after_abatement = federal_tax * (1 - QUEBEC_ABATEMENT)

        # Quebec-specific credits
        solidarity_credit = self._calculate_solidarity_credit(taxable_income)
        work_premium = self._calculate_work_premium(taxable_income)
        senior_credit = self._calculate_senior_credit(taxable_income)

        # Total Quebec tax
        total_quebec_tax = provincial_tax - solidarity_credit - work_premium - senior_credit

        return QuebecTaxResult(
            provincial_tax=provincial_tax,
            federal_tax=federal_after_abatement,
            quebec_abatement=federal_tax * QUEBEC_ABATEMENT,
            solidarity_credit=solidarity_credit,
            work_premium=work_premium,
            total_tax=federal_after_abatement + total_quebec_tax
        )
```

### 4.3 Frontend Province Detection

```typescript
// components/profile/ProvinceSelector.tsx
export function ProvinceSelector({
  value,
  onChange,
  showQuebecWarning = true
}: ProvinceSelectorProps) {
  const handleProvinceChange = (province: string) => {
    onChange(province);

    if (province === 'QC' && showQuebecWarning) {
      // Show Quebec-specific information
      toast.info(
        "Quebec selected: Your retirement planning will now use QPP instead of CPP, " +
        "Quebec tax rates, and Quebec-specific benefits.",
        { duration: 5000 }
      );
    }
  };

  return (
    <Select value={value} onValueChange={handleProvinceChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select province" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="QC">
          <div className="flex items-center gap-2">
            <span>Quebec</span>
            <Badge variant="outline" className="text-xs">QPP</Badge>
          </div>
        </SelectItem>
        <SelectItem value="ON">Ontario</SelectItem>
        {/* ... other provinces */}
      </SelectContent>
    </Select>
  );
}
```

---

## 5. Testing Strategy

### 5.1 Unit Tests
- QPP calculation accuracy tests
- Quebec tax calculation tests
- Quebec abatement verification
- Credit and deduction calculations

### 5.2 Integration Tests
- End-to-end Quebec resident simulation
- CPP to QPP switching scenarios
- Province change impact tests
- Tax optimization for Quebec

### 5.3 Validation Tests
- Compare with Retraite Québec official calculator
- Validate against Revenu Québec tax calculators
- Cross-reference with H&R Block Quebec
- Test with real Quebec resident scenarios

### 5.4 Test Data Requirements
```python
# test_quebec_scenarios.py
QUEBEC_TEST_CASES = [
    {
        "name": "Average Quebec Worker",
        "age": 60,
        "qpp_contributions": 35,  # years
        "average_earnings": 55000,
        "expected_qpp": 1050,  # monthly
        "expected_provincial_tax": 8500
    },
    {
        "name": "High Income Quebec Professional",
        "age": 65,
        "qpp_contributions": 40,
        "average_earnings": 85000,
        "expected_qpp": 1364,  # max benefit
        "expected_provincial_tax": 18000
    },
    {
        "name": "Low Income Senior with Supplements",
        "age": 70,
        "qpp_contributions": 25,
        "average_earnings": 25000,
        "expected_qpp": 600,
        "solidarity_credit": 1200,
        "expected_provincial_tax": 1500
    }
]
```

---

## 6. Data Migration Strategy

### Existing Users
1. Default all existing users to their current assumed province (ON)
2. Send email campaign to Quebec users to update profile
3. Provide one-click migration for Quebec residents
4. Recalculate simulations with Quebec rules when switched

### New Users
1. Province selection during onboarding
2. Auto-detect from postal code if provided
3. Show province-specific help during setup
4. Default to most common province if not specified

---

## 7. Risk Assessment & Mitigation

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| QPP calculation complexity | Medium | High | Extensive testing against official calculators |
| Tax abatement errors | Low | High | Validate with tax professionals |
| Data migration issues | Low | Medium | Staged rollout with rollback plan |
| Performance impact | Medium | Low | Optimize Quebec calculations, cache results |

### Business Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Regulatory compliance | Low | High | Legal review of Quebec requirements |
| Translation quality | Medium | Medium | Professional translation services |
| Market adoption | Low | Medium | Quebec-specific marketing campaign |
| Support complexity | High | Low | Dedicated Quebec support documentation |

---

## 8. Success Metrics

### Technical KPIs
- QPP calculation accuracy: >99.5%
- Quebec tax calculation accuracy: >99%
- Performance impact: <5% slower for Quebec users
- Test coverage: >90% for Quebec code

### Business KPIs
- Quebec user acquisition: 500 users in first month
- Quebec user retention: >80% after 3 months
- Quebec simulation completion rate: >70%
- Customer satisfaction (Quebec): >4.5/5 stars

---

## 9. Resource Requirements

### Development Team
- **Backend Developer:** 1 senior (8 weeks)
- **Frontend Developer:** 1 senior (4 weeks)
- **QA Engineer:** 1 (3 weeks)
- **DevOps:** Support for deployment (1 week)

### External Resources
- **Tax Consultant:** Quebec tax validation (16 hours)
- **Translation Service:** French translation (40 hours)
- **Legal Review:** Quebec compliance (8 hours)

### Infrastructure
- No additional infrastructure required
- Existing database can handle Quebec fields
- Performance impact minimal

---

## 10. Implementation Timeline

```
Week 1-2: Infrastructure & Data Model
Week 3-4: QPP Implementation
Week 5-6: Quebec Tax System
Week 7-8: Quebec Benefits
Week 9-10: French Translation (Optional Phase)

Milestones:
- Week 3: QPP Calculator Demo
- Week 6: Full Quebec Tax Support
- Week 8: Quebec MVP Launch
- Week 10: Bilingual Release
```

---

## 11. Go-to-Market Strategy

### Soft Launch (Week 8)
- Beta test with 50 Quebec users
- Gather feedback and refine
- Fix any calculation issues

### Public Launch (Week 10)
- Press release to Quebec media
- French and English marketing materials
- Partnership with Quebec financial advisors
- Social media campaign targeting Quebec

### Post-Launch
- Monitor usage and feedback
- Iterate based on user needs
- Add more Quebec-specific features
- Consider Quebec-specific pricing

---

## 12. Long-term Roadmap

### Phase 5: Advanced Quebec Features (Q3 2026)
- Quebec retirement homes cost calculator
- CELI (Quebec TFSA) optimization
- Quebec estate planning rules
- Integration with Retraite Québec

### Phase 6: Quebec Partnerships (Q4 2026)
- Desjardins integration
- National Bank partnership
- Quebec government endorsement
- Quebec advisor network

---

## Appendix A: Quebec Resources

### Official Calculators
- [Retraite Québec QPP Calculator](https://www.retraitequebec.gouv.qc.ca)
- [Revenu Québec Tax Estimator](https://www.revenuquebec.ca)
- [Quebec Solidarity Credit Calculator](https://www.revenuquebec.ca/credit-solidarite)

### Documentation
- QPP Act and Regulations
- Quebec Taxation Act
- Quebec Budget 2025-2026
- Retraite Québec Annual Report

### Key Contacts
- Retraite Québec Technical Support
- Revenu Québec Developer API
- Quebec FinTech Association
- Autorité des marchés financiers

---

## Appendix B: Code Snippets

### Province Detection
```typescript
// utils/province-detector.ts
export function detectProvinceFromPostalCode(postalCode: string): Province {
  const firstChar = postalCode[0].toUpperCase();

  const provinceMap: Record<string, Province> = {
    'G': 'QC', // Eastern Quebec
    'H': 'QC', // Montreal region
    'J': 'QC', // Western Quebec
    'K': 'ON', // Eastern Ontario
    'L': 'ON', // Central Ontario
    'M': 'ON', // Toronto
    'N': 'ON', // Southwestern Ontario
    'P': 'ON', // Northern Ontario
    // ... other provinces
  };

  return provinceMap[firstChar] || 'ON';
}
```

### QPP vs CPP Router
```python
# benefits.py
def calculate_pension_benefit(person: PersonInput) -> float:
    """Route to appropriate pension calculator based on province"""

    if person.province == 'QC':
        from .quebec.qpp_calculator import QPPCalculator
        calculator = QPPCalculator()
        return calculator.calculate_qpp_benefit(
            person.qpp_contributions,
            person.start_age,
            person.qpp_years_contributed
        )
    else:
        # Use existing CPP calculator
        return calculate_cpp_benefit(person)
```

---

*Document Version: 1.0.0*
*Last Updated: February 19, 2026*
*Next Review: March 1, 2026*