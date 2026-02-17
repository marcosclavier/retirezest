/**
 * Calculate accumulated TFSA contribution room based on CRA guidelines
 * TFSA program started in 2009 for Canadian residents 18 and older
 */

interface TFSACalculationParams {
  birthYear: number;
  currentYear: number;
  previousContributions?: number;
  previousWithdrawals?: { year: number; amount: number }[];
}

// Historical TFSA contribution limits from CRA
const TFSA_ANNUAL_LIMITS: Record<number, number> = {
  2009: 5000,
  2010: 5000,
  2011: 5000,
  2012: 5000,
  2013: 5500,
  2014: 5500,
  2015: 10000, // One-time increase
  2016: 5500,
  2017: 5500,
  2018: 5500,
  2019: 6000,
  2020: 6000,
  2021: 6000,
  2022: 6000,
  2023: 6500,
  2024: 6500,
  // Future years: assume current limit with potential inflation adjustments
  2025: 7000,
  2026: 7000,
  2027: 7000,
  2028: 7000,
  2029: 7000,
  2030: 7000,
  2031: 7000,
  2032: 7000,
  2033: 7000,
  2034: 7000,
  2035: 7000,
};

/**
 * Calculate the total accumulated TFSA contribution room for a person
 * @param params - Parameters for calculation
 * @returns Total available TFSA contribution room
 */
export function calculateAccumulatedTFSARoom(params: TFSACalculationParams): number {
  const { birthYear, currentYear, previousContributions = 0, previousWithdrawals = [] } = params;

  // TFSA program started in 2009
  const TFSA_START_YEAR = 2009;
  const ELIGIBILITY_AGE = 18;

  // Determine the year person became eligible (18 years old or 2009, whichever is later)
  const yearTurned18 = birthYear + ELIGIBILITY_AGE;
  const eligibilityStartYear = Math.max(yearTurned18, TFSA_START_YEAR);

  // If not yet eligible, return 0
  if (eligibilityStartYear > currentYear) {
    return 0;
  }

  // Calculate base contribution room from eligibility year to current year
  let totalRoom = 0;

  for (let year = eligibilityStartYear; year <= currentYear; year++) {
    // Use the defined limit for the year, or default to $7000 for future years
    const yearLimit = TFSA_ANNUAL_LIMITS[year] || 7000;
    totalRoom += yearLimit;
  }

  // Subtract any previous contributions
  totalRoom -= previousContributions;

  // Add back withdrawals from previous years (withdrawals restore room the following year)
  previousWithdrawals.forEach(withdrawal => {
    // Only count withdrawals from years before the current year
    if (withdrawal.year < currentYear) {
      totalRoom += withdrawal.amount;
    }
  });

  // Room cannot be negative
  return Math.max(0, totalRoom);
}

/**
 * Calculate TFSA room for someone who has never contributed
 * This is a simplified version for users with no TFSA history
 */
export function calculateVirginTFSARoom(birthYear: number, currentYear: number): number {
  return calculateAccumulatedTFSARoom({
    birthYear,
    currentYear,
    previousContributions: 0,
    previousWithdrawals: []
  });
}

/**
 * Get the annual TFSA limit for a specific year
 */
export function getAnnualTFSALimit(year: number): number {
  return TFSA_ANNUAL_LIMITS[year] || 7000; // Default to $7000 for undefined future years
}

/**
 * Example calculation for Rafael (born 1966, age 67 in 2033)
 */
export function calculateRafaelTFSARoom(): number {
  const RAFAEL_BIRTH_YEAR = 1966;
  const SIMULATION_START_YEAR = 2033;

  const room = calculateVirginTFSARoom(RAFAEL_BIRTH_YEAR, SIMULATION_START_YEAR);

  console.log(`Rafael's TFSA Room Calculation:
    Born: ${RAFAEL_BIRTH_YEAR}
    Simulation Year: ${SIMULATION_START_YEAR}
    Age in ${SIMULATION_START_YEAR}: ${SIMULATION_START_YEAR - RAFAEL_BIRTH_YEAR}
    Eligible since: 2009 (age ${2009 - RAFAEL_BIRTH_YEAR})
    Years of accumulation: ${SIMULATION_START_YEAR - 2009 + 1}
    Total accumulated room: $${room.toLocaleString()}
  `);

  return room;
}