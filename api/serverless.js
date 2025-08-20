import express from 'express';

// Import routes using dynamic import since it's ESM
let app;

async function getApp() {
  if (!app) {
    app = express();
    
    // Dynamic import for ESM modules
    const { registerRoutes } = await import('../server/routes.js');
    await registerRoutes(app);
  }
  return app;
}

export default async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}
