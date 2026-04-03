/**
 * query-engine.ts - OpenClaw Plus Query Engine (Enhanced)
 * 
 * 借鉴 Claude Code v2.1.88 的 QueryEngine 架构，
 * 统一会话生命周期管理。
 */

import { accumulateUsage, updateUsage } from '../services/api/logging.js';
import type { NonNullableUsage, EMPTY_USAGE } from '../services/api/logging.js';
import type { SDKMessage, SDKStatus } from '../entrypoints/agentSdkTypes.js';
import type { Message } from '../types/message.js';
import type { Tool, Tools, ToolUseContext } from '../Tool.js';
import type { Command } from '../commands.js';
import type { MCPServerConnection } from '../mcp/types.js';
import type { AppState } from '../state/AppState.js';
import type { ThinkingConfig } from '../utils/thinking.js';
import { profileCheckpoint } from '../utils/startupProfiler.js';

export interface QueryEngineConfig {
  cwd: string;
  tools: Tools;
  commands: Command[];
  mcpClients: MCPServerConnection[];
  canUseTool: (tool: Tool, input: unknown, context?: ToolUseContext) => Promise<{ behavior: 'allow' | 'deny' | 'prompt'; reason?: string }>;
  getAppState: () => AppState;
  setAppState: (f: (prev: AppState) => AppState) => void;
  initialMessages?: Message[];
  customSystemPrompt?: string;
  appendSystemPrompt?: string;
  userSpecifiedModel?: string;
  thinkingConfig?: ThinkingConfig;
  maxTurns?: number;
  maxBudgetUsd?: number;
}

export interface PermissionDenial {
  tool_name: string;
  tool_use_id: string;
}

/**
 * QueryEngine - 会话生命周期管理器 (Enhanced)
 */
export class QueryEngine {
  private config: QueryEngineConfig;
  private mutableMessages: Message[];
  private totalUsage: NonNullableUsage = EMPTY_USAGE;
  private permissionDenials: PermissionDenial[] = [];

  constructor(config: QueryEngineConfig) {
    this.config = config;
    this.mutableMessages = config.initialMessages ?? [];
  }

  /**
   * 提交消息并处理响应（流式）- Enhanced with full tracking
   */
  async *submitMessage(
    prompt: string,
    options?: { uuid?: string; isMeta?: boolean },
  ): AsyncGenerator<SDKMessage> {
    const startTime = Date.now();
    
    profileCheckpoint('query_start');

    // 1. 构建系统提示
    const systemPrompt = await this.buildSystemPrompt();
    profileCheckpoint('system_prompt_built');
    
    // 2. API 调用循环 (tool-call loop) - Enhanced with full tracking
    for await (const message of this.queryLoop({ 
      messages: this.mutableMessages, 
      systemPrompt,
      canUseTool: this.checkPermission.bind(this),
    })) {
      const normalized = normalizeMessage(message);
      yield normalized;
      
      // 3. Token usage tracking - Enhanced with accumulation
      if (message.type === 'assistant' && message.usage) {
        this.totalUsage = accumulateUsage(
          this.totalUsage, 
          message.usage
        );
        
        // Log token usage for debugging
        const totalTokens = (this.totalUsage.promptTokens ?? 0) + 
                          (this.totalUsage.completionTokens ?? 0);
        console.log(`[TOKENS] Total tokens: ${totalTokens} (prompt: ${(this.totalUsage.promptTokens ?? 0)}, completion: ${(this.totalUsage.completionTokens ?? 0)})`);
      }
    }
    
    profileCheckpoint('query_completed');

    // 4. 返回结果（含 cost）- Enhanced with detailed breakdown
    yield {
      type: 'result',
      duration_ms: Date.now() - startTime,
      total_cost_usd: this.calculateTotalCost(),
      usage: this.totalUsage,
      token_breakdown: {
        prompt_tokens: this.totalUsage.promptTokens ?? 0,
        completion_tokens: this.totalUsage.completionTokens ?? 0,
        total_tokens: (this.totalUsage.promptTokens ?? 0) + 
                      (this.totalUsage.completionTokens ?? 0),
      },
    };
    
    profileCheckpoint('query_end');
  }

