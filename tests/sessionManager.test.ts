/**
 * Session Manager Tests - 会话管理器测试
 */

import { SessionManager, Session } from '../src/core/sessionManager';

describe('SessionManager', () => {
  
  let manager: SessionManager;
  
  beforeEach(() => {
    manager = SessionManager.getInstance();
  });
  
  afterEach(() => {
    manager.stop();
  });
  
  describe('createSession', () => {
    
    test('should create a new session with unique ID', async () => {
      const session = await manager.createSession('Test Session');
      
      expect(session.id).toBeDefined();
      expect(typeof session.id).toBe('string');
      expect(session.label).toBe('Test Session');
      expect(session.messages).toEqual([]);
    });
    
    test('should create a session without label', async () => {
      const session = await manager.createSession();
      
      expect(session.id).toBeDefined();
      expect(session.label).toBeUndefined();
    });
  });
  
  describe('getSession', () => {
    
    test('should return null for non-existent session', async () => {
      const result = await manager.getSession('non-existent-id');
      
      expect(result).toBeNull();
    });
    
    test('should return existing session', async () => {
      const session = await manager.createSession('Test Session');
      const result = await manager.getSession(session.id);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(session.id);
    });
  });
  
  describe('addMessage', () => {
    
    test('should add message to session', async () => {
      const session = await manager.createSession('Test Session');
      
      await manager.addMessage(session.id, {
        role: 'user',
        content: 'Hello!',
        timestamp: Date.now()
      });
      
      const result = await manager.getSession(session.id);
      expect(result?.messages.length).toBe(1);
    });
    
    test('should limit messages to 100', async () => {
      const session = await manager.createSession('Test Session');
      
      // Add 150 messages
      for (let i = 0; i < 150; i++) {
        await manager.addMessage(session.id, {
          role: 'user' as any,
          content: `Message ${i}`,
          timestamp: Date.now() + i
        });
      }
      
      const result = await manager.getSession(session.id);
      expect(result?.messages.length).toBe(100); // Should be limited to 100
    });
    
    test('should throw error for non-existent session', async () => {
      await expect(manager.addMessage('non-existent-id', {
        role: 'user' as any,
        content: 'Hello!',
        timestamp: Date.now()
      })).rejects.toThrow();
    });
  });
  
  describe('sleepSession and wakeSession', () => {
    
    test('should sleep a session', async () => {
      const session = await manager.createSession('Test Session');
      
      expect(session.isActive).toBe(true);
      
      await manager.sleepSession(session.id);
      
      // Note: After sleeping, we need to get the session again as it's modified internally
      const result = await manager.getSession(session.id);
      expect(result?.isActive).toBe(false);
    });
    
    test('should wake a session', async () => {
      const session = await manager.createSession('Test Session');
      
      // First sleep the session
      await manager.sleepSession(session.id);
      
      // Then wake it up
      await manager.wakeSession(session.id);
      
      const result = await manager.getSession(session.id);
      expect(result?.isActive).toBe(true);
    });
  });
  
  describe('deleteSession', () => {
    
    test('should delete a session', async () => {
      const session = await manager.createSession('Test Session');
      
      await manager.deleteSession(session.id);
      
      const result = await manager.getSession(session.id);
      expect(result).toBeNull();
    });
  });
  
  describe('getAllSessions', () => {
    
    test('should return all sessions', async () => {
      const session1 = await manager.createSession('Session 1');
      const session2 = await manager.createSession('Session 2');
      
      const sessions = await manager.getAllSessions();
      
      expect(sessions.length).toBe(2);
      expect(sessions.map(s => s.id)).toContain(session1.id);
      expect(sessions.map(s => s.id)).toContain(session2.id);
    });
  });
  
  describe('heartbeat', () => {
    
    test('should update lastActivity on heartbeat', async () => {
      const session = await manager.createSession('Test Session');
      
      // Get initial timestamp
      const initialTimestamp = Date.now();
      
      // Wait a bit and then trigger heartbeat manually (via the interval)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = await manager.getSession(session.id);
      expect(result?.lastActivity).toBeGreaterThanOrEqual(initialTimestamp);
    });
  });
});
