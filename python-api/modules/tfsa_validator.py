"""
TFSA CRA Compliance Validator

Ensures strict compliance with CRA TFSA contribution rules to avoid penalties.
CRA charges 1% per month on over-contributions - this can add up to significant fines!
"""

from typing import Dict, Tuple, Optional


class TFSAValidator:
    """Validates TFSA contributions against CRA rules."""

    # CRA TFSA annual contribution limits
    ANNUAL_LIMITS = {
        2009: 5000,
        2010: 5000,
        2011: 5000,
        2012: 5000,
        2013: 5500,
        2014: 5500,
        2015: 10000,  # Increased temporarily
        2016: 5500,
        2017: 5500,
        2018: 5500,
        2019: 6000,
        2020: 6000,
        2021: 6000,
        2022: 6000,
        2023: 6500,
        2024: 7000,
        2025: 7000,
        2026: 7000,  # Projected
    }

    @staticmethod
    def get_annual_limit(year: int) -> float:
        """Get TFSA annual contribution limit for a given year."""
        if year < 2009:
            return 0.0  # TFSA didn't exist before 2009

        # Use the last known limit for future years
        if year in TFSAValidator.ANNUAL_LIMITS:
            return float(TFSAValidator.ANNUAL_LIMITS[year])
        else:
            # Default to 2026 limit for future years
            return 7000.0

    @staticmethod
    def validate_contribution(
        contribution_amount: float,
        available_room: float,
        year: int
    ) -> Tuple[bool, Optional[str], float]:
        """
        Validate a TFSA contribution against available room.

        Args:
            contribution_amount: Amount to contribute
            available_room: Current available TFSA contribution room
            year: Calendar year of contribution

        Returns:
            Tuple of (is_valid, error_message, penalty_amount)
        """
        if contribution_amount <= 0:
            return (True, None, 0.0)

        if contribution_amount > available_room:
            over_contribution = contribution_amount - available_room
            monthly_penalty = over_contribution * 0.01  # 1% per month
            annual_penalty = monthly_penalty * 12

            error_msg = (
                f"⛔ CRA VIOLATION: TFSA over-contribution of ${over_contribution:,.2f}\n"
                f"   Attempted contribution: ${contribution_amount:,.2f}\n"
                f"   Available room: ${available_room:,.2f}\n"
                f"   Monthly penalty (1%): ${monthly_penalty:,.2f}\n"
                f"   Annual penalty cost: ${annual_penalty:,.2f}"
            )

            return (False, error_msg, annual_penalty)

        return (True, None, 0.0)

    @staticmethod
    def calculate_next_year_room(
        current_room: float,
        current_year_withdrawals: float,
        next_year: int,
        contributions_this_year: float = 0.0
    ) -> float:
        """
        Calculate TFSA contribution room for next year.

        CRA Rules:
        1. Unused room carries forward
        2. Add next year's annual limit
        3. Add this year's withdrawals (available Jan 1 of next year)
        4. Subtract this year's contributions

        Args:
            current_room: Room at start of current year
            current_year_withdrawals: Total withdrawals in current year
            next_year: The next calendar year
            contributions_this_year: Total contributions made this year

        Returns:
            Available contribution room for next year
        """
        # Room after this year's activity
        remaining_room = current_room - contributions_this_year

        # Next year's room
        next_year_room = (
            remaining_room +  # Unused room carries forward
            TFSAValidator.get_annual_limit(next_year) +  # New annual limit
            current_year_withdrawals  # Withdrawals become available next year
        )

        return max(0.0, next_year_room)

    @staticmethod
    def check_recontribution_risk(
        planned_withdrawal: float,
        current_surplus: float,
        available_room: float
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if a withdrawal might create a problematic re-contribution situation.

        Args:
            planned_withdrawal: Amount planning to withdraw from TFSA
            current_surplus: Current cash surplus that might be reinvested
            available_room: Current available TFSA room

        Returns:
            Tuple of (has_risk, warning_message)
        """
        # If withdrawing from TFSA when there's already a surplus and room
        # this could create an inefficient circular flow
        if planned_withdrawal > 0 and current_surplus > 10000 and available_room > 10000:
            warning = (
                f"⚠️ TFSA CIRCULAR FLOW WARNING:\n"
                f"   Planning to withdraw ${planned_withdrawal:,.2f} from TFSA\n"
                f"   But there's already ${current_surplus:,.2f} surplus\n"
                f"   And ${available_room:,.2f} TFSA room available\n"
                f"   This creates inefficient withdraw-and-recontribute cycle"
            )
            return (True, warning)

        return (False, None)


def validate_tfsa_transaction(
    contribution: float,
    withdrawal: float,
    current_balance: float,
    available_room: float,
    year: int
) -> Dict[str, any]:
    """
    Comprehensive validation of a TFSA transaction.

    Returns:
        Dictionary with validation results and any warnings/errors
    """
    result = {
        "valid": True,
        "errors": [],
        "warnings": [],
        "penalties": 0.0
    }

    # Validate contribution
    if contribution > 0:
        is_valid, error_msg, penalty = TFSAValidator.validate_contribution(
            contribution, available_room, year
        )
        if not is_valid:
            result["valid"] = False
            result["errors"].append(error_msg)
            result["penalties"] += penalty

    # Check for negative balance
    if current_balance + contribution - withdrawal < 0:
        result["valid"] = False
        result["errors"].append(
            f"TFSA balance cannot go negative. "
            f"Balance: ${current_balance:,.2f}, "
            f"Contribution: ${contribution:,.2f}, "
            f"Withdrawal: ${withdrawal:,.2f}"
        )

    # Warn about large single-year movements
    if contribution > 50000:
        result["warnings"].append(
            f"Large TFSA contribution of ${contribution:,.2f} may trigger "
            f"CRA review even if compliant"
        )

    return result