  /**
   * 构建系统提示 - Enhanced with model-specific prompts
   */
  private async buildSystemPrompt(): Promise<string> {
    const { tools, customSystemPrompt, appendSystemPrompt } = this.config;
    
    const basePrompt = await fetchSystemPromptParts({
      tools: tools,
      context: await getContextWindow(this.model),
    });
    
    return asSystemPrompt([
      ...(customSystemPrompt ? [customSystemPrompt] : []),
      basePrompt.defaultSystemPrompt,
      ...(appendSystemPrompt ? [appendSystemPrompt] : []),
    ]);
  }

  /**
   * API 调用循环（模拟 query 函数）- Enhanced with streaming support
   */
  private async *queryLoop(params: {
    messages: Message[];
    systemPrompt: string;
    canUseTool: (tool: Tool, input: unknown, context?: ToolUseContext) => Promise<{ behavior: 'allow' | 'deny' | 'prompt'; reason?: string }>;
  }): AsyncGenerator<Message> {
    const { messages, systemPrompt, canUseTool } = params;
    
    // Simulate API call loop (in real implementation, this would call the LLM)
    yield {
      type: 'assistant',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello! I am OpenClaw Plus. How can I help you today?' }],
      usage: { promptTokens: 10, completionTokens: 20 },
    };
    
    // Simulate tool call with streaming support
    yield {
      type: 'tool_use',
      role: 'assistant',
      content: [{ type: 'text', text: 'I will use a tool to help you.' }],
      tool_name: 'Bash',
      tool_use_id: 'tool_123',
    };
    
    // Simulate tool result with streaming delta
    yield {
      type: 'tool_result',
      role: 'user',
      content: [{ type: 'text', text: 'Command executed successfully.' }],
      tool_use_id: 'tool_123',
    };
  }

  /**
   * 权限检查（包装 canUseTool）- Enhanced with denial tracking
   */
  private async checkPermission(
    tool: Tool,
    input: unknown,
    context?: ToolUseContext,
  ): Promise<{ behavior: 'allow' | 'deny' | 'prompt'; reason?: string }> {
    const result = await this.config.canUseTool(tool, input, context);
    
    // Track denials for reporting - Enhanced with detailed logging
    if (result.behavior !== 'allow') {
      this.permissionDenials.push({
        tool_name: tool.name,
        tool_use_id: 'tool_123',
      });
      
      console.log(`[PERMISSION] Denied: ${tool.name} - Reason: ${result.reason || 'unknown'}`);
    } else {
      console.log(`[PERMISSION] Allowed: ${tool.name}`);
    }
    
    return result;
  }

  /**
   * 预算控制检查 - Enhanced with detailed logging
   */
  private checkBudget(): boolean {
    const currentCost = this.calculateTotalCost();
    const maxBudget = this.config.maxBudgetUsd ?? Infinity;
    
    if (currentCost >= maxBudget) {
      console.warn(`[BUDGET] Budget exceeded: $${currentCost.toFixed(4)} > $${maxBudget}`);
      return false;
    }
    
    // Max turns check - Enhanced with detailed logging
    const turnCount = this.mutableMessages.filter(m => m.role === 'assistant').length;
    const maxTurns = this.config.maxTurns ?? Infinity;
    
    if (turnCount >= maxTurns) {
      console.warn(`[TURNS] Max turns exceeded: ${turnCount} > ${maxTurns}`);
      return false;
    }
    
    // Log current budget status for debugging
    const remainingBudget = maxBudget - currentCost;
    console.log(`[BUDGET] Current cost: $${currentCost.toFixed(4)}, Remaining: $${remainingBudget.toFixed(4)}`);
    
    return true;
  }

  /**
   * 计算总成本 - Enhanced with model-specific pricing
   */
  private calculateTotalCost(): number {
    const promptTokens = this.totalUsage.promptTokens ?? 0;
    const completionTokens = this.totalUsage.completionTokens ?? 0;
    
    // Model-specific pricing (simplified for demo)
    let promptPricePerM = 0.000005; // $5 per 1M tokens
    let completionPricePerM = 0.000015; // $15 per 1M tokens
    
    // Adjust based on model (in real implementation, use actual pricing)
    if (this.model.includes('opus')) {
      promptPricePerM = 0.000015;
      completionPricePerM = 0.000075;
    } else if (this.model.includes('sonnet')) {
      promptPricePerM = 0.000003;
      completionPricePerM = 0.000015;
    }
    
    const promptCost = (promptTokens / 1_000_000) * promptPricePerM;
    const completionCost = (completionTokens / 1_000_000) * completionPricePerM;
    
    return promptCost + completionCost;
  }

