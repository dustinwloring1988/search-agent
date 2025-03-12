/**
 * Echo Tool
 * A simple tool that echoes back the input, used for testing the tool system
 */

import { Tool, ToolParameters } from './types';

/**
 * Echo tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      description: 'The message to echo back',
    },
  },
  required: ['message'],
};

/**
 * A simple echo tool implementation
 * This tool simply echoes back the input message, used for testing
 */
const echoTool: Tool = {
  name: 'echo',
  description: 'Echoes back the provided message. Used for testing the tool system.',
  parameters,

  /**
   * Execute the echo tool
   * @param params - The parameters for the tool
   * @returns The echoed message with a timestamp
   */
  execute: async (params: Record<string, unknown>): Promise<unknown> => {
    const message = params.message as string;
    const timestamp = new Date().toISOString();

    return {
      echoed: message,
      timestamp,
      received: true,
    };
  },
};

// Export the tool as default
export default echoTool;
