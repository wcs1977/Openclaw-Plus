/**
 * startup-profiler.test.ts - Integration Tests for Startup Profiler
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  profileCheckpoint, 
  generateStartupReport, 
  detectBottlenecks, 
  getPerformanceStats,
  setProfilingEnabled,
  resetProfiler,
} from '../src/infra/startup-profiler.js';

describe('Startup Profiler Integration Tests', () => {
  
  beforeEach(() => {
    // Enable profiling for tests
    setProfilingEnabled(true);
    resetProfiler();
  });

  afterEach(() => {
    // Clean up after each test
    resetProfiler();
  });

  describe('profileCheckpoint', () => {
    
    it('should mark start and end times correctly', async () => {
      const cleanup = profileCheckpoint('test_checkpoint');
      
      expect(cleanup).toBeDefined();
      
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work
      
      cleanup!();
      
      const stats = getPerformanceStats();
      expect(stats.totalDuration).toBeGreaterThan(0);
    });

    it('should return no-op when profiling is disabled', () => {
      setProfilingEnabled(false);
      
      const cleanup = profileCheckpoint('disabled_checkpoint');
      
      // Should not throw and should be a function
      expect(typeof cleanup).toBe('function');
      
      cleanup!(); // Should not throw
      
      const stats = getPerformanceStats();
      expect(stats.totalDuration).toBe(0);
    });

    it('should record multiple checkpoints in order', async () => {
      const checkpoint1 = profileCheckpoint('first');
      await new Promise(resolve => setTimeout(resolve, 5));
      
      const checkpoint2 = profileCheckpoint('second');
      await new Promise(resolve => setTimeout(resolve, 5));
      
      const checkpoint3 = profileCheckpoint('third');
      
      checkpoint3!();
      checkpoint2!();
      checkpoint1!();
      
      const stats = getPerformanceStats();
      expect(stats.totalDuration).toBeGreaterThan(0);
    });

  });

  describe('generateStartupReport', () => {
    
    it('should generate formatted report with all checkpoints', async () => {
      const cp1 = profileCheckpoint('checkpoint_a');
      await new Promise(resolve => setTimeout(resolve, 5));
      cp1!();
      
      const cp2 = profileCheckpoint('checkpoint_b');
      await new Promise(resolve => setTimeout(resolve, 5));
      cp2!();
      
      const report = generateStartupReport();
      
      expect(report).toContain('OpenClaw Plus Startup Performance Report');
      expect(report).toContain('checkpoint_a');
      expect(report).toContain('checkpoint_b');
      expect(report).toContain('Total startup time:');
    });

    it('should highlight slow operations (>100ms)', async () => {
      const cp = profileCheckpoint('slow_operation');
      
      // Simulate a slow operation (200ms)
      await new Promise(resolve => setTimeout(resolve, 200));
      
      cp!();
      
      const report = generateStartupReport();
      
      expect(report).toContain('⚠️ SLOW');
      expect(report).toContain('slow_operation');
    });

    it('should sort operations by duration (descending)', async () => {
      // Create checkpoints with different durations
      const cp1 = profileCheckpoint('fast');
      await new Promise(resolve => setTimeout(resolve, 5));
      cp1!();
      
      const cp2 = profileCheckpoint('medium');
      await new Promise(resolve => setTimeout(resolve, 50));
      cp2!();
      
      const cp3 = profileCheckpoint('slow');
      await new Promise(resolve => setTimeout(resolve, 150));
      cp3!();
      
      const report = generateStartupReport();
      
      // Should be sorted: slow (150ms) > medium (50ms) > fast (5ms)
      const lines = report.split('\n');
      const slowIndex = lines.findIndex(l => l.includes('slow_operation') || l.includes('slow'));
      const mediumIndex = lines.findIndex(l => l.includes('medium'));
      const fastIndex = lines.findIndex(l => l.includes('fast'));
      
      expect(slowIndex).toBeLessThan(mediumIndex);
      expect(mediumIndex).toBeLessThan(fastIndex);
    });

  });

  describe('detectBottlenecks', () => {
    
    it('should detect operations exceeding threshold', async () => {
      const cp = profileCheckpoint('bottleneck_test');
      
      // Simulate operation taking 150ms (above default 100ms threshold)
      await new Promise(resolve => setTimeout(resolve, 150));
      
      cp!();
      
      const bottlenecks = detectBottlenecks(100);
      
      expect(bottlenecks.length).toBeGreaterThan(0);
      expect(bottlenecks[0]).toContain('bottleneck_test');
    });

    it('should return empty array when no bottlenecks', async () => {
      const cp = profileCheckpoint('fast_operation');
      
      // Simulate fast operation (10ms)
      await new Promise(resolve => setTimeout(resolve, 10));
      
      cp!();
      
      const bottlenecks = detectBottlenecks(100);
      
      expect(bottlenecks.length).toBe(0);
    });

    it('should respect custom threshold', async () => {
      const cp = profileCheckpoint('custom_threshold_test');
      
      // Simulate operation taking 50ms
      await new Promise(resolve => setTimeout(resolve, 50));
      
      cp!();
      
      // With default threshold (100ms), should not detect
      let bottlenecks = detectBottlenecks(100);
      expect(bottlenecks.length).toBe(0);
      
      // With custom threshold (25ms), should detect
      bottlenecks = detectBottlenecks(25);
      expect(bottlenecks.length).toBeGreaterThan(0);
    });

  });

  describe('getPerformanceStats', () => {
    
    it('should return accurate statistics', async () => {
      const cp1 = profileCheckpoint('stat_test_1');
      await new Promise(resolve => setTimeout(resolve, 20));
      cp1!();
      
      const cp2 = profileCheckpoint('stat_test_2');
      await new Promise(resolve => setTimeout(resolve, 30));
      cp2!();
      
      const stats = getPerformanceStats();
      
      expect(stats.totalDuration).toBeGreaterThan(40); // At least 50ms total
      expect(stats.averageDuration).toBeGreaterThan(0);
      expect(stats.slowestOperation).toBeDefined();
      expect(stats.bottleneckCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty profile stack', () => {
      const stats = getPerformanceStats();
      
      expect(stats.totalDuration).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.slowestOperation).toBeNull();
      expect(stats.bottleneckCount).toBe(0);
    });

  });

  describe('setProfilingEnabled', () => {
    
    it('should enable profiling when called with true', () => {
      setProfilingEnabled(false); // Start disabled
      
      const cleanup = profileCheckpoint('disabled_test');
      
      expect(typeof cleanup).toBe('function');
      
      setProfilingEnabled(true);
      
      const cleanup2 = profileCheckpoint('enabled_test');
      
      cleanup!();
      cleanup2!();
      
      const stats = getPerformanceStats();
      expect(stats.totalDuration).toBeGreaterThan(0);
    });

  });

  describe('resetProfiler', () => {
    
    it('should clear all profiler data', async () => {
      const cp1 = profileCheckpoint('before_reset');
      await new Promise(resolve => setTimeout(resolve, 5));
      cp1!();
      
      resetProfiler();
      
      const stats = getPerformanceStats();
      expect(stats.totalDuration).toBe(0);
    });

  });

});
