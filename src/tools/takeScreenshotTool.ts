/**
 * Take Screenshot Tool
 * A tool that allows the AI agent to capture screenshots of the page or elements
 */

import { Tool, ToolParameters } from './types';
import { BrowserInstance } from '../utils/playwright';
import path from 'path';
import fs from 'fs';

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

/**
 * Take Screenshot tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    selector: {
      type: 'string',
      description:
        'CSS selector or XPath of the element to screenshot (optional, full page if not provided)',
    },
    selectorType: {
      type: 'string',
      description: 'Type of selector to use',
      enum: ['css', 'xpath'],
      default: 'css',
    },
    filename: {
      type: 'string',
      description: 'Custom filename to use for the screenshot (without extension)',
    },
    fullPage: {
      type: 'boolean',
      description: 'Whether to capture the full scrollable page',
      default: false,
    },
    timeout: {
      type: 'number',
      description: 'Maximum time to wait for the element in milliseconds',
      default: 30000,
    },
  },
  required: [],
};

/**
 * Take Screenshot tool implementation
 */
const takeScreenshotTool: Tool = {
  name: 'takeScreenshot',
  description: 'Captures a screenshot of the page or a specific element',
  parameters,

  /**
   * Execute the screenshot capture
   * @param params - The parameters for the tool
   * @param browserInstance - The browser instance to use
   * @returns Information about the captured screenshot
   */
  execute: async (
    params: Record<string, unknown>,
    browserInstance?: BrowserInstance
  ): Promise<unknown> => {
    if (!browserInstance) {
      throw new Error('Browser instance is required for taking screenshots');
    }

    const { page } = browserInstance;
    const selector = params.selector as string | undefined;
    const selectorType = (params.selectorType as string) || 'css';
    const customFilename = params.filename as string | undefined;
    const fullPage = (params.fullPage as boolean) || false;
    const timeout = (params.timeout as number) || 30000;

    try {
      // Generate a unique filename if not provided
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
      const filename = customFilename ? `${customFilename}.png` : `screenshot_${timestamp}.png`;
      const filePath = path.join(screenshotsDir, filename);

      // Determine what to screenshot
      if (selector) {
        // Screenshot a specific element
        let elementHandle;

        // Find the element based on the selector type
        if (selectorType === 'xpath') {
          elementHandle = page.locator(`xpath=${selector}`);
        } else {
          elementHandle = page.locator(selector);
        }

        // Wait for the element to be visible
        await elementHandle.waitFor({ state: 'visible', timeout });

        // Take the screenshot of the element
        await elementHandle.screenshot({ path: filePath });

        return {
          success: true,
          message: `Captured screenshot of element with ${selectorType} selector: ${selector}`,
          filename,
          path: filePath,
          elementScreenshot: true,
        };
      } else {
        // Screenshot the entire page or viewport
        await page.screenshot({
          path: filePath,
          fullPage,
        });

        return {
          success: true,
          message: fullPage
            ? 'Captured screenshot of full page'
            : 'Captured screenshot of current viewport',
          filename,
          path: filePath,
          fullPage,
        };
      }
    } catch (error) {
      throw new Error(`Screenshot capture failed: ${(error as Error).message}`);
    }
  },
};

// Export the tool as default
export default takeScreenshotTool;
