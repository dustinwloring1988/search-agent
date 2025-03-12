/**
 * Wait For Tool
 * A tool that allows the AI agent to wait for various conditions like element availability,
 * navigation, or network activity to complete
 */

import { Tool, ToolParameters } from './types';
import { BrowserInstance } from '../utils/playwright';

/**
 * Wait For tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      description: 'The type of wait action to perform',
      enum: ['element', 'navigation', 'network', 'load', 'timeout'],
      default: 'element',
    },
    selector: {
      type: 'string',
      description:
        'CSS selector or XPath of the element to wait for (required for action="element")',
    },
    selectorType: {
      type: 'string',
      description: 'Type of selector to use for element',
      enum: ['css', 'xpath', 'text', 'label', 'id', 'role'],
      default: 'css',
    },
    state: {
      type: 'string',
      description: 'The state to wait for when waiting for an element',
      enum: ['visible', 'hidden', 'attached', 'detached'],
      default: 'visible',
    },
    url: {
      type: 'string',
      description: 'URL pattern to wait for navigation (can be a regex pattern)',
    },
    timeout: {
      type: 'number',
      description: 'Maximum time to wait in milliseconds',
      default: 30000,
    },
    networkIdleTime: {
      type: 'number',
      description: 'Time (ms) of no network activity to consider network idle',
      default: 500,
    },
  },
  required: ['action'],
};

/**
 * Wait For tool implementation
 */
const waitForTool: Tool = {
  name: 'waitFor',
  description: 'Waits for elements, navigation events, or network activity to complete',
  parameters,

  /**
   * Execute the wait operation
   * @param params - The parameters for the tool
   * @param browserInstance - The browser instance to use
   * @returns Information about what was waited for
   */
  execute: async (
    params: Record<string, unknown>,
    browserInstance?: BrowserInstance
  ): Promise<unknown> => {
    if (!browserInstance) {
      throw new Error('Browser instance is required for wait operations');
    }

    const { page } = browserInstance;
    const action = (params.action as string) || 'element';
    const timeout = (params.timeout as number) || 30000;
    const startTime = Date.now();

    try {
      switch (action) {
        case 'element': {
          // Wait for an element
          const selector = params.selector as string;
          if (!selector) {
            throw new Error('Selector is required for element wait');
          }

          const selectorType = (params.selectorType as string) || 'css';
          const state =
            (params.state as 'visible' | 'hidden' | 'attached' | 'detached') || 'visible';

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

          // Wait for the element with the specified state
          await elementHandle.waitFor({ state, timeout });

          const duration = Date.now() - startTime;
          return {
            success: true,
            message: `Waited ${duration}ms for element with ${selectorType} selector "${selector}" to be ${state}`,
            action,
            selector,
            state,
            duration,
          };
        }

        case 'navigation': {
          // Wait for navigation to a specific URL if provided
          const url = params.url as string | undefined;

          if (url) {
            // Wait for a specific URL
            await page.waitForURL(url, { timeout });

            const duration = Date.now() - startTime;
            return {
              success: true,
              message: `Waited ${duration}ms for navigation to URL matching "${url}"`,
              action,
              currentUrl: page.url(),
              duration,
            };
          } else {
            // Wait for any navigation to complete
            await page.waitForNavigation({ timeout });

            const duration = Date.now() - startTime;
            return {
              success: true,
              message: `Waited ${duration}ms for navigation to complete`,
              action,
              currentUrl: page.url(),
              duration,
            };
          }
        }

        case 'network': {
          // Wait for network to be idle
          const networkIdleTime = (params.networkIdleTime as number) || 500;

          await page.waitForLoadState('networkidle', { timeout });

          const duration = Date.now() - startTime;
          return {
            success: true,
            message: `Waited ${duration}ms for network activity to be idle for ${networkIdleTime}ms`,
            action,
            duration,
          };
        }

        case 'load': {
          // Wait for page to be fully loaded
          await page.waitForLoadState('load', { timeout });

          const duration = Date.now() - startTime;
          return {
            success: true,
            message: `Waited ${duration}ms for page to fully load`,
            action,
            duration,
          };
        }

        case 'timeout': {
          // Just wait for a specified amount of time
          await page.waitForTimeout(timeout);

          return {
            success: true,
            message: `Waited for ${timeout}ms`,
            action,
            duration: timeout,
          };
        }

        default:
          throw new Error(`Unknown wait action: ${action}`);
      }
    } catch (error) {
      throw new Error(`Wait operation failed: ${(error as Error).message}`);
    }
  },
};

// Export the tool as default
export default waitForTool;
