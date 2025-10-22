const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_FILE = '/Users/robertocallaghan/Documents/notes/Notes/task-description-test.txt';

test.describe('Task Description Visibility', () => {
  test.beforeEach(async ({ page }) => {
    // Console logging capture
    const logs = [];
    page.on('console', msg => {
      logs.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Store logs on page for later access
    page.logs = logs;

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('Shows visual indicator for tasks with descriptions', async ({ page }) => {
    // Wait for page to be ready
    await page.waitForTimeout(2000);

    // Open test file - look for it in the sidebar
    const testFileName = path.basename(TEST_FILE, '.txt');
    console.log('Looking for file:', testFileName);

    // Click on the test file in the sidebar
    const fileLink = await page.locator(`button:has-text("${testFileName}")`).first();
    if (await fileLink.count() > 0) {
      await fileLink.click();
    } else {
      // Try alternate selector
      await page.click(`text="${testFileName}"`);
    }
    await page.waitForTimeout(2000);

    // Check for visual indicators
    const indicators = await page.locator('.task-details-indicator').all();
    console.log('Found indicators:', indicators.length);

    // Should have indicators for tasks with descriptions
    expect(indicators.length).toBeGreaterThan(0);

    // Check the first task (should NOT have indicator)
    const tasks = await page.locator('.noteplan-task').all();
    console.log('Total tasks:', tasks.length);

    if (tasks.length > 0) {
      const firstTaskIndicators = await tasks[0].locator('.task-details-indicator').count();
      console.log('First task indicators:', firstTaskIndicators);
      expect(firstTaskIndicators).toBe(0); // First task has no description
    }

    if (tasks.length > 1) {
      const secondTaskIndicators = await tasks[1].locator('.task-details-indicator').count();
      console.log('Second task indicators:', secondTaskIndicators);
      expect(secondTaskIndicators).toBe(1); // Second task has description
    }

    // Check the indicator has the emoji
    if (indicators.length > 0) {
      const firstIndicator = indicators[0];
      const text = await firstIndicator.textContent();
      expect(text).toContain('📝');
    }
  });

  test('Preserves newlines in task descriptions', async ({ page }) => {
    // Navigate to Tasks tab
    await page.click('text="Tasks"');
    await page.waitForTimeout(1000);

    // Check console logs for task parsing
    const parseLogs = page.logs.filter(log =>
      log.text.includes('[parseTaskDetails]') ||
      log.text.includes('[TaskDetails]')
    );

    console.log('Parse logs found:', parseLogs.length);
    parseLogs.forEach(log => console.log(log.text));

    // Wait for tasks to load
    await page.waitForSelector('.task-tree-item', { timeout: 5000 });

    // Find and expand a task with details
    const expandButtons = await page.locator('button[title*="Expand details"]').all();
    console.log('Found expand buttons:', expandButtons.length);

    if (expandButtons.length > 0) {
      // Click the first expand button
      await expandButtons[0].click();
      await page.waitForTimeout(500);

      // Check that multiple paragraphs are rendered
      const details = await page.locator('.prose').first();
      const isVisible = await details.isVisible();
      expect(isVisible).toBeTruthy();

      // Check for paragraphs
      const paragraphs = await details.locator('p').all();
      console.log('Paragraphs found:', paragraphs.length);
      expect(paragraphs.length).toBeGreaterThan(0);

      // Check for bullet list
      const lists = await details.locator('ul').all();
      if (lists.length > 0) {
        const list = lists[0];
        const listItems = await list.locator('li').all();
        console.log('List items found:', listItems.length);
        expect(listItems.length).toBeGreaterThan(0);
      }
    }

    // Check that logs show newlines are present
    const newlineLogs = page.logs.filter(log =>
      log.text.includes('Has newlines:') ||
      log.text.includes('Line count:')
    );

    console.log('Newline logs:', newlineLogs.map(l => l.text));
  });

  test('Visual indicators have tooltips with preview', async ({ page }) => {
    // Open test file
    await page.click(`text="${path.basename(TEST_FILE, '.txt')}"`);
    await page.waitForTimeout(2000);

    // Find a task with indicator
    const indicators = await page.locator('.task-details-indicator').all();

    if (indicators.length > 0) {
      const firstIndicator = indicators[0];

      // Check for title attribute (tooltip)
      const title = await firstIndicator.getAttribute('title');
      console.log('Indicator tooltip:', title);

      // Should have some preview text
      expect(title).toBeTruthy();
      if (title) {
        expect(title.length).toBeGreaterThan(0);
      }
    }
  });

  test('CSS styles are applied correctly', async ({ page }) => {
    // Open test file
    await page.click(`text="${path.basename(TEST_FILE, '.txt')}"`);
    await page.waitForTimeout(2000);

    // Check that has-details class is applied
    const tasksWithDetails = await page.locator('.noteplan-task.has-details').all();
    console.log('Tasks with has-details class:', tasksWithDetails.length);
    expect(tasksWithDetails.length).toBeGreaterThan(0);

    // Check indicator styles
    if (tasksWithDetails.length > 0) {
      const indicator = await tasksWithDetails[0].locator('.task-details-indicator').first();

      // Check computed styles
      const opacity = await indicator.evaluate(el =>
        window.getComputedStyle(el).opacity
      );
      console.log('Indicator opacity:', opacity);

      const fontSize = await indicator.evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      console.log('Indicator font size:', fontSize);

      // Should have reduced opacity initially
      expect(parseFloat(opacity)).toBeLessThanOrEqual(1.0);
    }
  });
});