/**
 * AI Module
 * Handles AI query functionality through the Ollama API
 */

import { Message } from '../config/prompts';
import { OllamaAPI, StreamCallback } from './ollama';
import { logConversation, logError } from '../utils/logger';

// Load environment variables
const OLLAMA_API_HOST = process.env.OLLAMA_API_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';
const OLLAMA_TEMPERATURE = parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7');
const OLLAMA_MAX_TOKENS = parseInt(process.env.OLLAMA_MAX_TOKENS || '4096', 10);

// Create Ollama API instance
const ollamaApi = new OllamaAPI({
  apiHost: OLLAMA_API_HOST,
  model: OLLAMA_MODEL,
  temperature: OLLAMA_TEMPERATURE,
  maxTokens: OLLAMA_MAX_TOKENS,
});

/**
 * Query the AI with the given messages
 * @param messages - Array of messages to send to the AI
 * @returns Promise resolving to the AI's response
 */
export async function queryAI(messages: Message[]): Promise<string> {
  try {
    // Log the messages being sent
    messages.forEach(message => {
      logConversation(message);
    });

    // Query the AI
    const response = await ollamaApi.query(messages);

    // Create and log the AI's response message
    const aiMessage: Message = {
      role: 'assistant',
      content: response,
    };
    logConversation(aiMessage);

    return response;
  } catch (error) {
    logError(error as Error, 'queryAI');
    throw new Error(`Failed to query AI: ${(error as Error).message}`);
  }
}

/**
 * Query the AI with streaming output
 * @param messages - Array of messages to send to the AI
 * @param callback - Function to call with each chunk of the response
 * @returns Promise that resolves when the streaming is complete
 */
export async function streamQueryAI(messages: Message[], callback: StreamCallback): Promise<void> {
  try {
    // Log the messages being sent
    messages.forEach(message => {
      logConversation(message);
    });

    // Track the complete response for logging
    let completeResponse = '';

    // Create a wrapper callback to collect the complete response
    const wrappedCallback: StreamCallback = (text, done) => {
      // Add the text to the complete response
      completeResponse += text;
      
      // Call the original callback
      callback(text, done);
      
      // If this is the final chunk, log the complete response
      if (done && completeResponse) {
        const aiMessage: Message = {
          role: 'assistant',
          content: completeResponse,
        };
        logConversation(aiMessage);
      }
    };

    // Stream the query
    await ollamaApi.streamQuery(messages, wrappedCallback);
  } catch (error) {
    logError(error as Error, 'streamQueryAI');
    throw new Error(`Failed to stream query AI: ${(error as Error).message}`);
  }
}

/**
 * Check if the AI service is available
 * @returns Promise resolving to true if available, false otherwise
 */
export async function isAIAvailable(): Promise<boolean> {
  try {
    return await ollamaApi.isAvailable();
  } catch (error) {
    logError(error as Error, 'isAIAvailable');
    return false;
  }
} 