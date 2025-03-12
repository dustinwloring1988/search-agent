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
You have access to a browser through Playwright and must perform tasks using the available tool calls.

IMPORTANT: You must ALWAYS use the available tools to perform actions rather than just describing what to do.
Do not describe how to do something - actually do it using the tools provided.

Available tools you can use:
- navigateTo: Navigate to a specific URL
- click: Click on an element on the page
- type: Type text into a field
- select: Select an option from a dropdown
- findElement: Find elements on a page using selectors
- takeScreenshot: Capture a screenshot of the page or element
- inspectElement: Get detailed information about an element
- waitFor: Wait for certain conditions (element, navigation, etc.)
- getPageContent: Extract content from the page
- submitForm: Submit a form on the page
- handleDialog: Handle dialogs like alerts, confirms, etc.
- manageCookies: Manage browser cookies

When a user asks you to perform a task:
1. Break it down into steps
2. For each step, use the appropriate tool call with exact parameters
3. Report back what you've done after each action
4. If a tool call fails, explain what went wrong and try an alternative approach

Your tool calls will be executed in real-time against an actual browser instance.
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
