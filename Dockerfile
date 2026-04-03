# OpenClaw Docker Image - Production Build
# 基于 Node.js 22 LTS，优化构建和运行时性能

FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要工具
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# 复制 package.json 和 pnpm-lock.yaml (如果存在)
COPY package.json pnpm-lock.yaml* ./

# 使用 PNPM 安装依赖
RUN corepack enable && \
    pnpm install --frozen-lockfile --prod=false

# 复制源代码
COPY . .

# 运行类型检查和构建
RUN pnpm run build

# 生产阶段 - 最小化镜像
FROM node:22-alpine AS production

# 设置非 root 用户
RUN addgroup -g 1001 -S openclaw && \
    adduser -u 1001 -S openclaw -G openclaw

WORKDIR /app

# 从构建阶段复制依赖和构建产物
COPY --from=builder --chown=openclaw:openclaw /app/node_modules ./node_modules
COPY --from=builder --chown=openclaw:openclaw /app/dist ./dist
COPY --from=builder --chown=openclaw:openclaw /app/package.json ./package.json

# 设置环境变量
ENV NODE_ENV=production \
    OPENCLAW_VERSION=2026.4.1-beta.2 \
    PORT=18789

# 切换到非 root 用户
USER openclaw

# 暴露端口
EXPOSE 18789

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:18789/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# 启动命令
CMD ["node", "dist/index.js"]

# 镜像元数据标签
LABEL org.opencontainers.image.title="OpenClaw Gateway" \
      org.opencontainers.image.description="Personal AI Assistant Gateway with multi-channel support" \
      org.opencontainers.image.version="2026.4.1-beta.2" \
      org.opencontainers.image.vendor="OpenClaw Team" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/openclaw/openclaw" \
      org.opencontainers.image.url="https://openclaw.ai"
