/**
 * command-registry.ts - OpenClaw Plus Slash Command Registry
 * 
 * Slash command system for OpenClaw Plus with auto-completion and search.
 */

import { profileCheckpoint } from '../utils/startupProfiler.js';

/**
 * Command Types
 */
export type CommandType = 'prompt' | 'local' | 'system';

/**
 * Command Result Interface
 */
export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
  suggestions?: string[];
}

/**
 * Command Definition Interface
 */
export interface Command {
  /** Command name (e.g., '/commit') */
  name: string;
  
  /** Human-readable description */
  description: string;
  
  /** Command type */
  type: CommandType;
  
  /** Execute the command with arguments */
  execute: (args: string[]) => Promise<CommandResult>;
  
  /** Optional aliases for the command */
  aliases?: string[];
  
  /** Required arguments definition */
  args?: Array<{
    name: string;
    description: string;
    required?: boolean;
    default?: string;
  }>;
}

/**
 * Command Registry - Slash Command Management System (Enhanced)
 */
export class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private commandHistory: Array<{ name: string; args: string[]; timestamp: number }> = [];

  /**
   * Register a command
   */
  register(command: Command): void {
    if (this.commands.has(command.name)) {
      console.warn(`[COMMAND] Command already registered: ${command.name}`);
      return;
    }

    this.commands.set(command.name.toLowerCase(), command);
    
    // Register aliases
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.commands.set(alias.toLowerCase(), command);
      }
    }
    
    profileCheckpoint(`command_registered:${command.name}`);
    
    console.log(`[COMMAND] Registered: ${command.name} - ${command.description}`);
  }

  /**
   * Execute a command by name
   */
  async execute(name: string, args: string[]): Promise<CommandResult> {
    profileCheckpoint('command_execute_start');
    
    const cmd = this.commands.get(name.toLowerCase());
    
    if (!cmd) {
      profileCheckpoint('command_execute_not_found');
      
      return {
        success: false,
        error: `Unknown command: ${name}`,
        suggestions: this.suggestCommands(name),
      };
    }

    try {
      const result = await cmd.execute(args);
      
      // Record in history
      this.recordHistory(cmd.name, args);
      
      profileCheckpoint('command_execute_completed');
      
      return result;
    } catch (error) {
      profileCheckpoint('command_execute_failed');
      
      console.error(`[COMMAND] Execution failed for ${name}:`, error);
      
      return {
        success: false,
        error: `Command execution failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * List all registered commands
   */
  listCommands(): Command[] {
    const cmds = Array.from(this.commands.values());
    
    console.log(`[COMMAND] Total registered: ${cmds.length}`);
    
    return cmds;
  }

  /**
   * Search commands by name or description
   */
  searchCommands(query: string): Command[] {
    profileCheckpoint('command_search_start');
    
    const lowerQuery = query.toLowerCase();
    
    const results = this.listCommands().filter(cmd => 
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery)
    );
    
    profileCheckpoint('command_search_completed');
    
    console.log(`[COMMAND] Search found ${results.length} commands for: "${query}"`);
    
    return results;
  }

  /**
   * Command auto-completion
   */
  completeCommand(partialName: string): string[] {
    const lowerPartial = partialName.toLowerCase();
    
    const completions = this.listCommands()
      .filter(cmd => cmd.name.startsWith(lowerPartial))
      .map(cmd => cmd.name);
    
    console.log(`[COMMAND] Auto-complete for "${partialName}": ${completions.length} suggestions`);
    
    return completions;
  }

  /**
   * Suggest commands based on partial input
   */
  suggestCommands(partialName: string): string[] {
    const lowerPartial = partialName.toLowerCase();
    
    // Exact match first
    if (this.commands.has(lowerPartial)) {
      return [lowerPartial];
    }
    
    // Partial matches
    const suggestions = this.listCommands()
      .filter(cmd => cmd.name.includes(lowerPartial) || 
                     cmd.description.toLowerCase().includes(lowerPartial))
      .map(cmd => cmd.name);
    
    return suggestions.slice(0, 5); // Top 5 suggestions
  }

  /**
   * Get command help information
   */
  async getHelp(commandName: string): Promise<string> {
    const cmd = this.commands.get(commandName.toLowerCase());
    
    if (!cmd) {
      return `Unknown command: ${commandName}`;
    }
    
    let helpText = `### ${cmd.name}\n\n`;
    helpText += `${cmd.description}\n\n`;
    
    if (cmd.args && cmd.args.length > 0) {
      helpText += '**Arguments:**\n';
      
      for (const arg of cmd.args) {
        const required = arg.required ? '*' : '';
        const defaultValue = arg.default ? ` (default: ${arg.default})` : '';
        
        helpText += `- ${arg.name}${required}: ${arg.description}${defaultValue}\n`;
      }
      
      helpText += '\n';
    }
    
    if (cmd.aliases && cmd.aliases.length > 0) {
      helpText += `**Aliases:** ${cmd.aliases.join(', ')}\n\n`;
    }
    
    return helpText;
  }

  /**
   * Record command execution in history
   */
  private recordHistory(commandName: string, args: string[]): void {
    this.commandHistory.push({
      name: commandName,
      args,
      timestamp: Date.now(),
    });
    
    // Limit history size (keep last 100 commands)
    if (this.commandHistory.length > 100) {
      this.commandHistory.shift();
    }
  }

  /**
   * Get command execution history
   */
  getHistory(limit: number = 10): Array<{ name: string; args: string[]; timestamp: Date }> {
    return [...this.commandHistory].slice(-limit);
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.commandHistory = [];
    console.log('[COMMAND] History cleared');
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalCommands: number;
    commandsByType: Record<CommandType, number>;
    historySize: number;
  } {
    const cmds = this.listCommands();
    
    const byType: Record<CommandType, number> = {
      prompt: 0,
      local: 0,
      system: 0,
    };
    
    for (const cmd of cmds) {
      byType[cmd.type]++;
    }
    
    return {
      totalCommands: cmds.length,
      commandsByType: byType,
      historySize: this.commandHistory.length,
    };
  }

  /**
   * Reset registry (for testing)
   */
  reset(): void {
    this.commands.clear();
    this.commandHistory = [];
    
    profileCheckpoint('command_registry_reset');
  }
}

// Singleton instance
export const commandRegistry = new CommandRegistry();

/**
 * Helper function: Get available commands
 */
export function getAvailableCommands(): Command[] {
  return commandRegistry.listCommands();
}

/**
 * Helper function: Execute command with auto-completion support
 */
export async function executeCommand(name: string, args: string[]): Promise<CommandResult> {
  return commandRegistry.execute(name, args);
}
