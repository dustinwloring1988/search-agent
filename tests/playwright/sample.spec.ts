import { test, expect } from '@playwright/test';

test.describe('Basic browser functionality test', () => {
  test('should launch browser and navigate to a website', async ({ page }) => {
    // Navigate to a test website
    await page.goto('https://playwright.dev/');

    // Verify the page title contains the expected text
    const title = await page.title();
    expect(title).toContain('Playwright');

    // Take a screenshot for verification
    await page.screenshot({ path: 'tests/playwright/screenshots/homepage.png' });

    // Verify some content on the page
    const getStartedButton = page.getByRole('link', { name: 'Get started' });
    await expect(getStartedButton).toBeVisible();

    // Test basic navigation (optional - uncomment if needed)
    // await getStartedButton.click();
    // await expect(page.url()).toContain('/docs/intro');
  });
});
