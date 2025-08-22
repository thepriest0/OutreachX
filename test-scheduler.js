// Test script for 5-minute follow-up scheduling
// Run this after setting up a campaign to test the quick scheduling

const express = require('express');
const { storage } = require('./server/storage');
const { followUpScheduler } = require('./server/services/followUpScheduler');

async function testQuickScheduling() {
  console.log('=== Testing 5-Minute Follow-Up Scheduling ===\n');
  
  try {
    // Start the scheduler
    followUpScheduler.start();
    
    // List all campaigns to find one to test with
    const campaigns = await storage.getEmailCampaigns();
    const parentCampaign = campaigns.find(c => !c.isFollowUp && c.status === 'sent');
    
    if (!parentCampaign) {
      console.log('No suitable parent campaign found. Please send an email campaign first.');
      return;
    }
    
    console.log(`Found parent campaign: ${parentCampaign.id} - "${parentCampaign.subject}"`);
    
    // Schedule a 5-minute follow-up
    console.log('Scheduling 5-minute follow-up...');
    const followUpId = await followUpScheduler.scheduleFollowUp(
      parentCampaign.id,
      0, // 0 days
      parentCampaign.createdBy,
      5 // 5 minutes
    );
    
    console.log(`Follow-up scheduled with ID: ${followUpId}`);
    
    // Show the scheduled time
    const followUp = await storage.getEmailCampaignById(followUpId);
    const scheduledTime = new Date(followUp.scheduledAt);
    const now = new Date();
    const minutesUntil = Math.round((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
    
    console.log(`\\nScheduled for: ${scheduledTime.toISOString()} (UTC)`);
    console.log(`Local time: ${scheduledTime.toString()}`);
    console.log(`Minutes until execution: ${minutesUntil}`);
    
    console.log('\\nScheduler is running. Watch the console for execution logs...');
    console.log('The follow-up should be processed within the next 5-6 minutes.');
    
    // Monitor for the next 10 minutes
    let monitorCount = 0;
    const monitorInterval = setInterval(async () => {
      monitorCount++;
      const currentTime = new Date();
      
      // Check if it's been processed
      const updatedFollowUp = await storage.getEmailCampaignById(followUpId);
      
      console.log(`\\n[Check ${monitorCount}] ${currentTime.toISOString()}`);
      console.log(`Follow-up status: ${updatedFollowUp.status}`);
      
      if (updatedFollowUp.status !== 'draft') {
        console.log(`\\n✅ Follow-up processed! Final status: ${updatedFollowUp.status}`);
        if (updatedFollowUp.sentAt) {
          console.log(`Sent at: ${updatedFollowUp.sentAt}`);
        }
        clearInterval(monitorInterval);
        process.exit(0);
      }
      
      // Stop monitoring after 10 minutes
      if (monitorCount >= 20) { // 20 * 30 seconds = 10 minutes
        console.log('\\n⏰ Monitoring timeout reached. Check logs for any issues.');
        clearInterval(monitorInterval);
        process.exit(0);
      }
    }, 30000); // Check every 30 seconds
    
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testQuickScheduling();
}
