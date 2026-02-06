require('dotenv').config();

const http = require('http');
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const SocketService = require('./services/socket');

console.log('🔥 ENTRY FILE:', __filename);
console.log('🔥 REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'MISSING');

async function init() {
  try {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL is missing');
    }

    const app = express();
    const socketService = new SocketService();
    const server = http.createServer(app);
    const PORT = process.env.PORT || 8000;

    // Basic CORS for local dev (Next.js runs on a different port)
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') return res.sendStatus(204);
      next();
    });

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    /* ================= FILE UPLOADS ================= */

    const uploadDir = path.join(__dirname, '..', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });

    app.use('/uploads', express.static(uploadDir));

    const storage = multer.diskStorage({
      destination: (_, __, cb) => cb(null, uploadDir),
      filename: (_, file, cb) => {
        const ext = path.extname(file.originalname || '');
        const safeExt = ext && ext.length <= 10 ? ext : '';
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        cb(null, `${id}${safeExt}`);
      },
    });

    const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'application/pdf']);

    const upload = multer({
      storage,
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (_, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
          return cb(new Error('Only PNG/JPG/JPEG images and PDFs are allowed'));
        }
        cb(null, true);
      },
    });

    app.post('/upload', upload.single('file'), async (req, res) => {
      const { roomId, userId, username } = req.body || {};

      if (!roomId || !userId) {
        return res.status(400).json({ error: 'roomId and userId are required' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'file is required' });
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      const payload = {
        type: 'file',
        fileUrl,
        fileType: req.file.mimetype,
        filename: req.file.originalname,
        userId,
        username: username || 'Unknown',
        roomId,
        timestamp: Date.now(),
      };

      await socketService.publishToRoom(roomId, payload);

      return res.json({ ok: true, fileUrl });
    });

    // Handle upload errors (multer / fileFilter)
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Upload failed' });
      }
      next();
    });

    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    socketService.io.attach(server);
    socketService.initListeners();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('✅ WebSockets active');
      console.log('✅ Redis enabled');
    });

    process.on('SIGINT', () => {
      console.log('🛑 Shutting down...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

init();
