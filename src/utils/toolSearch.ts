/**
 * toolSearch.ts - OpenClaw Plus Tool Search Utilities
 */

import type { Tool } from '../Tool.js';
import { profileCheckpoint } from './startupProfiler.js';

/**
 * Tool Search Result
 */
export interface ToolSearchResult {
  tool: Tool;
  relevanceScore: number;
  matchType: 'exact' | 'partial' | 'semantic';
}

/**
 * Search tools by name or description
 */
export function searchTools(
  tools: Tool[], 
  query: string,
  options?: {
    maxResults?: number;
    minScore?: number;
  }
): ToolSearchResult[] {
  profileCheckpoint('tool_search_start');
  
  const results: ToolSearchResult[] = [];
  const lowerQuery = query.toLowerCase();
  
  for (const tool of tools) {
    let score = 0;
    let matchType: 'exact' | 'partial' | 'semantic' = 'partial';
    
    // Exact name match
    if (tool.name.toLowerCase() === lowerQuery) {
      score = 100;
      matchType = 'exact';
    } 
    // Partial name match
    else if (tool.name.toLowerCase().includes(lowerQuery)) {
      score = 80 - (tool.name.length - query.length) * 2;
      matchType = 'partial';
    }
    
    // Description match
    const descLower = tool.description.toLowerCase();
    if (descLower.includes(lowerQuery)) {
      score += 50;
      
      if (matchType !== 'exact') {
        matchType = 'partial';
      }
    }
    
    // Keyword matching in description
    const keywords = lowerQuery.split(/\s+/);
    let keywordMatches = 0;
    
    for (const keyword of keywords) {
      if (descLower.includes(keyword)) {
        keywordMatches++;
      }
    }
    
    if (keywordMatches > 0) {
      score += keywordMatches * 10;
      
      if (matchType !== 'exact' && matchType !== 'partial') {
        matchType = 'semantic';
      }
    }
    
    // Only include results with sufficient score
    const minScore = options?.minScore ?? 30;
    const maxResults = options?.maxResults ?? 10;
    
    if (score >= minScore) {
      results.push({
        tool,
        relevanceScore: Math.min(score, 100),
        matchType,
      });
    }
  }
  
  // Sort by relevance score (descending)
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Limit results
  const limitedResults = results.slice(0, maxResults);
  
  profileCheckpoint('tool_search_completed');
  
  console.log(`[SEARCH] Found ${limitedResults.length} tools for query: "${query}"`);
  
  return limitedResults;
}

/**
 * Suggest tools based on user intent (simplified)
 */
export function suggestTools(
  tools: Tool[], 
  intent: string,
  options?: { maxSuggestions?: number }
): Tool[] {
  profileCheckpoint('tool_suggestion_start');
  
  const lowerIntent = intent.toLowerCase();
  const suggestions: Array<{ tool: Tool; score: number }> = [];
  
  // Intent-based matching (simplified)
  const intentPatterns: Record<string, string[]> = {
    'file': ['FileReadTool', 'FileWriteTool', 'FileEditTool'],
    'search': ['GlobTool', 'GrepTool'],
    'execute': ['BashTool', 'PowerShellTool'],
    'web': ['WebFetchTool', 'WebSearchTool'],
    'task': ['TaskCreateTool', 'TaskListTool', 'TaskUpdateTool'],
  };
  
  for (const [pattern, toolNames] of Object.entries(intentPatterns)) {
    if (lowerIntent.includes(pattern)) {
      for (const name of toolNames) {
        const tool = tools.find(t => t.name === name);
        
        if (tool && !suggestions.some(s => s.tool.name === name)) {
          suggestions.push({ tool, score: 90 });
        }
      }
    }
  }
  
  // Sort by score and limit results
  suggestions.sort((a, b) => b.score - a.score);
  
  const limitedSuggestions = suggestions.slice(0, options?.maxSuggestions ?? 5).map(s => s.tool);
  
  profileCheckpoint('tool_suggestion_completed');
  
  console.log(`[SUGGEST] Suggested ${limitedSuggestions.length} tools for intent: "${intent}"`);
  
  return limitedSuggestions;
}

/**
 * Get tool recommendations based on context (simplified)
 */
export function getToolRecommendations(
  tools: Tool[], 
  context?: {
    cwd?: string;
    gitRepo?: boolean;
    hasFiles?: boolean;
  }
): Tool[] {
  profileCheckpoint('tool_recommendation_start');
  
  const recommendations: Tool[] = [];
  
  // Git repository context
  if (context?.gitRepo) {
    const gitTools = tools.filter(t => 
      t.name === 'BashTool' || t.name === 'GlobTool' || t.name === 'GrepTool'
    );
    
    recommendations.push(...gitTools);
  }
  
  // File system context
  if (context?.hasFiles) {
    const fileTools = tools.filter(t => 
      t.name === 'FileReadTool' || t.name === 'FileWriteTool' || t.name === 'FileEditTool'
    );
    
    recommendations.push(...fileTools);
  }
  
  // Default: suggest all tools if no context
  if (recommendations.length === 0) {
    return tools.slice(0, 5); // Top 5 most common tools
  }
  
  profileCheckpoint('tool_recommendation_completed');
  
  console.log(`[RECOMMEND] Recommended ${recommendations.length} tools based on context`);
  
  return recommendations;
}

/**
 * Tool search enabled check (optimistic)
 */
export function isToolSearchEnabledOptimistic(): boolean {
  // In real implementation, this would check feature flags and configuration
  return true;
}
