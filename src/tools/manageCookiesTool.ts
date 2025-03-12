/**
 * Manage Cookies Tool
 * A tool that allows the AI agent to manage browser cookies
 */

import { Tool, ToolParameters } from './types';
import { BrowserInstance } from '../utils/playwright';
import { Cookie } from 'playwright';

/**
 * Manage Cookies tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      description: 'The action to perform on cookies',
      enum: ['get', 'set', 'delete', 'clear'],
      default: 'get',
    },
    name: {
      type: 'string',
      description: 'The name of the cookie (required for set and delete actions)',
    },
    value: {
      type: 'string',
      description: 'The value of the cookie (required for set action)',
    },
    url: {
      type: 'string',
      description: 'The URL to get/set cookies for (defaults to current page)',
    },
    domain: {
      type: 'string',
      description: 'The domain of the cookie (for set action)',
    },
    path: {
      type: 'string',
      description: 'The path of the cookie (for set action)',
      default: '/',
    },
    expires: {
      type: 'number',
      description: 'The expiration date of the cookie in seconds since epoch (for set action)',
    },
    httpOnly: {
      type: 'boolean',
      description: 'Whether the cookie is HTTP only (for set action)',
      default: false,
    },
    secure: {
      type: 'boolean',
      description: 'Whether the cookie is secure (for set action)',
      default: false,
    },
    sameSite: {
      type: 'string',
      description: 'The SameSite attribute of the cookie (for set action)',
      enum: ['Strict', 'Lax', 'None'],
    },
  },
  required: ['action'],
};

/**
 * Manage Cookies tool implementation
 */
const manageCookiesTool: Tool = {
  name: 'manageCookies',
  description: 'Manages browser cookies (get, set, delete, or clear)',
  parameters,

  /**
   * Execute the cookie management
   * @param params - The parameters for the tool
   * @param browserInstance - The browser instance to use
   * @returns Information about the cookie management
   */
  execute: async (
    params: Record<string, unknown>,
    browserInstance?: BrowserInstance
  ): Promise<unknown> => {
    if (!browserInstance) {
      throw new Error('Browser instance is required for cookie management');
    }

    const { context, page } = browserInstance;
    const action = (params.action as string) || 'get';
    const name = params.name as string | undefined;
    const value = params.value as string | undefined;
    const url = (params.url as string) || page.url();
    const domain = params.domain as string | undefined;
    const path = (params.path as string) || '/';
    const expires = params.expires as number | undefined;
    const httpOnly = (params.httpOnly as boolean) || false;
    const secure = (params.secure as boolean) || false;
    const sameSite = params.sameSite as 'Strict' | 'Lax' | 'None' | undefined;

    try {
      switch (action) {
        case 'get': {
          // Get cookies for the current page or specified URL
          const cookies = await context.cookies(url);

          return {
            success: true,
            message: `Retrieved ${cookies.length} cookies for ${url}`,
            cookies,
          };
        }

        case 'set': {
          // Validate required parameters
          if (!name) {
            throw new Error('Cookie name is required for set action');
          }
          if (value === undefined) {
            throw new Error('Cookie value is required for set action');
          }

          // Create the cookie object
          const cookie: Partial<Cookie> = {
            name,
            value,
            path,
            httpOnly,
            secure,
          };

          // Add optional properties only if they are defined
          if (domain) cookie.domain = domain;
          if (expires) cookie.expires = expires;
          if (sameSite) cookie.sameSite = sameSite;

          // Set the cookie
          await context.addCookies([{ ...(cookie as Cookie), url }]);

          return {
            success: true,
            message: `Set cookie ${name}=${value} for ${url}`,
            cookie: { ...cookie, url },
          };
        }

        case 'delete': {
          // Validate required parameters
          if (!name) {
            throw new Error('Cookie name is required for delete action');
          }

          // Get current cookies
          const currentCookies = await context.cookies(url);

          // Find the cookie to delete
          const cookieToDelete = currentCookies.find(c => c.name === name);

          if (!cookieToDelete) {
            return {
              success: false,
              message: `Cookie ${name} not found for ${url}`,
            };
          }

          // Delete the cookie by setting it with an expired date
          await context.addCookies([
            {
              ...cookieToDelete,
              expires: 0, // Set to epoch time 0 (expired)
            },
          ]);

          return {
            success: true,
            message: `Deleted cookie ${name} for ${url}`,
          };
        }

        case 'clear': {
          // Clear all cookies for the current context
          await context.clearCookies();

          return {
            success: true,
            message: 'Cleared all cookies',
          };
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      throw new Error(`Cookie management failed: ${(error as Error).message}`);
    }
  },
};

// Export the tool as default
export default manageCookiesTool;
