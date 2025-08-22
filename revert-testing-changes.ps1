# PowerShell script to revert testing changes
# Run this when you're done testing the 5-minute follow-ups

Write-Host "🔄 Reverting follow-up scheduler to production settings..." -ForegroundColor Yellow

# 1. Show what needs to be reverted
Write-Host "📋 Changes to revert:" -ForegroundColor Cyan
Write-Host "1. Scheduler frequency: every minute → every 5 minutes" -ForegroundColor White
Write-Host "2. UI dropdown: minutes options → days only" -ForegroundColor White  
Write-Host "3. Default delay: 5 minutes → 3 days" -ForegroundColor White
Write-Host "4. Optional: Remove delay_minutes column" -ForegroundColor White

Write-Host "`n🛠️  Manual revert steps:" -ForegroundColor Cyan

Write-Host "1. In server/services/followUpScheduler.ts:" -ForegroundColor Yellow
Write-Host "   Change: cron.schedule('* * * * *'..." -ForegroundColor Red
Write-Host "   To:     cron.schedule('*/5 * * * *'..." -ForegroundColor Green

Write-Host "`n2. In client/src/components/email/follow-up-scheduler.tsx:" -ForegroundColor Yellow
Write-Host "   - Remove minute options (5m, 10m, 30m)" -ForegroundColor Red
Write-Host "   - Change default delayDays from 0 to 3" -ForegroundColor Red
Write-Host "   - Simplify dropdown to days-only" -ForegroundColor Red

Write-Host "`n3. Optional database cleanup:" -ForegroundColor Yellow
Write-Host "   ALTER TABLE email_campaigns DROP COLUMN delay_minutes;" -ForegroundColor Magenta

Write-Host "`n✅ Use this checklist to clean up when testing is complete!" -ForegroundColor Green
Write-Host "💡 The changes are isolated and won't affect your production app until you revert." -ForegroundColor Blue
