/**
 * queryHelpers.ts - Query Engine 辅助函数
 */

import type { SDKMessage, SDKStatus } from '../entrypoints/agentSdkTypes.js';
import type { Message } from '../types/message.js';
import type { NonNullableUsage, EMPTY_USAGE } from '../services/api/logging.js';
import { accumulateUsage, updateUsage } from '../services/api/logging.js';

/**
 * 标准化消息格式（SDK 兼容）
 */
export function normalizeMessage(message: Message): SDKMessage {
  switch (message.type) {
    case 'assistant':
      return {
        type: 'assistant',
        content: message.content,
        usage: message.usage ?? EMPTY_USAGE,
      };
    
    case 'tool_use':
      return {
        type: 'tool_use',
        tool_name: (message as any).tool_name,
        tool_use_id: (message as any).tool_use_id,
        input: (message as any).input ?? {},
      };
    
    case 'tool_result':
      return {
        type: 'tool_result',
        tool_use_id: (message as any).tool_use_id,
        content: message.content,
        isError: (message as any).is_error ?? false,
      };
    
    case 'stream_event':
      return {
        type: 'stream_event',
        event: (message as any).event,
      };
    
    default:
      return message as SDKMessage;
  }
}

/**
 * 流式事件处理器
 */
export class StreamEventHandler {
  private currentMessageUsage: NonNullableUsage = EMPTY_USAGE;
  
  handleEvent(event: unknown): void {
    if (!event) return;
    
    const typedEvent = event as Record<string, unknown>;
    
    switch (typedEvent.type) {
      case 'message_start':
        this.currentMessageUsage = EMPTY_USAGE;
        console.log('[STREAM] Message started');
        break;
      
      case 'message_delta':
        if (typedEvent.usage) {
          this.currentMessageUsage = updateUsage(
            this.currentMessageUsage, 
            typedEvent.usage as NonNullableUsage
          );
        }
        break;
      
      case 'content_block_start':
        console.log('[STREAM] Content block started');
        break;
      
      case 'content_block_delta':
        // Accumulate content delta
        if (typedEvent.delta) {
          console.log('[STREAM] Content delta:', typedEvent.delta);
        }
        break;
      
      case 'content_block_stop':
        console.log('[STREAM] Content block stopped');
        break;
      
      default:
        console.log('[STREAM] Unknown event type:', typedEvent.type);
    }
  }
  
  getCurrentUsage(): NonNullableUsage {
    return this.currentMessageUsage;
  }
}

/**
 * 处理权限拒绝（孤儿权限）
 */
export function handleOrphanedPermission(
  permission: unknown,
): AsyncGenerator<SDKMessage> {
  console.warn('[QUERY] Handling orphaned permission:', permission);
  
  yield {
    type: 'permission_denial',
    tool_name: 'unknown',
    tool_use_id: '',
    reason: 'Orphaned permission detected',
  };
}

/**
 * 检查结果是否成功
 */
export function isResultSuccessful(result: unknown): boolean {
  if (!result) return false;
  
  const typedResult = result as Record<string, unknown>;
  
  // Check for success indicator
  if (typedResult.success === true) return true;
  if (typedResult.error) return false;
  
  // Default to success if no error field
  return !typedResult.error;
}

/**
 * SDK 状态更新器
 */
export class StatusUpdater {
  private setStatus: (status: SDKStatus) => void;
  
  constructor(setStatus: (status: SDKStatus) => void) {
    this.setStatus = setStatus;
  }
  
  update(status: SDKStatus): void {
    this.setStatus(status);
    
    switch (status.type) {
      case 'initializing':
        console.log('[STATUS] Initializing...');
        break;
      
      case 'connecting':
        console.log('[STATUS] Connecting to gateway...');
        break;
      
      case 'authenticated':
        console.log('[STATUS] Authenticated successfully');
        break;
      
      case 'ready':
        console.log('[STATUS] Ready to process messages');
        break;
      
      case 'error':
        console.error('[STATUS] Error:', status.message);
        break;
    }
  }
}

/**
 * 消息过滤器（用于 SDK）
 */
export class MessageFilter {
  private filters: Array<(msg: Message) => boolean> = [];
  
  addFilter(filter: (msg: Message) => boolean): void {
    this.filters.push(filter);
  }
  
  filter(messages: Message[]): Message[] {
    return messages.filter(msg => 
      this.filters.every(f => f(msg))
    );
  }
}

/**
 * 错误处理助手
 */
export class ErrorHandler {
  static handleError(error: unknown, context?: string): void {
    const message = error instanceof Error ? error.message : String(error);
    
    if (context) {
      console.error(`[ERROR] ${context}:`, message);
    } else {
      console.error('[ERROR]:', message);
    }
  }
  
  static isRetryable(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    
    // Network errors are retryable
    if (message.includes('network') || 
        message.includes('timeout') || 
        message.includes('ECONNREFUSED')) {
      return true;
    }
    
    // Rate limit errors are retryable with backoff
    if (message.includes('rate limit') || message.includes('429')) {
      return true;
    }
    
    return false;
  }
}

/**
 * 性能追踪器（用于 query loop）
 */
export class QueryPerformanceTracker {
  private startTime: number | null = null;
  
  start(): void {
    this.startTime = performance.now();
  }
  
  end(): number {
    if (!this.startTime) return 0;
    
    const duration = performance.now() - this.startTime;
    console.log(`[PERF] Query completed in ${duration.toFixed(2)}ms`);
    
    this.startTime = null;
    return duration;
  }
  
  mark(label: string): void {
    if (this.startTime) {
      const elapsed = performance.now() - this.startTime;
      console.log(`[PERF] ${label}: ${elapsed.toFixed(2)}ms`);
    }
  }
}
