// Debug script for testing follow-up scheduler
// This script helps verify that the scheduler works correctly with timezone handling

const { storage } = require('./server/storage');

async function debugScheduler() {
  console.log('=== Follow-Up Scheduler Debug (Nigerian Time) ===\n');
  
  const now = new Date();
  console.log(`Current time (Nigerian): ${now.toString()}`);
  console.log(`Current time (UTC): ${now.toISOString()}`);
  console.log(`Nigeria is UTC+1, so Nigerian time is 1 hour ahead of UTC\n`);
  
  try {
    // Get all scheduled campaigns
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1); // Get all scheduled campaigns
    
    const allScheduled = await storage.getScheduledEmailCampaigns(futureDate);
    console.log(`Total scheduled campaigns: ${allScheduled.length}\n`);
    
    if (allScheduled.length > 0) {
      console.log('Scheduled campaigns:');
      allScheduled.forEach((campaign, index) => {
        const scheduledTime = new Date(campaign.scheduledAt);
        const timeDiff = scheduledTime.getTime() - now.getTime();
        const minutesDiff = Math.round(timeDiff / (1000 * 60));
        
        console.log(`${index + 1}. Campaign ${campaign.id}`);
        console.log(`   Subject: ${campaign.subject}`);
        console.log(`   Scheduled (Nigerian): ${scheduledTime.toString()}`);
        console.log(`   Scheduled (UTC): ${scheduledTime.toISOString()}`);
        console.log(`   Time until execution: ${minutesDiff} minutes`);
        console.log(`   Follow-up sequence: ${campaign.followUpSequence || 'N/A'}`);
        console.log(`   Status: ${campaign.status}\n`);
      });
    }
    
    // Get campaigns ready to send right now
    const readyNow = await storage.getScheduledEmailCampaigns(now);
    console.log(`Campaigns ready to send now: ${readyNow.length}\n`);
    
    if (readyNow.length > 0) {
      console.log('Ready to send:');
      readyNow.forEach((campaign, index) => {
        const scheduledTime = new Date(campaign.scheduledAt);
        console.log(`${index + 1}. Campaign ${campaign.id} - ${campaign.subject}`);
        console.log(`   Scheduled (Nigerian): ${scheduledTime.toString()}`);
        console.log(`   Scheduled (UTC): ${scheduledTime.toISOString()}`);
        console.log(`   Status: ${campaign.status}\n`);
      });
    }
    
    // Test scheduling a 5-minute follow-up
    console.log('=== Testing 5-minute schedule ===');
    const test5MinDate = new Date();
    test5MinDate.setMinutes(test5MinDate.getMinutes() + 5);
    console.log(`5 minutes from now (Nigerian): ${test5MinDate.toString()}`);
    console.log(`5 minutes from now (UTC): ${test5MinDate.toISOString()}\n`);
    
  } catch (error) {
    console.error('Error during debug:', error);
  }
}

// Helper function to monitor the scheduler in real-time
async function monitorScheduler(durationMinutes = 10) {
  console.log(`\n=== Monitoring scheduler for ${durationMinutes} minutes ===\n`);
  
  const startTime = Date.now();
  const endTime = startTime + (durationMinutes * 60 * 1000);
  
  const interval = setInterval(async () => {
    const now = new Date();
    const readyNow = await storage.getScheduledEmailCampaigns(now);
    
    if (readyNow.length > 0) {
      console.log(`[${now.toISOString()}] Found ${readyNow.length} campaigns ready to send:`);
      readyNow.forEach(campaign => {
        console.log(`  - ${campaign.id}: ${campaign.subject}`);
      });
    } else {
      console.log(`[${now.toISOString()}] No campaigns ready to send`);
    }
    
    if (Date.now() >= endTime) {
      clearInterval(interval);
      console.log('\nMonitoring complete.');
    }
  }, 30000); // Check every 30 seconds
}

// Export functions for use
module.exports = {
  debugScheduler,
  monitorScheduler
};

// If running directly, execute debug
if (require.main === module) {
  debugScheduler().then(() => {
    console.log('Debug complete. To monitor in real-time, use: monitorScheduler(10)');
    process.exit(0);
  }).catch(console.error);
}
