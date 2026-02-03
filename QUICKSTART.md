# Quick Start Guide

Get the chat app running in **5 minutes**.

---

## Option 1: Using Docker Compose (Fastest ⚡)

### Requirements
- Docker & Docker Compose installed

### Steps
```bash
# 1. Navigate to project
cd scaleable-chat

# 2. Start everything
docker-compose up -d

# 3. Open browser
# Frontend: http://localhost:3000
# Backend: http://localhost:8000

# 4. View logs
docker-compose logs -f

# 5. Stop when done
docker-compose down
```

**That's it!** Redis, backend, and frontend all running.

---

## Option 2: Local Development (Manual)

### Requirements
- Node.js >= 18
- Redis running locally
- Yarn package manager

### Steps

**1. Install Dependencies**
```bash
cd scaleable-chat
yarn install
```

**2. Setup Environment Files**
```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local
```

**3. Start Redis (New Terminal)**
```bash
redis-server
# Or with Docker: docker run -d -p 6379:6379 redis:latest
```

**4. Start Development Server**
```bash
yarn dev
```

**5. Open in Browser**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

---

## Testing the Chat

### Open in 2 Browser Tabs
1. Open http://localhost:3000 in Tab 1
2. Open http://localhost:3000 in Tab 2
3. Send message from Tab 1
4. Verify it appears in Tab 2

### Test Features
- ✅ Send multiple messages
- ✅ Check timestamps
- ✅ Test connection indicator
- ✅ Try on mobile (responsive)
- ✅ Try keyboard: Enter to send, Shift+Enter for newline

---

## Troubleshooting

### Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:** Start Redis first
```bash
redis-server
# or
docker run -d -p 6379:6379 redis:latest
```

### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Modules Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules
yarn install
```

### Socket Connection Error
```
WebSocket connection to 'http://localhost:8000' failed
```
**Solution:** Verify backend is running
```bash
# Check if port 8000 is listening
netstat -an | grep 8000
# or
ss -tulpn | grep 8000
```

---

## File Structure

```
scaleable-chat/
├── apps/
│   ├── server/           # Backend (Node.js + Socket.IO)
│   │   └── src/
│   │       ├── index.js  # Main server
│   │       └── services/socket.js
│   │
│   └── web/              # Frontend (Next.js + React)
│       ├── app/
│       │   ├── layout.jsx
│       │   ├── page.jsx
│       │   └── globals.css
│       ├── components/
│       └── context/
│
├── docker-compose.yml    # One-command setup
├── README.md             # Full documentation
└── DEPLOYMENT.md         # Production guide
```

---

## Commands

```bash
# Development
yarn dev              # Start both apps

# Build for production
yarn build            # Compile everything

# Production start
yarn start            # Run compiled apps

# Formatting
yarn format           # Auto-format code

# Server only
cd apps/server && npm run dev

# Web only
cd apps/web && npm run dev
```

---

## Environment Variables

### Backend (apps/server/.env)
```env
PORT=8000
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

### Frontend (apps/web/.env.local)
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
NODE_ENV=development
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│           Browser (Next.js Frontend)                │
│         Port: 3000                                  │
└──────────────────┬──────────────────────────────────┘
                   │ WebSocket
                   ↓
┌─────────────────────────────────────────────────────┐
│        Node.js Backend (Socket.IO)                  │
│         Port: 8000                                  │
└──────────────────┬──────────────────────────────────┘
                   │ Pub/Sub
                   ↓
┌─────────────────────────────────────────────────────┐
│              Redis Broker                           │
│         Port: 6379                                  │
└─────────────────────────────────────────────────────┘
```

---

## Features

✨ **Real-Time Messaging**
- Instant message delivery
- Auto-scroll to latest

🎨 **Modern UI**
- Discord/Slack inspired
- Dark theme
- Responsive design
- Smooth animations

⚡ **Performant**
- Sub-second build
- Zero TypeScript overhead
- Optimized Tailwind CSS

🔄 **Scalable**
- Redis Pub/Sub
- Horizontal scaling ready
- Stateless design

---

## Next Steps

1. **Explore the code**
   - Backend: `apps/server/src/`
   - Frontend: `apps/web/app/`

2. **Read documentation**
   - `README.md` - Full overview
   - `MIGRATION_GUIDE.md` - TypeScript → JavaScript details
   - `DEPLOYMENT.md` - Production deployment

3. **Customize**
   - Edit `apps/web/tailwind.config.js` for styling
   - Modify messages in `apps/web/components/`
   - Update backend in `apps/server/src/services/`

4. **Deploy**
   - Docker: See `DEPLOYMENT.md` option 3
   - Heroku: See `DEPLOYMENT.md` option 1
   - AWS: See `DEPLOYMENT.md` option 2

---

## Getting Help

| Issue | Solution |
|-------|----------|
| Port conflict | `lsof -i :8000` and kill PID |
| Redis error | Check Redis running: `redis-cli ping` |
| Build error | `rm -rf node_modules && yarn install` |
| Connection failed | Verify `NEXT_PUBLIC_SOCKET_URL` is correct |
| Slow startup | First build is slow, subsequent builds are faster |

---

**That's all!** You now have a running real-time chat application. 🎉

For more details, see `README.md` or `DEPLOYMENT.md`.
