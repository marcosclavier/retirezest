# TFSA Room Calculation for Rafael (Born 1966)

## CRA TFSA Contribution Limits History

Rafael is 67 in 2033, so he was born in 1966.
TFSA program started in 2009 when Rafael was 43 years old (eligible since he was 18+).

### Annual TFSA Contribution Limits (CRA):

| Year | Annual Limit | Rafael's Age | Accumulated Room |
|------|-------------|--------------|------------------|
| 2009 | $5,000 | 43 | $5,000 |
| 2010 | $5,000 | 44 | $10,000 |
| 2011 | $5,000 | 45 | $15,000 |
| 2012 | $5,000 | 46 | $20,000 |
| 2013 | $5,500 | 47 | $25,500 |
| 2014 | $5,500 | 48 | $31,000 |
| 2015 | $10,000 | 49 | $41,000 |
| 2016 | $5,500 | 50 | $46,500 |
| 2017 | $5,500 | 51 | $52,000 |
| 2018 | $5,500 | 52 | $57,500 |
| 2019 | $6,000 | 53 | $63,500 |
| 2020 | $6,000 | 54 | $69,500 |
| 2021 | $6,000 | 55 | $75,500 |
| 2022 | $6,000 | 56 | $81,500 |
| 2023 | $6,500 | 57 | $88,000 |
| 2024 | $6,500 | 58 | $94,500 |
| 2025 | $7,000* | 59 | $101,500 |
| 2026 | $7,000* | 60 | $108,500 |
| 2027 | $7,000* | 61 | $115,500 |
| 2028 | $7,000* | 62 | $122,500 |
| 2029 | $7,000* | 63 | $129,500 |
| 2030 | $7,000* | 64 | $136,500 |
| 2031 | $7,000* | 65 | $143,500 |
| 2032 | $7,000* | 66 | $150,500 |
| 2033 | $7,000* | 67 | **$157,500** |

*Projected based on current $7,000 limit (may be indexed to inflation)

## Key Finding:

**Rafael has $157,500 in accumulated TFSA contribution room by 2033** if he has never contributed before.

## Current Problem:
- The simulation only contributes $3,056 to TFSA despite having a $40,000 surplus
- This suggests the code is using an incorrect starting TFSA room value
- The full $40,000 surplus should go to TFSA (well within the $157,500 available room)

## Solution Required:
1. Fix the TFSA room calculation to properly track accumulated unused room
2. Ensure surplus allocation prioritizes TFSA up to available room
3. Display the correct TFSA contribution and remaining room in the UI