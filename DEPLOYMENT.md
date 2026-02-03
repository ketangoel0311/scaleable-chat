# Deployment Guide

This guide covers deploying the Scaleable Chat application to production environments.

## Local Development

### Prerequisites
- Node.js >= 18
- Redis (local or remote)
- Yarn package manager

### Quick Start
```bash
# Install dependencies
yarn install

# Set up environment variables
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local

# Start Redis (in another terminal)
redis-server

# Run development server
yarn dev

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

---

## Docker Compose (Recommended for Development)

Run entire stack locally with Docker Compose:

```bash
docker-compose up -d
```

This starts:
- **Redis** on port 6379
- **Backend** on port 8000
- **Frontend** on port 3000

View logs:
```bash
docker-compose logs -f
```

Stop the stack:
```bash
docker-compose down
```

---

## Production Deployment

### Environment Variables

**Backend (.env):**
```env
PORT=8000
NODE_ENV=production
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_USER=default  # If using Redis 6+
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NODE_ENV=production
```

### Build for Production

```bash
# Install dependencies
yarn install

# Build all apps
yarn build

# Outputs:
# - Server: apps/server/dist/
# - Web: apps/web/.next/
```

### Deployment Options

#### Option 1: Heroku

**Backend:**
```bash
cd apps/server
heroku create your-app-server
heroku config:set REDIS_HOST=your-redis-host
heroku config:set REDIS_PASSWORD=your-password
git push heroku main
```

**Frontend:**
```bash
cd apps/web
heroku create your-app-web
heroku config:set NEXT_PUBLIC_SOCKET_URL=https://your-app-server.herokuapp.com
git push heroku main
```

#### Option 2: AWS EC2

**1. Launch EC2 Instance**
- AMI: Ubuntu 22.04 LTS
- Instance Type: t3.small or larger
- Security Groups: Allow ports 80, 443, 8000, 3000

**2. SSH into Instance**
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

**3. Install Dependencies**
```bash
sudo apt update
sudo apt install -y nodejs npm redis-server

# Use NVM for better Node management
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

**4. Clone and Setup**
```bash
git clone your-repo-url
cd scaleable-chat
yarn install
yarn build
```

**5. Start Services**
```bash
# Background backend with PM2
npm install -g pm2
pm2 start "node apps/server/dist/index.js" --name backend
pm2 start "npm start --prefix apps/web" --name frontend
pm2 save
pm2 startup

# Or use systemd (see below)
```

**6. Configure Nginx as Reverse Proxy**
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/default
```

Add configuration:
```nginx
upstream backend {
  server localhost:8000;
}

upstream frontend {
  server localhost:3000;
}

