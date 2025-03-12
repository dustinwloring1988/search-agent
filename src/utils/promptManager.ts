/**
 * Prompt Manager
 * Handles the management of system and user prompts
 */

import {
  Message,
  createSystemPrompt,
  createUserPrompt,
  createAssistantPrompt,
} from '../config/prompts';
import { logConversation } from './logger';

/**
 * Class to manage conversation context and prompts
 */
export class PromptManager {
  private messages: Message[] = [];
  private initialized = false;

  /**
   * Initializes the prompt manager with the system prompt
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }

    const systemPrompt = createSystemPrompt();
    this.messages.push(systemPrompt);
    logConversation(systemPrompt);
    this.initialized = true;
  }

  /**
   * Adds a user prompt to the conversation
   * @param content - The content of the user's message
   * @returns The created user message
   */
  public addUserPrompt(content: string): Message {
    if (!this.initialized) {
      this.initialize();
    }

    const userMessage = createUserPrompt(content);
    this.messages.push(userMessage);
    logConversation(userMessage);
    return userMessage;
  }

  /**
   * Adds an assistant response to the conversation
   * @param content - The content of the assistant's message
   * @returns The created assistant message
   */
  public addAssistantResponse(content: string): Message {
    if (!this.initialized) {
      this.initialize();
    }

    const assistantMessage = createAssistantPrompt(content);
    this.messages.push(assistantMessage);
    logConversation(assistantMessage);
    return assistantMessage;
  }

  /**
   * Gets the current conversation context
   * @returns Array of messages in the conversation
   */
  public getConversation(): Message[] {
    return [...this.messages];
  }

  /**
   * Clears the conversation history except for the system prompt
   */
  public clearConversation(): void {
    if (this.initialized && this.messages.length > 0) {
      // Keep only the system prompt
      const systemPrompt = this.messages[0];
      this.messages = [systemPrompt];
    } else {
      this.messages = [];
      this.initialized = false;
    }
  }
}
