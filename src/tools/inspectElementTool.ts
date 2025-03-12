/**
 * Inspect Element Tool
 * A tool that allows the AI agent to extract detailed information about elements on the page
 */

import { Tool, ToolParameters } from './types';
import { BrowserInstance } from '../utils/playwright';

/**
 * Inspect Element tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    selector: {
      type: 'string',
      description: 'CSS selector, XPath, or text content of the element to inspect',
    },
    selectorType: {
      type: 'string',
      description: 'Type of selector to use',
      enum: ['css', 'xpath', 'text', 'label', 'id', 'role'],
      default: 'css',
    },
    includeStyles: {
      type: 'boolean',
      description: 'Whether to include computed styles',
      default: false,
    },
    includeAttributes: {
      type: 'boolean',
      description: 'Whether to include all attributes',
      default: true,
    },
    includeHTML: {
      type: 'boolean',
      description: 'Whether to include the HTML of the element',
      default: false,
    },
    includeAccessibility: {
      type: 'boolean',
      description: 'Whether to include accessibility information',
      default: false,
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
 * Inspect Element tool implementation
 */
const inspectElementTool: Tool = {
  name: 'inspectElement',
  description: 'Extracts detailed information about an element on the page',
  parameters,

  /**
   * Execute the element inspection
   * @param params - The parameters for the tool
   * @param browserInstance - The browser instance to use
   * @returns Detailed information about the element
   */
  execute: async (
    params: Record<string, unknown>,
    browserInstance?: BrowserInstance
  ): Promise<unknown> => {
    if (!browserInstance) {
      throw new Error('Browser instance is required for inspecting elements');
    }

    const { page } = browserInstance;
    const selector = params.selector as string;
    const selectorType = (params.selectorType as string) || 'css';
    const includeStyles = (params.includeStyles as boolean) || false;
    const includeAttributes = (params.includeAttributes as boolean) ?? true;
    const includeHTML = (params.includeHTML as boolean) || false;
    const includeAccessibility = (params.includeAccessibility as boolean) || false;
    const timeout = (params.timeout as number) || 30000;

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

      // Wait for the element to be visible
      await elementHandle.waitFor({ state: 'visible', timeout });

      // Gather basic element information
      const result: Record<string, unknown> = {};

      // Get tag name and basic properties
      result.tagName = await elementHandle.evaluate((el: Element) => el.tagName.toLowerCase());
      result.text = await elementHandle.textContent();
      result.innerText = await elementHandle.innerText();
      result.value = await elementHandle
        .evaluate((el: HTMLInputElement) => el.value || null)
        .catch(() => null);
      result.isVisible = await elementHandle.isVisible();
      result.isEnabled = await elementHandle.isEnabled();

      // Get bounding box and geometry
      const boundingBox = await elementHandle.boundingBox();
      if (boundingBox) {
        result.boundingBox = boundingBox;
      }

      // Include attributes if requested
      if (includeAttributes) {
        const attributes = await elementHandle.evaluate((el: Element) => {
          const attrs: Record<string, string> = {};
          for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            attrs[attr.name] = attr.value;
          }
          return attrs;
        });
        result.attributes = attributes;
      }

      // Include HTML if requested
      if (includeHTML) {
        result.outerHTML = await elementHandle.evaluate((el: Element) => el.outerHTML);
        result.innerHTML = await elementHandle.evaluate((el: Element) => el.innerHTML);
      }

      // Include computed styles if requested
      if (includeStyles) {
        const styles = await elementHandle.evaluate((el: Element) => {
          const computed = window.getComputedStyle(el);
          const styles: Record<string, string> = {};
          for (let i = 0; i < computed.length; i++) {
            const prop = computed[i];
            styles[prop] = computed.getPropertyValue(prop);
          }
          return styles;
        });
        result.computedStyles = styles;
      }

      // Include accessibility information if requested
      if (includeAccessibility) {
        const accessibility = await elementHandle.evaluate((el: Element) => {
          // Basic accessibility properties
          const acc: Record<string, unknown> = {};

          // Role
          acc.role = el.getAttribute('role') || 'generic';

          // ARIA attributes
          const ariaAttrs: Record<string, string> = {};
          for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            if (attr.name.startsWith('aria-')) {
              ariaAttrs[attr.name] = attr.value;
            }
          }
          acc.ariaAttributes = ariaAttrs;

          // Tab index
          acc.tabIndex = (el as HTMLElement).tabIndex || null;

          // Accessible name (if possible)
          try {
            if ('ariaLabel' in el) {
              acc.accessibleName = (el as any).ariaLabel;
            }
          } catch {
            // Ignore errors
          }

          return acc;
        });
        result.accessibility = accessibility;
      }

      return {
        success: true,
        element: result,
        message: `Inspected element with ${selectorType} selector: ${selector}`,
      };
    } catch (error) {
      throw new Error(`Element inspection failed: ${(error as Error).message}`);
    }
  },
};

// Export the tool as default
export default inspectElementTool;
