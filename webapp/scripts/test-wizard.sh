#!/bin/bash

# Load environment variables from .env.local
export $(grep -v '^#' .env.local | xargs)

# Run the automated wizard test
npx tsx scripts/automated-wizard-test.ts
