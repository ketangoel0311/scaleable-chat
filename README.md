# Scaleable Chat Application

A production-grade real-time chat application built with **Node.js**, **Next.js**, **WebSockets**, and **Redis Pub/Sub**. 

## Key Features

✅ **Real-time Messaging** - Powered by Socket.IO + Redis Pub/Sub  
✅ **Horizontally Scalable** - Redis enables load balancing across multiple servers  
✅ **Modern UI** - Discord/Slack inspired design with Tailwind CSS  
✅ **Responsive** - Mobile and desktop optimized  
✅ **Pure JavaScript** - No TypeScript, clean ES2020+ code  
✅ **Production Ready** - Error handling, reconnection logic, graceful shutdown  

---

## Architecture

### Backend (`/apps/server`)
- **Runtime:** Node.js with ES modules
- **WebSocket:** Socket.IO v4.7.2
- **Message Broker:** Redis Pub/Sub for horizontal scaling
- **Error Handling:** Comprehensive try-catch and error listeners
- **Graceful Shutdown:** SIGINT handler for clean server termination

### Frontend (`/apps/web`)
- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS v3.3.6
- **Real-time:** Socket.IO Client
- **Components:** React hooks (useState, useEffect, useCallback, useContext)
- **State Management:** Context API with custom hook

---

## Project Structure

```
scaleable-chat/
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── index.js          # Server entry point
│   │   │   └── services/
│   │   │       └── socket.js     # Socket.IO + Redis integration
│   │   ├── package.json
│   │   ├── build.js              # Build script (file copying)
│   │   └── .env.example
│   │
│   └── web/
│       ├── app/
│       │   ├── layout.jsx        # Root layout
│       │   ├── page.jsx          # Main chat page
│       │   └── globals.css       # Tailwind base styles
│       ├── components/
│       │   ├── ChatMessage.jsx   # Message bubble component
│       │   ├── MessageInput.jsx  # Input area component
│       │   ├── ConnectionStatus.jsx
│       │   └── index.js          # Barrel export
│       ├── context/
│       │   └── SocketProvider.jsx # Socket context & hooks
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       └── .env.example
│
├── package.json                   # Root Turbo workspace config
├── turbo.json                     # Turbo build orchestration
└── .gitignore
```

---

## Installation & Setup

### Prerequisites
- **Node.js** >= 18
- **Yarn** 1.22.19 (or npm/pnpm)
- **Redis** (local or remote)

### 1. Install Dependencies

```bash
cd scaleable-chat
yarn install
```

### 2. Configure Environment Variables

**Backend** (`apps/server/.env`):
```bash
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env`:
```
PORT=8000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USER=
REDIS_PASSWORD=
NODE_ENV=development
```

**Frontend** (`apps/web/.env.local`):
```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
NODE_ENV=development
```

### 3. Start Redis

Make sure Redis is running:
```bash
redis-server
# Or if using Docker:
docker run -d -p 6379:6379 redis:latest
```

### 4. Build & Run

**Development Mode** (runs both server and web):
```bash
yarn dev
```

Then:
- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000

**Production Build**:
```bash
yarn build
```

**Start Production Server**:
```bash
yarn start
```

---

## Migration Notes: TypeScript → JavaScript

### What Changed

#### ✅ Backend Conversion
- `src/index.ts` → `src/index.js`
- `src/services/socket.ts` → `src/services/socket.js`
- **Removed:**
  - Interface definitions (`SocketService` class, type generics)
  - `tsconfig.json`
  - TypeScript dev dependencies (typescript, tsc-watch)
- **Added:**
  - ESM module support (`"type": "module"` in package.json)
  - `build.js` for copying src to dist
  - Comprehensive JSDoc comments
  - Enhanced error handling with try-catch blocks
  - Connection lifecycle logging

#### ✅ Frontend Conversion
- `app/layout.tsx` → `app/layout.jsx`
- `app/page.tsx` → `app/page.jsx`
- `context/SocketProvider.tsx` → `context/SocketProvider.jsx`
- **Removed:**
  - Type/Interface definitions (SocketProviderProps, ISocketContext)
  - `tsconfig.json` and TS build configs
  - React type annotations (`React.FC`, `React.ReactNode`)
  - TypeScript dev dependencies
- **Added:**
  - **Tailwind CSS** for modern styling
  - Component-based architecture (ChatMessage, MessageInput, ConnectionStatus)
  - Enhanced socket state (isConnected, isTyping, timestamp tracking)
  - Auto-scroll functionality
  - Connection status indicator
  - Message timestamps and formatting
  - Keyboard shortcuts (Enter to send)
  - Textarea for multi-line support

#### ✅ Configuration Cleanup
- Removed all TypeScript config files
- Removed eslint-config and typescript-config packages
- Updated build scripts to use Node.js directly
- Added Tailwind CSS config
- Added PostCSS config for Tailwind processing

### Key Improvements

