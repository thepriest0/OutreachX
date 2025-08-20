// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');

let app = null;

// Initialize a working app with essential endpoints
function initializeApp() {
  if (app) return app;
  
  app = express();
  
  // Configure CORS
  app.use(cors({
    origin: true, // Allow all origins for now
    credentials: true
  }));

  app.use(express.json());
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'OutreachX API is running on Vercel!'
    });
  });

  // User endpoint
  app.get('/api/user', (req, res) => {
    res.json({ 
      authenticated: false,
      message: 'Authentication not implemented in serverless version'
    });
  });

  // Setup check endpoint
  app.get('/api/setup-needed', (req, res) => {
    res.json({ 
      setupNeeded: false,
      message: 'Setup completed'
    });
  });

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', (req, res) => {
    res.json({ 
      totalLeads: 0, 
      totalCampaigns: 0, 
      openRate: 0, 
      replyRate: 0,
      message: 'Demo data - connect to database for real stats'
    });
  });

  // Leads endpoint
  app.get('/api/leads', (req, res) => {
    res.json([]);
  });

  app.post('/api/leads', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Lead creation not implemented in serverless version' 
    });
  });

  // Email campaigns endpoint
  app.get('/api/email-campaigns', (req, res) => {
    res.json([]);
  });

  app.post('/api/email-campaigns', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Campaign creation not implemented in serverless version' 
    });
  });

  // Email tracking endpoint - MOST IMPORTANT for your use case
  app.get('/api/email/track-open/:trackingId', (req, res) => {
    try {
      console.log(`📧 EMAIL OPENED: trackingId=${req.params.trackingId}`);
      console.log(`📧 User-Agent: ${req.headers['user-agent']}`);
      console.log(`📧 IP: ${req.ip || req.connection.remoteAddress}`);
      
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

  // Reply webhook endpoint (for future Gmail integration)
  app.post('/api/email/reply-webhook', (req, res) => {
    console.log('📧 REPLY WEBHOOK received:', req.body);
    res.json({ success: true, message: 'Reply webhook received' });
  });

  // Catch-all for unimplemented API routes
  app.all('/api/*', (req, res) => {
    res.status(501).json({ 
      error: 'API endpoint not fully implemented in serverless version',
      endpoint: req.path,
      method: req.method,
      message: 'This is a simplified version for email tracking. For full functionality, use local development.'
    });
  });
  
  return app;
}

// Export handler for Vercel
module.exports = async (req, res) => {
  try {
    const app = initializeApp();
    
    // Handle the request using Express
    app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
