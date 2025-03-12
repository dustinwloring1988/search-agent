/**
 * Tool Manager
 * Handles registration, discovery, and execution of tools
 */

import fs from 'fs';
import path from 'path';
import { logError } from '../utils/logger';
import { Tool, ToolCall, ToolResult, OllamaToolDefinition } from './types';

/**
 * ToolManager class
 * Manages the registration and execution of tools
 */
export class ToolManager {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a tool with the manager
   * @param tool - The tool to register
   */
  public registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool with name "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   * @param name - Name of the tool to retrieve
   * @returns The tool if found, undefined otherwise
   */
  public getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   * @returns Array of all registered tools
   */
  public getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all tool definitions in the format required by Ollama API
   * @returns Array of tool definitions
   */
  public getToolDefinitions(): OllamaToolDefinition[] {
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  /**
   * Execute a tool call
   * @param toolCall - The tool call to execute
   * @returns Result of the tool execution
   */
  public async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    try {
      const tool = this.getTool(toolCall.name);

      if (!tool) {
        return {
          success: false,
          error: `Tool "${toolCall.name}" not found`,
        };
      }

      // Execute the tool and get the result
      const result = await tool.execute(toolCall.parameters);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logError(error as Error, 'ToolManager.executeTool');
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Load all tools from a directory
   * @param directoryPath - Path to the directory containing tool implementations
   */
  public async loadToolsFromDirectory(directoryPath: string): Promise<void> {
    try {
      // Ensure the directory exists
      if (!fs.existsSync(directoryPath)) {
        throw new Error(`Directory does not exist: ${directoryPath}`);
      }

      // Get all TypeScript files in the directory (excluding index.ts and types.ts)
      const files = fs
        .readdirSync(directoryPath)
        .filter(
          file => file.endsWith('.ts') && !['index.ts', 'types.ts', 'toolManager.ts'].includes(file)
        );

      // Import and register each tool
      for (const file of files) {
        try {
          const toolModule = await import(path.join(directoryPath, file));

          // Each tool file should export a default tool instance
          if (toolModule.default && this.isValidTool(toolModule.default)) {
            this.registerTool(toolModule.default);
          }
        } catch (error) {
          logError(error as Error, `ToolManager.loadToolsFromDirectory (${file})`);
        }
      }
    } catch (error) {
      logError(error as Error, 'ToolManager.loadToolsFromDirectory');
      throw error;
    }
  }

  /**
   * Type guard to check if an object is a valid Tool
   * @param obj - Object to check
   * @returns True if the object is a valid Tool
   */
  private isValidTool(obj: unknown): obj is Tool {
    const tool = obj as Tool;
    return (
      tool !== null &&
      typeof tool === 'object' &&
      typeof tool.name === 'string' &&
      typeof tool.description === 'string' &&
      tool.parameters !== undefined &&
      typeof tool.execute === 'function'
    );
  }
}

// Export singleton instance
export const toolManager = new ToolManager();
