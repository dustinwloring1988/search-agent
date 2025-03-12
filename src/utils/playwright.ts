import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';

export interface BrowserInstance {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

/**
 * Launches a browser with the specified type
 * @param browserType - The type of browser to launch ('chromium', 'firefox', or 'webkit')
 * @returns Promise resolving to browser instance with browser, context and page
 */
export async function launchBrowser(
  browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium'
): Promise<BrowserInstance> {
  let browser: Browser;

  // Launch the selected browser
  switch (browserType) {
    case 'firefox':
      browser = await firefox.launch({ headless: false });
      break;
    case 'webkit':
      browser = await webkit.launch({ headless: false });
      break;
    case 'chromium':
    default:
      browser = await chromium.launch({ headless: false });
      break;
  }

  // Create a new browser context
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  });

  // Create a new page
  const page = await context.newPage();

  return { browser, context, page };
}

/**
 * Closes a browser instance and all associated resources
 * @param instance - The browser instance to close
 */
export async function closeBrowser(instance: BrowserInstance): Promise<void> {
  await instance.page.close();
  await instance.context.close();
  await instance.browser.close();
}

/**
 * Takes a screenshot of the current page
 * @param page - The Playwright page to screenshot
 * @param path - The file path where to save the screenshot
 */
export async function takeScreenshot(page: Page, path: string): Promise<void> {
  await page.screenshot({ path });
}
