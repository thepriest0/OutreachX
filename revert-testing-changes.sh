#!/bin/bash
# Quick revert script for testing changes
# Run this when you're done testing the 5-minute follow-ups

echo "🔄 Reverting follow-up scheduler to production settings..."

# 1. Revert scheduler frequency to every 5 minutes
echo "📅 Changing scheduler from every minute to every 5 minutes..."
sed -i "s/cron.schedule('\\* \\* \\* \\* \\*'/cron.schedule('\\/\\*5 \\* \\* \\* \\*'/g" server/services/followUpScheduler.ts

# 2. Optional: Remove delay_minutes column from database
echo "🗑️  To remove the delay_minutes column from database, run:"
echo "   ALTER TABLE email_campaigns DROP COLUMN delay_minutes;"

# 3. Revert default follow-up delay to 3 days
echo "📝 Don't forget to manually change the default delay back to 3 days in the frontend"

echo "✅ Basic revert complete!"
echo ""
echo "Manual steps remaining:"
echo "1. Change dropdown options back to days-only in follow-up-scheduler.tsx"
echo "2. Remove delayMinutes parameter from API calls"
echo "3. Optionally remove delay_minutes column from database"
