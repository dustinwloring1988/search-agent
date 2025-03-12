/**
 * Handle Dialog Tool
 * A tool that allows the AI agent to handle dialogs and popups
 */

import { Tool, ToolParameters } from './types';
import { BrowserInstance } from '../utils/playwright';
import { Dialog } from 'playwright';

/**
 * Handle Dialog tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      description: 'The action to take when a dialog appears',
      enum: ['accept', 'dismiss', 'fill'],
      default: 'accept',
    },
    text: {
      type: 'string',
      description: 'Text to enter in prompt dialogs (only used when action is "fill")',
    },
    dialogType: {
      type: 'string',
      description: 'The type of dialog to handle',
      enum: ['alert', 'confirm', 'prompt', 'beforeunload', 'all'],
      default: 'all',
    },
    waitForDialog: {
      type: 'boolean',
      description: 'Whether to wait for a dialog to appear before proceeding',
      default: false,
    },
    timeout: {
      type: 'number',
      description: 'Maximum time to wait for a dialog in milliseconds (when waitForDialog is true)',
      default: 30000,
    },
  },
  required: ['action'],
};

/**
 * Handle Dialog tool implementation
 */
const handleDialogTool: Tool = {
  name: 'handleDialog',
  description: 'Configures how to handle browser dialogs like alerts, confirms, and prompts',
  parameters,

  /**
   * Execute the dialog handling
   * @param params - The parameters for the tool
   * @param browserInstance - The browser instance to use
   * @returns Information about the dialog handling
   */
  execute: async (
    params: Record<string, unknown>,
    browserInstance?: BrowserInstance
  ): Promise<unknown> => {
    if (!browserInstance) {
      throw new Error('Browser instance is required for dialog handling');
    }

    const { page } = browserInstance;
    const action = (params.action as string) || 'accept';
    const text = params.text as string | undefined;
    const dialogType = (params.dialogType as string) || 'all';
    const waitForDialog = (params.waitForDialog as boolean) || false;
    const timeout = (params.timeout as number) || 30000;

    try {
      // Set up dialog handler
      page.on('dialog', async (dialog: Dialog) => {
        // Check if we should handle this type of dialog
        if (dialogType === 'all' || dialog.type() === dialogType) {
          // Handle the dialog based on the action
          switch (action) {
            case 'accept':
              await dialog.accept();
              break;
            case 'dismiss':
              await dialog.dismiss();
              break;
            case 'fill':
              if (dialog.type() === 'prompt' && text !== undefined) {
                await dialog.accept(text);
              } else if (dialog.type() === 'prompt') {
                await dialog.accept(dialog.defaultValue() || '');
              } else {
                await dialog.accept();
              }
              break;
            default:
              await dialog.accept();
          }
        } else {
          // Default behavior for other dialog types
          await dialog.accept();
        }
      });

      // If we need to wait for a dialog, set up a promise
      if (waitForDialog) {
        // Create a promise that resolves when a dialog is handled
        const dialogPromise = new Promise<{ type: string; message: string }>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`Timed out waiting for dialog after ${timeout}ms`));
          }, timeout);

          // One-time listener for dialog
          page.once('dialog', dialog => {
            clearTimeout(timeoutId);
            const dialogInfo = {
              type: dialog.type(),
              message: dialog.message(),
            };
            // We need to resolve after the dialog is handled
            setTimeout(() => resolve(dialogInfo), 100);
          });
        });

        // Wait for the dialog
        const dialogInfo = await dialogPromise;

        return {
          success: true,
          message: `Successfully handled ${dialogInfo.type} dialog with message: ${dialogInfo.message}`,
          action,
          dialogInfo,
        };
      }

      // If not waiting, just return success
      return {
        success: true,
        message: `Dialog handler set up to ${action} ${dialogType} dialogs`,
        action,
        dialogType,
        waitForDialog,
      };
    } catch (error) {
      throw new Error(`Dialog handling failed: ${(error as Error).message}`);
    }
  },
};

// Export the tool as default
export default handleDialogTool;
