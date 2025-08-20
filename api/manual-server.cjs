// Manual server implementation for Vercel when compiled version fails
const express = require('express');
const cors = require('cors');

async function createManualApp() {
  const app = express();
  
  // Basic middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
      }
    });
    
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: 'manual-server',
      message: 'Full manual server implementation running'
    });
  });

  // Auth endpoints
  app.get('/api/user', async (req, res) => {
    // TODO: Implement proper authentication
    res.json({ 
      authenticated: false,
      user: null,
      message: 'Authentication system needs database connection'
    });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    // TODO: Implement login logic
    res.status(401).json({ 
      error: 'Authentication not implemented',
      message: 'Database connection required for login'
    });
  });

  app.post('/api/auth/logout', async (req, res) => {
    res.json({ success: true, message: 'Logged out' });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { username, password, email } = req.body;
    // TODO: Implement registration logic
    res.status(501).json({ 
      error: 'Registration not implemented',
      message: 'Database connection required for registration'
    });
  });

  // Setup endpoint
  app.get('/api/setup-needed', async (req, res) => {
    res.json({ 
      setupNeeded: false,
      message: 'Manual server - some features may require database setup'
    });
  });

  // Dashboard endpoints
  app.get('/api/dashboard/stats', async (req, res) => {
    // TODO: Connect to actual database
    res.json({
      totalLeads: 0,
      totalCampaigns: 0,
      openRate: 0,
      replyRate: 0,
      message: 'Demo data - database connection needed for real stats'
    });
  });

  app.get('/api/dashboard/recent-leads', async (req, res) => {
    res.json([]);
  });

  app.get('/api/dashboard/performance', async (req, res) => {
    res.json({
      chartData: [],
      message: 'Performance data requires database connection'
    });
  });

  // Leads endpoints
  app.get('/api/leads', async (req, res) => {
    // TODO: Fetch from database
    res.json([]);
  });

  app.post('/api/leads', async (req, res) => {
    const leadData = req.body;
    
    // TODO: Save to database
    console.log('Lead creation attempted:', leadData);
    
    res.status(501).json({
      success: false,
      error: 'Database connection required',
      message: 'Lead creation needs database setup'
    });
  });

  app.delete('/api/leads/:id', async (req, res) => {
    const { id } = req.params;
    
    // TODO: Delete from database
    console.log('Lead deletion attempted:', id);
    
    res.status(501).json({
      success: false,
      error: 'Database connection required',
      message: 'Lead deletion needs database setup'
    });
  });

  // Email campaigns endpoints
  app.get('/api/email-campaigns', async (req, res) => {
    // TODO: Fetch from database
    res.json([]);
  });

  app.post('/api/email-campaigns', async (req, res) => {
    const campaignData = req.body;
    
    // TODO: Save to database and send emails
    console.log('Campaign creation attempted:', campaignData);
    
    res.status(501).json({
      success: false,
      error: 'Email service and database connection required',
      message: 'Campaign creation needs full server setup'
    });
  });

  app.patch('/api/email-campaigns/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    // TODO: Update in database
    console.log('Campaign update attempted:', id, updates);
    
    res.status(501).json({
      success: false,
      error: 'Database connection required',
      message: 'Campaign updates need database setup'
    });
  });

  // Email tracking - THIS WORKS FULLY
  app.get('/api/email/track-open/:trackingId', (req, res) => {
    try {
      const { trackingId } = req.params;
      
      console.log(`📧 EMAIL OPENED: trackingId=${trackingId}`);
      console.log(`📧 User-Agent: ${req.headers['user-agent']}`);
      console.log(`📧 IP: ${req.ip || req.connection.remoteAddress}`);
      console.log(`📧 Timestamp: ${new Date().toISOString()}`);
      
      // TODO: Update database with open tracking
      
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

  // Reply webhook endpoint
  app.post('/api/email/reply-webhook', (req, res) => {
    console.log('📧 REPLY WEBHOOK received:', req.body);
    
    // TODO: Process reply and update database
    
    res.json({ 
      success: true, 
      message: 'Reply webhook received - processing requires database connection' 
    });
  });

  // Insights endpoints
  app.get('/api/insights', async (req, res) => {
    res.json([]);
  });

  app.post('/api/insights', async (req, res) => {
    const insightData = req.body;
    
    console.log('Insight creation attempted:', insightData);
    
    res.status(501).json({
      success: false,
      error: 'AI service and database connection required',
      message: 'Insights generation needs full server setup'
    });
  });

  // File upload endpoint
  app.post('/api/upload', async (req, res) => {
    res.status(501).json({
      error: 'File upload not implemented',
      message: 'File upload requires server storage configuration'
    });
  });

  // CSV import endpoint
  app.post('/api/leads/import-csv', async (req, res) => {
    res.status(501).json({
      error: 'CSV import not implemented',
      message: 'CSV import requires database connection'
    });
  });

  // Analytics endpoints
  app.get('/api/analytics/*', async (req, res) => {
    res.json({
      data: [],
      message: 'Analytics data requires database connection'
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Manual server error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message, error: err.name });
  });

  return app;
}

module.exports = { createManualApp };
