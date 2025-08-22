# Follow-Up Scheduler Testing Guide

## Overview
The follow-up scheduler has been enhanced to support:
1. **5-minute delays** for quick testing
2. **Timezone-safe scheduling** using UTC timestamps
3. **Minute-level precision** for development and testing

## Changes Made

### 1. Frontend Changes
- Added support for minute-based delays in the follow-up scheduler UI
- Added 5-minute, 10-minute, and 30-minute options to the delay dropdown
- First follow-up now defaults to 5 minutes for easy testing

### 2. Backend Changes
- Updated `followUpScheduler.ts` to handle both day and minute delays
- Changed cron schedule from every 5 minutes to every minute for better precision
- All scheduling now uses UTC timestamps to avoid timezone issues
- Added `delayMinutes` field to database schema

### 3. Database Changes
- Added `delay_minutes` column to `email_campaigns` table
- Run `add-delay-minutes-column.sql` to update your database

## Testing Instructions

### Quick Test (5 minutes)
1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Create and send an email campaign**
   - Go to Campaigns page
   - Create a new campaign
   - Send it to a lead

3. **Schedule a 5-minute follow-up**
   - Click "Schedule Follow-up" on the sent campaign
   - Select "5 minutes" from the delay dropdown
   - Generate or write follow-up content
   - Save the schedule

4. **Monitor the scheduler**
   - Watch the server console logs
   - The follow-up should be processed within 5-6 minutes
   - You'll see logs like:
     ```
     Scheduling follow-up for 5 minutes from now (UTC): 2025-08-22T15:30:00.000Z
     Follow-up scheduler started - checking every minute for scheduled emails
     [2025-08-22T15:30:30.000Z] Found 1 campaigns ready to send
     Sending scheduled follow-up [campaign-id]
     ```

### Debug Tools

#### 1. Debug Script
Run the debug script to see all scheduled campaigns:
```bash
node debug-scheduler.js
```

This shows:
- Current time in both UTC and local timezone
- All scheduled campaigns with timing details
- Campaigns ready to send immediately

#### 2. Test Script
Run the automated test script:
```bash
node test-scheduler.js
```

This script:
- Finds a suitable parent campaign
- Schedules a 5-minute follow-up automatically
- Monitors for 10 minutes and reports when it's processed

#### 3. Real-time Monitoring
To monitor the scheduler in real-time:
```javascript
const { monitorScheduler } = require('./debug-scheduler');
monitorScheduler(10); // Monitor for 10 minutes
```

## Timezone Safety

### Problem Solved
Previously, scheduling used local time which could cause issues:
- Server timezone changes
- Daylight saving time transitions
- Different deployment environments

### Solution Implemented
- All scheduling calculations use UTC methods:
  - `setUTCMinutes()` for minute delays
  - `setUTCDate()` for day delays
- Database stores timestamps in UTC
- Scheduler checks against UTC time
- Console logs show both UTC and local times for clarity

## Verification Checklist

✅ **Minute delays work**: 5-minute follow-ups are processed within 6 minutes
✅ **Timezone consistency**: Scheduling works regardless of server timezone
✅ **Cron frequency**: Scheduler runs every minute for precise timing
✅ **Database compatibility**: New `delay_minutes` column is properly used
✅ **UI updates**: Dropdown includes minute options (5m, 10m, 30m)
✅ **Logging**: Clear logs show scheduling and processing times

## Common Issues & Solutions

### Issue: "No suitable parent campaign found"
**Solution**: Create and send an email campaign first

### Issue: Follow-up not processing after 5 minutes
**Solutions**:
1. Check server console for error logs
2. Verify database connection
3. Run `node debug-scheduler.js` to see if it's scheduled
4. Check if parent campaign was replied to (auto-cancels follow-ups)

### Issue: Timezone confusion
**Solution**: Look at UTC timestamps in logs, not local time

### Issue: Database errors about missing columns
**Solution**: Run the migration: `add-delay-minutes-column.sql`

## Production Considerations

- For production, use day-based delays (1-30 days)
- Minute-based delays are primarily for testing
- Consider changing cron back to `*/5 * * * *` (every 5 minutes) for production if minute precision isn't needed
- Monitor server resources as every-minute cron jobs are more frequent

## Example Test Flow

1. **Setup** (one time):
   ```bash
   # Apply database migration
   psql -d your_database -f add-delay-minutes-column.sql
   
   # Start application
   npm run dev
   ```

2. **Test execution**:
   ```bash
   # Terminal 1: Run the app and watch logs
   npm run dev
   
   # Terminal 2: Run debug script
   node debug-scheduler.js
   
   # Terminal 3: Run automated test
   node test-scheduler.js
   ```

3. **Verification**:
   - Check that follow-up appears in scheduled list
   - Wait 5-6 minutes
   - Verify follow-up status changes from 'draft' to 'sent' or 'failed'
   - Check recipient email for the follow-up

This setup gives you a reliable way to test follow-up scheduling with quick turnaround times and timezone safety.
