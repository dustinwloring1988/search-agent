/**
 * Type Tool
 * A tool that allows the AI agent to type text into input fields
 */

import { Tool, ToolParameters } from './types';
import { BrowserInstance } from '../utils/playwright';

/**
 * Type tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    selector: {
      type: 'string',
      description: 'CSS selector, XPath, or label of the input element to type into',
    },
    selectorType: {
      type: 'string',
      description: 'Type of selector to use',
      enum: ['css', 'xpath', 'label'],
      default: 'css',
    },
    text: {
      type: 'string',
      description: 'The text to type into the element',
    },
    delay: {
      type: 'number',
      description: 'Delay between keystrokes in milliseconds',
      default: 0,
    },
    clearFirst: {
      type: 'boolean',
      description: 'Whether to clear the input field before typing',
      default: true,
    },
    pressEnter: {
      type: 'boolean',
      description: 'Whether to press Enter after typing',
      default: false,
    },
    timeout: {
      type: 'number',
      description: 'Maximum time to wait for the element in milliseconds',
      default: 30000,
    },
  },
  required: ['selector', 'text'],
};

/**
 * Type tool implementation
 * This tool types text into an input element
 */
const typeTool: Tool = {
  name: 'type',
  description: 'Types text into an input field identified by CSS selector, XPath, or label',
  parameters,

  /**
   * Execute the type operation
   * @param params - The parameters for the tool
   * @param browserInstance - The browser instance to use
   * @returns The result of the type operation
   */
  execute: async (
    params: Record<string, unknown>,
    browserInstance?: BrowserInstance
  ): Promise<unknown> => {
    if (!browserInstance) {
      throw new Error('Browser instance is required for typing text');
    }

    const { page } = browserInstance;
    const selector = params.selector as string;
    const selectorType = (params.selectorType as string) || 'css';
    const text = params.text as string;
    const delay = (params.delay as number) || 0;
    const clearFirst = (params.clearFirst as boolean) ?? true;
    const pressEnter = (params.pressEnter as boolean) || false;
    const timeout = (params.timeout as number) || 30000;

    try {
      let element;

      // Find the element based on the selector type
      switch (selectorType) {
        case 'xpath':
          element = page.locator(`xpath=${selector}`);
          break;
        case 'label':
          element = page.getByLabel(selector);
          break;
        case 'css':
        default:
          element = page.locator(selector);
          break;
      }

      // Wait for the element to be visible and enabled
      await element.waitFor({ state: 'visible', timeout });

      // Clear the field if requested
      if (clearFirst) {
        await element.clear();
      }

      // Type the text
      await element.type(text, { delay });

      // Press Enter if requested
      if (pressEnter) {
        await element.press('Enter');
      }

      return {
        success: true,
        message: `Typed "${text}" into element with ${selectorType} selector: ${selector}`,
        pressedEnter: pressEnter,
      };
    } catch (error) {
      throw new Error(`Type operation failed: ${(error as Error).message}`);
    }
  },
};

// Export the tool as default
export default typeTool;
