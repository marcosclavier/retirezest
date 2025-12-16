"""
Quick test to verify Household dataclass works correctly
"""

from modules.models import Person, Household

# Create two Person objects with balances
p1 = Person(
    name="Juan",
    start_age=54,
    tfsa_balance=150000,
    rrif_balance=185000,
    rrsp_balance=0,
    nonreg_balance=441500,
    corporate_balance=0
)

p2 = Person(
    name="Daniela",
    start_age=53,
    tfsa_balance=220000,
    rrif_balance=260000,
    rrsp_balance=0,
    nonreg_balance=441500,
    corporate_balance=0
)

print(f"✅ Created Person p1:")
print(f"   p1.name={p1.name}, tfsa={p1.tfsa_balance:,.0f}, rrif={p1.rrif_balance:,.0f}")

print(f"✅ Created Person p2:")
print(f"   p2.name={p2.name}, tfsa={p2.tfsa_balance:,.0f}, rrif={p2.rrif_balance:,.0f}")

# Create Household with those Person objects
household = Household(
    p1=p1,
    p2=p2,
    province="AB",
    start_year=2025,
    end_age=95,
    strategy="Corp->RRIF->NonReg->TFSA",
    spending_go_go=200000
)

print(f"\n🏠 Created Household:")
print(f"   household.p1.name={household.p1.name}, household.p1.tfsa_balance=${household.p1.tfsa_balance:,.0f}")
print(f"   household.p2.name={household.p2.name}, household.p2.tfsa_balance=${household.p2.tfsa_balance:,.0f}")

# Test AssetAnalyzer
from utils.asset_analyzer import AssetAnalyzer

print(f"\n🔍 Testing AssetAnalyzer:")
composition = AssetAnalyzer.analyze(household)
print(f"   Total value: ${composition.total_value:,.0f}")
print(f"   TFSA: ${composition.tfsa_balance:,.0f}")
print(f"   RRIF: ${composition.rrif_balance:,.0f}")
print(f"   NonReg: ${composition.nonreg_balance:,.0f}")
