
#!/usr/bin/env node

/**
 * Gmail Watch Setup Script
 * Sets up Gmail push notifications via Pub/Sub
 */

import { google } from 'googleapis';

async function setupGmailWatch() {
  console.log('🔔 Setting up Gmail push notifications...');
  
  // Check required environment variables
  const requiredVars = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GOOGLE_CLOUD_PROJECT_ID'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    return;
  }

  try {
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      access_token: process.env.GMAIL_ACCESS_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Set up Gmail watch
    const topicName = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/topics/gmail-notifications`;
    
    const watchResponse = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: topicName,
        labelIds: ['INBOX'], // Watch inbox for new messages
        labelFilterAction: 'include'
      }
    });

    console.log('✅ Gmail watch set up successfully!');
    console.log('📧 History ID:', watchResponse.data.historyId);
    console.log('⏰ Expiration:', new Date(parseInt(watchResponse.data.expiration)).toLocaleString());
    
    console.log('\n📋 Next steps:');
    console.log('1. Make sure your Pub/Sub topic exists:', topicName);
    console.log('2. Ensure your subscription pushes to your webhook URL');
    console.log('3. Test by sending a reply to one of your tracked emails');

  } catch (error) {
    console.error('❌ Error setting up Gmail watch:', error.message);
    
    if (error.message.includes('insufficient authentication scopes')) {
      console.log('\n💡 You may need to re-run the OAuth setup with additional scopes.');
      console.log('Required scopes for push notifications:');
      console.log('- https://www.googleapis.com/auth/gmail.readonly');
      console.log('- https://www.googleapis.com/auth/gmail.modify');
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupGmailWatch().catch(console.error);
}

export { setupGmailWatch };
