/**
 * startupProfiler.ts - OpenClaw Plus 启动性能分析器
 * 
 * 借鉴 Claude Code v2.1.88 的 profileCheckpoint 模式，
 * 用于追踪启动阶段的性能瓶颈。
 */

interface ProfileEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

const profileStack: ProfileEntry[] = [];
let isProfilingEnabled = true;

/**
 * 标记性能检查点
 * 
 * @param name - 检查点名称
 * @returns 返回一个函数，调用时结束该检查点并记录持续时间
 */
export function profileCheckpoint(name: string): () => void {
  if (!isProfilingEnabled) {
    return () => {}; // No-op if profiling is disabled
  }

  const start = performance.now();
  
  console.log(`[STARTUP] ${name} started at ${start.toFixed(2)}ms`);
  
  return () => {
    const end = performance.now();
    const duration = end - start;
    
    console.log(`[STARTUP] ${name} completed in ${duration.toFixed(2)}ms`);
    
    profileStack.push({ 
      name, 
      startTime: start, 
      endTime: end,
      duration,
    });
  };
}

/**
 * 生成性能报告
 */
export function generateStartupReport(): string {
  const entries = profileStack.sort((a, b) => 
    (b.duration ?? 0) - (a.duration ?? 0)
  );
  
  let report = '\n=== OpenClaw Plus Startup Performance Report ===\n\n';
  
  for (const entry of entries) {
    const duration = entry.duration ?? 'N/A';
    
    // Add visual indicator for slow operations (>100ms)
    const indicator = typeof duration === 'number' && duration > 100 
      ? ' ⚠️ SLOW' 
      : '';
    
    report += `${entry.name.padEnd(45)} ${duration.toFixed(2)}ms${indicator}\n`;
  }
  
  const totalTime = entries.reduce((sum, entry) => sum + (entry.duration ?? 0), 0);
  
  report += '\n' + '='.repeat(60) + '\n';
  report += `Total startup time: ~${totalTime.toFixed(2)}ms\n`;
  report += '='.repeat(60) + '\n';
  
  return report;
}

/**
 * 性能瓶颈检测
 */
export function detectBottlenecks(thresholdMs = 100): string[] {
  const bottlenecks: string[] = [];
  
  for (const entry of profileStack) {
    if (entry.duration && entry.duration > thresholdMs) {
      bottlenecks.push(
        `${entry.name}: ${entry.duration.toFixed(2)}ms (>${thresholdMs}ms)`
      );
    }
  }
  
  return bottlenecks;
}

/**
 * 获取性能统计信息
 */
export function getPerformanceStats(): {
  totalDuration: number;
  averageDuration: number;
  slowestOperation: string | null;
  bottleneckCount: number;
} {
  const entries = profileStack.filter(e => e.duration);
  
  if (entries.length === 0) {
    return {
      totalDuration: 0,
      averageDuration: 0,
      slowestOperation: null,
      bottleneckCount: 0,
    };
  }
  
  const totalDuration = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);
  const averageDuration = totalDuration / entries.length;
  
  const slowestEntry = entries.reduce((slowest, current) => 
    (current.duration ?? 0) > (slowest?.duration ?? 0) ? current : slowest
  );
  
  const bottleneckCount = entries.filter(e => e.duration && e.duration > 100).length;
  
  return {
    totalDuration,
    averageDuration,
    slowestOperation: slowestEntry?.name || null,
    bottleneckCount,
  };
}

/**
 * 启用/禁用性能分析器
 */
export function setProfilingEnabled(enabled: boolean) {
  isProfilingEnabled = enabled;
  
  if (enabled) {
    console.log('[STARTUP] Profiling enabled');
  } else {
    console.log('[STARTUP] Profiling disabled');
  }
}

/**
 * 重置性能分析器数据
 */
export function resetProfiler() {
  profileStack.length = 0;
  
  console.log('[STARTUP] Profiler data cleared');
}

/**
 * 自动在启动结束时生成报告（如果 profiling 已启用）
 */
if (isProfilingEnabled) {
  // Register shutdown handler to generate report
  process.on('exit', () => {
    const stats = getPerformanceStats();
    
    if (stats.totalDuration > 0) {
      console.log('\n' + generateStartupReport());
      
      if (stats.bottleneckCount > 0) {
        console.warn(`\n⚠️ Detected ${stats.bottleneckCount} performance bottleneck(s):\n`);
        
        for (const bottleneck of detectBottlenecks(100)) {
          console.warn(`  - ${bottleneck}`);
        }
      }
    }
  });
}
