import { createServer } from 'http';
import { createHttpServer } from './server/http';
import { createWebSocketServer } from './server/websocket';
import { config } from './config/env';

// Create HTTP server
const app = createHttpServer();
const httpServer = createServer(app);

// Create WebSocket server
const wss = createWebSocketServer(httpServer);

// Start server
httpServer.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🎮 Game ready to play!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