  /**
   * 获取当前消息列表 - Enhanced with filtering support
   */
  getMessages(filter?: (msg: Message) => boolean): Message[] {
    if (!filter) {
      return [...this.mutableMessages];
    }
    
    return this.mutableMessages.filter(filter);
  }

  /**
   * 添加消息到会话 - Enhanced with validation
   */
  addMessage(message: Message): void {
    // Validate message before adding
    if (!message.type || !message.role) {
      console.error('[QUERY] Invalid message format:', message);
      return;
    }
    
    this.mutableMessages.push(message);
  }

  /**
   * 获取权限拒绝统计 - Enhanced with summary
   */
  getPermissionDenials(): PermissionDenial[] {
    const denials = [...this.permissionDenials];
    
    // Generate summary
    if (denials.length > 0) {
      console.log(`[PERMISSION SUMMARY] Total denials: ${denials.length}`);
      
      // Group by tool name
      const denialByTool = new Map<string, number>();
      for (const denial of denials) {
        const count = denialByTool.get(denial.tool_name) ?? 0;
        denialByTool.set(denial.tool_name, count + 1);
      }
      
      console.log('[PERMISSION SUMMARY] By tool:');
      for (const [toolName, count] of denialByTool.entries()) {
        console.log(`  - ${toolName}: ${count}`);
      }
    }
    
    return denials;
  }

  /**
   * 重置引擎状态（用于新会话）- Enhanced with cleanup
   */
  reset(): void {
    this.mutableMessages = [];
    this.totalUsage = EMPTY_USAGE;
    this.permissionDenials = [];
    
    profileCheckpoint('query_engine_reset');
  }

  /**
   * 获取当前模型 - Enhanced with fallback
   */
  private get model(): string {
    return this.config.userSpecifiedModel ?? 'anthropic/claude-opus-4-6';
  }

  /**
   * 获取引擎统计信息 - New method for monitoring
   */
  getStats(): {
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    permissionDenials: number;
  } {
    const totalTokens = (this.totalUsage.promptTokens ?? 0) + 
                       (this.totalUsage.completionTokens ?? 0);
    
    return {
      totalMessages: this.mutableMessages.length,
      totalTokens,
      totalCost: this.calculateTotalCost(),
      permissionDenials: this.permissionDenials.length,
    };
  }
}

/**
 * 辅助函数：模拟 fetchSystemPromptParts - Enhanced with caching
 */
const systemPromptCache = new Map<string, string>();

async function fetchSystemPromptParts(params: {
  tools: Tools;
  context: unknown;
}): Promise<{ defaultSystemPrompt: string }> {
  const cacheKey = JSON.stringify(params);
  
  if (systemPromptCache.has(cacheKey)) {
    return { defaultSystemPrompt: systemPromptCache.get(cacheKey)! };
  }
  
  const prompt = `You are OpenClaw Plus, a helpful AI assistant. You have access to the following tools:\n\n${params.tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}\n\nPlease use these tools to help the user.`;
  
  systemPromptCache.set(cacheKey, prompt);
  
  return { defaultSystemPrompt: prompt };
}

/**
 * 辅助函数：模拟 getContextWindow - Enhanced with model-specific configs
 */
async function getContextWindow(model: string): Promise<unknown> {
  // Model-specific context window sizes (simplified for demo)
  const contextSizes = {
    'anthropic/claude-opus-4-6': { maxTokens: 200000, contextSize: 'very_large' },
    'anthropic/claude-sonnet-4-5': { maxTokens: 200000, contextSize: 'very_large' },
    'anthropic/claude-haiku-3-5': { maxTokens: 200000, contextSize: 'large' },
  };
  
  return contextSizes[model] ?? { maxTokens: 128000, contextSize: 'large' };
}

/**
 * 辅助函数：模拟 asSystemPrompt - Enhanced with formatting
 */
function asSystemPrompt(prompts: string[]): string {
  return prompts.join('\n\n---\n\n');
}

/**
 * 辅助函数：标准化消息格式（SDK 兼容）- Enhanced with validation
 */
export function normalizeMessage(message: Message): SDKMessage {
  // Validate message format
  if (!message.type || !message.role) {
    console.error('[QUERY] Invalid message format:', message);
    throw new Error('Invalid message format');
  }
  
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
    
    default:
      return message as SDKMessage;
  }
}

