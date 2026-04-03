/**
 * English Translations - OpenClaw Internationalization
 */

export const en = {
  common: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    back: "Back",
    next: "Next",
    previous: "Previous",
    close: "Close",
    open: "Open",
    yes: "Yes",
    no: "No",
    ok: "OK",
    retry: "Retry",
    refresh: "Refresh",
    search: "Search",
    filter: "Filter",
    clear: "Clear",
    reset: "Reset",
    apply: "Apply",
    upload: "Upload",
    download: "Download",
    copy: "Copy",
    paste: "Paste",
    cut: "Cut",
    selectAll: "Select All",
    undo: "Undo",
    redo: "Redo"
  },
  
  gateway: {
    title: "OpenClaw Gateway",
    status: {
      running: "Gateway is running",
      stopped: "Gateway is stopped",
      starting: "Starting gateway...",
      stopping: "Stopping gateway...",
      error: "Gateway encountered an error"
    }
  },
  
  channels: {
    title: "Channel Management",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    slack: "Slack",
    discord: "Discord",
    signal: "Signal",
    imessage: "iMessage",
    teams: "Microsoft Teams",
    matrix: "Matrix",
    feishu: "Feishu",
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
  
  commands: {
    start: "Start Gateway",
    stop: "Stop Gateway",
    restart: "Restart Gateway",
    status: "View Status",
    logs: "View Logs",
    config: "Configuration Management",
    doctor: "System Diagnostics",
    onboard: "Quick Setup Wizard",
    skills: "Skill Management",
    plugins: "Plugin Management",
    update: "Update OpenClaw"
  },
  
  messages: {
    welcome: "Welcome to OpenClaw! 🦞\n\nI'm your personal AI assistant, here to help you:\n• Handle multi-channel messages\n• Automate daily tasks\n• Provide intelligent suggestions\n\nType /help to see available commands.",
    help: "**📚 Available Commands**:\n\n`/start` - Start the gateway\n`/stop` - Stop the gateway\n`/status` - View status\n`/logs` - View logs\n`/config` - Configuration management\n`/doctor` - System diagnostics\n`/onboard` - Quick setup wizard\n`/skills` - Skill management\n`/plugins` - Plugin management",
    welcomeBack: "Welcome back! 👋\nLast session: {lastSession}",
    goodbye: "Goodbye! See you next time! 👋"
  },
  
  settings: {
    title: "Settings",
    general: "General Settings",
    appearance: "Appearance",
    notifications: "Notifications",
    privacy: "Privacy",
    about: "About",
    language: "Language",
    theme: "Theme",
    timezone: "Timezone"
  },
  
  themes: {
    light: "Light Mode",
    dark: "Dark Mode",
    auto: "Auto (System)"
  },
  
  errors: {
    connectionFailed: "Connection failed. Please check your network.",
    authenticationError: "Authentication error. Please try logging in again.",
    permissionDenied: "Permission denied. Please check your access rights.",
    timeoutError: "Request timed out. Please try again later.",
    notFound: "Resource not found.",
    serverError: "Server error. Please try again later.",
    invalidInput: "Invalid input. Please check your data.",
    networkError: "Network error. Please check your connection."
  },
  
  onboard: {
    title: "Quick Start Wizard",
    step1: "Environment Check",
    step2: "Configuration Review",
    step3: "Installation",
    step4: "Channel Setup",
    environmentIssues: "Environment issues detected:",
    recommendations: "Recommendations:",
    autoFix: "Attempt automatic fixes?",
    acceptConfig: "Accept this configuration?",
    quickStartComplete: "Quick start complete!",
    verifySetup: "Run 'openclaw doctor' to verify setup",
    launchGateway: "Run 'openclaw start' to launch the gateway"
  },
  
  skills: {
    title: "Skill Management",
    discover: "Discover Skills",
    install: "Install Skill",
    uninstall: "Uninstall Skill",
    listInstalled: "List Installed Skills",
    fromHub: "From ClawHub",
    local: "Local Skills",
    available: "Available Skills",
    installed: "Installed Skills",
    installing: "Installing skill...",
    installedSuccessfully: "Skill installed successfully!",
    uninstalling: "Uninstalling skill...",
    uninstalledSuccessfully: "Skill uninstalled!",
    incompatible: "Incompatible with current version",
    missingFeatures: "Missing required features"
  },
  
  plugins: {
    title: "Plugin Management",
    create: "Create New Plugin",
    install: "Install Plugin",
    uninstall: "Uninstall Plugin",
    listInstalled: "List Installed Plugins",
    fromNpm: "From npm",
    local: "Local Plugins",
    available: "Available Plugins",
    installed: "Installed Plugins",
    creating: "Creating plugin...",
    createdSuccessfully: "Plugin created successfully!",
    installing: "Installing plugin...",
    installedSuccessfully: "Plugin installed successfully!"
  },
  
  doctor: {
    title: "System Diagnostics",
    checking: "Running diagnostics...",
    checks: {
      nodeVersion: "Node.js version check",
      pnpmInstalled: "pnpm availability",
      workspaceWritable: "Workspace writability",
      tailscaleAvailable: "Tailscale status",
      configValid: "Configuration validity"
    },
    passed: "All checks passed!",
    issuesFound: "Issues detected:",
    recommendations: "Recommendations:"
  },
  
  errors: {
    permissionDenied: "Permission denied. Please check file/directory permissions.",
    networkError: "Network error. Check internet connection or proxy settings.",
    missingFile: "Missing file. Run 'openclaw onboard' to initialize.",
    connectionRefused: "Connection refused. Ensure Gateway is running.",
    timeoutError: "Request timed out. Increase timeout in configuration.",
    memoryError: "Memory error. Close other applications or upgrade RAM.",
    diskSpaceError: "Disk space error. Free up space or move workspace."
  },
  
  recovery: {
    title: "Recovery Mode",
    description: "Limited functionality available. Run commands:",
    exit: "Exit Recovery Mode"
  },
  
  basicMode: {
    title: "Basic Mode",
    description: "Gateway running with limited channels.",
    availableChannels: "Available channels: WebChat, CLI",
    restoreFull: "To restore full functionality:"
  }
};

export default en;
