const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_FILE_1 = '/Users/robertocallaghan/Documents/notes/Notes/test-file-1.txt';
const TEST_FILE_2 = '/Users/robertocallaghan/Documents/notes/Notes/test-file-2.txt';

test.describe('File Switching', () => {
  test.beforeAll(() => {
    // Create test files
    fs.writeFileSync(TEST_FILE_1, '# Test File 1\n\n- [ ] Task in file 1\n- Regular bullet', 'utf-8');
    fs.writeFileSync(TEST_FILE_2, '# Test File 2\n\n- [ ] Task in file 2\n- Another bullet', 'utf-8');
  });

  test.afterAll(() => {
    // Clean up test files
    if (fs.existsSync(TEST_FILE_1)) fs.unlinkSync(TEST_FILE_1);
    if (fs.existsSync(TEST_FILE_2)) fs.unlinkSync(TEST_FILE_2);
  });

  test('should switch between files without errors', async ({ page }) => {
    // Capture console messages
    const consoleMessages = [];
    const consoleErrors = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
      consoleMessages.push(`[${msg.type()}] ${text}`);
    });

    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Wait for the sidebar to load
    await page.waitForSelector('aside', { timeout: 10000 });

    // Make sure we're on the Files tab
    const filesTab = page.locator('button:has-text("Files")').first();
    await filesTab.click();

    // Wait a moment for files to load
    await page.waitForTimeout(2000);

    // Find and click on test-file-1.txt
    const file1 = page.locator('text=test-file-1.txt').first();
    await expect(file1).toBeVisible();
    await file1.click();

    // Wait for editor to load
    await page.waitForSelector('.tiptap', { timeout: 5000 });

    // Check for errors
    const errorsAfterFile1 = consoleErrors.filter(err =>
      err.includes('Cannot read properties of undefined') ||
      err.includes('parseTasksFromContent')
    );

    if (errorsAfterFile1.length > 0) {
      console.log('Errors after opening file 1:', errorsAfterFile1);
    }

    // Now switch to test-file-2.txt
    const file2 = page.locator('text=test-file-2.txt').first();
    await expect(file2).toBeVisible();
    await file2.click();

    // Wait a moment for the switch
    await page.waitForTimeout(1000);

    // Check for errors after switching
    const errorsAfterFile2 = consoleErrors.filter(err =>
      err.includes('Cannot read properties of undefined') ||
      err.includes('parseTasksFromContent')
    );

    // Test should pass if no errors occurred
    expect(errorsAfterFile2).toHaveLength(0);

    // Also verify the content loaded
    const editorContent = await page.locator('.tiptap').textContent();
    expect(editorContent).toContain('Test File 2');
  });
});