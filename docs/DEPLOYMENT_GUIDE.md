# 🚀 OpenClaw Plus 部署指南

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: light)" srcset="../docs/assets/openclaw-logo-text-dark.svg">
        <img src="../docs/assets/openclaw-logo-text.svg" alt="OpenClaw Plus" width="500">
    </picture>

**OpenClaw Plus** - 个人 AI 助手增强版

[![Version](https://img.shields.io/badge/version-2026.4.1--beta.1-blue)](https://github.com/wcs1977/Openclaw-Plus)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20|%20macOS%20|%20Linux-blue)]()

---

## 📋 目录

- [快速开始](#快速开始)
- [系统要求](#系统要求)
- [安装步骤](#安装步骤)
- [配置指南](#配置指南)
- [部署到 GitHub](#部署到-github)
- [故障排除](#故障排除)
- [常见问题](#常见问题)

---

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/wcs1977/Openclaw-Plus.git
cd Openclaw-Plus
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 构建项目

```bash
# 开发模式（全功能）
pnpm build:dev

# 生产模式（优化）
pnpm build:prod

# 最小化构建（核心功能）
pnpm build:minimal
```

### 4. 运行 OpenClaw Plus

```bash
# 启动网关
pnpm gateway:watch

# 或使用 npm
openclaw-plus onboard --install-daemon
```

---

## 💻 系统要求

### 必需条件

- **Node.js**: v24（推荐）或 v22.16+
- **包管理器**: pnpm（推荐）或 npm
- **操作系统**: 
  - Windows (通过 WSL2，强烈推荐)
  - macOS (Intel/Apple Silicon)
  - Linux (Ubuntu 20.04+, Debian 11+)

### 可选组件

- **Docker**: 用于沙箱环境（非必需）
- **Tailscale**: 用于远程访问（推荐）
- **Git LFS**: 用于大文件管理（推荐）

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

# 4. 安装 pnpm
sudo npm install -g pnpm

# 5. 克隆 OpenClaw Plus
git clone https://github.com/wcs1977/Openclaw-Plus.git
cd Openclaw-Plus

# 6. 安装依赖
pnpm install

# 7. 构建项目
pnpm build:prod

# 8. 运行
openclaw-plus onboard --install-daemon
```

### macOS

```bash
# 1. 确保 Homebrew 已安装
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装 Node.js 24
brew install node@24

# 3. 安装 pnpm
npm install -g pnpm

# 4. 克隆 OpenClaw Plus
git clone https://github.com/wcs1977/Openclaw-Plus.git
cd Openclaw-Plus

# 5. 安装依赖
pnpm install

# 6. 构建项目
pnpm build:prod

# 7. 运行
openclaw-plus onboard --install-daemon
```

### Linux (Ubuntu/Debian)

```bash
# 1. 安装 Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装 pnpm
sudo npm install -g pnpm

# 3. 克隆 OpenClaw Plus
git clone https://github.com/wcs1977/Openclaw-Plus.git
cd Openclaw-Plus

# 4. 安装依赖
pnpm install

# 5. 构建项目
pnpm build:prod

# 6. 运行
openclaw-plus onboard --install-daemon
```

---

## ⚙️ 配置指南

### 基本配置文件

创建 `~/.openclaw/openclaw.json`:

```json5
{
  // AI 模型配置
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

## 🌐 部署到 GitHub

### 步骤 1: 配置 Git

```bash
# 设置用户名和邮箱
git config user.name "wcs1977"
git config user.email "w24543563@hotmail.com"

# 验证配置
git config --list | grep -E 'user\.name|user\.email'
```

### 步骤 2: 添加远程仓库

```bash
# 添加新的远程仓库（如果尚未添加）
git remote add plus https://github.com/wcs1977/Openclaw-Plus.git

# 验证远程仓库
git remote -v
```

### 步骤 3: 提交更改

```bash
# 检查当前状态
git status

# 添加所有更改
git add .

# 提交更改（使用有意义的消息）
git commit -m "feat: OpenClaw Plus v2026.4.1-beta.1 - 优化完成"
```

### 步骤 4: 推送代码

#### 方式 A: 使用 HTTPS + Token（推荐）

```bash
# 设置 Git Credential Manager
git config --global credential.helper store

# 推送到远程仓库
git push -u plus main --force
```

**注意**: 首次推送时，系统会提示输入 GitHub 用户名和密码。密码处需要输入 **Personal Access Token (PAT)**。

#### 方式 B: 使用 SSH（如果已配置）

```bash
# 添加 SSH 远程仓库
git remote add plus_ssh git@github.com:wcs1977/Openclaw-Plus.git

# 推送到远程仓库
git push -u plus_ssh main --force
```

### 步骤 5: 验证推送

```bash
# 查看远程分支状态
git ls-remote plus

# 在浏览器中访问
open https://github.com/wcs1977/Openclaw-Plus
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

A: 修改 `~/.openclaw/exec-approvals.json`:

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

A: 使用 Tailscale:

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
- [GitHub 仓库](https://github.com/wcs1977/Openclaw-Plus)
- [Discord 社区](https://discord.gg/clawd)
- [视频教程](https://youtube.com/@openclaw)

---

## 🤝 贡献指南

欢迎提交 PR！请阅读 [CONTRIBUTING.md](../CONTRIBUTING.md)。

AI/vibe-coded PRs welcome! 🤖

---

**OpenClaw Plus** - 您的个人 AI 助手增强版
由社区共同构建 🦞
