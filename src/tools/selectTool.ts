/**
 * Select Tool
 * A tool that allows the AI agent to select options from dropdown menus
 */

import { Tool, ToolParameters } from './types';
import { BrowserInstance } from '../utils/playwright';

/**
 * Select tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    selector: {
      type: 'string',
      description: 'CSS selector, XPath, or label of the select element',
    },
    selectorType: {
      type: 'string',
      description: 'Type of selector to use',
      enum: ['css', 'xpath', 'label'],
      default: 'css',
    },
    value: {
      type: 'string',
      description: 'The value attribute of the option to select',
    },
    text: {
      type: 'string',
      description: 'The visible text of the option to select (alternative to value)',
    },
    index: {
      type: 'number',
      description: 'The zero-based index of the option to select (alternative to value and text)',
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
 * Select tool implementation
 * This tool selects an option from a dropdown menu
 */
const selectTool: Tool = {
  name: 'select',
  description: 'Selects an option from a dropdown menu identified by CSS selector, XPath, or label',
  parameters,

  /**
   * Execute the select operation
   * @param params - The parameters for the tool
   * @param browserInstance - The browser instance to use
   * @returns The result of the select operation
   */
  execute: async (
    params: Record<string, unknown>,
    browserInstance?: BrowserInstance
  ): Promise<unknown> => {
    if (!browserInstance) {
      throw new Error('Browser instance is required for select operations');
    }

    const { page } = browserInstance;
    const selector = params.selector as string;
    const selectorType = (params.selectorType as string) || 'css';
    const value = params.value as string | undefined;
    const text = params.text as string | undefined;
    const index = params.index as number | undefined;
    const timeout = (params.timeout as number) || 30000;

    // Ensure at least one selection method is provided
    if (value === undefined && text === undefined && index === undefined) {
      throw new Error('At least one of value, text, or index must be provided');
    }

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

      // Select the option based on the provided selection method
      let selectedOption;
      if (value !== undefined) {
        await element.selectOption({ value });
        selectedOption = `value="${value}"`;
      } else if (text !== undefined) {
        await element.selectOption({ label: text });
        selectedOption = `text="${text}"`;
      } else if (index !== undefined) {
        await element.selectOption({ index });
        selectedOption = `index=${index}`;
      }

      return {
        success: true,
        message: `Selected option with ${selectedOption} from dropdown with ${selectorType} selector: ${selector}`,
      };
    } catch (error) {
      throw new Error(`Select operation failed: ${(error as Error).message}`);
    }
  },
};

// Export the tool as default
export default selectTool;
