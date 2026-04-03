/**
 * Chinese Translations - 中文翻译
 */

export const zh = {
  common: {
    loading: "加载中...",
    error: "错误",
    success: "成功",
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    delete: "删除",
    edit: "编辑",
    view: "查看",
    back: "返回",
    next: "下一步",
    previous: "上一步"
  },
  
  gateway: {
    title: "OpenClaw 网关",
    status: {
      running: "网关正在运行",
      stopped: "网关已停止",
      starting: "正在启动网关...",
      stopping: "正在停止网关..."
    }
  },
  
  channels: {
    title: "频道管理",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    slack: "Slack",
    discord: "Discord",
    signal: "Signal",
    imessage: "iMessage",
    teams: "Microsoft Teams",
    matrix: "Matrix",
    feishu: "飞书",
    line: "LINE",
    mattermost: "Mattermost",
    nextcloud: "Nextcloud Talk",
    nostr: "Nostr",
    synology: "Synology Chat",
    tlon: "Tlon",
    twitch: "Twitch",
    zalo: "Zalo",
    webchat: "WebChat"
  },
  
  errors: {
    connectionFailed: "连接失败，请检查网络。",
    authenticationError: "认证错误，请重新登录。",
    permissionDenied: "权限不足，请检查访问权限。",
    timeoutError: "请求超时，请稍后重试。",
    notFound: "未找到资源。",
    serverError: "服务器错误，请稍后再试。"
  },
  
  commands: {
    start: "启动网关",
    stop: "停止网关",
    restart: "重启网关",
    status: "查看状态",
    logs: "查看日志",
    config: "配置管理",
    doctor: "系统诊断",
    onboard: "快速设置向导",
    skills: "技能管理",
    plugins: "插件管理"
  },
  
  messages: {
    welcome: "欢迎使用 OpenClaw! 🦞\n\n我是你的个人 AI 助手，可以帮你：\n• 处理多频道消息\n• 自动化日常任务\n• 提供智能建议\n\n输入 /help 查看可用命令。",
    help: "📚 **可用命令**:\n\n`/start` - 启动网关\n`/stop` - 停止网关\n`/status` - 查看状态\n`/logs` - 查看日志\n`/config` - 配置管理\n`/doctor` - 系统诊断\n`/onboard` - 快速设置向导\n`/skills` - 技能管理\n`/plugins` - 插件管理",
    welcomeBack: "欢迎回来！👋\n上次会话：{lastSession}",
    goodbye: "再见！下次见！👋"
  },
  
  settings: {
    title: "设置",
    general: "常规设置",
    appearance: "外观",
    notifications: "通知",
    privacy: "隐私",
    about: "关于"
  },
  
  themes: {
    light: "浅色模式",
    dark: "深色模式",
    auto: "自动跟随系统"
  }
};

export default zh;
