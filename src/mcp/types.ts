/**
 * types.ts - OpenClaw Plus MCP Type Definitions
 */

/**
 * MCP Server Configuration Types
 */
export type McpTransportType = 'stdio' | 'sse' | 'streamable-http';

export interface McpConfig {
  /** Unique identifier for this server configuration */
  name: string;
  
  /** Transport type (stdio, sse, or streamable-http) */
  type: McpTransportType;
  
  /** Command and arguments for stdio transport */
  command?: string;
  args?: string[];
  
  /** URL for SSE or streamable-HTTP transports */
  url?: string;
  
  /** Additional configuration options */
  config?: Record<string, unknown>;
}

/**
 * MCP Server Connection Interface
 */
export interface MCPServerConnection {
  /** Server name */
  readonly name: string;
  
  /** Transport type */
  readonly type: string;
  
  /** Connect to the server */
  connect(): Promise<void>;
  
  /** List available tools */
  listTools(): Promise<{ 
    tools: Array<{ 
      name: string; 
      description?: string; 
      inputSchema: Record<string, unknown> 
    }> 
  }>;
  
  /** Call a tool */
  callTool(
    name: string, 
    input: Record<string, unknown>
  ): Promise<{ 
    content: Array<{ type: string; text?: string; blob?: string }> 
  }>;
  
  /** List available resources */
  listResources(): Promise<{ 
    resources: Array<{ 
      uri: string; 
      name?: string; 
      description?: string 
    }> 
  }>;
  
  /** Read a resource */
  readResource(
    uri: string
  ): Promise<{ 
    contents: Array<{ 
      uri: string; 
      mimeType?: string; 
      text?: string; 
      blob?: string 
    }> 
  }>;
  
  /** Close the connection */
  close(): Promise<void>;
  
  /** Check if connected */
  isConnectedTo(): boolean;
}

/**
 * MCP Tool Definition (from server)
 */
export interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

/**
 * MCP Resource Definition (from server)
 */
export interface McpResourceDefinition {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

/**
 * MCP Tool Call Result
 */
export interface McpToolResult {
  content: Array<{ 
    type: 'text' | 'image' | 'resource'; 
    text?: string; 
    blob?: string;
    resource?: McpResourceDefinition;
  }>;
  isError?: boolean;
}

/**
 * MCP Resource Read Result
 */
export interface McpResourceReadResult {
  contents: Array<{ 
    uri: string; 
    mimeType?: string; 
    text?: string; 
    blob?: string;
  }>;
}

/**
 * MCP Server Capabilities (optional)
 */
export interface McpServerCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
}

/**
 * MCP Server Info (from server)
 */
export interface McpServerInfo {
  name: string;
  version: string;
  capabilities?: McpServerCapabilities;
}

/**
 * MCP Protocol Messages (simplified)
 */
export type McpMessage = 
  | { jsonrpc: '2.0'; id: number | string; result: unknown }
  | { jsonrpc: '2.0'; id: number | string; error: { code: number; message: string; data?: unknown } }
  | { jsonrpc: '2.0'; method: string; params?: Record<string, unknown> };

/**
 * MCP Tool Search Result
 */
export interface McpToolSearchResult {
  tool: McpToolDefinition;
  relevanceScore: number;
}

/**
 * MCP Resource Search Result
 */
export interface McpResourceSearchResult {
  resource: McpResourceDefinition;
  relevanceScore: number;
}
