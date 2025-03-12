/**
 * Tool system type definitions
 * Core types for the tool system implementation
 */

/**
 * Tool interface defining the structure for all tools
 */
export interface Tool {
  /** Unique identifier for the tool */
  name: string;

  /** Human-readable description of what the tool does */
  description: string;

  /** JSON Schema representation of the parameters for this tool */
  parameters: ToolParameters;

  /** Function that executes the tool with the provided parameters */
  execute: ToolExecuteFunction;
}

/**
 * Schema for tool parameters in JSON Schema format
 */
export interface ToolParameters {
  type: string;
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
}

/**
 * Schema for individual tool parameter property
 */
export interface ToolParameterProperty {
  type: string;
  description: string;
  enum?: string[];
  default?: unknown;
}

/**
 * Tool execution function type
 */
export type ToolExecuteFunction = (params: Record<string, unknown>) => Promise<unknown>;

/**
 * Tool call representation from LLM
 */
export interface ToolCall {
  /** Name of the tool to execute */
  name: string;

  /** Parameters to pass to the tool */
  parameters: Record<string, unknown>;
}

/**
 * Result of a tool execution
 */
export interface ToolResult {
  /** Whether the tool execution was successful */
  success: boolean;

  /** The data returned by the tool */
  data?: unknown;

  /** Error message if the tool execution failed */
  error?: string;
}

/**
 * Format of an Ollama tool definition to be sent to the API
 */
export interface OllamaToolDefinition {
  /** Name of the tool */
  name: string;

  /** Description of what the tool does */
  description: string;

  /** JSON Schema for the tool parameters */
  parameters: ToolParameters;
}
