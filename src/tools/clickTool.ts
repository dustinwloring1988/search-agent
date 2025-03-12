/**
 * Click Tool
 * A tool that allows the AI agent to click on elements in the browser
 */

import { Tool, ToolParameters } from './types';
import { BrowserInstance } from '../utils/playwright';

/**
 * Click tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    selector: {
      type: 'string',
      description: 'CSS selector, XPath, or text content of the element to click',
    },
    selectorType: {
      type: 'string',
      description: 'Type of selector to use',
      enum: ['css', 'xpath', 'text'],
      default: 'css',
    },
    button: {
      type: 'string',
      description: 'Mouse button to use for the click',
      enum: ['left', 'right', 'middle'],
      default: 'left',
    },
    clickCount: {
      type: 'number',
      description: 'Number of times to click',
      default: 1,
    },
    timeout: {
      type: 'number',
      description: 'Maximum time to wait for the element in milliseconds',
      default: 30000,
    },
  },
  required: ['selector'],
};

/**
 * Click tool implementation
 * This tool clicks on an element in the page
 */
const clickTool: Tool = {
  name: 'click',
  description:
    'Clicks on an element in the page identified by CSS selector, XPath, or text content',
  parameters,

  /**
   * Execute the click operation
   * @param params - The parameters for the tool
   * @param browserInstance - The browser instance to use
   * @returns The result of the click operation
   */
  execute: async (
    params: Record<string, unknown>,
    browserInstance?: BrowserInstance
  ): Promise<unknown> => {
    if (!browserInstance) {
      throw new Error('Browser instance is required for clicking elements');
    }

    const { page } = browserInstance;
    const selector = params.selector as string;
    const selectorType = (params.selectorType as string) || 'css';
    const button = (params.button as 'left' | 'right' | 'middle') || 'left';
    const clickCount = (params.clickCount as number) || 1;
    const timeout = (params.timeout as number) || 30000;

    try {
      let element;

      // Find the element based on the selector type
      switch (selectorType) {
        case 'xpath':
          element = page.locator(`xpath=${selector}`);
          break;
        case 'text':
          element = page.getByText(selector);
          break;
        case 'css':
        default:
          element = page.locator(selector);
          break;
      }

      // Wait for the element to be visible and enabled
      await element.waitFor({ state: 'visible', timeout });

      // Perform the click operation
      await element.click({
        button,
        clickCount,
        timeout,
      });

      return {
        success: true,
        message: `Clicked on element with ${selectorType} selector: ${selector}`,
        currentUrl: page.url(),
      };
    } catch (error) {
      throw new Error(`Click operation failed: ${(error as Error).message}`);
    }
  },
};

// Export the tool as default
export default clickTool;
