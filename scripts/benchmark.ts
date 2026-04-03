/**
 * Performance Benchmark Suite - 性能基准测试套件
 */

import { SessionManager } from '../src/core/sessionManager';
import { ErrorHandler } from '../src/core/errorHandler';
import { SkillManager } from '../src/services/skillManager';
import { DMPairingService } from '../src/core/dmPairing';

interface BenchmarkResult {
  name: string;
  durationMs: number;
  throughput: number; // ops/sec
  memoryUsageMB: number;
  status: 'pass' | 'fail' | 'warning';
}

class PerformanceBenchmark {
  
  private results: BenchmarkResult[] = [];
  
  async runAll(): Promise<BenchmarkResult[]> {
    
    console.log('🚀 Starting OpenClaw Performance Benchmarks\n');
    console.log('=' .repeat(60));
    
    // Test 1: Session Creation Performance
    this.results.push(await this.testSessionCreation());
    
    // Test 2: Message Processing Performance
    this.results.push(await this.testMessageProcessing());
    
    // Test 3: Memory Usage Over Time
    this.results.push(await this.testMemoryUsage());
    
    // Test 4: Error Handling Latency
    this.results.push(await this.testErrorHandlingLatency());
    
    // Test 5: Skill Discovery Performance
    this.results.push(await this.testSkillDiscovery());
    
    // Test 6: DM Pairing Verification Speed
    this.results.push(await this.testDMPairingSpeed());
    
    // Print Summary
    this.printSummary();
    
    return this.results;
  }
  
  private async testSessionCreation(): Promise<BenchmarkResult> {
    
    const manager = SessionManager.getInstance();
    const iterations = 1000;
    
    console.log(`\n📊 Test: Session Creation Performance (${iterations} iterations)`);
    
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await manager.createSession(`Test Session ${i}`);
    }
    
    const durationMs = Date.now() - startTime;
    const throughput = Math.round(iterations / (durationMs / 1000));
    
    // Clean up
    const sessions = await manager.getAllSessions();
    for (const session of sessions) {
      await manager.deleteSession(session.id);
    }
    
    const result: BenchmarkResult = {
      name: 'Session Creation',
      durationMs,
      throughput,
      memoryUsageMB: 0, // TODO: measure actual memory usage
      status: durationMs < 5000 ? 'pass' : 'warning'
    };
    
    console.log(`   Duration: ${durationMs}ms`);
    console.log(`   Throughput: ${throughput} sessions/sec`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    
    return result;
  }
  
  private async testMessageProcessing(): Promise<BenchmarkResult> {
    
    const manager = SessionManager.getInstance();
    const session = await manager.createSession('Benchmark Session');
    const iterations = 500;
    
    console.log(`\n📊 Test: Message Processing Performance (${iterations} messages)`);
    
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await manager.addMessage(session.id, {
        role: 'user' as any,
        content: `Test message ${i}`,
        timestamp: Date.now()
      });
    }
    
    const durationMs = Date.now() - startTime;
    const throughput = Math.round(iterations / (durationMs / 1000));
    
    await manager.deleteSession(session.id);
    
    const result: BenchmarkResult = {
      name: 'Message Processing',
      durationMs,
      throughput,
      memoryUsageMB: 0,
      status: durationMs < 3000 ? 'pass' : 'warning'
    };
    
    console.log(`   Duration: ${durationMs}ms`);
    console.log(`   Throughput: ${throughput} messages/sec`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    
    return result;
  }
  
