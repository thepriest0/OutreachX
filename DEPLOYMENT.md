# OutreachX Vercel Deployment Guide

## Prerequisites
1. Vercel account (sign up at vercel.com)
2. Vercel CLI installed: `npm install -g vercel`

## Deployment Steps

### 1. Build the project locally to ensure it works
```bash
npm run build
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy to Vercel
```bash
vercel
```

### 4. Set Environment Variables in Vercel Dashboard
Go to your Vercel project dashboard and add these environment variables:

**Database (Xata):**
- `XATA_API_KEY` - Your Xata API key
- `XATA_BRANCH` - Your Xata branch (usually "main")
- `DATABASE_URL` - Your Xata PostgreSQL connection string

**Gmail Integration:**
- `GMAIL_CLIENT_ID` - Your Google OAuth2 client ID
- `GMAIL_CLIENT_SECRET` - Your Google OAuth2 client secret
- `GMAIL_REFRESH_TOKEN` - Your Gmail refresh token
- `GMAIL_REDIRECT_URI` - Set to your Vercel domain + `/api/auth/gmail/callback`

**Session & Auth:**
- `SESSION_SECRET` - A secure random string for session encryption
- `FROM_NAME` - Your sender name (e.g., "OutreachX Team")
- `FROM_EMAIL` - Your Gmail address

**AI (Gemini):**
- `GEMINI_API_KEY` - Your Google Gemini AI API key

### 5. Update Gmail OAuth Redirect URI
In your Google Cloud Console OAuth2 settings, add your Vercel domain as an authorized redirect URI:
- `https://your-app-name.vercel.app/api/auth/gmail/callback`

### 6. Test the deployment
- Visit your Vercel URL
- Test email sending and tracking
- Verify reply tracking works

## Important Notes

1. **Email Tracking**: With a public Vercel URL, email tracking pixels will work properly in email clients.

2. **Database**: Make sure your Xata database is accessible from Vercel (it should be by default).

3. **Environment Variables**: Never commit environment variables to git. Set them in Vercel dashboard.

4. **Domain**: You can add a custom domain in Vercel settings if needed.

## Troubleshooting

- If deployment fails, check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Check that the database connection works from the deployed app
- Test Gmail OAuth flow with the new domain
