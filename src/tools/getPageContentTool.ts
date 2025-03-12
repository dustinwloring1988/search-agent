/**
 * Get Page Content Tool
 * A tool that allows the AI agent to extract text content from the page
 */

import { Tool, ToolParameters } from './types';
import { BrowserInstance } from '../utils/playwright';

/**
 * Get Page Content tool parameters schema
 */
const parameters: ToolParameters = {
  type: 'object',
  properties: {
    selector: {
      type: 'string',
      description:
        'CSS selector or XPath to limit content extraction to a specific element (optional)',
    },
    selectorType: {
      type: 'string',
      description: 'Type of selector to use',
      enum: ['css', 'xpath', 'text', 'label', 'id', 'role'],
      default: 'css',
    },
    contentType: {
      type: 'string',
      description: 'Type of content to extract',
      enum: ['text', 'html', 'markdown', 'links', 'images', 'tables'],
      default: 'text',
    },
    includeMetadata: {
      type: 'boolean',
      description: 'Whether to include page metadata (title, description, etc.)',
      default: true,
    },
    maxLength: {
      type: 'number',
      description: 'Maximum length of content to extract (0 for no limit)',
      default: 0,
    },
    timeout: {
      type: 'number',
      description: 'Maximum time to wait for elements in milliseconds',
      default: 30000,
    },
  },
  required: [],
};

/**
 * Get Page Content tool implementation
 */
