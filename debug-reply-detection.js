// Debug script for testing email reply detection
// This helps you understand why replies might not be detected automatically

import { storage } from './server/storage.js';
import { emailReplyTracker } from './server/services/emailReplyTracker.js';

async function debugReplyDetection() {
  console.log('🔍 Email Reply Detection Debug\n');
  
  try {
    // Check Gmail credentials
    console.log('📧 Gmail Configuration:');
    console.log(`  Client ID: ${process.env.GMAIL_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`  Client Secret: ${process.env.GMAIL_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`  Refresh Token: ${process.env.GMAIL_REFRESH_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`  Access Token: ${process.env.GMAIL_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}\n`);
    
    // Check if reply tracker is running
    console.log('🤖 Reply Tracker Status:');
    console.log(`  Is running: ${emailReplyTracker.running ? '✅ Yes' : '❌ No'}`);
    
    // Get sent campaigns without replies
    const sentCampaigns = await storage.getSentCampaignsWithoutReplies();
    console.log(`\n📤 Sent Campaigns Pending Reply:`);;
    
    if (sentCampaigns.length === 0) {
      console.log('  📭 No campaigns pending reply tracking');
    } else {
      sentCampaigns.forEach((campaign, index) => {
        console.log(`  ${index + 1}. Campaign ${campaign.id}`);
        console.log(`     Subject: ${campaign.subject}`);
        console.log(`     To: ${campaign.lead?.email || 'Unknown'}`);
        console.log(`     Sent: ${campaign.sentAt}`);
        console.log(`     Status: ${campaign.status}`);
        console.log(`     Message ID: ${campaign.messageId || 'Not set'}\n`);
      });
    }
    
    // Get all leads and their statuses
    const leads = await storage.getLeads();
    const leadStatusCounts = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('👥 Lead Status Summary:');
    Object.entries(leadStatusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Show recent campaigns with replies
    const repliedCampaigns = await storage.getEmailCampaigns();
    const recentReplies = repliedCampaigns
      .filter(c => c.status === 'replied' && c.repliedAt)
      .sort((a, b) => new Date(b.repliedAt).getTime() - new Date(a.repliedAt).getTime())
      .slice(0, 5);
    
    console.log(`\n📬 Recent Replied Campaigns (last 5):`);
    if (recentReplies.length === 0) {
      console.log('  📭 No replied campaigns found');
    } else {
      recentReplies.forEach((campaign, index) => {
        console.log(`  ${index + 1}. Campaign ${campaign.id}`);
        console.log(`     Subject: ${campaign.subject}`);
        console.log(`     Replied: ${campaign.repliedAt}`);
        console.log(`     Lead ID: ${campaign.leadId}\n`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Manual reply check function
async function manualReplyCheck() {
  console.log('🔄 Running manual reply check...\n');
  
  try {
    // Trigger manual check
    await emailReplyTracker.checkNow();
    console.log('✅ Manual reply check completed');
  } catch (error) {
    console.error('❌ Manual reply check failed:', error);
  }
}

// Test the reply detection
async function testReplyDetection() {
  console.log('=== Email Reply Detection Test ===\n');
  
  await debugReplyDetection();
  
  console.log('\n' + '='.repeat(50));
  console.log('💡 Troubleshooting Tips:');
  console.log('1. Ensure Gmail credentials are properly configured');
  console.log('2. Check that sent campaigns have messageId set');
  console.log('3. Reply tracker checks every 30 seconds automatically');
  console.log('4. Manual replies can be marked via API or UI');
  console.log('5. Check server logs for reply detection messages');
  
  if (process.argv.includes('--manual-check')) {
    console.log('\n' + '='.repeat(50));
    await manualReplyCheck();
  }
}

// Run the test
testReplyDetection().then(() => {
  console.log('\n🎉 Debug complete!');
  console.log('💡 Run with --manual-check to trigger manual reply detection');
  process.exit(0);
}).catch(console.error);
