const { test, expect } = require('@playwright/test');

const APP_URL = 'http://localhost:5173';

test.describe('App Load Test', () => {
  test('App loads without errors', async ({ page }) => {
    const errors = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log(`[Browser Error] ${msg.text()}`);
      }
    });

    // Navigate to app
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Wait a bit for React to render
    await page.waitForTimeout(2000);

    // Check for any errors
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    }

    expect(errors.length).toBe(0);

    // Verify app loaded
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('Can open a calendar file', async ({ page }) => {
    const errors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log(`[Browser Error] ${msg.text()}`);
      }
    });

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to click Calendar folder
    const calendarButton = page.locator('text=Calendar').first();
    if (await calendarButton.isVisible()) {
      await calendarButton.click();
      await page.waitForTimeout(1000);
    }

    // Check no errors occurred
    expect(errors.length).toBe(0);
  });
});
