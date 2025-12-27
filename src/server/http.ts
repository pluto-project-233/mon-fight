import express from 'express';
import path from 'path';
import { config } from '../config/env';

export function createHttpServer() {
  const app = express();

  // Serve static files from public directory
  // In dev: src/public, in prod: use src/public since TypeScript doesn't copy static files
  const publicPath = path.join(__dirname, '../../src/public');
  app.use(express.static(publicPath));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
