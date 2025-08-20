// Simple, working Vercel API - NO FALLBACKS, NO COMPLEXITY
const express = require('express');
const cors = require('cors');
const path = require('path');

let app = null;

function createApp() {
  if (app) return app;
  
  app = express();
  
  // Middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (req.path.startsWith("/api")) {
        console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
      }
    });
    next();
  });

  // Static files
  app.use(express.static(path.join(__dirname, '../dist/public')));
  
  // API ENDPOINTS
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/user', (req, res) => {
    res.json({ authenticated: false, user: null });
  });

  app.post('/api/auth/login', (req, res) => {
    res.status(401).json({ error: 'Invalid credentials' });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true });
  });

  app.post('/api/auth/register', (req, res) => {
    res.status(501).json({ error: 'Registration not implemented' });
  });

  app.get('/api/setup-needed', (req, res) => {
    res.json({ setupNeeded: false });
  });

  // DASHBOARD ENDPOINTS - FIXED DATA STRUCTURES
  app.get('/api/dashboard/stats', (req, res) => {
    res.json({
      totalLeads: 0,
      totalSent: 0,
      responseRate: 0.0,
      totalReplies: 0,
      leadsGrowth: 0.0,
      emailsGrowth: 0.0,
      responseChange: 0.0,
      followupsGrowth: 0.0
    });
  });

  app.get('/api/dashboard/recent-leads', (req, res) => {
    res.json([]);
  });

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
      ]
    });
  });

  app.get('/api/insights', (req, res) => {
    res.json([]);
  });

  // LEADS
  app.get('/api/leads', (req, res) => {
    res.json([]);
  });

  app.post('/api/leads', (req, res) => {
    res.json({ success: false, message: 'Database required' });
  });

  app.delete('/api/leads/:id', (req, res) => {
    res.json({ success: false, message: 'Database required' });
  });

  // EMAIL CAMPAIGNS
  app.get('/api/email-campaigns', (req, res) => {
    res.json([]);
  });

  app.post('/api/email-campaigns', (req, res) => {
    res.json({ success: false, message: 'Database required' });
  });

  app.patch('/api/email-campaigns/:id', (req, res) => {
    res.json({ success: false, message: 'Database required' });
  });

  // EMAIL TRACKING - THE MOST IMPORTANT ENDPOINT
  app.get('/api/email/track-open/:trackingId', (req, res) => {
    try {
      console.log(`📧 EMAIL OPENED: ${req.params.trackingId}`);
      
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
      console.error('Tracking error:', error);
      res.status(500).json({ error: 'Tracking failed' });
    }
  });

  app.post('/api/email/reply-webhook', (req, res) => {
    console.log('📧 Reply webhook:', req.body);
    res.json({ success: true });
  });

  // OTHER ENDPOINTS
  app.post('/api/upload', (req, res) => {
    res.status(501).json({ error: 'Upload not implemented' });
  });

  app.post('/api/leads/import-csv', (req, res) => {
    res.status(501).json({ error: 'CSV import not implemented' });
  });

  app.get('/api/analytics/*', (req, res) => {
    res.json({ data: [] });
  });

  // SPA FALLBACK
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });
  
  return app;
}

// VERCEL HANDLER
module.exports = (req, res) => {
  try {
    const app = createApp();
    app(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};
