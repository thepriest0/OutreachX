# Deploying OutreachX to Render

## Prerequisites
1. Push your code to a GitHub repository
2. Create a Render account at https://render.com

## Step 1: Create PostgreSQL Database
1. Go to Render Dashboard → New → PostgreSQL
2. Choose a name for your database (e.g., `outreachx-db`)
3. Select the free tier or paid tier based on your needs
4. Click "Create Database"
5. Copy the "External Database URL" - you'll need this for your web service

## Step 2: Create Web Service
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `outreachx-app` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

## Step 3: Set Environment Variables
In your web service settings, add these environment variables:

### Required:
- `DATABASE_URL`: The PostgreSQL URL from step 1
- `NODE_ENV`: `production`
- `SESSION_SECRET`: Generate a random string (use a password generator)

### Optional (for full functionality):
- `GMAIL_CLIENT_ID`: Your Gmail OAuth client ID
- `GMAIL_CLIENT_SECRET`: Your Gmail OAuth client secret
- `GMAIL_REFRESH_TOKEN`: Your Gmail refresh token
- `GMAIL_REDIRECT_URI`: Your Gmail redirect URI
- `SENDGRID_API_KEY`: Your SendGrid API key for email sending
- `GOOGLE_AI_API_KEY`: Your Google AI API key for AI features

## Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically deploy your app
3. Once deployed, you'll get a URL like `https://outreachx-app.onrender.com`

## Step 5: Database Migration
After first deployment, you may need to run database migrations:
1. Go to your web service → Shell tab
2. Run: `npm run db:push`

## Features that work on Render:
✅ Background cron jobs (follow-up scheduler)
✅ Email reply tracking with intervals
✅ PostgreSQL database
✅ File uploads
✅ Session management
✅ Gmail OAuth integration
✅ All your existing backend services

## Important Notes:
- Render automatically handles SSL certificates
- Your app will sleep after 15 minutes of inactivity on the free tier
- Paid plans ($7/month) keep your app always running
- Database backups are automatic on paid database plans

## Troubleshooting:
- Check the "Logs" tab in your web service for any errors
- Ensure all environment variables are set correctly
- Make sure your GitHub repository is up to date

## Free Tier Limitations:
- Web service sleeps after 15 minutes of inactivity
- 750 build hours per month
- PostgreSQL database: 1GB storage, expires after 90 days

For production use, consider upgrading to paid plans for better reliability.
