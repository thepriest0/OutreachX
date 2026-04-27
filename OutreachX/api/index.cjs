// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');

let app = null;

// Initialize the app with full server functionality
async function initializeApp() {
  if (app) return app;
  
  try {
    // Import the compiled server
    const { createApp } = require('../dist/server/index.js');
    
    // Create the full app
    app = await createApp();
    
    // Configure CORS for production
    app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? true // Allow all origins for now, update with your domain later
        : ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true
    }));
    
    return app;
  } catch (error) {
    console.error('Failed to initialize full app, falling back to basic version:', error);
    
    // Fallback to basic implementation
    app = express();
    
    // Configure CORS
    app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? true // Allow all origins for now, update with your domain later
        : ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true
    }));

    app.use(express.json());
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Basic endpoints that can be expanded
    app.get('/api/dashboard/stats', (req, res) => {
      res.json({ 
        totalLeads: 0, 
        totalCampaigns: 0, 
        openRate: 0, 
        replyRate: 0 
      });
    });

    app.get('/api/leads', (req, res) => {
      res.json([]);
    });

    app.get('/api/email-campaigns', (req, res) => {
      res.json([]);
    });

    // Email tracking endpoint - this is crucial for your tracking to work
    app.get('/api/email/track-open/:trackingId', (req, res) => {
      try {
        console.log(`📧 TRACKING: Email open request for trackingId: ${req.params.trackingId}`);
        
        // Return 1x1 transparent pixel
        const pixel = Buffer.from(
          'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          'base64'
        );
        
        res.writeHead(200, {
          'Content-Type': 'image/gif',
          'Content-Length': pixel.length,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.end(pixel);
      } catch (error) {
        console.error('Email tracking error:', error);
        res.status(500).json({ error: 'Tracking failed' });
      }
    });

    // Fallback for other API routes
    app.all('/api/*', (req, res) => {
      res.status(501).json({ 
        error: 'API endpoint not implemented in serverless version',
        endpoint: req.path 
      });
    });
    
    return app;
  }
}

// Export handler for Vercel
module.exports = async (req, res) => {
  try {
    const app = await initializeApp();
    
    // Handle the request using Express
    app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
