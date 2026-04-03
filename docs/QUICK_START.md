# 🚀 OpenClaw Plus 快速开始指南

## 一分钟上手

### 1. 安装

```bash
npm install -g openclaw-plus@latest
```

### 2. 初始化

```bash
openclaw-plus onboard --install-daemon
```

按提示完成设置即可！

### 3. 启动网关

```bash
pnpm gateway:watch
```

### 4. 开始使用

在另一个终端窗口：

```bash
# 发送消息
openclaw-plus message send --to +1234567890 --message "你好，OpenClaw Plus！"

# 与助手对话（可选将回复发送到任何连接的消息渠道）
openclaw-plus agent --message "帮我写一个 Python 脚本" --thinking high
```

---

## 📱 连接消息渠道

### Telegram

```bash
# 设置环境变量
export TELEGRAM_BOT_TOKEN="123456:ABCDEF"

# 或修改配置文件 ~/.openclaw/openclaw.json
{
  "channels": {
    "telegram": {
      "botToken": "123456:ABCDEF"
    }
  }
}
```

### WhatsApp

```bash
# 扫码登录
openclaw-plus channels login --channel whatsapp
```

### Slack/Discord

按照配置文件中的说明设置 bot token。

---

## 🛠️ 常用命令速查

| 命令 | 功能 |
|------|------|
| `openclaw-plus onboard` | 运行初始化向导 |
| `openclaw-plus gateway` | 启动/管理网关 |
| `openclaw-plus agent --message "..."` | 与助手对话 |
| `openclaw-plus message send` | 发送消息 |
| `openclaw-plus channels login` | 登录消息渠道 |
| `openclaw-plus skills list` | 查看已安装技能 |
| `openclaw-plus doctor` | 诊断问题 |

---

## ⚙️ 配置示例

### 基本配置 (`~/.openclaw/openclaw.json`)

```json5
{
  // AI 模型
  "agent": {
    "model": "anthropic/claude-opus-4-6"
  },
  
  // Gateway 端口
  "gateway": {
    "port": 18789,
    "auth": {
      "mode": "token",
      "token": "your-secret-token"
    }
  },
  
  // 默认工作空间
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace"
    }
  }
}
```

### 安全配置

```json5
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main"  // 非主会话使用沙箱
      }
    }
  }
}
```

---

## 🔧 故障排除

### Gateway 无法启动

```bash
# 检查端口占用
lsof -i :18789

# 杀死进程并重启
kill -9 <PID> && openclaw-plus gateway --port 18789
```

### 消息渠道连接失败

```bash
# 重新登录
openclaw-plus channels login --channel whatsapp

# 检查凭证
cat ~/.openclaw/credentials | jq '.whatsapp'
```

### Node.js 版本问题

```bash
# 检查版本
node --version

# 使用 nvm 切换
nvm install 24 && nvm use 24
```

---

## 📚 更多资源

- [完整安装指南](./DEPLOYMENT_GUIDE.md)
- [官方文档](https://docs.openclaw.ai)
- [GitHub 仓库](https://github.com/wcs1977/Openclaw-Plus)
- [Discord 社区](https://discord.gg/clawd)

---

**OpenClaw Plus** - 您的个人 AI 助手增强版 🦞
