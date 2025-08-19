#!/usr/bin/env node

/**
 * Gmail OAuth Setup Script
 * This script helps you obtain refresh and access tokens for Gmail API
 * 
 * Prerequisites:
 * 1. You need GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET from Google Cloud Console
 * 2. Run: npm install googleapis open
 * 3. Run this script: node scripts/gmail-oauth-setup.js
 */

import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import open from 'open';
import readline from 'readline';

// OAuth2 configuration
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

const REDIRECT_URI = 'http://localhost:3000/oauth/callback';

async function setupGmailOAuth() {
  console.log('🚀 Gmail OAuth Setup Script');
  console.log('================================\n');

  // Get credentials from environment or prompt
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ Missing credentials!');
    console.log('Please set the following environment variables:');
    console.log('- GMAIL_CLIENT_ID');
    console.log('- GMAIL_CLIENT_SECRET\n');
    console.log('Get these from Google Cloud Console:');
    console.log('1. Go to https://console.cloud.google.com');
    console.log('2. Create/select project → APIs & Services → Credentials');
    console.log('3. Create OAuth 2.0 Client ID (Desktop Application type)');
    console.log('4. Download credentials and use Client ID/Secret');
    return;
  }

  console.log('✅ Found Gmail credentials');
  console.log(`Client ID: ${clientId.substring(0, 20)}...`);

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    REDIRECT_URI
  );

  // Generate authorization URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Important: needed for refresh token
    scope: SCOPES,
    prompt: 'consent' // Force consent screen to get refresh token
  });

  console.log('\n📋 Setup Steps:');
  console.log('1. Opening authorization URL in your browser...');
  console.log('2. Sign in to your Google account');
  console.log('3. Grant permissions to your application');
  console.log('4. You\'ll be redirected to localhost (this script will handle it)');
  console.log('\nIf browser doesn\'t open automatically, visit:');
  console.log(authUrl);

  // Create temporary server to handle callback
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/oauth/callback') {
      const { code, error } = parsedUrl.query;
      
      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`
          <h1>❌ Authorization Failed</h1>
          <p>Error: ${error}</p>
          <p>Please try running the script again.</p>
        `);
        server.close();
        return;
      }

      if (code) {
        try {
          // Exchange code for tokens
          const { tokens } = await oauth2Client.getToken(code);
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>✅ Authorization Successful!</h1>
            <p>You can close this tab and return to your terminal.</p>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 2rem; text-align: center; }
              h1 { color: #28a745; }
            </style>
          `);

          // Display tokens
          console.log('\n🎉 Success! Here are your tokens:');
          console.log('=====================================');
          
          if (tokens.refresh_token) {
            console.log('\n📝 GMAIL_REFRESH_TOKEN:');
            console.log(tokens.refresh_token);
          } else {
            console.log('\n⚠️  No refresh token received. This might happen if:');
            console.log('   - You\'ve authorized this app before');
            console.log('   - Try revoking access at https://myaccount.google.com/permissions');
            console.log('   - Then run this script again');
          }
          
          console.log('\n🔑 GMAIL_ACCESS_TOKEN:');
          console.log(tokens.access_token);
          
          console.log('\n📋 Next Steps:');
          console.log('1. Copy the tokens above');
          console.log('2. Add them as secrets in your Replit project:');
          console.log('   - GMAIL_REFRESH_TOKEN');
          console.log('   - GMAIL_ACCESS_TOKEN');
          console.log('3. Your Gmail integration is ready! 🚀');

          // Test the tokens
          if (tokens.refresh_token && tokens.access_token) {
            console.log('\n🧪 Testing tokens...');
            oauth2Client.setCredentials(tokens);
            
            try {
              const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
              const profile = await gmail.users.getProfile({ userId: 'me' });
              console.log(`✅ Token test successful! Gmail account: ${profile.data.emailAddress}`);
            } catch (testError) {
              console.log(`⚠️  Token test failed: ${testError.message}`);
              console.log('   Tokens were generated but may need verification');
            }
          }

          server.close();
          
        } catch (tokenError) {
          console.error('\n❌ Failed to exchange code for tokens:', tokenError.message);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>❌ Token Exchange Failed</h1>
            <p>Error: ${tokenError.message}</p>
          `);
          server.close();
        }
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  // Start server
  server.listen(3000, () => {
    console.log('\n🌐 Started local server on http://localhost:3000');
    console.log('⏳ Waiting for authorization...\n');
    
    // Open browser
    setTimeout(() => {
      open(authUrl).catch(() => {
        console.log('Could not open browser automatically.');
      });
    }, 1000);
  });

  // Handle server errors
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('❌ Port 3000 is already in use.');
      console.log('Please close any applications using port 3000 and try again.');
    } else {
      console.error('Server error:', err.message);
    }
  });
}

// Run the setup
setupGmailOAuth().catch(console.error);

export { setupGmailOAuth };