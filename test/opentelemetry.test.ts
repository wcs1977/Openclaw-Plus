/**
 * opentelemetry.test.ts - Integration Tests for OpenTelemetry Manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  OpenTelemetryManager, 
  initializeOpenTelemetry, 
  shutdownOpenTelemetry,
} from '../src/services/telemetry/opentelemetry.js';

describe('OpenTelemetry Manager Integration Tests', () => {
  
  let manager: OpenTelemetryManager;
  
  beforeEach(() => {
    // Create fresh instance for each test
    manager = new OpenTelemetryManager();
    
    // Mock console methods to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    // Clean up after each test
    await shutdownOpenTelemetry();
    
    // Restore console mocks
    vi.restoreAllMocks();
  });

  describe('initialize', () => {
    
    it('should initialize SDK successfully with valid config', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      
      await manager.initialize(config);
      
      expect(manager.getStatus().initialized).toBe(true);
    });

    it('should skip initialization if already initialized', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      
      await manager.initialize(config);
      expect(manager.getStatus().initialized).toBe(true);
      
      // Second call should skip
      await manager.initialize(config);
      
      expect(manager.getStatus().initialized).toBe(true);
    });

    it('should handle initialization failure gracefully', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        endpoint: 'invalid-endpoint-url', // Invalid URL to cause failure
      };
      
      try {
        await manager.initialize(config);
        fail('Expected initialization to throw');
      } catch (error) {
        expect(error).toBeDefined();
        expect(manager.getStatus().initialized).toBe(false);
      }
    });

  });

  describe('shutdown', () => {
    
    it('should shutdown SDK successfully after initialization', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      
      await manager.initialize(config);
      expect(manager.getStatus().initialized).toBe(true);
      
      await manager.shutdown();
      
      expect(manager.getStatus().initialized).toBe(false);
    });

    it('should handle shutdown when not initialized', async () => {
      // Should not throw
      await manager.shutdown();
      
      expect(manager.getStatus().initialized).toBe(false);
    });

  });

  describe('logEvent', () => {
    
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should log event when initialized', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      
      await manager.initialize(config);
      
      manager.logEvent('test_event', { key: 'value' });
      
      // Should have logged to console (mocked)
      expect(console.log).toHaveBeenCalled();
    });

    it('should log event even when not initialized', async () => {
      // Should not throw and should still log
      manager.logEvent('test_event', { key: 'value' });
      
      expect(console.log).toHaveBeenCalledWith(
        '[OTEL] Event logged (not initialized): test_event',
        { key: 'value' }
      );
    });

  });

  describe('trackTokenUsage', () => {
    
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should track token usage correctly', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      
      await manager.initialize(config);
      
      manager.trackTokenUsage('anthropic/claude-opus-4-6', 1234);
      
      expect(console.log).toHaveBeenCalledWith(
        '[OTEL] Metric recorded: token_usage',
        expect.objectContaining({ model: 'anthropic/claude-opus-4-6', tokens: 1234 })
      );
    });

  });

  describe('trackCost', () => {
    
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should track cost correctly', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      
      await manager.initialize(config);
      
      manager.trackCost(0.0123);
      
      expect(console.log).toHaveBeenCalledWith(
        '[OTEL] Metric recorded: cost',
        expect.objectContaining({ cost_usd: 0.0123 })
      );
    });

  });

  describe('trackCommandExecution', () => {
    
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should track command execution correctly', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      
      await manager.initialize(config);
      
      manager.trackCommandExecution('/commit', 123);
      
      expect(console.log).toHaveBeenCalledWith(
        '[OTEL] Metric recorded: command_execution',
        expect.objectContaining({ 
          command_name: '/commit', 
          duration_ms: 123 
        })
      );
    });

  });

  describe('trackPermissionCheck', () => {
    
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should track permission check with allow result', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      
      await manager.initialize(config);
      
      manager.trackPermissionCheck('BashTool', 'allow', 'low');
      
      expect(console.log).toHaveBeenCalledWith(
        '[OTEL] Metric recorded: permission_check',
        expect.objectContaining({ 
          tool_name: 'BashTool', 
          result: 'allow',
          risk_level: 'low'
        })
      );
    });

    it('should track permission check with deny result', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      
      await manager.initialize(config);
      
      manager.trackPermissionCheck('BashTool', 'deny', 'high');
      
      expect(console.log).toHaveBeenCalledWith(
        '[OTEL] Metric recorded: permission_check',
        expect.objectContaining({ 
          tool_name: 'BashTool', 
          result: 'deny',
          risk_level: 'high'
        })
      );
    });

  });

  describe('trackQueryPerformance', () => {
    
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should track query performance correctly', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      
      await manager.initialize(config);
      
      manager.trackQueryPerformance(234, 567, 0.0089);
      
      expect(console.log).toHaveBeenCalledWith(
        '[OTEL] Metric recorded: query_performance',
        expect.objectContaining({ 
          duration_ms: 234,
          token_count: 567,
          cost_usd: 0.0089
        })
      );
    });

  });

  describe('trackError', () => {
    
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should track error with message and stack', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      
      await manager.initialize(config);
      
      const testError = new Error('Test error message');
      
      manager.trackError(testError, 'test_context');
      
      expect(console.error).toHaveBeenCalledWith(
        '[OTEL] Error tracked:',
        'Test error message'
      );
    });

  });

  describe('getStats', () => {
    
    it('should return telemetry statistics', async () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      
      await manager.initialize(config);
      
      // Record some events
      manager.logEvent('event_1');
      manager.trackTokenUsage('model-1', 100);
      manager.trackCost(0.01);
      
      const stats = manager.getStats();
      
      expect(stats).toHaveProperty('eventsRecorded');
      expect(stats).toHaveProperty('errorsTracked');
    });

  });

});
