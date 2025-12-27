#!/bin/bash

# Kill any existing game server process
echo "🔪 Killing existing game server..."
pkill -f "node dist/index.js" 2>/dev/null || true
pkill -f "ts-node src/index.ts" 2>/dev/null || true

# Wait a moment for ports to be released
sleep 1

# Check if port 3000 is still in use and kill it (using fuser)
echo "🔪 Freeing port 3000..."
fuser -k 3000/tcp 2>/dev/null || true
sleep 1

# Rebuild TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Start the server
echo "🚀 Starting game server..."
npm start &

# Wait for server to start
sleep 2

echo "✅ Game server restarted at http://localhost:3000"
