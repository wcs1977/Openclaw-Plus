# OpenClaw Gateway - Docker Image

[![Docker Pulls](https://img.shields.io/docker/pulls/openclaw/gateway.svg)](https://hub.docker.com/r/openclaw/gateway)
[![Docker Version](https://img.shields.io/docker/v/openclaw/gateway?sort=semver)](https://hub.docker.com/r/openclaw/gateway/tags)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Official Docker images for OpenClaw Personal AI Assistant Gateway.

---

## 📦 Available Tags

| Tag | Description | Size |
|-----|-------------|------|
| `latest` | Latest stable release | ~180MB |
| `2026.4.1-beta.2` | Current beta version | ~180MB |
| `2026.4.1-beta.1` | Previous beta | ~175MB |

---

## 🚀 Quick Start

### 1. Pull the image

```bash
docker pull openclaw/gateway:latest
```

### 2. Run with default configuration

```bash
docker run -d \
  --name openclaw-gateway \
  -p 18789:18789 \
  openclaw/gateway:latest
```

### 3. Access the gateway

Open your browser and navigate to: `http://localhost:18789`

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Node.js environment | `production` | No |
| `OPENCLAW_VERSION` | OpenClaw version | Auto-detected | No |
| `PORT` | Gateway port | `18789` | No |
| `TZ` | Timezone | `UTC` | No |

### Example with custom configuration

```bash
docker run -d \
  --name openclaw-gateway \
  -p 18789:18789 \
  -e NODE_ENV=production \
  -e PORT=18789 \
  -e TZ=Asia/Shanghai \
  -v $(pwd)/config.yaml:/app/config.yaml:ro \
  openclaw/gateway:latest
```

---

## 📁 Volume Mounts

### Recommended volumes

| Path | Purpose | Example |
|------|---------|---------|
| `/root/.openclaw` | User data and configuration | `-v /host/path:/root/.openclaw` |
| `/app/config.yaml` | Configuration file (read-only) | `-v /host/config.yaml:/app/config.yaml:ro` |

### Example with persistent storage

```bash
docker run -d \
  --name openclaw-gateway \
  -p 18789:18789 \
  -v openclaw-data:/root/.openclaw \
  -v ./config.yaml:/app/config.yaml:ro \
  openclaw/gateway:latest

# Create named volume
docker volume create openclaw-data
```

---

## 🔐 Security Best Practices

### Run as non-root user (default)

The container runs as a non-root user (`openclaw` UID 1001) by default.

### Use read-only root filesystem

```bash
docker run -d \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --mount type=volume,source=openclaw-data,target=/root/.openclaw \
  openclaw/gateway:latest
```

### Limit capabilities

```bash
docker run -d \
  --cap-drop=ALL \
  --cap-add=NET_BIND_SERVICE \
  openclaw/gateway:latest
```

---

## 🏥 Health Check

The container includes a built-in health check that monitors the gateway status.

### Check container health

```bash
docker inspect --format='{{.State.Health.Status}}' openclaw-gateway
```

### View health logs

```bash
docker logs openclaw-gateway | grep -i health
```

---

## 📊 Monitoring

### View resource usage

```bash
# CPU and Memory
docker stats openclaw-gateway

# Detailed metrics
docker inspect openclaw-gateway --format='{{json .State}}' | jq
```

### Access logs

```bash
# Real-time logs
docker logs -f openclaw-gateway

# Last 100 lines
docker logs --tail 100 openclaw-gateway

# Since specific time
docker logs --since 2026-04-03T00:00:00 openclaw-gateway
```

---

## 🔄 Updates

### Pull latest image

```bash
docker pull openclaw/gateway:latest
```

### Restart with new version

```bash
docker stop openclaw-gateway
docker rm openclaw-gateway
docker run -d --name openclaw-gateway openclaw/gateway:latest
```

---

## 🐛 Troubleshooting

### Container won't start

Check logs for errors:
```bash
docker logs openclaw-gateway
```

Common issues:
- Port already in use → Change port mapping (`-p 8080:18789`)
- Permission denied → Check volume permissions
- Configuration error → Verify `config.yaml` syntax

### High memory usage

The container uses Alpine-based image for minimal footprint (~180MB). If you see high memory usage:
```bash
# Restart container
docker restart openclaw-gateway

# Check memory limits
docker inspect --format='{{.HostConfig.Memory}}' openclaw-gateway
```

### Connection refused

Ensure the gateway is running and listening on the correct port:
```bash
docker exec openclaw-gateway netstat -tlnp | grep 18789
```

---

## 📚 Resources

- [Official Documentation](https://docs.openclaw.ai)
- [GitHub Repository](https://github.com/openclaw/openclaw)
- [Discord Community](https://discord.gg/clawd)
- [Issue Tracker](https://github.com/openclaw/openclaw/issues)

---

## 📄 License

OpenClaw is licensed under the MIT License. See [LICENSE](../LICENSE) for details.

---

*This Docker image is maintained by the OpenClaw Team.*  
*Last updated: 2026-04-03*
