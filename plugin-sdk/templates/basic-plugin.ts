/**
 * Basic Plugin Template - 基础插件模板
 * 
 * 这是 OpenClaw 插件开发的基础模板。
 * 扩展此模板来创建你自己的插件。
 */

import { Plugin, PluginHook } from '@openclaw/plugin-sdk';

export const basicPlugin: Plugin = {
  id: 'basic-plugin',
  name: 'Basic Plugin Template',
  version: '1.0.0',
  description: 'OpenClaw 基础插件模板，用于快速开始插件开发',
  author: 'Your Name',
  
  permissions: ['read', 'write'],
  
  hooks: [
    {
      name: 'onMessageReceived',
      description: '当收到消息时触发',
      callback: async (params) => {
        const { channel, senderId, content } = params;
        
        console.log(`📬 Message from ${senderId} on ${channel}: ${content}`);
        
        // TODO: 实现你的消息处理逻辑
        
        return true; // 继续处理其他钩子
      }
    },
    
    {
      name: 'onCommandExecuted',
      description: '当执行命令时触发',
      callback: async (params) => {
        const { command, args } = params;
        
        console.log(`📝 Command ${command} with args: ${args.join(' ')}`);
        
        // TODO: 实现你的命令处理逻辑
        
        return true; // 继续执行其他命令处理器
      }
    },
    
    {
      name: 'onSessionCreated',
      description: '当创建新会话时触发',
      callback: async (params) => {
        const { sessionId, label } = params;
        
        console.log(`📝 New session created: ${sessionId} (${label})`);
        
        // TODO: 实现你的会话初始化逻辑
        
        return true;
      }
    },
    
    {
      name: 'onSessionDeleted',
      description: '当删除会话时触发',
      callback: async (params) => {
        const { sessionId } = params;
        
        console.log(`🗑️ Session deleted: ${sessionId}`);
        
        // TODO: 实现你的清理逻辑
        
        return true;
      }
    }
  ],
  
  async install() {
    console.log('📦 Installing basic-plugin...');
    
    // TODO: 安装逻辑
    
    console.log('✅ basic-plugin installed successfully!');
  },
  
  async uninstall() {
    console.log('🗑️ Uninstalling basic-plugin...');
    
    // TODO: 卸载逻辑
    
    console.log('✅ basic-plugin uninstalled!');
  }
};

export default basicPlugin;
