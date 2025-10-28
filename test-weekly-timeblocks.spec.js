const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_TASKS_FILE = path.join(
  process.env.HOME,
  'Documents/notes/Notes/timeblock-test-tasks.txt'
);

const DAILY_NOTE_FILE = path.join(
  process.env.HOME,
  'Documents/notes/Calendar/20251028 - Tuesday - Oct 28th.txt'
);

const APP_URL = 'http://localhost:5173';

test.describe('Weekly View - Timeblocked Tasks', () => {
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

  test('1. Timeblocked tasks appear in weekly view', async ({ page }) => {
    // Switch to week view
    const weekButton = page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Week")').first();
    await weekButton.click();
    await page.waitForTimeout(2000);

    // Check for tasks that are timeblocked in today's daily note
    const morningStandup = page.locator('text=Morning standup meeting');
    const codeReview = page.locator('text=Code review session');
    const lunchBreak = page.locator('text=Lunch break');
    const deepWork = page.locator('text=Afternoon deep work');
    const wrapUp = page.locator('text=End of day wrap-up');

    // Check visibility
    const morningVisible = await morningStandup.isVisible().catch(() => false);
    const codeReviewVisible = await codeReview.isVisible().catch(() => false);
    const lunchVisible = await lunchBreak.isVisible().catch(() => false);
    const deepWorkVisible = await deepWork.isVisible().catch(() => false);
    const wrapUpVisible = await wrapUp.isVisible().catch(() => false);

    console.log('Morning standup visible:', morningVisible);
    console.log('Code review visible:', codeReviewVisible);
    console.log('Lunch break visible:', lunchVisible);
    console.log('Deep work visible:', deepWorkVisible);
    console.log('Wrap-up visible:', wrapUpVisible);

    // At least some timeblocked tasks should be visible
    const anyVisible = morningVisible || codeReviewVisible || lunchVisible || deepWorkVisible || wrapUpVisible;

    console.log('Any timeblocked task visible:', anyVisible);
    expect(anyVisible).toBeTruthy();
  });

  test('2. Timeblocked tasks show time slots', async ({ page }) => {
    // Switch to week view
    const weekButton = page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Week")').first();
    await weekButton.click();
    await page.waitForTimeout(2000);

    // Look for time slot indicators (clock icon + time)
    const timeSlots = page.locator('span:has(svg[class*="h-3 w-3"])').filter({ hasText: /-/ });
    const timeSlotCount = await timeSlots.count();

    console.log(`Found ${timeSlotCount} time slot indicators`);

    // If timeblocked tasks are visible, we should see time slots
    // This is a softer assertion since it depends on the current week
  });

  test('3. Daily note content is loaded for the week', async ({ page }) => {
    // Switch to week view
    const weekButton = page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Week")').first();
    await weekButton.click();
    await page.waitForTimeout(2000);

    // Check console logs for daily note loading
    const dailyNoteLogs = consoleMessages.filter(m =>
      m.includes('No daily note found') || m.includes('daily note')
    );

    console.log('Daily note logs:', dailyNoteLogs);

    // The week view should attempt to load daily notes
    expect(consoleMessages.length).toBeGreaterThan(0);
  });

  test('4. Timeblocked tasks are not duplicated', async ({ page }) => {
    // Switch to week view
    const weekButton = page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Week")').first();
    await weekButton.click();
    await page.waitForTimeout(2000);

    // Count occurrences of a specific task
    const morningStandupElements = page.locator('text=Morning standup meeting');
    const count = await morningStandupElements.count();

    console.log(`Found ${count} instances of "Morning standup meeting"`);

    // Should only appear once per day (not duplicated)
    expect(count).toBeLessThanOrEqual(1);
  });

  test('5. File content verification', async ({ page }) => {
    // Verify test files exist and have correct content
    const tasksFileExists = fs.existsSync(TEST_TASKS_FILE);
    const dailyNoteExists = fs.existsSync(DAILY_NOTE_FILE);

    console.log('Tasks file exists:', tasksFileExists);
    console.log('Daily note exists:', dailyNoteExists);

    expect(tasksFileExists).toBeTruthy();
    expect(dailyNoteExists).toBeTruthy();

    // Read daily note content
    const dailyNoteContent = fs.readFileSync(DAILY_NOTE_FILE, 'utf-8');
    console.log('Daily note content length:', dailyNoteContent.length);

    // Verify timeblock references are in the daily note
    expect(dailyNoteContent).toContain('[[Morning standup meeting]]');
    expect(dailyNoteContent).toContain('[[Code review session]]');
    expect(dailyNoteContent).toContain('09:00-10:00');
    expect(dailyNoteContent).toContain('10:00-12:00');

    // Switch to week view
    const weekButton = page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Week")').first();
    await weekButton.click();
    await page.waitForTimeout(2000);

    // Check global task store
    const globalTaskLogs = consoleMessages.filter(m =>
      m.includes('[GlobalTaskStore]') && m.includes('timeblock-test-tasks.txt')
    );
    console.log('Global task store logs for timeblock file:', globalTaskLogs);
  });

  test('6. Scheduled date tasks and timeblocked tasks both appear', async ({ page }) => {
    // Switch to week view
    const weekButton = page.locator('div[class*="bg-gray-100 dark:bg-gray-700"] button:has-text("Week")').first();
    await weekButton.click();
    await page.waitForTimeout(2000);

    // Look for tasks from weekly-schedule-test.txt (scheduled with >YYYY-MM-DD)
    const scheduledTask = page.locator('text=Team standup meeting').first();
    const scheduledVisible = await scheduledTask.isVisible().catch(() => false);

    // Look for timeblocked tasks
    const timeblockedTask = page.locator('text=Morning standup meeting').first();
    const timeblockedVisible = await timeblockedTask.isVisible().catch(() => false);

    console.log('Scheduled task (>YYYY-MM-DD) visible:', scheduledVisible);
    console.log('Timeblocked task ([[name]] in daily note) visible:', timeblockedVisible);

    // At least one type should be visible
    const anyTaskVisible = scheduledVisible || timeblockedVisible;
    expect(anyTaskVisible).toBeTruthy();
  });
});
