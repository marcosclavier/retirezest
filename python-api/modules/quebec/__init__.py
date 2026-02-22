"""
Quebec-specific retirement planning modules for RetireZest.

This package contains Quebec-specific implementations for:
- QPP (Quebec Pension Plan) calculations
- Quebec provincial tax with abatement
- Quebec benefits (solidarity credit, work premium, etc.)
- Quebec-specific optimization strategies
"""

from .qpp_calculator import QPPCalculator
from .quebec_tax import QuebecTaxCalculator
from .quebec_benefits import QuebecBenefitsCalculator

__all__ = [
    'QPPCalculator',
    'QuebecTaxCalculator',
    'QuebecBenefitsCalculator'
]