**Backend:**
- Cleaner ES2020+ syntax with async/await
- Better error messages with prefixed logs `[SocketService]`, `[Server]`
- Graceful shutdown handling (SIGINT)
- Redis error event listeners
- Message metadata (timestamp, from)

**Frontend:**
- **Modern UI** inspired by Discord/Slack
  - Dark theme (gray-900 background)
  - Message bubbles with distinct styling
  - Smooth animations (fade-in, slide-up)
- **Better UX**
  - Auto-scroll on new messages
  - Connection status indicator
  - Loading states on send button
  - Enter to send, Shift+Enter for newline
  - Disabled input when disconnected
- **Component Reusability**
  - ChatMessage for individual messages
  - MessageInput for input area
  - ConnectionStatus for status display
- **Enhanced Socket Context**
  - Proper connection lifecycle
  - Message metadata (timestamps, sender info)
  - Reconnection strategy configured

---

## API & WebSocket Protocol

### Client → Server
```javascript
// Send message
socket.emit('event:message', { message: 'Hello!' });
```

### Server → Client
```javascript
// Receive messages (via Redis Pub/Sub broadcast)
socket.on('message', (data) => {
  // data: '{"message":"Hello!","from":"socket-id","timestamp":1234567890}'
  const { message, from, timestamp } = JSON.parse(data);
});
```

### Socket.IO Events
- **connect** - Client connected
- **disconnect** - Client disconnected
- **event:message** - Client sends message
- **message** - Server broadcasts message
- **error** - Socket/Redis error

---

## Performance & Scalability

### Redis Pub/Sub Architecture
```
Client 1 ──[emit]──> Server 1 ──[publish]──> Redis
                                               ↓
                                            [subscribe]
                                               ↓
Server 2 ──[emit]──> Client 2, Client 3, Client 4
```

**Benefits:**
- Horizontal scaling across multiple server instances
- All clients receive messages regardless of which server they connect to
- Decoupled communication via Redis broker
- Automatic client reconnection with exponential backoff

### Error Handling
- Redis connection errors logged and monitored
- Socket errors caught and reported
- Message parsing errors handled gracefully
- Server graceful shutdown on SIGINT

---

## Deployment

### Docker (Example)

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY apps/server .
RUN yarn install
RUN yarn build
EXPOSE 8000
CMD ["yarn", "start"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY apps/web .
RUN yarn install
RUN yarn build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next .next
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/public public
EXPOSE 3000
CMD ["yarn", "start"]
```

### Environment Variables for Production
- `PORT` - Backend port (default: 8000)
- `REDIS_HOST` - Redis server hostname
- `REDIS_PORT` - Redis server port
- `REDIS_PASSWORD` - Redis password (if secured)
- `NODE_ENV` - Set to "production"
- `NEXT_PUBLIC_SOCKET_URL` - Backend socket.io endpoint

---

## Troubleshooting

### Connection Issues
1. **Verify Redis is running:** `redis-cli ping` (should respond with PONG)
2. **Check CORS:** Backend allows `origin: '*'`, adjust if needed
3. **Verify socket URL:** Ensure `NEXT_PUBLIC_SOCKET_URL` matches server address
4. **Check firewall:** Ensure port 8000 (backend) is accessible

### Build Issues
1. **Clear node_modules:** `rm -rf node_modules && yarn install`
2. **Clear Next.js cache:** `rm -rf apps/web/.next && yarn build`
3. **Verify Node version:** `node --version` (must be >= 18)

### Redis Issues
```bash
# Test Redis connection
redis-cli ping

# Monitor Redis pub/sub
redis-cli
> SUBSCRIBE MESSAGES
```

---

## Development Workflow

### Local Development
```bash
# Terminal 1: Start everything
yarn dev

# Terminal 2: Watch build (if needed)
# Turbo handles this automatically

# Access in browser
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### Code Organization
- **Backend:** Service-based architecture (SocketService handles all WebSocket logic)
- **Frontend:** Component-based with Context API for state
- **Styling:** Tailwind utility classes (no custom CSS needed)

### Adding Features
1. **New socket event:** Add listener in `SocketService.initListeners()`
2. **New component:** Create in `apps/web/components/`
3. **New route:** Add in `apps/web/app/` (App Router)
4. **State:** Use Context API or add to SocketProvider

---

## Testing

### Manual Testing Checklist
- [ ] Open chat in 2 browser tabs
- [ ] Send message from tab 1, verify in tab 2
- [ ] Disconnect Redis, verify connection error
- [ ] Reconnect Redis, verify reconnection
- [ ] Test on mobile (responsive design)
- [ ] Keyboard: Enter to send, Shift+Enter for newline
- [ ] Auto-scroll on new messages
- [ ] Timestamps display correctly

---

## License

MIT - Feel free to use for any purpose.

---

## Support & Issues

For issues or questions:
1. Check logs: Backend logs show `[SocketService]` and `[Server]` prefixes
2. Browser console: Frontend logs socket events
3. Redis logs: `redis-cli SUBSCRIBE MESSAGES` to monitor pub/sub
4. Environment: Verify all `.env` files are configured correctly

