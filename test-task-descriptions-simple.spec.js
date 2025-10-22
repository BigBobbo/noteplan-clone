const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_FILE = '/Users/robertocallaghan/Documents/notes/Notes/task-description-test.txt';

test.describe('Task Description Simple Test', () => {
  test('Basic visual test', async ({ page }) => {
    // Console logging capture
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      console.log('[Console]:', text);
      logs.push(text);
    });

    console.log('Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-screenshot-1.png', fullPage: true });

    console.log('Waiting for app to load...');
    await page.waitForTimeout(3000);

    // Try to find the test file in the sidebar
    const testFileName = path.basename(TEST_FILE, '.txt');
    console.log('Looking for file:', testFileName);

    // Take another screenshot
    await page.screenshot({ path: 'test-screenshot-2.png', fullPage: true });

    // Try clicking on the file - be flexible with selectors
    const fileSelectors = [
      `button:has-text("${testFileName}")`,
      `[role="button"]:has-text("${testFileName}")`,
      `text="${testFileName}"`,
      `.sidebar button:has-text("${testFileName}")`,
    ];

    let clicked = false;
    for (const selector of fileSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.count() > 0) {
          console.log(`Clicking file with selector: ${selector}`);
          await element.click();
          clicked = true;
          break;
        }
      } catch (e) {
        console.log(`Selector ${selector} failed:`, e.message);
      }
    }

    if (!clicked) {
      console.log('Could not find file to click');
      // List all visible buttons for debugging
      const buttons = await page.locator('button').all();
      console.log('Available buttons:', buttons.length);
      for (let i = 0; i < Math.min(10, buttons.length); i++) {
        const text = await buttons[i].textContent();
        console.log(`  Button ${i}: ${text}`);
      }
    }

    await page.waitForTimeout(2000);

    // Take screenshot after clicking
    await page.screenshot({ path: 'test-screenshot-3.png', fullPage: true });

    // Check for indicators
    const indicators = await page.locator('.task-details-indicator').all();
    console.log('Found task-details-indicator elements:', indicators.length);

    // Check for noteplan tasks
    const tasks = await page.locator('.noteplan-task').all();
    console.log('Found noteplan-task elements:', tasks.length);

    // Check logs for parsing
    const parseLogs = logs.filter(log =>
      log.includes('[parseNotePlanMarkdown]') ||
      log.includes('[parseTaskDetails]') ||
      log.includes('hasDetails')
    );

    console.log('Relevant logs:');
    parseLogs.forEach(log => console.log('  ', log));

    // Just check that we have some tasks
    expect(tasks.length).toBeGreaterThan(0);
  });
});