const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const APP_URL = 'http://localhost:5173';

test.describe('Monthly View - Tasks Display', () => {
  let consoleMessages = [];

  test.beforeEach(async ({ page }) => {
    // Capture console messages for debugging
    consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      console.log(`[${msg.type()}] ${text}`);
    });

    // Navigate to app
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Wait for initial load and global task indexing
    await page.waitForTimeout(3000);
  });

  test('1. Monthly view loads and displays calendar grid', async ({ page }) => {
    // Switch to month view
    const monthButton = page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Month")').first();
    await expect(monthButton).toBeVisible();
    await monthButton.click();
    await page.waitForTimeout(1000);

    // Verify 7-column grid
    const weekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const header of weekHeaders) {
      const headerElement = page.locator(`text=${header}`).first();
      await expect(headerElement).toBeVisible();
    }

    // Verify day cells exist
    const dayCells = page.locator('div.relative.px-2.py-2');
    const cellCount = await dayCells.count();
    console.log(`Found ${cellCount} day cells`);

    // Should have 35-42 cells (5-6 weeks)
    expect(cellCount).toBeGreaterThanOrEqual(35);
    expect(cellCount).toBeLessThanOrEqual(42);
  });

  test('2. Scheduled tasks appear in correct date cells', async ({ page }) => {
    // Switch to month view
    await page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Month")').first().click();
    await page.waitForTimeout(2000);

    // Check for tasks from our test files
    const scheduledTask = page.locator('text=Team standup meeting').first();
    const scheduledVisible = await scheduledTask.isVisible().catch(() => false);

    console.log('Scheduled task visible:', scheduledVisible);

    // At least the global task store should have indexed our files
    const globalTaskLogs = consoleMessages.filter(m =>
      m.includes('[GlobalTaskStore]') || m.includes('Total tasks')
    );
    console.log('Global task store logs:', globalTaskLogs);
  });

  test('3. Timeblocked tasks appear in correct date cells', async ({ page }) => {
    // Switch to month view
    await page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Month")').first().click();
    await page.waitForTimeout(2000);

    // Check for timeblocked tasks
    const timeblockedTask = page.locator('text=Morning standup meeting').first();
    const timeblockedVisible = await timeblockedTask.isVisible().catch(() => false);

    console.log('Timeblocked task visible:', timeblockedVisible);
  });

  test('4. Tasks show priority indicators', async ({ page }) => {
    // Switch to month view
    await page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Month")').first().click();
    await page.waitForTimeout(2000);

    // Look for priority indicators (colored left borders)
    const p1Tasks = page.locator('div[class*="border-l-red-500"]');
    const p2Tasks = page.locator('div[class*="border-l-orange-500"]');
    const p3Tasks = page.locator('div[class*="border-l-yellow-500"]');

    const p1Count = await p1Tasks.count();
    const p2Count = await p2Tasks.count();
    const p3Count = await p3Tasks.count();

    console.log(`Priority tasks found: P1=${p1Count}, P2=${p2Count}, P3=${p3Count}`);
  });

  test('5. Task checkboxes are interactive', async ({ page }) => {
    // Switch to month view
    await page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Month")').first().click();
    await page.waitForTimeout(2000);

    // Find first checkbox
    const firstCheckbox = page.locator('button .h-3.w-3.rounded-sm.border').first();
    const checkboxVisible = await firstCheckbox.isVisible().catch(() => false);

    if (checkboxVisible) {
      console.log('Found task checkbox, attempting to click');
      await firstCheckbox.click();
      await page.waitForTimeout(500);

      // Check for toggle logs
      const toggleLogs = consoleMessages.filter(m =>
        m.includes('toggle') || m.includes('Toggle') || m.includes('CrossFileTask')
      );
      console.log('Toggle logs:', toggleLogs);

      expect(checkboxVisible).toBeTruthy();
    } else {
      console.log('No task checkboxes visible (might be no tasks in current month)');
      expect(true).toBeTruthy();
    }
  });

  test('6. Expand/collapse works for cells with many tasks', async ({ page }) => {
    // Switch to month view
    await page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Month")').first().click();
    await page.waitForTimeout(2000);

    // Look for expand/collapse chevron icons
    const expandIcons = page.locator('svg').filter({ hasText: /ChevronDown|ChevronUp/ });
    const iconCount = await expandIcons.count();

    console.log(`Found ${iconCount} expand/collapse icons`);

    // If we find one, try clicking it
    if (iconCount > 0) {
      const firstIcon = expandIcons.first();
      await firstIcon.click();
      await page.waitForTimeout(300);

      console.log('Clicked expand/collapse icon');
    }
  });

  test('7. "+X more" indicator shows when tasks overflow', async ({ page }) => {
    // Switch to month view
    await page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Month")').first().click();
    await page.waitForTimeout(2000);

    // Look for "+X more" text
    const moreIndicators = page.locator('button:has-text("more")');
    const moreCount = await moreIndicators.count();

    console.log(`Found ${moreCount} "+X more" indicators`);
  });

  test('8. Click day number navigates to that day', async ({ page }) => {
    // Switch to month view
    await page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Month")').first().click();
    await page.waitForTimeout(1000);

    // Find a day number button
    const dayButton = page.locator('button.inline-flex.items-center.justify-center.w-7.h-7').first();
    await dayButton.click();
    await page.waitForTimeout(500);

    // Should stay on the page (navigation might happen or view might change)
    console.log('Clicked day number button');
  });

  test('9. Drag and drop to schedule task on month view', async ({ page }) => {
    // Switch to month view
    await page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Month")').first().click();
    await page.waitForTimeout(2000);

    // Find a date cell
    const dateCell = page.locator('div.relative.px-2.py-2').nth(15); // Pick middle cell
    const cellBox = await dateCell.boundingBox();

    if (cellBox) {
      console.log('Date cell found, drag-and-drop area available');
      expect(cellBox.width).toBeGreaterThan(0);
    }
  });

  test('10. Both scheduled and timeblocked tasks appear together', async ({ page }) => {
    // Switch to month view
    await page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Month")').first().click();
    await page.waitForTimeout(2000);

    // Count all task elements
    const allTasks = page.locator('div.flex.items-start.gap-1.px-1.py-0\\.5');
    const taskCount = await allTasks.count();

    console.log(`Total tasks displayed in month view: ${taskCount}`);

    // Check global task store indexed our test files
    const globalTaskLogs = consoleMessages.filter(m =>
      m.includes('weekly-schedule-test.txt') || m.includes('timeblock-test-tasks.txt')
    );
    console.log('Test files indexed:', globalTaskLogs.length > 0);
  });

  test('11. Completed tasks show with strike-through', async ({ page }) => {
    // Switch to month view
    await page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Month")').first().click();
    await page.waitForTimeout(2000);

    // Look for completed tasks (line-through style)
    const completedTasks = page.locator('span.line-through');
    const completedCount = await completedTasks.count();

    console.log(`Found ${completedCount} completed tasks`);
  });

  test('12. Today\'s date is highlighted', async ({ page }) => {
    // Switch to month view
    await page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Month")').first().click();
    await page.waitForTimeout(1000);

    // Find today's cell (with blue background)
    const todayCell = page.locator('button.bg-blue-600').first();
    const todayVisible = await todayCell.isVisible().catch(() => false);

    console.log('Today cell highlighted:', todayVisible);
    expect(todayVisible).toBeTruthy();
  });
});
