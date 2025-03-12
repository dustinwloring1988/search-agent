/**
 * Navigate Tool
 * A tool that allows the AI agent to navigate to a URL in the browser
 */

import { Tool, ToolParameters } from './types';
import { BrowserInstance } from '../utils/playwright';

/**
 * Navigate tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: 'The URL to navigate to',
    },
    waitUntil: {
      type: 'string',
      description: 'When to consider navigation successful',
      enum: ['load', 'domcontentloaded', 'networkidle', 'commit'],
      default: 'load',
    },
    timeout: {
      type: 'number',
      description: 'Maximum navigation time in milliseconds',
      default: 30000,
    },
  },
  required: ['url'],
};

/**
 * Navigate tool implementation
 * This tool navigates the browser to the specified URL
 */
const navigateTool: Tool = {
  name: 'navigateTo',
  description: 'Navigates the browser to the specified URL',
  parameters,

  /**
   * Execute the navigation
   * @param params - The parameters for the tool
   * @param browserInstance - The browser instance to use
   * @returns The result of the navigation
   */
  execute: async (
    params: Record<string, unknown>,
    browserInstance?: BrowserInstance
  ): Promise<unknown> => {
    if (!browserInstance) {
      throw new Error('Browser instance is required for navigation');
    }

    const { page } = browserInstance;
    const url = params.url as string;
    const waitUntil =
      (params.waitUntil as 'load' | 'domcontentloaded' | 'networkidle' | 'commit') || 'load';
    const timeout = (params.timeout as number) || 30000;

    try {
      // Perform the navigation
      const response = await page.goto(url, {
        waitUntil,
        timeout,
      });

      // Return navigation result
      return {
        success: true,
        status: response?.status() || 0,
        url: page.url(),
        title: await page.title(),
      };
    } catch (error) {
      throw new Error(`Navigation failed: ${(error as Error).message}`);
    }
  },
};

// Export the tool as default
export default navigateTool;
