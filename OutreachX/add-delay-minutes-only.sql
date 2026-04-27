-- Migration to add delay_minutes column to existing email_campaigns table
-- Run this if you already have the email_campaigns table and just need to add the new column

ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS delay_minutes INTEGER;

-- Add a comment to document the new column
COMMENT ON COLUMN email_campaigns.delay_minutes IS 'Minutes delay for follow-up scheduling (for testing purposes)';

-- Optional: Update existing follow-ups to have explicit delay_minutes = NULL for clarity
-- This helps distinguish between minute-based (testing) and day-based (production) schedules
UPDATE email_campaigns 
SET delay_minutes = NULL 
WHERE delay_minutes IS NULL AND follow_up_delay IS NOT NULL;
