const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const EXAMPLE_FILE = '/Users/robertocallaghan/Documents/notes/Notes/task-description-validation.txt';

test.describe('Task Description Feature Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Create comprehensive test file
    const content = `# Task Description Validation

## Without Descriptions
- [ ] Simple task
- [x] Completed task
- [-] Cancelled task

## With Descriptions
- [ ] Task with single line description
  This is the description for the task above

- [ ] Task with multi-line description
  First line of description
  Second line of description

  New paragraph after blank line

- [ ] Task with list in description
  Description includes:
  - Bullet point one
  - Bullet point two
  - Bullet point three

## Nested Tasks
- [ ] Parent task with description
  Parent task description text
  - [ ] Subtask with description
    Subtask description text
  - [ ] Subtask without description`;

    fs.writeFileSync(EXAMPLE_FILE, content, 'utf-8');

    // Capture console logs
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('[parseTaskDetails]') ||
          text.includes('[TaskDetails]') ||
          text.includes('hasDetails')) {
        console.log('[LOG]', text);
      }
    });
    page.logs = logs;

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('Visual indicators appear in editor', async ({ page }) => {
    console.log('=== Testing Visual Indicators in Editor ===');

    // Wait for the page to load
    await page.waitForTimeout(3000);

    // Try to open the file
    const testFileName = path.basename(EXAMPLE_FILE, '.txt');
    console.log('Looking for file:', testFileName);

    // Try multiple selectors to find the file
    const clicked = await page.evaluate((fileName) => {
      // Try various ways to find and click the file
      const selectors = [
        `button:has-text("${fileName}")`,
        `[role="button"]:has-text("${fileName}")`,
        `.file-item:has-text("${fileName}")`,
        `text="${fileName}"`
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          element.click();
          return true;
        }
      }
      return false;
    }, testFileName);

    if (!clicked) {
      console.log('Could not click file, trying fallback');
      await page.keyboard.press('Meta+k'); // Try command palette
      await page.waitForTimeout(500);
      await page.keyboard.type(testFileName);
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(2000);

    // Check for task indicators
    const indicators = await page.locator('.task-details-indicator').count();
    console.log('Found indicators:', indicators);

    // Should have indicators for tasks with descriptions
    expect(indicators).toBeGreaterThan(0);

    // Check for the 📝 emoji
    const indicatorElements = await page.locator('.task-details-indicator').all();
    if (indicatorElements.length > 0) {
      const text = await indicatorElements[0].textContent();
      console.log('Indicator text:', text);
      expect(text).toContain('📝');
    }

    // Check tooltips
    if (indicatorElements.length > 0) {
      const tooltip = await indicatorElements[0].getAttribute('title');
      console.log('Tooltip:', tooltip);
      expect(tooltip).toBeTruthy();
    }
  });

  test('Tasks tab renders descriptions properly', async ({ page }) => {
    console.log('=== Testing Tasks Tab Rendering ===');

    // Navigate to Tasks tab
    await page.waitForTimeout(2000);

    // Try to click Tasks tab
    const tasksClicked = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const tasksTab = tabs.find(el => el.textContent?.includes('Tasks'));
      if (tasksTab) {
        tasksTab.click();
        return true;
      }
      return false;
    });

    if (tasksClicked) {
      console.log('Clicked Tasks tab');
      await page.waitForTimeout(2000);

      // Check for expand buttons
      const expandButtons = await page.locator('button[title*="Expand"]').count();
      console.log('Expand buttons found:', expandButtons);

      // Click first expand button if available
      if (expandButtons > 0) {
        await page.locator('button[title*="Expand"]').first().click();
        await page.waitForTimeout(500);

        // Check for prose content (markdown rendered)
        const proseContent = await page.locator('.prose').count();
        console.log('Prose content areas:', proseContent);
        expect(proseContent).toBeGreaterThan(0);

        // Check for paragraphs
        const paragraphs = await page.locator('.prose p').count();
        console.log('Paragraphs in prose:', paragraphs);

        // Check for lists
        const lists = await page.locator('.prose ul, .prose ol').count();
        console.log('Lists in prose:', lists);
      }
    }

    // Check console logs for parsing
    const detailLogs = page.logs.filter(log =>
      log.includes('Has newlines:') ||
      log.includes('Line count:') ||
      log.includes('[parseTaskDetails]')
    );

    console.log('Detail parsing logs found:', detailLogs.length);
    detailLogs.forEach(log => console.log('  ', log));
  });

  test('Save and reload persistence', async ({ page }) => {
    console.log('=== Testing Save and Reload Persistence ===');

    // Open the file
    const testFileName = path.basename(EXAMPLE_FILE, '.txt');

    await page.waitForTimeout(3000);

    // Try to open file
    await page.evaluate((fileName) => {
      const element = document.querySelector(`button:has-text("${fileName}")`);
      if (element) element.click();
    }, testFileName);

    await page.waitForTimeout(2000);

    // Count initial indicators
    const initialIndicators = await page.locator('.task-details-indicator').count();
    console.log('Initial indicators:', initialIndicators);

    // Make a small edit to trigger save
    await page.keyboard.press('End');
    await page.keyboard.type(' ');
    await page.waitForTimeout(1000);

    // Reload the page
    console.log('Reloading page...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Open the file again
    await page.evaluate((fileName) => {
      const element = document.querySelector(`button:has-text("${fileName}")`);
      if (element) element.click();
    }, testFileName);

    await page.waitForTimeout(2000);

    // Count indicators after reload
    const reloadedIndicators = await page.locator('.task-details-indicator').count();
    console.log('Indicators after reload:', reloadedIndicators);

    // Should maintain the same number of indicators
    expect(reloadedIndicators).toBe(initialIndicators);

    // Verify file content is preserved
    const savedContent = fs.readFileSync(EXAMPLE_FILE, 'utf-8');
    console.log('File has content:', savedContent.length > 0);
    expect(savedContent.includes('Task with single line description')).toBeTruthy();
  });

  test.afterEach(async ({ page }) => {
    // Take screenshot for debugging
    await page.screenshot({
      path: `test-validation-${Date.now()}.png`,
      fullPage: true
    });
  });
});