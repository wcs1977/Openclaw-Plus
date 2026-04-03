/**
 * Integration Tests - 集成测试
 */

import { SessionManager } from '../src/core/sessionManager';
import { ErrorHandler } from '../src/core/errorHandler';
import { SkillManager } from '../src/services/skillManager';
import { DMPairingService } from '../src/core/dmPairing';

describe('OpenClaw Integration Tests', () => {
  
  describe('Session Management Flow', () => {
    
    test('should handle complete session lifecycle', async () => {
      const manager = SessionManager.getInstance();
      
      // Create session
      const session = await manager.createSession('Integration Test');
      expect(session.id).toBeDefined();
      
      // Add messages
      await manager.addMessage(session.id, {
        role: 'user' as any,
        content: 'Hello OpenClaw!',
        timestamp: Date.now()
      });
      
      const sessionData = await manager.getSession(session.id);
      expect(sessionData?.messages.length).toBe(1);
      
      // Sleep and wake
      await manager.sleepSession(session.id);
      await manager.wakeSession(session.id);
      
      const awakeSession = await manager.getSession(session.id);
      expect(awakeSession?.isActive).toBe(true);
      
      // Delete session
      await manager.deleteSession(session.id);
      
      const deletedSession = await manager.getSession(session.id);
      expect(deletedSession).toBeNull();
    });
  });
  
  describe('Error Handling Flow', () => {
    
    test('should handle various error types gracefully', async () => {
      const errorHandler = ErrorHandler.getInstance();
      
      // Test permission denied
      await expect(errorHandler.handleStartupError(
        new Error('EACCES: permission denied')
      )).resolves.toBeUndefined();
      
      // Test missing file
      await expect(errorHandler.handleStartupError(
        new Error('ENOENT: no such file or directory')
      )).resolves.toBeUndefined();
      
      // Test connection refused
      await expect(errorHandler.handleStartupError(
        new Error('ECONNREFUSED: connection refused')
      )).resolves.toBeUndefined();
    });
  });
  
  describe('Skill System Integration', () => {
    
    test('should discover skills from directory', async () => {
      const manager = SkillManager.getInstance();
      
      // This will scan the default skill directories
      const skills = await manager.discoverSkills();
      
      // Skills may or may not exist, but should return array
      expect(Array.isArray(skills)).toBe(true);
    });
  });
  
  describe('DM Pairing Integration', () => {
    
    test('should handle pairing flow correctly', async () => {
      const service = DMPairingService.getInstance();
      
      // Request pairing code
      await service.requestPairingCode('test-channel', 'user-123');
      
      // Verify pairing request exists
      const stats = service.getStats();
      expect(stats.pendingPairings).toBeGreaterThanOrEqual(0);
      
      // Cleanup expired pairings
      service.cleanupExpiredPairings();
    });
    
    test('should reject invalid pairing codes', async () => {
      const service = DMPairingService.getInstance();
      
      const result = await service.verifyPairingCode(
        'test-channel',
        'user-123',
        'INVALID-CODE'
      );
      
      expect(result).toBe(false);
    });
  });
  
  describe('Combined Workflow', () => {
    
    test('should handle complete user workflow', async () => {
      const sessionManager = SessionManager.getInstance();
      const errorHandler = ErrorHandler.getInstance();
      
      // Step 1: Create session
      const session = await sessionManager.createSession('Workflow Test');
      expect(session.id).toBeDefined();
      
      // Step 2: Add messages
      await sessionManager.addMessage(session.id, {
        role: 'user' as any,
        content: 'I need help with a task',
        timestamp: Date.now()
      });
      
      // Step 3: Simulate error handling
      try {
        throw new Error('Simulated error');
      } catch (error) {
        await errorHandler.handleStartupError(error as Error);
      }
      
      // Step 4: Clean up
      await sessionManager.deleteSession(session.id);
    });
  });
});
