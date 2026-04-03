/**
 * opentelemetry.ts - OpenClaw Plus OpenTelemetry Integration
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { HttpTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS } from '@opentelemetry/semantic-conventions';

/**
 * OpenTelemetry SDK Configuration
 */
export interface OpenTelemetryConfig {
  /** Endpoint for trace export (optional) */
  endpoint?: string;
  
  /** API key for authentication (optional) */
  apiKey?: string;
  
  /** Service name */
  serviceName: string;
  
  /** Service version */
  serviceVersion: string;
}

/**
 * OpenTelemetry Manager - Centralized telemetry management
 */
export class OpenTelemetryManager {
  private sdk: NodeSDK | null = null;
  private isInitialized = false;

  /**
   * Initialize OpenTelemetry SDK
   */
  async initialize(config: OpenTelemetryConfig): Promise<void> {
    if (this.isInitialized) {
      console.warn('[OTEL] Already initialized, skipping...');
      return;
    }

    try {
      const sdk = new NodeSDK({
        resource: new Resource({
          [SEMRESATTRS.SERVICE_NAME]: config.serviceName,
          [SEMRESATTRS.SERVICE_VERSION]: config.serviceVersion,
          'openclaw.platform': process.platform,
          'openclaw.node_version': process.version,
        }),
        
        traceExporter: new HttpTraceExporter({
          url: config.endpoint || 'https://telemetry.openclaw.ai/v1/traces',
          headers: config.apiKey 
            ? { Authorization: `Bearer ${config.apiKey}` }
            : {},
        }),
      });

      sdk.start();
      
      this.sdk = sdk;
      this.isInitialized = true;
      
      console.log('[OTEL] OpenTelemetry initialized');
    } catch (error) {
      console.error('[OTEL] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Shutdown OpenTelemetry SDK
   */
  async shutdown(): Promise<void> {
    if (!this.sdk || !this.isInitialized) {
      return;
    }

    try {
      await this.sdk.shutdown();
      
      console.log('[OTEL] OpenTelemetry shut down');
      
      this.sdk = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('[OTEL] Failed to shutdown:', error);
    }
  }

  /**
   * Get SDK status
   */
  getStatus(): { initialized: boolean; service: string; version: string } {
    return {
      initialized: this.isInitialized,
      service: 'openclaw-plus',
      version: '2026.4.1-beta.1',
    };
  }

  /**
   * Record custom event (for analysis)
   */
  logEvent(eventName: string, properties?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      console.log(`[OTEL] Event logged (not initialized): ${eventName}`, properties);
      return;
    }

    // In real implementation, this would record to OpenTelemetry span
    console.log(`[OTEL] Event: ${eventName}`, properties || {});
  }

  /**
   * Track token usage
   */
  trackTokenUsage(model: string, tokens: number): void {
    const eventName = 'token_usage';
    
    this.logEvent(eventName, { model, tokens });
    
    // Record metric (simplified)
    console.log(`[OTEL] Metric recorded: ${eventName} - model=${model}, tokens=${tokens}`);
  }

  /**
   * Track cost
   */
  trackCost(costUsd: number): void {
    const eventName = 'cost';
    
    this.logEvent(eventName, { cost_usd: costUsd });
    
    console.log(`[OTEL] Metric recorded: ${eventName} - cost=$${costUsd.toFixed(4)}`);
  }

  /**
   * Track command execution
   */
  trackCommandExecution(commandName: string, durationMs: number): void {
    const eventName = 'command_execution';
    
    this.logEvent(eventName, { 
      command_name: commandName, 
      duration_ms: durationMs,
    });
    
    console.log(`[OTEL] Metric recorded: ${eventName} - command=${commandName}, duration=${durationMs}ms`);
  }

  /**
   * Track permission check
   */
  trackPermissionCheck(
    toolName: string, 
    result: 'allow' | 'deny' | 'prompt',
    riskLevel?: 'low' | 'medium' | 'high'
  ): void {
    const eventName = 'permission_check';
    
    this.logEvent(eventName, { 
      tool_name: toolName, 
      result,
      risk_level: riskLevel,
    });
    
    console.log(`[OTEL] Metric recorded: ${eventName} - tool=${toolName}, result=${result}`);
  }

  /**
   * Track query performance
   */
  trackQueryPerformance(
    durationMs: number, 
    tokenCount: number,
    costUsd: number
  ): void {
    const eventName = 'query_performance';
    
    this.logEvent(eventName, {
      duration_ms: durationMs,
      token_count: tokenCount,
      cost_usd: costUsd,
    });
    
    console.log(`[OTEL] Metric recorded: ${eventName} - duration=${durationMs}ms, tokens=${tokenCount}, cost=$${costUsd.toFixed(4)}`);
  }

  /**
   * Track error event
   */
  trackError(error: Error, context?: string): void {
    const eventName = 'error';
    
    this.logEvent(eventName, {
      error_message: error.message,
      error_stack: error.stack,
      context: context || 'unknown',
    });
    
    console.error(`[OTEL] Error tracked: ${error.message}`, error.stack);
  }

  /**
   * Get telemetry statistics (simplified)
   */
  getStats(): {
    eventsRecorded: number;
    errorsTracked: number;
    lastEventTime?: Date;
  } {
    // In real implementation, query OpenTelemetry metrics
    return {
      eventsRecorded: 0,
      errorsTracked: 0,
    };
  }
}

// Singleton instance
export const openTelemetryManager = new OpenTelemetryManager();

/**
 * Initialize OpenTelemetry with default configuration
 */
export function initializeOpenTelemetry(): void {
  openTelemetryManager.initialize({
    serviceName: 'openclaw-plus',
    serviceVersion: '2026.4.1-beta.1',
  });
}

/**
 * Shutdown OpenTelemetry
 */
export async function shutdownOpenTelemetry(): Promise<void> {
  await openTelemetryManager.shutdown();
}
