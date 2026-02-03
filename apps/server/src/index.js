require('dotenv').config();

const http = require('http');
const SocketService = require('./services/socket');

console.log('🔥 ENTRY FILE:', __filename);
console.log('🔥 REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'MISSING');

/**
 * Initialize and start the HTTP server with WebSocket support
 */
async function init() {
  try {
    // Validate environment
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL is missing');
    }

    const socketService = new SocketService();
    const server = http.createServer();
    const PORT = process.env.PORT || 8000;

    // Attach Socket.IO
    socketService.io.attach(server);
    socketService.initListeners();

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('✅ WebSockets active');
      console.log('✅ Redis Pub/Sub enabled');
      console.log('✅ Redis short-term cache (last 50 messages)');
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('❌ Fatal startup error:', err.message);
    process.exit(1);
  }
}

init();

// require('dotenv').config();

// console.log('🔥 ENTRY FILE:', __filename);
// console.log('🔥 REDIS_URL:', process.env.REDIS_URL);

// const http = require('http');
// const SocketService = require('./services/socket');

// /**
//  * Initialize and start the HTTP server with WebSocket support
//  */
// async function init() {
//   try {
//     // Validate env
//     if (!process.env.REDIS_URL) {
//       throw new Error('REDIS_URL is missing');
//     }

//     const socketService = new SocketService();
//     const httpServer = http.createServer();
//     const PORT = process.env.PORT || 8000;

//     // Attach Socket.IO to HTTP server
//     socketService.io.attach(httpServer);

//     // Initialize WebSocket listeners
//     socketService.initListeners();

//     // Start server
//     httpServer.listen(PORT, () => {
//       console.log(`[Server] 🚀 HTTP Server running on http://localhost:${PORT}`);
//       console.log('[Server] ✅ WebSockets active');
//       console.log('[Server] ✅ Redis Pub/Sub enabled');
//     });

//     // Graceful shutdown
//     process.on('SIGINT', () => {
//       console.log('[Server] Shutting down gracefully...');
//       httpServer.close(() => {
//         console.log('[Server] Server closed');
//         process.exit(0);
//       });
//     });
//   } catch (error) {
//     console.error('[Server] ❌ Fatal error during initialization:', error.message);
//     process.exit(1);
//   }
// }

// init();
