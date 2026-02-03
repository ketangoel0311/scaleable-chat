const { Server } = require('socket.io');
const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error('❌ REDIS_URL missing — refusing to start');
  process.exit(1);
}

// Redis clients
const pub = new Redis(redisUrl, { maxRetriesPerRequest: null });
const sub = new Redis(redisUrl, { maxRetriesPerRequest: null });
const store = new Redis(redisUrl, { maxRetriesPerRequest: null }); // for cache

const MESSAGE_CHANNEL = 'MESSAGES';
const MESSAGE_CACHE_KEY = 'chat:last50';

pub.on('connect', () => console.log('✅ Redis PUB connected'));
sub.on('connect', () => console.log('✅ Redis SUB connected'));
store.on('connect', () => console.log('✅ Redis STORE connected'));

pub.on('error', (e) => console.error('❌ Redis PUB error:', e.message));
sub.on('error', (e) => console.error('❌ Redis SUB error:', e.message));
store.on('error', (e) => console.error('❌ Redis STORE error:', e.message));

/**
 * SocketService - Real-time chat with Redis Pub/Sub + short-term cache
 */
class SocketService {
  constructor() {
    console.log('[SocketService] Initializing...');

    this._io = new Server({
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Subscribe for horizontal scaling
    sub.subscribe(MESSAGE_CHANNEL, (err) => {
      if (err) {
        console.error('[SocketService] Redis subscribe error:', err);
      } else {
        console.log('[SocketService] Subscribed to MESSAGES channel');
      }
    });
  }

  initListeners() {
    const io = this._io;
    console.log('[SocketService] Initializing listeners...');

    io.on('connection', async (socket) => {
      console.log(`[SocketService] Client connected: ${socket.id}`);

      // 🔥 SEND LAST 50 MESSAGES ON CONNECT
      try {
        const cached = await store.lrange(MESSAGE_CACHE_KEY, 0, 4);
        cached.reverse().forEach((msg) => {
          socket.emit('message', JSON.parse(msg));
        });
      } catch (err) {
        console.error('[SocketService] Failed to load message cache:', err.message);
      }

      // Handle new message
      socket.on('event:message', async ({ message }) => {
        try {
          const payload = {
            message,
            from: socket.id,
            timestamp: Date.now(),
          };

          // 1️⃣ Save to Redis short-term cache
          await store.lpush(MESSAGE_CACHE_KEY, JSON.stringify(payload));
          await store.ltrim(MESSAGE_CACHE_KEY, 0, 4);

          // 2️⃣ Publish for scale
          await pub.publish(MESSAGE_CHANNEL, JSON.stringify(payload));
        } catch (err) {
          console.error('[SocketService] Publish error:', err.message);
        }
      });

      socket.on('disconnect', () => {
        console.log(`[SocketService] Client disconnected: ${socket.id}`);
      });
    });

    // Broadcast messages coming from Redis
    sub.on('message', (_, message) => {
      io.emit('message', JSON.parse(message));
    });
  }

  get io() {
    return this._io;
  }
}

module.exports = SocketService;

// const { Server } = require('socket.io');
// const Redis = require('ioredis');

// const redisUrl = process.env.REDIS_URL;

// if (!redisUrl) {
//   console.error('❌ REDIS_URL missing — refusing to start');
//   process.exit(1);
// }

// // Force CLOUD Redis only
// const pub = new Redis(redisUrl, {
//   maxRetriesPerRequest: null,
// });

// const sub = new Redis(redisUrl, {
//   maxRetriesPerRequest: null,
// });

// pub.on('connect', () => {
//   console.log('✅ Redis PUB connected to CLOUD');
// });

// sub.on('connect', () => {
//   console.log('✅ Redis SUB connected to CLOUD');
// });

// pub.on('error', (err) => {
//   console.error('❌ Redis PUB error:', err.message);
// });

// sub.on('error', (err) => {
//   console.error('❌ Redis SUB error:', err.message);
// });

// /**
//  * SocketService - Manages WebSocket connections and Redis Pub/Sub
//  */
// class SocketService {
//   constructor() {
//     console.log('[SocketService] Initializing...');

//     this._io = new Server({
//       cors: {
//         origin: '*',
//         methods: ['GET', 'POST'],
//       },
//     });

//     sub.subscribe('MESSAGES', (err) => {
//       if (err) {
//         console.error('[SocketService] Redis subscribe error:', err);
//       } else {
//         console.log('[SocketService] Subscribed to MESSAGES channel');
//       }
//     });
//   }

//   initListeners() {
//     const io = this._io;
//     console.log('[SocketService] Initializing listeners...');

//     io.on('connection', (socket) => {
//       console.log(`[SocketService] Client connected: ${socket.id}`);

//       socket.on('event:message', async ({ message }) => {
//         try {
//           await pub.publish(
//             'MESSAGES',
//             JSON.stringify({
//               message,
//               from: socket.id,
//               timestamp: Date.now(),
//             })
//           );
//         } catch (err) {
//           console.error('[SocketService] Publish error:', err.message);
//         }
//       });

//       socket.on('disconnect', () => {
//         console.log(`[SocketService] Client disconnected: ${socket.id}`);
//       });
//     });

//     sub.on('message', (_, message) => {
//       io.emit('message', JSON.parse(message));
//     });
//   }

//   get io() {
//     return this._io;
//   }
// }

// module.exports = SocketService;