const getPageContentTool: Tool = {
  name: 'getPageContent',
  description: 'Extracts text content from the current page or a specific element',
  parameters,

  /**
   * Execute the content extraction
   * @param params - The parameters for the tool
   * @param browserInstance - The browser instance to use
   * @returns The extracted content
   */
  execute: async (
    params: Record<string, unknown>,
    browserInstance?: BrowserInstance
  ): Promise<unknown> => {
    if (!browserInstance) {
      throw new Error('Browser instance is required for content extraction');
    }

    const { page } = browserInstance;
    const selector = params.selector as string | undefined;
    const selectorType = (params.selectorType as string) || 'css';
    const contentType = (params.contentType as string) || 'text';
    const includeMetadata = (params.includeMetadata as boolean) ?? true;
    const maxLength = (params.maxLength as number) || 0;
    const timeout = (params.timeout as number) || 30000;

    try {
      // Gather page metadata if requested
      const metadata: Record<string, unknown> = {};
      if (includeMetadata) {
        metadata.title = await page.title();
        metadata.url = page.url();

        // Get metadata tags
        metadata.description = await page.evaluate(() => {
          const descEl = document.querySelector('meta[name="description"]');
          return descEl ? (descEl as HTMLMetaElement).content : null;
        });

        metadata.keywords = await page.evaluate(() => {
          const keywordsEl = document.querySelector('meta[name="keywords"]');
          return keywordsEl ? (keywordsEl as HTMLMetaElement).content : null;
        });
      }

      // If no selector is provided, extract from the whole page
      if (!selector) {
        // Extract the requested content type from the whole page
        let content: unknown;
        switch (contentType) {
          case 'text':
            content = await page.evaluate(() => {
              return document.body.innerText || document.body.textContent;
            });
            break;

          case 'html':
            content = await page.evaluate(() => {
              return document.body.innerHTML;
            });
            break;

          case 'links':
            content = await page.evaluate(() => {
              const links = Array.from(document.querySelectorAll('a'));
              return links.map(link => ({
                text: link.innerText?.trim() || link.textContent?.trim() || '',
                href: link.href,
                title: link.title || null,
                target: link.target || null,
              }));
            });
            break;

          case 'images':
            content = await page.evaluate(() => {
              const images = Array.from(document.querySelectorAll('img'));
              return images.map(img => ({
                src: img.src,
                alt: img.alt || null,
                title: img.title || null,
                width: img.width,
                height: img.height,
              }));
            });
            break;

          case 'tables':
            content = await page.evaluate(() => {
              const tables = Array.from(document.querySelectorAll('table'));
              return tables.map(table => {
                const rows = Array.from(table.querySelectorAll('tr'));
                return rows.map(row => {
                  const cells = Array.from(row.querySelectorAll('th, td'));
                  return cells.map(cell => cell.textContent?.trim() || '');
                });
              });
            });
            break;

          case 'markdown':
            // Simple HTML to Markdown conversion
            content = await page.evaluate(() => {
              const html = document.body.innerHTML;

              // Very simple HTML to Markdown conversion
              let markdown = html;

              // Replace headings
              markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n');
              markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n');
              markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n');

              // Replace paragraphs
              markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n');

              // Replace links
              markdown = markdown.replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/g, '[$2]($1)');

              // Replace lists
              markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/g, '$1\n');
              markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n');

              // Replace bold and italic
              markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**');
              markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*');

              // Remove other HTML tags
              markdown = markdown.replace(/<[^>]*>/g, '');

              // Decode HTML entities
              const txt = document.createElement('textarea');
              txt.innerHTML = markdown;
              markdown = txt.value;

              return markdown;
            });
            break;

          default:
            throw new Error(`Unsupported content type: ${contentType}`);
        }

        // Limit the content length if specified
        if (maxLength > 0 && typeof content === 'string' && content.length > maxLength) {
          content = content.substring(0, maxLength) + '... (content truncated)';
        }

        return {
          success: true,
          content,
          metadata: includeMetadata ? metadata : undefined,
          message: `Extracted ${contentType} content from the current page`,
        };
      } else {
        // Find the element based on the selector type
        let elementLocator;
        switch (selectorType) {
          case 'xpath':
            elementLocator = page.locator(`xpath=${selector}`);
            break;
          case 'text':
            elementLocator = page.getByText(selector);
            break;
          case 'label':
            elementLocator = page.getByLabel(selector);
            break;
          case 'id':
            elementLocator = page.locator(`#${selector}`);
            break;
          case 'role':
            elementLocator = page.getByRole(selector as any);
            break;
          case 'css':
          default:
            elementLocator = page.locator(selector);
            break;
        }

        try {
          // Wait for the element to exist
          await elementLocator.waitFor({ state: 'attached', timeout });
        } catch (error) {
          return {
            success: false,
            message: `Element with ${selectorType} selector "${selector}" not found`,
            error: (error as Error).message,
          };
        }

        // Extract content from the element
        let content: unknown;
        switch (contentType) {
          case 'text':
            content = await elementLocator.textContent();
            break;

          case 'html':
            content = await elementLocator.evaluate(el => el.outerHTML);
            break;

          case 'links':
            content = await elementLocator.evaluate(el => {
              const links = Array.from(el.querySelectorAll('a'));
              return links.map(link => ({
                text: link.innerText?.trim() || link.textContent?.trim() || '',
                href: link.href,
                title: link.title || null,
                target: link.target || null,
              }));
            });
            break;

          case 'images':
            content = await elementLocator.evaluate(el => {
              const images = Array.from(el.querySelectorAll('img'));
              return images.map(img => ({
                src: img.src,
                alt: img.alt || null,
                title: img.title || null,
                width: img.width,
                height: img.height,
              }));
            });
            break;

          case 'tables':
            content = await elementLocator.evaluate(el => {
              const tables = Array.from(el.querySelectorAll('table'));
              return tables.map(table => {
                const rows = Array.from(table.querySelectorAll('tr'));
                return rows.map(row => {
                  const cells = Array.from(row.querySelectorAll('th, td'));
                  return cells.map(cell => cell.textContent?.trim() || '');
                });
              });
            });
            break;

          case 'markdown':
            content = await elementLocator.evaluate(el => {
              const html = el.outerHTML;

              // Very simple HTML to Markdown conversion
              let markdown = html;

              // Replace headings
              markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n');
              markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n');
              markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n');

              // Replace paragraphs
              markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n');

              // Replace links
              markdown = markdown.replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/g, '[$2]($1)');

              // Replace lists
              markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/g, '$1\n');
              markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n');

              // Replace bold and italic
              markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**');
              markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*');

              // Remove other HTML tags
              markdown = markdown.replace(/<[^>]*>/g, '');

              // Decode HTML entities
              const txt = document.createElement('textarea');
              txt.innerHTML = markdown;
              markdown = txt.value;

              return markdown;
            });
            break;

          default:
            throw new Error(`Unsupported content type: ${contentType}`);
        }

        // Limit the content length if specified
        if (maxLength > 0 && typeof content === 'string' && content.length > maxLength) {
          content = content.substring(0, maxLength) + '... (content truncated)';
        }

        return {
          success: true,
          content,
          metadata: includeMetadata ? metadata : undefined,
          message: `Extracted ${contentType} content from element with ${selectorType} selector: ${selector}`,
        };
      }
    } catch (error) {
      throw new Error(`Content extraction failed: ${(error as Error).message}`);
    }
  },
};

// Export the tool as default
export default getPageContentTool;
