/**
 * Find Element Tool
 * A tool that allows the AI agent to find elements on the page using various selectors
 */

import { Tool, ToolParameters } from './types';
import { BrowserInstance } from '../utils/playwright';

/**
 * Find Element tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    selector: {
      type: 'string',
      description: 'CSS selector, XPath, or text content to search for',
    },
    selectorType: {
      type: 'string',
      description: 'Type of selector to use',
      enum: ['css', 'xpath', 'text', 'label', 'id', 'role'],
      default: 'css',
    },
    timeout: {
      type: 'number',
      description: 'Maximum time to wait for the element in milliseconds',
      default: 30000,
    },
    waitForVisible: {
      type: 'boolean',
      description: 'Whether to wait for the element to be visible',
      default: true,
    },
    extractProps: {
      type: 'string',
      description:
        'Comma-separated list of properties to extract from the element (text,innerText,innerHTML,value,href,src,id,className)',
      default: 'text',
    },
    multiple: {
      type: 'boolean',
      description: 'Whether to find all matching elements instead of just the first one',
      default: false,
    },
    maxResults: {
      type: 'number',
      description: 'Maximum number of results to return when multiple is true',
      default: 10,
    },
  },
  required: ['selector'],
};

/**
 * Find Element tool implementation
 * This tool finds elements on the page using various selectors
 */
const findElementTool: Tool = {
  name: 'findElement',
  description: 'Finds elements on the page using CSS selectors, XPath, or text content',
  parameters,

  /**
   * Execute the find element operation
   * @param params - The parameters for the tool
   * @param browserInstance - The browser instance to use
   * @returns The found element(s) details
   */
  execute: async (
    params: Record<string, unknown>,
    browserInstance?: BrowserInstance
  ): Promise<unknown> => {
    if (!browserInstance) {
      throw new Error('Browser instance is required for finding elements');
    }

    const { page } = browserInstance;
    const selector = params.selector as string;
    const selectorType = (params.selectorType as string) || 'css';
    const timeout = (params.timeout as number) || 30000;
    const waitForVisible = (params.waitForVisible as boolean) ?? true;

    // Parse comma-separated list of properties to extract
    const extractPropsStr = (params.extractProps as string) || 'text';
    const extractProps = extractPropsStr.split(',').map(prop => prop.trim());

    const multiple = (params.multiple as boolean) || false;
    const maxResults = (params.maxResults as number) || 10;

    try {
      let elementHandle;

      // Find the element based on the selector type
      switch (selectorType) {
        case 'xpath':
          elementHandle = page.locator(`xpath=${selector}`);
          break;
        case 'text':
          elementHandle = page.getByText(selector);
          break;
        case 'label':
          elementHandle = page.getByLabel(selector);
          break;
        case 'id':
          elementHandle = page.locator(`#${selector}`);
          break;
        case 'role':
          elementHandle = page.getByRole(selector as any);
          break;
        case 'css':
        default:
          elementHandle = page.locator(selector);
          break;
      }

      // Wait for the element if requested
      if (waitForVisible) {
        try {
          await elementHandle.first().waitFor({ state: 'visible', timeout });
        } catch (error) {
          return {
            success: false,
            message: `No elements found for ${selectorType} selector: ${selector}`,
            error: (error as Error).message,
          };
        }
      }

      // Get the count of matching elements
      const count = await elementHandle.count();

      if (count === 0) {
        return {
          success: false,
          message: `No elements found for ${selectorType} selector: ${selector}`,
        };
      }

      // Process results based on whether we want single or multiple elements
      if (!multiple) {
        // Just get the first matching element
        const result = await extractElementProperties(elementHandle.first(), extractProps);
        return {
          success: true,
          element: result,
          message: `Found element with ${selectorType} selector: ${selector}`,
        };
      } else {
        // Get multiple elements
        const elements = [];
        const limit = Math.min(count, maxResults);

        for (let i = 0; i < limit; i++) {
          const element = elementHandle.nth(i);
          const properties = await extractElementProperties(element, extractProps);
          elements.push(properties);
        }

        return {
          success: true,
          elements,
          count,
          limitedCount: limit,
          message: `Found ${count} elements with ${selectorType} selector: ${selector} (returning ${limit})`,
        };
      }
    } catch (error) {
      throw new Error(`Find element operation failed: ${(error as Error).message}`);
    }
  },
};

/**
 * Helper function to extract properties from an element
 * @param element - The Playwright element locator
 * @param properties - Array of property names to extract
 * @returns Object containing the requested properties
 */
async function extractElementProperties(
  element: any,
  properties: string[]
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  // Get bounding box if element exists
  try {
    const boundingBox = await element.boundingBox();
    if (boundingBox) {
      result.boundingBox = boundingBox;
    }
  } catch {
    // Element might not be visible, ignore the error
  }

  // Extract requested properties
  for (const prop of properties) {
    try {
      switch (prop) {
        case 'text':
          result.text = await element.textContent();
          break;
        case 'innerText':
          result.innerText = await element.innerText();
          break;
        case 'innerHTML':
          result.innerHTML = await element.evaluate((el: Element) => el.innerHTML);
          break;
        case 'value':
          result.value = await element.inputValue();
          break;
        case 'href':
          result.href = await element.getAttribute('href');
          break;
        case 'src':
          result.src = await element.getAttribute('src');
          break;
        case 'id':
          result.id = await element.getAttribute('id');
          break;
        case 'className':
          result.className = await element.getAttribute('class');
          break;
        default:
          // For any other properties, try to get them as attributes
          result[prop] = await element.getAttribute(prop);
      }
    } catch {
      // If property extraction fails, set it to null
      result[prop] = null;
    }
  }

  // Get tag name
  try {
    result.tagName = await element.evaluate((el: Element) => el.tagName.toLowerCase());
  } catch {
    result.tagName = null;
  }

  return result;
}

// Export the tool as default
export default findElementTool;
