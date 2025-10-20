const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_FILE_1 = '/Users/robertocallaghan/Documents/notes/Notes/test-switch-1.txt';
const TEST_FILE_2 = '/Users/robertocallaghan/Documents/notes/Notes/test-switch-2.txt';

test.describe('File Switching Error Fix', () => {
  test.beforeAll(() => {
    // Create test files
    fs.writeFileSync(TEST_FILE_1, '# Test File 1\n\n- [ ] Task in file 1\n', 'utf-8');
    fs.writeFileSync(TEST_FILE_2, '# Test File 2\n\n- [ ] Task in file 2\n', 'utf-8');
  });

  test.afterAll(() => {
    // Clean up test files
    if (fs.existsSync(TEST_FILE_1)) fs.unlinkSync(TEST_FILE_1);
    if (fs.existsSync(TEST_FILE_2)) fs.unlinkSync(TEST_FILE_2);
  });

  test('should not throw parseTasksFromContent error when switching files', async ({ page }) => {
    // Capture console errors
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.toString());
    });

    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load
    await page.waitForTimeout(3000);

    // Try to trigger file switching via the useFileStore directly
    await page.evaluate(() => {
      // Access the store from the window if it's exposed, or through React DevTools
      const openFile = window?.useFileStore?.getState?.()?.openFile;
      if (openFile) {
        openFile('test-switch-1.txt');
      }
    });

    await page.waitForTimeout(1000);

    // Check for the specific error we fixed
    const parseTaskErrors = consoleErrors.filter(err =>
      err.includes("Cannot read properties of undefined (reading 'split')") ||
      err.includes('parseTasksFromContent')
    );

    console.log('All console errors:', consoleErrors);
    console.log('Parse task errors:', parseTaskErrors);

    // The test passes if we don't get the specific error
    expect(parseTaskErrors).toHaveLength(0);
  });

  test('manual navigation test - check console for errors', async ({ page }) => {
    // This test just opens the page and logs what happens
    // Useful for manual debugging

    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', error => {
      consoleMessages.push(`[PAGE ERROR] ${error.toString()}`);
    });

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    console.log('=== Console Messages During Load ===');
    consoleMessages.forEach(msg => console.log(msg));

    // Try to find and click on a file in the UI (if visible)
    try {
      // Wait for Files tab and click it
      const filesButton = page.locator('text="Files"').first();
      if (await filesButton.isVisible({ timeout: 2000 })) {
        console.log('Found Files tab, clicking...');
        await filesButton.click({ force: true });
        await page.waitForTimeout(2000);
      }

      // Try to find a test file
      const testFile = page.locator('text=test-switch-1.txt').first();
      if (await testFile.isVisible({ timeout: 2000 })) {
        console.log('Found test file, clicking...');
        await testFile.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('Could not interact with UI:', e.message);
    }

    console.log('=== Final Console Messages ===');
    consoleMessages.forEach(msg => console.log(msg));

    // Check for our specific error
    const hasError = consoleMessages.some(msg =>
      msg.includes("Cannot read properties of undefined (reading 'split')")
    );

    expect(hasError).toBe(false);
  });
});