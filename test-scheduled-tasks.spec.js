const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Test file paths
const NOTES_DIR = '/Users/robertocallaghan/Documents/notes/Notes';
const CALENDAR_DIR = '/Users/robertocallaghan/Documents/notes/Calendar';
const TEST_NOTE_PATH = path.join(NOTES_DIR, 'test-scheduled-task.txt');
const TEST_CALENDAR_PATH = path.join(CALENDAR_DIR, '20251021.txt');

// App URL
const APP_URL = 'http://localhost:5173';

test.describe('Scheduled Tasks Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Create test note with tasks
    const testNoteContent = `# Test Note

- [ ] Task A - First test task #p1
- [ ] Task B - Second test task #p2
- [ ] Task C - Third test task
`;

    fs.writeFileSync(TEST_NOTE_PATH, testNoteContent, 'utf-8');

    // Create calendar file with scheduled tasks
    const calendarContent = `# Monday, October 21, 2025

## Timeblocking
+ 09:00-10:00 [[Task A - First test task]] #timeblock
+ 14:00-15:00 [[Task B - Second test task]] #timeblock
+ 16:00-17:00 [[Task B - Second test task]] #timeblock

## Tasks

## Notes
`;

    fs.writeFileSync(TEST_CALENDAR_PATH, calendarContent, 'utf-8');

    // Capture console logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Browser Error] ${msg.text()}`);
      }
    });

    // Navigate to app
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(() => {
    // Cleanup test files
    if (fs.existsSync(TEST_NOTE_PATH)) {
      fs.unlinkSync(TEST_NOTE_PATH);
    }
    // Don't delete calendar file - might want to inspect it
  });

  test('1. Scheduled Tasks section appears on calendar files', async ({ page }) => {
    // Open the calendar file
    await page.click('text=Calendar');
    await page.waitForTimeout(1000);

    // Click on the date (20251021)
    await page.click('text=20251021');
    await page.waitForTimeout(2000);

    // Check if ScheduledTasksSection is visible
    const scheduledSection = page.locator('text=Scheduled Tasks for Today');
    await expect(scheduledSection).toBeVisible();

    // Check task count
    const taskCount = page.locator('text=/\\d+ tasks?/');
    await expect(taskCount).toBeVisible();
  });

  test('2. Tasks are grouped by source file', async ({ page }) => {
    // Open calendar file
    await page.click('text=Calendar');
    await page.waitForTimeout(1000);
    await page.click('text=20251021');
    await page.waitForTimeout(2000);

    // Check for "From: test-scheduled-task" header
    const sourceHeader = page.locator('text=/From: test-scheduled-task/');
    await expect(sourceHeader).toBeVisible();
  });

  test('3. Tasks show correct time slots', async ({ page }) => {
    // Open calendar file
    await page.click('text=Calendar');
    await page.waitForTimeout(1000);
    await page.click('text=20251021');
    await page.waitForTimeout(2000);

    // Check Task A shows 09:00-10:00
    const taskA = page.locator('text=Task A - First test task').first();
    await expect(taskA).toBeVisible();

    const taskATime = page.locator('text=09:00-10:00').first();
    await expect(taskATime).toBeVisible();

    // Check Task B shows multiple time slots (14:00-15:00, 16:00-17:00)
    const taskBTime = page.locator('text=14:00-15:00, 16:00-17:00').first();
    await expect(taskBTime).toBeVisible();
  });

  test('4. Daily completion checkbox works independently', async ({ page }) => {
    // Open calendar file
    await page.click('text=Calendar');
    await page.waitForTimeout(1000);
    await page.click('text=20251021');
    await page.waitForTimeout(2000);

    // Find the first task's daily completion checkbox
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(firstCheckbox).not.toBeChecked();

    // Check it
    await firstCheckbox.check();
    await page.waitForTimeout(500);

    // Verify it's checked
    await expect(firstCheckbox).toBeChecked();

    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);

    // Open calendar file again
    await page.click('text=Calendar');
    await page.waitForTimeout(1000);
    await page.click('text=20251021');
    await page.waitForTimeout(2000);

    // Verify checkbox state persisted
    const checkboxAfterReload = page.locator('input[type="checkbox"]').first();
    await expect(checkboxAfterReload).toBeChecked();

    // Now verify the source task is NOT completed
    await page.click('text=Notes');
    await page.waitForTimeout(1000);
    await page.click('text=test-scheduled-task');
    await page.waitForTimeout(2000);

    // The source task should still be unchecked
    const sourceTaskCheckbox = page.locator('[data-noteplan-task="true"]').first();
    const isChecked = await sourceTaskCheckbox.evaluate(el =>
      el.getAttribute('data-checked') === 'true'
    );
    expect(isChecked).toBe(false);
  });

  test('5. Clicking task name opens source file', async ({ page }) => {
    // Open calendar file
    await page.click('text=Calendar');
    await page.waitForTimeout(1000);
    await page.click('text=20251021');
    await page.waitForTimeout(2000);

    // Click on task name
    await page.click('text=Task A - First test task');
    await page.waitForTimeout(2000);

    // Should navigate to source file
    // Check if we're now viewing test-scheduled-task.txt
    const activeFile = page.locator('.sidebar').locator('.bg-blue-50, .bg-blue-900');
    const activeFileText = await activeFile.textContent();
    expect(activeFileText).toContain('test-scheduled-task');
  });

  test('6. Section is collapsible', async ({ page }) => {
    // Open calendar file
    await page.click('text=Calendar');
    await page.waitForTimeout(1000);
    await page.click('text=20251021');
    await page.waitForTimeout(2000);

    // Find the collapse button (ChevronDown icon button)
    const collapseButton = page.locator('text=Scheduled Tasks for Today').locator('..');

    // Task should be visible initially
    const taskA = page.locator('text=Task A - First test task').first();
    await expect(taskA).toBeVisible();

    // Click to collapse
    await collapseButton.click();
    await page.waitForTimeout(300);

    // Task should be hidden
    await expect(taskA).not.toBeVisible();

    // Click to expand
    await collapseButton.click();
    await page.waitForTimeout(300);

    // Task should be visible again
    await expect(taskA).toBeVisible();
  });

  test('7. No section shown for calendar days without scheduled tasks', async ({ page }) => {
    // Create a calendar file without any timeblock references
    const emptyCalendarPath = path.join(CALENDAR_DIR, '20251022.txt');
    const emptyContent = `# Tuesday, October 22, 2025

## Timeblocking

## Tasks

## Notes
`;
    fs.writeFileSync(emptyCalendarPath, emptyContent, 'utf-8');

    // Open this calendar file
    await page.click('text=Calendar');
    await page.waitForTimeout(1000);
    await page.click('text=20251022');
    await page.waitForTimeout(2000);

    // Scheduled Tasks section should NOT appear
    const scheduledSection = page.locator('text=Scheduled Tasks for Today');
    await expect(scheduledSection).not.toBeVisible();

    // Cleanup
    fs.unlinkSync(emptyCalendarPath);
  });

  test('8. Priority badges display correctly', async ({ page }) => {
    // Open calendar file
    await page.click('text=Calendar');
    await page.waitForTimeout(1000);
    await page.click('text=20251021');
    await page.waitForTimeout(2000);

    // Check for P1 badge on Task A
    const p1Badge = page.locator('text=P1').first();
    await expect(p1Badge).toBeVisible();

    // Check for P2 badge on Task B
    const p2Badge = page.locator('text=P2').first();
    await expect(p2Badge).toBeVisible();
  });
});
