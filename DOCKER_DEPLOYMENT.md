# CodeNomad v2 Docker Deployment Guide

This guide explains how to deploy CodeNomad v2 using Docker.

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose -f docker-compose.v2.yml up -d

# View logs
docker-compose -f docker-compose.v2.yml logs -f

# Stop services
docker-compose -f docker-compose.v2.yml down
```

Access the application at:
- Web UI: http://localhost:3000
- API Server: http://localhost:3100

### Using Docker Directly

#### Server Only

```bash
# Build the server image
docker build -f Dockerfile.v2 -t codenomad-server:latest .

# Run the server
docker run -d \
  --name codenomad-server \
  -p 3100:3100 \
  -v codenomad-data:/app/data \
  -e PORT=3100 \
  -e HOST=0.0.0.0 \
  -e LOG_LEVEL=info \
  codenomad-server:latest
```

#### Web UI Only

```bash
# Build the web image
docker build -f Dockerfile.v2-web -t codenomad-web:latest .

# Run the web UI
docker run -d \
  --name codenomad-web \
  -p 3000:3000 \
  -e VITE_API_BASE_URL=http://localhost:3100 \
  codenomad-web:latest
```

## Environment Variables

### Server Container

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `DB_PATH` | `/app/data/codenomad.db` | Database file path |
| `LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins |
| `OPENCODE_BASE_URL` | `http://localhost:3400` | OpenCode server URL |

### Web Container

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3100` | Backend API URL |
| `VITE_WS_URL` | `ws://localhost:3100` | WebSocket URL |

## Volumes

### Server Data Volume

The server uses a named volume `codenomad-data` to persist the SQLite database:

```bash
# Inspect volume
docker volume inspect codenomad-data

# Backup database
docker run --rm -v codenomad-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/codenomad-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restore database
docker run --rm -v codenomad-data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/codenomad-backup-YYYYMMDD.tar.gz -C /data
```

## Health Checks

Both containers include health checks:

```bash
# Check server health
curl http://localhost:3100/health

# Check container health status
docker ps
docker inspect codenomad-server | grep -A 5 Health
```

## Production Deployment

### 1. Environment-Specific Configuration

Create a `.env` file:

```bash
# .env
NODE_ENV=production
PORT=3100
HOST=0.0.0.0
DB_PATH=/app/data/codenomad.db
LOG_LEVEL=warn
CORS_ORIGINS=https://codenomad.example.com
OPENCODE_BASE_URL=http://opencode-server:3400
```

Use it with docker-compose:

```bash
docker-compose -f docker-compose.v2.yml --env-file .env up -d
```

### 2. Reverse Proxy Setup (Nginx)

```nginx
# /etc/nginx/sites-available/codenomad
upstream codenomad_backend {
    server localhost:3100;
}

upstream codenomad_frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name codenomad.example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name codenomad.example.com;

    ssl_certificate /etc/letsencrypt/live/codenomad.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/codenomad.example.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://codenomad_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://codenomad_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://codenomad_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### 3. Docker Swarm / Kubernetes

For orchestration, see the deployment examples in the `deployment/` directory.

## Monitoring

### Logs

```bash
# Follow all logs
docker-compose -f docker-compose.v2.yml logs -f

# Server logs only
docker-compose -f docker-compose.v2.yml logs -f server

# Web logs only
docker-compose -f docker-compose.v2.yml logs -f web
```

### Resource Usage

```bash
# Container stats
docker stats codenomad-server codenomad-web

# Detailed container info
docker inspect codenomad-server
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs codenomad-server

# Inspect container
docker inspect codenomad-server

# Run in interactive mode
docker run -it --rm codenomad-server:latest sh
```

### Database Issues

```bash
# Connect to running container
docker exec -it codenomad-server sh

# Check database
cd /app/data
ls -la

# Reset database (WARNING: deletes all data)
docker-compose -f docker-compose.v2.yml down -v
docker-compose -f docker-compose.v2.yml up -d
```

### Network Issues

```bash
# Check network
docker network ls
docker network inspect codenomad-network

# Test connectivity
docker exec codenomad-web ping codenomad-server
```

## Scaling

### Horizontal Scaling

For load balancing:

```yaml
# docker-compose.v2.yml
services:
  server:
    # ... existing config ...
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

### Database Migration

For production, consider migrating to PostgreSQL:

1. Update server to use PostgreSQL adapter
2. Migrate data from SQLite
3. Update docker-compose.yml to include PostgreSQL service

## Security Considerations

- Use secrets for sensitive configuration
- Run containers as non-root user (already configured)
- Keep images updated
- Use HTTPS in production
- Configure firewall rules
- Regular backups
- Monitor logs for security events

## Updates

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose -f docker-compose.v2.yml build

# Restart services
docker-compose -f docker-compose.v2.yml up -d
```

## License

MIT - See LICENSE file for details.
