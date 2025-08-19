# Gmail OAuth Setup Script

This script helps you obtain the required Gmail API tokens for email functionality.

## Prerequisites

1. **Google Cloud Console Setup** (if not done already):
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create or select your project
   - Enable Gmail API: APIs & Services → Library → Search "Gmail API" → Enable
   - Create OAuth credentials: APIs & Services → Credentials → Create credentials → OAuth client ID
   - Choose "Desktop application" type
   - Download the credentials JSON file

2. **Environment Variables**:
   You should already have these set in your Replit secrets:
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`

## Running the Script

1. **Install dependencies**:
   ```bash
   npm install googleapis open
   ```

2. **Run the script**:
   ```bash
   node scripts/gmail-oauth-setup.js
   ```

3. **Follow the prompts**:
   - The script will open your browser automatically
   - Sign in to your Google account
   - Grant permissions to your application
   - The script will capture the tokens automatically

4. **Copy the tokens**:
   - Copy the `GMAIL_REFRESH_TOKEN` and `GMAIL_ACCESS_TOKEN`
   - Add them to your Replit secrets

## What the script does

1. Creates a temporary local server on port 3000
2. Opens Gmail authorization URL in your browser
3. Handles the OAuth callback automatically
4. Exchanges the authorization code for access and refresh tokens
5. Tests the tokens to make sure they work
6. Provides you with the tokens to add to your project

## Troubleshooting

**No refresh token received?**
- This happens if you've authorized the app before
- Go to [Google Account Permissions](https://myaccount.google.com/permissions)
- Find your app and revoke access
- Run the script again

**Port 3000 already in use?**
- Close any applications using port 3000
- Or modify the script to use a different port

**Browser doesn't open automatically?**
- Copy the authorization URL from the terminal
- Paste it in your browser manually

## Security Notes

- Keep your refresh token secure - it doesn't expire
- Access tokens expire every hour but refresh automatically
- Never share these tokens publicly
- Store them securely in your environment variables