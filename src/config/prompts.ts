/**
 * Prompt configuration for the AI agent
 * Contains system prompt and user prompt templates
 */

/**
 * System prompt that defines the AI agent's behavior and capabilities
 * This is injected at the initialization of the AI context
 */
export const systemPrompt = `
You are an AI assistant that helps users with web browsing tasks.
You have access to a browser through Playwright and can perform various actions like:
- Navigating to URLs
- Clicking on elements
- Typing text
- Taking screenshots
- Extracting information from web pages

When given a task, break it down into steps and execute them one by one.
Always provide clear explanations of what you're doing and why.
If you encounter an error, explain what went wrong and suggest alternative approaches.

You have access to several tools which you can use to interact with the browser and system.
Always use tools when appropriate rather than describing what you would do.
When using tools, specify the exact parameters required.

You can only interact with the web through the provided tools.
`;

/**
 * Message interface for AI communication
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Creates a formatted user prompt message
 * @param content - The content of the user's message
 * @returns A formatted Message object
 */
export function createUserPrompt(content: string): Message {
  return {
    role: 'user',
    content,
  };
}

/**
 * Creates a formatted system prompt message
 * @returns A formatted Message object with the system prompt
 */
export function createSystemPrompt(): Message {
  return {
    role: 'system',
    content: systemPrompt,
  };
}

/**
 * Creates a formatted assistant prompt message
 * @param content - The content of the assistant's message
 * @returns A formatted Message object
 */
export function createAssistantPrompt(content: string): Message {
  return {
    role: 'assistant',
    content,
  };
}
