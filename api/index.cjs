// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const path = require('path');

let app = null;

// Initialize the full app with all server functionality
async function initializeApp() {
  if (app) return app;
  
  try {
    // Try to import the compiled server
    const serverPath = path.join(__dirname, '../dist/server/index.js');
    
    // Since the compiled server is ES modules, we need to use dynamic import
    const { createApp } = await import(serverPath);
    
    console.log('✅ Successfully loaded full server functionality');
    app = await createApp();
    
    return app;
  } catch (error) {
    console.error('❌ Failed to load compiled server, trying alternative approach:', error);
    
    try {
      // Alternative: try to manually recreate the server functionality
      const { createManualApp } = require('./manual-server.cjs');
      app = await createManualApp();
      console.log('✅ Successfully loaded manual server implementation');
      return app;
    } catch (manualError) {
      console.error('❌ Manual server also failed:', manualError);
      
      // Final fallback: basic app
      console.log('⚠️ Using basic fallback server');
      app = createBasicApp();
      return app;
    }
  }
}

// Create a basic app as final fallback
function createBasicApp() {
  const app = express();
  
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Serve static files
  app.use(express.static(path.join(__dirname, '../dist/public')));
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'Basic server running - some features may be limited'
    });
  });

  // User endpoints
  app.get('/api/user', (req, res) => {
    res.json({ 
      authenticated: false,
      message: 'Authentication not available in basic mode'
    });
  });

  app.get('/api/setup-needed', (req, res) => {
    res.json({ setupNeeded: false });
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', (req, res) => {
    res.json({ 
      totalLeads: 0, 
      totalCampaigns: 0, 
      openRate: 0.0, 
      replyRate: 0.0,
      responseRate: 0.0,
      conversionRate: 0.0,
      totalOpens: 0,
      totalReplies: 0,
      totalSent: 0,
      message: 'Demo data - database not connected in basic mode'
    });
  });

  // Dashboard performance endpoint
  app.get('/api/dashboard/performance', (req, res) => {
    res.json({
      chartData: [
        { date: '2024-01-01', opens: 0, replies: 0, sent: 0 },
        { date: '2024-01-02', opens: 0, replies: 0, sent: 0 },
        { date: '2024-01-03', opens: 0, replies: 0, sent: 0 },
        { date: '2024-01-04', opens: 0, replies: 0, sent: 0 },
        { date: '2024-01-05', opens: 0, replies: 0, sent: 0 },
        { date: '2024-01-06', opens: 0, replies: 0, sent: 0 },
        { date: '2024-01-07', opens: 0, replies: 0, sent: 0 }
      ],
      message: 'Demo chart data - database not connected in basic mode'
    });
  });

  // Dashboard recent leads endpoint
  app.get('/api/dashboard/recent-leads', (req, res) => {
    res.json([]);
  });

  // Insights endpoint
  app.get('/api/insights', (req, res) => {
    res.json([]);
  });

  // Leads endpoints
  app.get('/api/leads', (req, res) => {
    res.json([]);
  });

  app.post('/api/leads', (req, res) => {
    res.json({ 
      success: false, 
      message: 'Lead creation requires full server mode' 
    });
  });

  // Email campaigns
  app.get('/api/email-campaigns', (req, res) => {
    res.json([]);
  });

  app.post('/api/email-campaigns', (req, res) => {
    res.json({ 
      success: false, 
      message: 'Campaign creation requires full server mode' 
    });
  });

  // CRITICAL: Email tracking endpoint
  app.get('/api/email/track-open/:trackingId', (req, res) => {
    try {
      console.log(`📧 EMAIL OPENED: trackingId=${req.params.trackingId}`);
      
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

  // Catch-all for SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });
  
  return app;
}

// Export handler for Vercel
module.exports = async (req, res) => {
  try {
    const app = await initializeApp();
    app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