server {
  listen 80 default_server;
  server_name your-domain.com;

  # Frontend
  location / {
    proxy_pass http://frontend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # Backend
  location /socket.io {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
}
```

**7. Enable HTTPS with Let's Encrypt**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Option 3: Docker on AWS ECS

**1. Create ECR Repository**
```bash
aws ecr create-repository --repository-name scaleable-chat-server
aws ecr create-repository --repository-name scaleable-chat-web
```

**2. Build and Push Docker Images**
```bash
docker build -t scaleable-chat-server -f Dockerfile.server .
docker build -t scaleable-chat-web -f Dockerfile.web .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag scaleable-chat-server 123456789.dkr.ecr.us-east-1.amazonaws.com/scaleable-chat-server:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/scaleable-chat-server:latest
```

**3. Create ECS Cluster and Services**
```bash
aws ecs create-cluster --cluster-name scaleable-chat-prod
# Configure task definitions and services via AWS Console or CLI
```

#### Option 4: DigitalOcean App Platform

**1. Connect GitHub Repository**
- Create `.do/app.yaml`:
```yaml
name: scaleable-chat
services:
  - name: backend
    github:
      repo: your-user/scaleable-chat
      branch: main
    build_command: "cd apps/server && npm run build"
    run_command: "node dist/index.js"
    http_port: 8000
    envs:
      - key: REDIS_HOST
        value: ${db.host}
      - key: REDIS_PORT
        value: "6379"
      - key: REDIS_PASSWORD
        value: ${db.password}

  - name: frontend
    github:
      repo: your-user/scaleable-chat
      branch: main
    build_command: "cd apps/web && npm run build"
    run_command: "npm start"
    http_port: 3000
    envs:
      - key: NEXT_PUBLIC_SOCKET_URL
        value: https://your-app-backend.ondigitalocean.app

databases:
  - name: redis
    engine: REDIS
    version: "7"
```

**2. Deploy via DigitalOcean Console**
- Upload `app.yaml` and deploy

---

## Kubernetes Deployment

### Helm Chart (Simplified Example)

**values.yaml:**
```yaml
backend:
  replicas: 3
  image: your-registry/scaleable-chat-server:latest
  port: 8000

frontend:
  replicas: 2
  image: your-registry/scaleable-chat-web:latest
  port: 3000

redis:
  replicas: 1
  image: redis:7-alpine
  port: 6379
```

### Deploy with Helm
```bash
helm repo add scaleable-chat ./helm
helm install scaleable-chat scaleable-chat/scaleable-chat -f values.yaml -n production
```

---

## Production Checklist

- [ ] Environment variables configured (Redis host, passwords, etc.)
- [ ] HTTPS/SSL certificates installed
- [ ] Firewall rules configured (ports 80, 443 only)
- [ ] Redis backups scheduled
- [ ] Monitoring and alerts set up (DataDog, New Relic, etc.)
- [ ] Log aggregation configured (ELK, Splunk, etc.)
- [ ] Database migrations run
- [ ] Performance testing completed
- [ ] Security audit completed
- [ ] Backup and disaster recovery plan documented
- [ ] Auto-scaling configured (if using cloud)
- [ ] Rate limiting configured
- [ ] CORS policy tightened (remove `origin: '*'`)

---

## Scaling Considerations

### Horizontal Scaling
With Redis Pub/Sub, multiple backend instances can be deployed:
- Load balancer (nginx, HAProxy, AWS ALB)
- Redis broker ensures message delivery to all clients
- Session affinity not required (stateless design)

### Redis Cluster
For production, use Redis Cluster for high availability:
```bash
redis-sentinel /etc/redis/sentinel.conf
```

### Database Optimization
If adding PostgreSQL (as architecture allows):
- Use connection pooling (PgBouncer)
- Create appropriate indexes
- Regular VACUUM and ANALYZE

### Monitoring
```bash
# Monitor socket connections
ss -tulpn | grep 8000

# Monitor Redis
redis-cli INFO stats

# Check node process
pm2 monit
```

---

## Troubleshooting Production Issues

### High Memory Usage
```bash
# Check Node.js memory
node --max-old-space-size=4096 dist/index.js

# Check Redis
redis-cli INFO memory
```

### Connection Timeouts
- Check firewall rules
- Verify Redis connectivity: `redis-cli ping`
- Check network latency: `ping redis-host`

### Message Loss
- Verify Redis persistence: `redis-cli CONFIG GET appendonly`
- Check server logs: `pm2 logs`
- Monitor Redis pub/sub: `redis-cli SUBSCRIBE MESSAGES`

---

## Maintenance

### Updates
```bash
# Update Node version
nvm install 18.20.0
nvm use 18.20.0

# Update dependencies
yarn upgrade
yarn build
pm2 restart all
```

### Backups
```bash
# Redis backup
redis-cli BGSAVE

# Copy dump.rdb to secure location
scp ubuntu@instance:/var/lib/redis/dump.rdb ./backups/
```

---

## Performance Tips

1. **Enable Gzip Compression:**
   ```nginx
   gzip on;
   gzip_types text/plain text/css text/javascript application/json;
   ```

2. **Set Appropriate Timeouts:**
   ```javascript
   const socket = io(url, {
     reconnectionDelay: 1000,
     reconnectionDelayMax: 5000,
     reconnectionAttempts: 5,
   });
   ```

3. **Use Connection Pooling** (if adding DB):
   ```javascript
   const pool = new Pool({
     max: 20,
     idleTimeoutMillis: 30000,
   });
   ```

4. **Monitor Socket.IO Memory:**
   ```javascript
   setInterval(() => {
     console.log('Memory:', process.memoryUsage());
   }, 60000);
   ```

