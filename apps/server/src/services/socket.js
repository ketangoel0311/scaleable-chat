const { Server } = require('socket.io');
const Redis = require('ioredis');
const { generateRoomId } = require('../utils/roomUtils');

/* ================= REDIS SETUP ================= */

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error('❌ REDIS_URL missing');
  process.exit(1);
}

const pub = new Redis(redisUrl, { maxRetriesPerRequest: null });
const sub = new Redis(redisUrl, { maxRetriesPerRequest: null });
const store = new Redis(redisUrl, { maxRetriesPerRequest: null });

const getRoomMessagesKey = (roomId) => `room:${roomId}:messages`;
const getRoomChannel = (roomId) => `room:${roomId}`;

/* ================= STATE ================= */

const roomUsers = new Map(); // roomId -> Map(socketId -> user)
const userIdToSocket = new Map(); // userId -> socketId

/* ================= REDIS LOGS ================= */

pub.on('connect', () => console.log('✅ Redis PUB connected'));
sub.on('connect', () => console.log('✅ Redis SUB connected'));
store.on('connect', () => console.log('✅ Redis STORE connected'));

pub.on('error', (e) => console.error('❌ Redis PUB error:', e.message));
sub.on('error', (e) => console.error('❌ Redis SUB error:', e.message));
store.on('error', (e) => console.error('❌ Redis STORE error:', e.message));

/* ================= SOCKET SERVICE ================= */

class SocketService {
  constructor() {
    console.log('[SocketService] Initializing…');

    this._io = new Server({
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      maxHttpBufferSize: 50 * 1024 * 1024,
    });

    sub.psubscribe('room:*', (err) => {
      if (err) {
        console.error('[SocketService] Redis psubscribe error:', err);
      } else {
        console.log('[SocketService] Subscribed to room:*');
      }
    });
  }

  async publishToRoom(roomId, payload) {
    if (!roomId) return;

    const safePayload = {
      ...payload,
      roomId,
      timestamp: payload?.timestamp || Date.now(),
    };

    await store.lpush(getRoomMessagesKey(roomId), JSON.stringify(safePayload));
    await store.ltrim(getRoomMessagesKey(roomId), 0, 49);
    await pub.publish(getRoomChannel(roomId), JSON.stringify(safePayload));
  }

  initListeners() {
    const io = this._io;
    console.log('[SocketService] Initializing listeners…');

    io.on('connection', (socket) => {
      console.log(`[SocketService] Client connected: ${socket.id}`);

      let currentRoomId = null;
      let currentUsername = null;
      let currentUserId = null;

      /* ---------- CREATE ROOM ---------- */

      socket.on('create_room', ({ username, userId }) => {
        const roomId = generateRoomId();

        // If this user already has a socket, disconnect it to avoid duplicates
        const existingSocketId = userIdToSocket.get(userId);
        if (existingSocketId && existingSocketId !== socket.id) {
          const existingSocket = io.sockets.sockets.get(existingSocketId);
          if (existingSocket) {
            existingSocket.disconnect();
          }
        }

        currentRoomId = roomId;
        currentUsername = username;
        currentUserId = userId;

        userIdToSocket.set(userId, socket.id);
        socket.join(roomId);

        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Map());
        }

        roomUsers.get(roomId).set(socket.id, {
          socketId: socket.id,
          username,
          userId,
        });

        socket.emit('room_created', { roomId });
        io.to(roomId).emit('room_users', Array.from(roomUsers.get(roomId).values()));

        console.log(`[Room] Created ${roomId} by ${username} (userId=${userId})`);
      });

      /* ---------- JOIN ROOM ---------- */

      socket.on('join_room', async ({ roomId, username, userId }) => {
        // If this user already has a socket, disconnect it to avoid duplicates in any room
        const existingSocketId = userIdToSocket.get(userId);
        if (existingSocketId && existingSocketId !== socket.id) {
          const existingSocket = io.sockets.sockets.get(existingSocketId);
          if (existingSocket) {
            existingSocket.disconnect();
          }
        }

        currentRoomId = roomId;
        currentUsername = username;
        currentUserId = userId;

        userIdToSocket.set(userId, socket.id);
        socket.join(roomId);

        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Map());
        }

        roomUsers.get(roomId).set(socket.id, {
          socketId: socket.id,
          username,
          userId,
        });

        const cached = await store.lrange(getRoomMessagesKey(roomId), 0, 49);

        cached.reverse().forEach((msg) => {
          try {
            socket.emit('message', JSON.parse(msg));
          } catch {}
        });

        socket.emit('room_joined', { roomId });
        io.to(roomId).emit('room_users', Array.from(roomUsers.get(roomId).values()));

        console.log(`[Room] ${username} (userId=${userId}) joined ${roomId}`);
      });

      /* ---------- TEXT MESSAGE ---------- */

      socket.on('event:message', async ({ message }) => {
        if (!currentRoomId || !currentUsername) return;

        const payload = {
          type: 'text',
          message,
          userId: currentUserId,
          username: currentUsername,
          timestamp: Date.now(),
          roomId: currentRoomId,
        };

        await this.publishToRoom(currentRoomId, payload);
      });

      /* ---------- DISCONNECT ---------- */

      socket.on('disconnect', () => {
        if (currentUserId) userIdToSocket.delete(currentUserId);

        if (currentRoomId) {
          const users = roomUsers.get(currentRoomId);
          if (users) {
            users.delete(socket.id);
            io.to(currentRoomId).emit('room_users', Array.from(users.values()));
          }
        }

        console.log(`[SocketService] Disconnected ${socket.id}`);
      });
    });

    /* ---------- REDIS → SOCKET ---------- */

    sub.on('pmessage', (_, channel, message) => {
      if (!channel.startsWith('room:')) return;
      const roomId = channel.replace('room:', '');
      io.to(roomId).emit('message', JSON.parse(message));
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
