/**
 * Renderer Utilities
 * Browser-friendly utility functions for the renderer process
 */

/**
 * Simple prompt manager for the renderer process
 * Does not use Node.js modules like the main process version
 */
export class RendererPromptManager {
  private history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  /**
   * Initialize the prompt manager
   */
  public initialize(): void {
    console.log('Renderer prompt manager initialized');
  }

  /**
   * Add a user prompt to the history
   * @param content - User prompt content
   */
  public addUserPrompt(content: string): void {
    this.history.push({
      role: 'user',
      content,
    });
    console.log('User prompt added:', content);

    // In a real implementation, this would communicate with the main process
  }

  /**
   * Add an assistant response to the history
   * @param content - Assistant response content
   */
  public addAssistantResponse(content: string): void {
    this.history.push({
      role: 'assistant',
      content,
    });
    console.log('Assistant response added');
  }

  /**
   * Get the current conversation history
   * @returns Conversation history
   */
  public getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.history];
  }
}
