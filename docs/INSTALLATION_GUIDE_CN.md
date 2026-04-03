# 🦞 OpenClaw Plus 安装使用指南（中文版）

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: light)" srcset="../docs/assets/openclaw-logo-text-dark.svg">
        <img src="../docs/assets/openclaw-logo-text.svg" alt="OpenClaw Plus" width="500">
    </picture>
</p>

**OpenClaw Plus** 是一款个人 AI 助手增强版，支持多消息平台集成、本地化运行和强大的工具扩展能力。

---

## 📋 目录

- [快速开始](#快速开始)
- [系统要求](#系统要求)
- [安装步骤](#安装步骤)
- [配置指南](#配置指南)
- [常用命令](#常用命令)
- [故障排除](#故障排除)
- [常见问题](#常见问题)

---

## 🚀 快速开始

### 1. 安装 OpenClaw Plus

```bash
# 使用 npm（推荐）
npm install -g openclaw-plus@latest

# 或使用 pnpm
pnpm add -g openclaw-plus@latest
```

### 2. 运行初始化向导

```bash
openclaw-plus onboard --install-daemon
```

这将引导您完成：
- Gateway 网关设置
- 工作空间配置
- 消息渠道连接
- Skills 技能安装

### 3. 启动网关

```bash
# 开发模式（推荐）
pnpm gateway:watch

# 或生产模式
openclaw-plus gateway --port 18789 --verbose
```

---

## 💻 系统要求

### 必需条件

- **Node.js**: v24（推荐）或 v22.16+
- **操作系统**: 
  - macOS (Intel/Apple Silicon)
  - Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
  - Windows (通过 WSL2，强烈推荐)

### 可选组件

- **Docker**: 用于沙箱环境（非必需）
- **Tailscale**: 用于远程访问（推荐）
- **Python 3.9+**: 部分工具依赖

---

## 📦 安装步骤

### Windows (WSL2)

```bash
# 1. 启用 WSL2
wsl --install

# 2. 进入 Ubuntu 子系统
wsl

# 3. 安装 Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. 安装 OpenClaw Plus
npm install -g openclaw-plus@latest

# 5. 运行初始化
openclaw-plus onboard --install-daemon
```

### macOS

```bash
# 1. 确保 Homebrew 已安装
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装 Node.js 24
brew install node@24

# 3. 安装 OpenClaw Plus
npm install -g openclaw-plus@latest

# 4. 运行初始化
openclaw-plus onboard --install-daemon
```

### Linux (Ubuntu/Debian)

```bash
# 1. 安装 Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装 OpenClaw Plus
npm install -g openclaw-plus@latest

# 3. 运行初始化
openclaw-plus onboard --install-daemon
```

---

## ⚙️ 配置指南

### 基本配置文件

创建 `~/.openclaw/openclaw.json`：

```json5
{
  // 模型配置
  agent: {
    model: "anthropic/claude-opus-4-6",
  },
  
  // Gateway 配置
  gateway: {
    port: 18789,
    auth: {
      mode: "token",
      token: "your-secret-token"
    }
  },
  
  // 默认代理设置
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      sandbox: {
        mode: "non-main"
      }
    }
  }
}
```

### 消息渠道配置

#### Telegram

```json5
{
  channels: {
    telegram: {
      botToken: "123456:ABCDEF",
      groups: {
        "*": {
          requireMention: true
        }
      }
    }
  }
}
```

#### WhatsApp

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+1234567890", "+0987654321"],
      groups: {
        "group-id": true
      }
    }
  }
}
```

#### Slack

```json5
{
  channels: {
    slack: {
      botToken: "xoxb-your-token",
      appToken: "xapp-your-app-token"
    }
  }
}
```

---

## 🛠️ 常用命令

### Gateway 管理

```bash
# 启动网关（开发模式）
openclaw-plus gateway --port 18789 --verbose

# 停止网关
openclaw-plus gateway stop

# 重启网关
openclaw-plus gateway restart

# 查看状态
openclaw-plus gateway status
```

### Agent 交互

```bash
# 发送消息给助手
openclaw-plus agent --message "创建项目清单" --thinking high

# 查看会话状态
openclaw-plus session status

# 重置会话
openclaw-plus session reset
```

### Channel 管理

```bash
# 登录 WhatsApp
openclaw-plus channels login --channel whatsapp

# 列出所有渠道
openclaw-plus channels list

# 登出指定渠道
openclaw-plus channels logout --channel telegram
```

### Skills 管理

```bash
# 安装技能
openclaw-plus skills install @openclaw/skill-name

# 列出已安装技能
openclaw-plus skills list

# 更新所有技能
openclaw-plus skills update
```

---

## 🔧 故障排除

### Gateway 无法启动

**症状**: `Gateway failed to start on port 18789`

**解决方案**:
```bash
# 检查端口占用
lsof -i :18789

# 杀死进程
kill -9 <PID>

# 或更改端口
openclaw-plus gateway --port 18790
```

### 消息渠道连接失败

**症状**: `Failed to connect to WhatsApp/Telegram`

**解决方案**:
```bash
# 重新登录
openclaw-plus channels login --channel whatsapp

# 检查凭证
cat ~/.openclaw/credentials | jq '.whatsapp'

# 重置凭证
rm ~/.openclaw/credentials && openclaw-plus channels login
```

### Node.js 版本问题

**症状**: `Unsupported engine` 错误

**解决方案**:
```bash
# 检查当前版本
node --version

# 使用 nvm 切换版本
nvm install 24
nvm use 24

# 或设置全局版本
nvm alias default 24
```

### Docker 沙箱问题

**症状**: `Sandbox mode not available`

**解决方案**:
```bash
# 检查 Docker 是否运行
docker ps

# 启动 Docker
sudo systemctl start docker

# 验证权限
docker run hello-world
```

---

## ❓ 常见问题

### Q: OpenClaw Plus 和 OpenClaw 有什么区别？

A: OpenClaw Plus 是 OpenClaw 的增强版本，包含：
- 更友好的中文界面
- 增强的安全审批机制（可配置）
- 优化的性能表现
- 更多本地化功能

### Q: 如何禁用命令审批？

A: 修改 `~/.openclaw/exec-approvals.json`：

```json5
{
  "version": 1,
  "defaults": {
    "security": "full",
    "ask": "off"
  }
}
```

### Q: 如何配置远程访问？

A: 使用 Tailscale：

```bash
# 安装 Tailscale
sudo apt install tailscale

# 登录
sudo tailscale up

# OpenClaw Plus 会自动配置
openclaw-plus gateway --tailscale-mode serve
```

### Q: 如何备份数据？

A: 

```bash
# 备份工作目录
tar -czf openclaw-backup-$(date +%Y%m%d).tar.gz ~/.openclaw

# 恢复
tar -xzf openclaw-backup-YYYYMMDD.tar.gz -C ~
```

### Q: 如何更新到最新版本？

A:

```bash
# 使用 npm 更新
npm update -g openclaw-plus@latest

# 或使用 beta 版本
openclaw-plus update --channel beta

# 或开发版本
openclaw-plus update --channel dev
```

---

## 📚 更多资源

- [官方文档](https://docs.openclaw.ai)
- [GitHub 仓库](https://github.com/openclaw/openclaw)
- [Discord 社区](https://discord.gg/clawd)
- [视频教程](https://youtube.com/@openclaw)

---

## 🤝 贡献指南

欢迎提交 PR！请阅读 [CONTRIBUTING.md](../CONTRIBUTING.md)。

AI/vibe-coded PRs welcome! 🤖

---

**OpenClaw Plus** - 您的个人 AI 助手增强版
由社区共同构建 🦞
