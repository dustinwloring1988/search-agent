/**
 * Submit Form Tool
 * A tool that allows the AI agent to submit forms on the page
 */

import { Tool, ToolParameters } from './types';
import { BrowserInstance } from '../utils/playwright';

/**
 * Submit Form tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    selector: {
      type: 'string',
      description:
        'CSS selector or XPath of the form element to submit (optional, will use any parent form if not provided)',
    },
    selectorType: {
      type: 'string',
      description: 'Type of selector to use',
      enum: ['css', 'xpath'],
      default: 'css',
    },
    waitForNavigation: {
      type: 'boolean',
      description: 'Whether to wait for navigation to complete after form submission',
      default: true,
    },
    timeout: {
      type: 'number',
      description: 'Maximum time to wait for form submission and navigation in milliseconds',
      default: 30000,
    },
  },
  required: [],
};

/**
 * Submit Form tool implementation
 */
const submitFormTool: Tool = {
  name: 'submitForm',
  description: 'Submits a form on the page, optionally waiting for navigation to complete',
  parameters,

  /**
   * Execute the form submission
   * @param params - The parameters for the tool
   * @param browserInstance - The browser instance to use
   * @returns Information about the form submission
   */
  execute: async (
    params: Record<string, unknown>,
    browserInstance?: BrowserInstance
  ): Promise<unknown> => {
    if (!browserInstance) {
      throw new Error('Browser instance is required for form submission');
    }

    const { page } = browserInstance;
    const selector = params.selector as string | undefined;
    const selectorType = (params.selectorType as string) || 'css';
    const waitForNavigation = (params.waitForNavigation as boolean) ?? true;
    const timeout = (params.timeout as number) || 30000;

    try {
      // Get the starting URL
      const startUrl = page.url();

      // Set up navigation promise if waiting for navigation
      const navigationPromise = waitForNavigation
        ? page.waitForNavigation({ timeout })
        : Promise.resolve();

      // Submit the form
      if (selector) {
        // Find the form based on the selector type
        let formElement;
        if (selectorType === 'xpath') {
          formElement = page.locator(`xpath=${selector}`);
        } else {
          formElement = page.locator(selector);
        }

        // Wait for the element to be attached to the DOM
        await formElement.waitFor({ state: 'attached', timeout });

        // Check if the selected element is a form
        const isForm = await formElement.evaluate(el => {
          return el.tagName.toLowerCase() === 'form';
        });

        if (isForm) {
          // Submit the form element directly
          await formElement.evaluate(form => {
            (form as HTMLFormElement).submit();
          });
        } else {
          // Check if there's a submit button inside the element
          const submitButton = await formElement
            .locator('input[type="submit"], button[type="submit"], button:not([type])')
            .first()
            .count()
            .then(count => count > 0);

          if (submitButton) {
            // Click the submit button
            await formElement
              .locator('input[type="submit"], button[type="submit"], button:not([type])')
              .first()
              .click();
          } else {
            // Try to find a parent form and submit it
            await formElement.evaluate(el => {
              const form = el.closest('form');
              if (form) {
                (form as HTMLFormElement).submit();
              } else {
                throw new Error('No parent form found');
              }
            });
          }
        }
      } else {
        // If no selector provided, try to submit the first form on the page
        const formCount = await page.locator('form').count();

        if (formCount === 0) {
          throw new Error('No forms found on the page');
        }

        // Get the first form and submit it
        await page.evaluate(() => {
          const form = document.querySelector('form');
          if (form) {
            (form as HTMLFormElement).submit();
          } else {
            throw new Error('No forms found on the page');
          }
        });
      }

      // Wait for navigation to complete if requested
      if (waitForNavigation) {
        await navigationPromise;

        // Get the new URL after navigation
        const endUrl = page.url();

        return {
          success: true,
          message: 'Form submitted successfully and navigation completed',
          startUrl,
          endUrl,
          navigationOccurred: startUrl !== endUrl,
        };
      } else {
        return {
          success: true,
          message: 'Form submitted successfully',
          startUrl,
        };
      }
    } catch (error) {
      throw new Error(`Form submission failed: ${(error as Error).message}`);
    }
  },
};

// Export the tool as default
export default submitFormTool;
