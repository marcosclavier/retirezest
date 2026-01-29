#!/bin/bash

# Weekly Reactivation Check Automation Script
#
# This script runs the reactivation tracking check and can be scheduled
# using cron or other scheduling tools.
#
# Setup with cron (runs every Monday at 9am):
#   0 9 * * 1 /path/to/run_weekly_reactivation_check.sh
#
# Or run manually:
#   ./run_weekly_reactivation_check.sh

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the webapp directory
cd "$SCRIPT_DIR"

# Log file for automation output
LOG_FILE="$SCRIPT_DIR/reactivation_check.log"

echo "========================================" >> "$LOG_FILE"
echo "Weekly Reactivation Check: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Run the tracking script
node track_reactivations.js >> "$LOG_FILE" 2>&1

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo "✅ Reactivation check completed successfully" >> "$LOG_FILE"
else
    echo "❌ Reactivation check failed with exit code $?" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"

# Optional: Send notification (uncomment if you want email notifications)
# if grep -q "REACTIVATED" "$SCRIPT_DIR/reactivation_tracking_results.json"; then
#     echo "🎉 User reactivation detected! Check the dashboard." | mail -s "RetireZest: User Reactivated" your-email@example.com
# fi
