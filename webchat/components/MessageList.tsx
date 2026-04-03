/**
 * Message List Component - WebChat 消息列表组件
 * 
 * 现代化 UI/UX 优化：主题切换、移动端适配、更好的用户体验
 */

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function MessageList({ messages }: { messages: Message[] }) {
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // 自动滚动到最新消息
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // 主题切换
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    
    // 保存到本地存储
    localStorage.setItem('theme', theme === 'light' ? 'dark' : 'light');
  };
  
  return (
    <div 
      className={`message-list ${theme}`}
      ref={scrollRef}
      style={{
        backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a2e',
        color: theme === 'light' ? '#000000' : '#ffffff',
        height: 'calc(100vh - 200px)',
        overflowY: 'auto',
        padding: '1rem'
      }}
    >
      {messages.map((msg, index) => (
        <MessageBubble 
          key={index}
          message={msg}
          theme={theme}
        />
      ))}
      
      {/* 主题切换按钮 */}
      <button
        onClick={toggleTheme}
        className="theme-toggle"
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          background: theme === 'light' ? '#f3f4f6' : '#2d3748',
          border: 'none',
          borderRadius: '50%',
          width: '3rem',
          height: '3rem',
          fontSize: '1.5rem',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  );
}

// MessageBubble 组件
function MessageBubble({ message, theme }: { 
  message: Message; 
  theme: 'light' | 'dark';
}) {
  
  const isUser = message.sender === 'user';
  
  return (
    <div
      className={`message-bubble ${isUser ? 'user' : 'assistant'} ${theme}`}
      style={{
        backgroundColor: isUser 
          ? (theme === 'light' ? '#2563eb' : '#1e40af')
          : (theme === 'light' ? '#f3f4f6' : '#1f2937'),
        color: isUser ? '#ffffff' : '#000000',
        borderRadius: '1rem',
        padding: '1rem',
        margin: '0.5rem 0',
        maxWidth: '80%',
        boxShadow: theme === 'light' 
          ? '0 2px 4px rgba(0,0,0,0.1)' 
          : '0 2px 4px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s',
        transform: 'hover' in document.documentElement ? 'scale(1.02)' : 'none'
      }}
    >
      <div className="message-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginBottom: '0.5rem',
        fontSize: '0.875rem',
        opacity: 0.9
      }}>
        <span className="sender">
          {isUser ? 'You' : 'OpenClaw 🦞'}
        </span>
        <span className="timestamp">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
      
      <div className="message-content" style={{ 
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap'
      }}>
        {message.content}
      </div>
    </div>
  );
}

// CSS 样式 (实际项目中应使用 CSS modules 或 styled-components)
const styles = `
.message-list {
  height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 1rem;
}

.message-bubble.user {
  margin-left: auto;
}

.message-bubble.assistant {
  margin-right: auto;
}

.theme-toggle:hover {
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .message-bubble {
    max-width: 95%;
  }
  
  .theme-toggle {
    bottom: 0.5rem;
    right: 0.5rem;
  }
}
`;

export default MessageList;
