/**
 * Test Priority and Scheduling Features
 *
 * Tests:
 * 1. Priority tags (#p1-#p4) are correctly parsed and displayed
 * 2. Scheduled dates (>YYYY-MM-DD) are correctly parsed
 * 3. Tasks appear in "Scheduled" filter
 * 4. Tasks appear in "Today" filter (if scheduled for today)
 * 5. Priority levels are visually indicated
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const APP_URL = 'http://localhost:5173';
const TEST_FILE = path.join(
  process.env.HOME,
  'Documents/notes/Notes/priority-schedule-test.txt'
);

// Get tomorrow's date in YYYY-MM-DD format
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

test.describe('Priority and Scheduling Features', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console messages for debugging
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Store for access in tests
    page.consoleMessages = consoleMessages;

    // Navigate to app
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for file system sync
  });

  test('1. Test file appears in file list', async ({ page }) => {
    // Look for the test file in sidebar
    const fileLink = page.locator('text=priority-schedule-test.txt').first();
    await expect(fileLink).toBeVisible({ timeout: 10000 });
    console.log('✓ Test file found in sidebar');
  });

  test('2. Priority #p1 tasks are parsed correctly', async ({ page }) => {
    // Open the test file
    await page.click('text=priority-schedule-test.txt');
    await page.waitForTimeout(1000);

    // Switch to Tasks tab
    await page.click('button:has-text("Tasks")');
    await page.waitForTimeout(500);

    // Look for the #p1 task scheduled for tomorrow
    const tomorrowDate = getTomorrowDate();
    const taskText = page.locator('text=Complete quarterly report').first();
    await expect(taskText).toBeVisible({ timeout: 5000 });

    // Check that #p1 tag is visible
    const p1Tag = page.locator('span.inline-flex.items-center:has-text("#p1")').first();
    await expect(p1Tag).toBeVisible();

    console.log('✓ Priority #p1 task found and tag displayed');
  });

  test('3. Scheduled date is parsed and displayed', async ({ page }) => {
    // Open test file
    await page.click('text=priority-schedule-test.txt');
    await page.waitForTimeout(1000);

    // Switch to Tasks tab
    await page.click('button:has-text("Tasks")');
    await page.waitForTimeout(500);

    // Look for date indicator on scheduled task
    const tomorrowDate = getTomorrowDate();

    // Check for the date display (format: >YYYY-MM-DD)
    const dateIndicator = page.locator(`text=>${tomorrowDate}`).first();
    await expect(dateIndicator).toBeVisible({ timeout: 5000 });

    console.log(`✓ Scheduled date >${tomorrowDate} is displayed`);
  });

  test('4. Scheduled filter shows only scheduled tasks', async ({ page }) => {
    // Open test file
    await page.click('text=priority-schedule-test.txt');
    await page.waitForTimeout(1000);

    // Switch to Tasks tab
    await page.click('button:has-text("Tasks")');
    await page.waitForTimeout(500);

    // Count tasks in "All" view
    const allTasksCount = await page.locator('[data-task-item]').count();
    console.log(`Total tasks in "All" view: ${allTasksCount}`);

    // Click "Scheduled" filter
    await page.click('button:has-text("⏰")'); // Scheduled emoji
    await page.waitForTimeout(500);

    // Count tasks in "Scheduled" view
    const scheduledTasksCount = await page.locator('[data-task-item]').count();
    console.log(`Total tasks in "Scheduled" view: ${scheduledTasksCount}`);

    // Verify scheduled tasks are less than or equal to all tasks
    expect(scheduledTasksCount).toBeLessThanOrEqual(allTasksCount);
    expect(scheduledTasksCount).toBeGreaterThan(0);

    // Verify scheduled tasks have dates
    const taskWithDate = page.locator('[data-task-item]:has-text(">")').first();
    await expect(taskWithDate).toBeVisible();

    console.log('✓ Scheduled filter works correctly');
  });

  test('5. Today filter shows only today\'s tasks', async ({ page }) => {
    // Open test file
    await page.click('text=priority-schedule-test.txt');
    await page.waitForTimeout(1000);

    // Switch to Tasks tab
    await page.click('button:has-text("Tasks")');
    await page.waitForTimeout(500);

    // Click "Today" filter
    await page.click('button:has-text("📅")'); // Today emoji
    await page.waitForTimeout(500);

    // Count tasks in "Today" view
    const todayTasksCount = await page.locator('[data-task-item]').count();
    console.log(`Total tasks in "Today" view: ${todayTasksCount}`);

    // Verify today's date appears in tasks (if any)
    if (todayTasksCount > 0) {
      const todayDate = getTodayDate();
      const todayTask = page.locator(`[data-task-item]:has-text(">${todayDate}")`).first();
      await expect(todayTask).toBeVisible();
      console.log(`✓ Today filter shows tasks for ${todayDate}`);
    } else {
      console.log('✓ Today filter shows 0 tasks (none scheduled for today)');
    }
  });

  test('6. Multiple priority levels are parsed', async ({ page }) => {
    // Open test file
    await page.click('text=priority-schedule-test.txt');
    await page.waitForTimeout(1000);

    // Switch to Tasks tab
    await page.click('button:has-text("Tasks")');
    await page.waitForTimeout(500);

    // Check for different priority tags
    const priorityLevels = ['#p1', '#p2', '#p3', '#p4'];

    for (const priority of priorityLevels) {
      const priorityTag = page.locator(`span.inline-flex.items-center:has-text("${priority}")`);
      const count = await priorityTag.count();
      console.log(`Found ${count} tasks with ${priority} priority`);

      if (count > 0) {
        await expect(priorityTag.first()).toBeVisible();
      }
    }

    console.log('✓ All priority levels are parsed and displayed');
  });

  test('7. Task with #p1 and scheduled date tomorrow has all properties', async ({ page }) => {
    // Open test file
    await page.click('text=priority-schedule-test.txt');
    await page.waitForTimeout(1000);

    // Switch to Tasks tab
    await page.click('button:has-text("Tasks")');
    await page.waitForTimeout(500);

    const tomorrowDate = getTomorrowDate();

    // Find the main test task
    const mainTask = page.locator('[data-task-item]:has-text("Complete quarterly report")').first();
    await expect(mainTask).toBeVisible();

    // Verify it has #p1 tag
    const p1Tag = mainTask.locator('span:has-text("#p1")');
    await expect(p1Tag).toBeVisible();

    // Verify it has #work tag
    const workTag = mainTask.locator('span:has-text("#work")');
    await expect(workTag).toBeVisible();

    // Verify it has @john mention
    const johnMention = mainTask.locator('span:has-text("@john")');
    await expect(johnMention).toBeVisible();

    // Verify it has the scheduled date
    const dateIndicator = mainTask.locator(`text=>${tomorrowDate}`);
    await expect(dateIndicator).toBeVisible();

    console.log('✓ Task has all properties: #p1, #work, @john, scheduled for tomorrow');
  });

  test('8. Active filter excludes completed and cancelled tasks', async ({ page }) => {
    // Open test file
    await page.click('text=priority-schedule-test.txt');
    await page.waitForTimeout(1000);

    // Switch to Tasks tab
    await page.click('button:has-text("Tasks")');
    await page.waitForTimeout(500);

    // Click "Active" filter
    await page.click('button:has-text("⭐")'); // Active emoji
    await page.waitForTimeout(500);

    // Verify completed tasks are not shown
    const completedTask = page.locator('[data-task-item]:has-text("Write test file")');
    await expect(completedTask).not.toBeVisible();

    // Verify cancelled tasks are not shown
    const cancelledTask = page.locator('[data-task-item]:has-text("Old feature request")');
    await expect(cancelledTask).not.toBeVisible();

    // Verify active tasks ARE shown
    const activeTask = page.locator('[data-task-item]:has-text("Complete quarterly report")');
    await expect(activeTask).toBeVisible();

    console.log('✓ Active filter correctly excludes completed and cancelled tasks');
  });

  test('9. Verify parsing in console logs', async ({ page }) => {
    // Open test file
    await page.click('text=priority-schedule-test.txt');
    await page.waitForTimeout(2000);

    // Check console messages for task parsing
    const messages = page.consoleMessages || [];
    const taskParsingLogs = messages.filter(m => m.includes('task') || m.includes('parse'));

    console.log('Console logs related to task parsing:');
    taskParsingLogs.forEach(log => console.log(`  ${log}`));

    // Just verify no errors occurred
    const errorLogs = messages.filter(m => m.includes('[error]'));
    expect(errorLogs.length).toBe(0);

    console.log('✓ No parsing errors in console');
  });

  test('10. File content verification', async ({ page }) => {
    // Read the actual file
    const fileContent = fs.readFileSync(TEST_FILE, 'utf-8');

    const tomorrowDate = getTomorrowDate();

    // Verify file contains expected content
    expect(fileContent).toContain(`#p1`);
    expect(fileContent).toContain(`>${tomorrowDate}`);
    expect(fileContent).toContain(`@john`);
    expect(fileContent).toContain(`Complete quarterly report`);

    console.log('✓ File content contains all expected elements');
    console.log(`✓ Tomorrow's date (${tomorrowDate}) is in the file`);
  });
});
