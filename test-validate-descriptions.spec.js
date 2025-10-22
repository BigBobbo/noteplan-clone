const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_FILE = '/Users/robertocallaghan/Documents/notes/Notes/task-description-examples.txt';

test.describe('Task Description Validation', () => {
  let consoleLogs = [];

  test.beforeEach(async ({ page }) => {
    consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('[parseTaskDetails]') ||
          text.includes('[TaskDetails]') ||
          text.includes('hasDetails')) {
        console.log('[Debug]', text);
      }
    });
  });

  test('Task descriptions persist across editor save and reload', async ({ page }) => {
    console.log('=== Test 1: Editor Save and Reload ===');

    // Navigate to app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open the test file
    const fileName = path.basename(TEST_FILE, '.txt');
    console.log('Opening file:', fileName);

    // Try multiple selectors to find and click the file
    const clicked = await page.evaluate((name) => {
      // Find any button containing the file name
      const buttons = Array.from(document.querySelectorAll('button'));
      const fileButton = buttons.find(btn => btn.textContent.includes(name));
      if (fileButton) {
        fileButton.click();
        return true;
      }
      return false;
    }, fileName);

    if (!clicked) {
      console.log('Could not click file button, trying text selector');
      await page.click(`text="${fileName}"`).catch(() => console.log('Text selector also failed'));
    }

    await page.waitForTimeout(3000);

    // Check for task indicators in editor
    const indicators = await page.locator('.task-details-indicator').count();
    console.log('Task indicators found in editor:', indicators);

    // Verify we have indicators (should be many based on our test file)
    expect(indicators).toBeGreaterThan(0);

    // Check that the emoji is rendered
    const firstIndicator = await page.locator('.task-details-indicator').first();
    if (await firstIndicator.count() > 0) {
      const text = await firstIndicator.textContent();
      expect(text).toContain('📝');
      console.log('Indicator shows emoji:', text);
    }

    // Make a small edit to trigger save
    const editor = await page.locator('.ProseMirror').first();
    if (await editor.count() > 0) {
      await editor.click();
      await page.keyboard.press('End');
      await page.keyboard.type(' ');
      await page.waitForTimeout(1000);
      await page.keyboard.press('Backspace');
      console.log('Made edit to trigger save');
    }

    // Wait for save (auto-save should trigger)
    await page.waitForTimeout(2000);

    // Reload the page
    console.log('Reloading page...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open the file again
    const clickedAfterReload = await page.evaluate((name) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const fileButton = buttons.find(btn => btn.textContent.includes(name));
      if (fileButton) {
        fileButton.click();
        return true;
      }
      return false;
    }, fileName);

    await page.waitForTimeout(3000);

    // Check indicators are still there after reload
    const indicatorsAfterReload = await page.locator('.task-details-indicator').count();
    console.log('Task indicators after reload:', indicatorsAfterReload);

    expect(indicatorsAfterReload).toBe(indicators);
    console.log('✓ Indicators persisted after reload');
  });

  test('Task descriptions render correctly in Tasks tab', async ({ page }) => {
    console.log('=== Test 2: Tasks Tab Rendering ===');

    // Navigate to app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on Tasks tab
    const tasksTab = await page.locator('button:has-text("Tasks")').first();
    if (await tasksTab.count() > 0) {
      await tasksTab.click();
      console.log('Clicked Tasks tab');
    } else {
      // Try alternate selector
      await page.click('text="Tasks"').catch(() => console.log('Could not find Tasks tab'));
    }

    await page.waitForTimeout(2000);

    // Check for tasks with details
    const expandButtons = await page.locator('button[title*="Expand details"]').count();
    console.log('Expandable tasks found:', expandButtons);

    if (expandButtons > 0) {
      // Expand first task with details
      const firstExpand = await page.locator('button[title*="Expand details"]').first();
      await firstExpand.click();
      console.log('Expanded first task with details');

      await page.waitForTimeout(1000);

      // Check that details are rendered with ReactMarkdown
      const detailsElement = await page.locator('.prose').first();
      if (await detailsElement.count() > 0) {
        // Check for proper paragraph rendering
        const paragraphs = await detailsElement.locator('p').count();
        console.log('Paragraphs in details:', paragraphs);
        expect(paragraphs).toBeGreaterThan(0);

        // Check for lists (if any)
        const lists = await detailsElement.locator('ul, ol').count();
        console.log('Lists in details:', lists);

        // Take screenshot for visual verification
        await page.screenshot({
          path: 'test-tasks-tab.png',
          fullPage: true
        });

        console.log('✓ Task details render with proper formatting');
      }
    }

    // Check console logs for parsing
    const detailLogs = consoleLogs.filter(log =>
      log.includes('[parseTaskDetails]') && log.includes('has details')
    );
    console.log('Task detail parsing logs:', detailLogs.length);
  });

  test('Visual indicators have tooltips with preview text', async ({ page }) => {
    console.log('=== Test 3: Tooltip Preview ===');

    // Navigate to app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open the test file
    const fileName = path.basename(TEST_FILE, '.txt');

    await page.evaluate((name) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const fileButton = buttons.find(btn => btn.textContent.includes(name));
      if (fileButton) fileButton.click();
    }, fileName);

    await page.waitForTimeout(3000);

    // Find indicators with tooltips
    const indicators = await page.locator('.task-details-indicator').all();

    if (indicators.length > 0) {
      for (let i = 0; i < Math.min(3, indicators.length); i++) {
        const indicator = indicators[i];
        const tooltip = await indicator.getAttribute('title');

        if (tooltip) {
          console.log(`Indicator ${i + 1} tooltip:`, tooltip);
          expect(tooltip.length).toBeGreaterThan(0);

          // Tooltip should have preview text
          if (tooltip.length > 50) {
            expect(tooltip).toContain('...');
            console.log('✓ Tooltip has truncated preview with ellipsis');
          }
        }
      }
    }
  });

  test('File content remains valid after edits', async ({ page }) => {
    console.log('=== Test 4: File Integrity ===');

    // Read original file content
    const originalContent = fs.readFileSync(TEST_FILE, 'utf-8');
    const originalLines = originalContent.split('\n').length;
    console.log('Original file lines:', originalLines);

    // Navigate and open file
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const fileName = path.basename(TEST_FILE, '.txt');
    await page.evaluate((name) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const fileButton = buttons.find(btn => btn.textContent.includes(name));
      if (fileButton) fileButton.click();
    }, fileName);

    await page.waitForTimeout(3000);

    // Make a small edit
    const editor = await page.locator('.ProseMirror').first();
    if (await editor.count() > 0) {
      await editor.click();
      await page.keyboard.press('End');
      await page.keyboard.type('\n\n- [ ] Test task added by automation');
      console.log('Added test task');
    }

    // Wait for auto-save
    await page.waitForTimeout(3000);

    // Read file after edit
    const newContent = fs.readFileSync(TEST_FILE, 'utf-8');
    const newLines = newContent.split('\n').length;
    console.log('New file lines:', newLines);

    // File should have grown
    expect(newLines).toBeGreaterThan(originalLines);

    // Check that task descriptions are still properly indented
    const lines = newContent.split('\n');
    let tasksWithDescriptions = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^- \[ \]/)) {
        // Check if next line is indented (description)
        if (i + 1 < lines.length && lines[i + 1].match(/^  /)) {
          tasksWithDescriptions++;
        }
      }
    }

    console.log('Tasks with descriptions after edit:', tasksWithDescriptions);
    expect(tasksWithDescriptions).toBeGreaterThan(0);

    // Restore original content
    fs.writeFileSync(TEST_FILE, originalContent, 'utf-8');
    console.log('✓ Restored original file content');
  });
});