  private async testMemoryUsage(): Promise<BenchmarkResult> {
    
    const manager = SessionManager.getInstance();
    const iterations = 100;
    
    console.log(`\n📊 Test: Memory Usage Over Time (${iterations} sessions)`);
    
    // Create sessions
    for (let i = 0; i < iterations; i++) {
      await manager.createSession(`Memory Test ${i}`);
    }
    
    // Get memory usage (Node.js process)
    const memUsage = process.memoryUsage();
    const memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    // Clean up
    for (let i = 0; i < iterations; i++) {
      try {
        await manager.deleteSession(`Memory Test ${i}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    const result: BenchmarkResult = {
      name: 'Memory Usage',
      durationMs: 0,
      throughput: 0,
      memoryUsageMB: memoryMB,
      status: memoryMB < 100 ? 'pass' : 'warning'
    };
    
    console.log(`   Memory Used: ${memoryMB}MB`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    
    return result;
  }
  
  private async testErrorHandlingLatency(): Promise<BenchmarkResult> {
    
    const errorHandler = ErrorHandler.getInstance();
    const iterations = 100;
    
    console.log(`\n📊 Test: Error Handling Latency (${iterations} errors)`);
    
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      try {
        throw new Error(`Test error ${i}`);
      } catch (error) {
        await errorHandler.handleStartupError(error as Error);
      }
    }
    
    const durationMs = Date.now() - startTime;
    const throughput = Math.round(iterations / (durationMs / 1000));
    
    const result: BenchmarkResult = {
      name: 'Error Handling Latency',
      durationMs,
      throughput,
      memoryUsageMB: 0,
      status: durationMs < 2000 ? 'pass' : 'warning'
    };
    
    console.log(`   Duration: ${durationMs}ms`);
    console.log(`   Throughput: ${throughput} errors/sec`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    
    return result;
  }
  
  private async testSkillDiscovery(): Promise<BenchmarkResult> {
    
    const manager = SkillManager.getInstance();
    
    console.log('\n📊 Test: Skill Discovery Performance');
    
    const startTime = Date.now();
    const skills = await manager.discoverSkills();
    const durationMs = Date.now() - startTime;
    
    const result: BenchmarkResult = {
      name: 'Skill Discovery',
      durationMs,
      throughput: 0,
      memoryUsageMB: 0,
      status: durationMs < 1000 ? 'pass' : 'warning'
    };
    
    console.log(`   Duration: ${durationMs}ms`);
    console.log(`   Skills Found: ${skills.length}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    
    return result;
  }
  
  private async testDMPairingSpeed(): Promise<BenchmarkResult> {
    
    const service = DMPairingService.getInstance();
    const iterations = 100;
    
    console.log(`\n📊 Test: DM Pairing Verification Speed (${iterations} verifications)`);
    
    // Setup: Create some pairing requests
    for (let i = 0; i < 10; i++) {
      await service.requestPairingCode('benchmark-channel', `user-${i}`);
    }
    
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      // Test with valid code
      await service.verifyPairingCode(
        'benchmark-channel',
        'user-123',
        'INVALID-CODE' // Will fail, but that's OK for benchmark
      );
    }
    
    const durationMs = Date.now() - startTime;
    const throughput = Math.round(iterations / (durationMs / 1000));
    
    service.cleanupExpiredPairings();
    
    const result: BenchmarkResult = {
      name: 'DM Pairing Speed',
      durationMs,
      throughput,
      memoryUsageMB: 0,
      status: durationMs < 1000 ? 'pass' : 'warning'
    };
    
    console.log(`   Duration: ${durationMs}ms`);
    console.log(`   Throughput: ${throughput} verifications/sec`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    
    return result;
  }
  
  private printSummary(): void {
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE BENCHMARK SUMMARY');
    console.log('='.repeat(60));
    
    const totalDuration = this.results.reduce((sum, r) => sum + r.durationMs, 0);
    const passCount = this.results.filter(r => r.status === 'pass').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    
    console.log(`\nTotal Tests: ${this.results.length}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Warnings: ${warningCount}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    
    console.log('\nDetailed Results:');
    for (const result of this.results) {
      const statusIcon = result.status === 'pass' ? '✅' : '⚠️';
      console.log(`\n${statusIcon} ${result.name}`);
      if (result.durationMs > 0) {
        console.log(`   Duration: ${result.durationMs}ms`);
        console.log(`   Throughput: ${result.throughput} ops/sec`);
      }
      if (result.memoryUsageMB > 0) {
        console.log(`   Memory Usage: ${result.memoryUsageMB}MB`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (warningCount === 0) {
      console.log('✅ All benchmarks passed! Performance is optimal.');
    } else {
      console.log(`⚠️ ${warningCount} benchmark(s) need attention.`);
    }
  }
}

// Run benchmarks
async function main() {
  
  const benchmark = new PerformanceBenchmark();
  
  try {
    await benchmark.runAll();
    
    // Exit with appropriate code
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

main();
