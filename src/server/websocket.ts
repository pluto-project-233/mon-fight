import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { handleConnect, handlePlayerMove, handleDisconnect } from '../handlers';

export function createWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New client connected');

    // Handle connection
    handleConnect(ws);

    // Handle messages
    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'MOVE':
            handlePlayerMove(ws, message.payload);
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      handleDisconnect(ws);
      console.log('Client disconnected');
    });
  });

  return wss;
}
