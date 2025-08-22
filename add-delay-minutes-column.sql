-- Migration script to add delayMinutes column to email_campaigns table
-- Run this SQL command in your database to add support for minute-based delays

ALTER TABLE email_campaigns 
ADD COLUMN delay_minutes INTEGER;

-- Add a comment to document the new column
COMMENT ON COLUMN email_campaigns.delay_minutes IS 'Minute-based delay for follow-up scheduling (primarily for testing)';

-- Update any existing records to ensure consistency
-- This is optional - existing records will work fine with NULL delay_minutes
UPDATE email_campaigns 
SET delay_minutes = 0 
WHERE delay_minutes IS NULL AND follow_up_delay IS NOT NULL;
