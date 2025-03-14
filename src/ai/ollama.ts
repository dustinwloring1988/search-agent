/**
 * Ollama API wrapper for AI integration
 * Provides a simple interface to interact with Ollama LLM
 */

import { Message } from '../config/prompts';
import { logError } from '../utils/logger';
import { OllamaToolDefinition, ToolCall } from '../tools/types';

// Default API configuration
const DEFAULT_API_HOST = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.1';

/**
 * Configuration options for Ollama API
 */
export interface OllamaConfig {
  /** Base URL for the Ollama API */
  apiHost?: string;
  /** Model to use for queries */
  model?: string;
  /** Temperature parameter for generation (0.0 to 1.0) */
  temperature?: number;
  /** Maximum number of tokens to generate */
  maxTokens?: number;
}

/**
 * Response format from Ollama API
 */
interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  tool_calls?: OllamaToolCall[];
}

/**
 * Tool call format from Ollama API
 */
interface OllamaToolCall {
  name: string;
  parameters: Record<string, unknown>;
}

/**
 * Streaming callback function type
 */
export type StreamCallback = (text: string, done: boolean, toolCalls?: ToolCall[]) => void;

/**
 * A wrapper class for interacting with the Ollama API
 */
export class OllamaAPI {
  private apiHost: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  /**
   * Creates a new OllamaAPI instance
   * @param config - Configuration options for the API
   */
  constructor(config: OllamaConfig = {}) {
    this.apiHost = config.apiHost || DEFAULT_API_HOST;
    this.model = config.model || DEFAULT_MODEL;
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 4096;
  }

  /**
   * Converts internal message format to Ollama's format
   * @param messages - Array of message objects
   * @returns Formatted prompt string
   */
  private formatMessages(messages: Message[]): string {
    return messages
      .map(msg => {
        const role =
          msg.role === 'assistant' ? 'Assistant' : msg.role === 'system' ? 'System' : 'User';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');
  }

  /**
   * Queries the Ollama API with the provided messages
   * @param messages - Array of message objects to send
   * @param tools - Optional array of tool definitions to provide to the model
   * @returns Response text from the API
   */
  public async query(messages: Message[], tools?: OllamaToolDefinition[]): Promise<string> {
    try {
      const formattedPrompt = this.formatMessages(messages);

      const requestBody: Record<string, unknown> = {
        model: this.model,
        prompt: formattedPrompt,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: false,
      };

      // Add tools to the request if provided
      if (tools && tools.length > 0) {
        requestBody.tools = tools;
      }

      const response = await fetch(`${this.apiHost}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${errorText}`);
      }

      const result = (await response.json()) as OllamaResponse;
      return result.response;
    } catch (error) {
      logError(error as Error, 'OllamaAPI.query');
      throw error;
    }
  }

  /**
   * Streams a response from the Ollama API
   * @param messages - Array of message objects to send
   * @param callback - Function to call with each chunk of the response
   * @param tools - Optional array of tool definitions to provide to the model
   */
  public async streamQuery(
    messages: Message[],
    callback: StreamCallback,
    tools?: OllamaToolDefinition[]
  ): Promise<void> {
    try {
      const formattedPrompt = this.formatMessages(messages);

      const requestBody: Record<string, unknown> = {
        model: this.model,
        prompt: formattedPrompt,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: true,
      };

      // Add tools to the request if provided
      if (tools && tools.length > 0) {
        requestBody.tools = tools;
      }

      const response = await fetch(`${this.apiHost}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (done) {
          callback('', true);
          break;
        }

        const text = decoder.decode(value);
        try {
          // Each line is a separate JSON object
          const lines = text.split('\n').filter(line => line.trim());

          for (const line of lines) {
            const chunk = JSON.parse(line) as OllamaResponse;

            // Check if there are tool calls in the response
            if (chunk.tool_calls && chunk.tool_calls.length > 0) {
              const toolCalls = chunk.tool_calls.map(tc => ({
                name: tc.name,
                parameters: tc.parameters,
              }));

              callback(chunk.response, chunk.done, toolCalls);
            } else {
              callback(chunk.response, chunk.done);
            }

            if (chunk.done) {
              callback('', true);
              return;
            }
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
          callback(text, false);
        }
      }
    } catch (error) {
      logError(error as Error, 'OllamaAPI.streamQuery');
      callback(`Error: ${(error as Error).message}`, true);
      throw error;
    }
  }

  /**
   * Checks if the Ollama API is available
   * @returns True if the API is available, false otherwise
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiHost}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      logError(error as Error, 'OllamaAPI.isAvailable');
      return false;
    }
  }
}
