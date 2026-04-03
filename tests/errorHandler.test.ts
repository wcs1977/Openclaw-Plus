/**
 * Error Handler Tests - 错误处理测试
 */

import { ErrorHandler } from '../src/core/errorHandler';

describe('ErrorHandler', () => {
  
  let errorHandler: ErrorHandler;
  
  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
  });
  
  describe('classifyError', () => {
    
    test('should classify PERMISSION_DENIED correctly', () => {
      const error = new Error('EACCES: permission denied');
      const result = (errorHandler as any).classifyError(error);
      
      expect(result.name).toBe('PERMISSION_DENIED');
      expect(result.severity).toBe('HIGH');
    });
    
    test('should classify MISSING_FILE correctly', () => {
      const error = new Error('ENOENT: no such file or directory');
      const result = (errorHandler as any).classifyError(error);
      
      expect(result.name).toBe('MISSING_FILE');
      expect(result.severity).toBe('LOW');
    });
    
    test('should classify CONNECTION_REFUSED correctly', () => {
      const error = new Error('ECONNREFUSED: connection refused');
      const result = (errorHandler as any).classifyError(error);
      
      expect(result.name).toBe('CONNECTION_REFUSED');
      expect(result.severity).toBe('HIGH');
    });
    
    test('should classify NETWORK_ERROR correctly', () => {
      const error = new Error('ENOTFOUND: network unreachable');
      const result = (errorHandler as any).classifyError(error);
      
      expect(result.name).toBe('NETWORK_ERROR');
      expect(result.severity).toBe('MEDIUM');
    });
    
    test('should classify TYPE_ERROR correctly', () => {
      const error = new TypeError('Invalid type');
      const result = (errorHandler as any).classifyError(error);
      
      expect(result.name).toBe('TYPE_ERROR');
      expect(result.severity).toBe('MEDIUM');
    });
    
    test('should classify UNKNOWN_ERROR correctly', () => {
      const error = new Error('Unknown error message');
      const result = (errorHandler as any).classifyError(error);
      
      expect(result.name).toBe('UNKNOWN_ERROR');
      expect(result.severity).toBe('MEDIUM');
    });
  });
  
  describe('getSuggestions', () => {
    
    test('should return suggestions for PERMISSION_DENIED', () => {
      const error = new Error('EACCES: permission denied');
      const result = (errorHandler as any).getSuggestions(
        { name: 'PERMISSION_DENIED', severity: 'HIGH' },
        error
      );
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('Run with elevated permissions');
    });
    
    test('should return suggestions for MISSING_FILE', () => {
      const error = new Error('ENOENT: no such file or directory');
      const result = (errorHandler as any).getSuggestions(
        { name: 'MISSING_FILE', severity: 'LOW' },
        error
      );
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('Run "openclaw onboard"');
    });
    
    test('should return default suggestions for unknown errors', () => {
      const error = new Error('Random error');
      const result = (errorHandler as any).getSuggestions(
        { name: 'UNKNOWN_ERROR', severity: 'MEDIUM' },
        error
      );
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('Contact support');
    });
  });
  
  describe('handleStartupError', () => {
    
    test('should handle startup errors gracefully', async () => {
      const error = new Error('EACCES: permission denied');
      
      // This should not throw
      await expect(errorHandler.handleStartupError(error)).resolves.toBeUndefined();
    });
  });
});
