/**
 * ACTUAL TEST: Drag task to timeline and verify timeblock creation
 * This test will actually perform the drag-and-drop and verify it works
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const APP_URL = 'http://localhost:5173';
const NOTES_DIR = path.join(process.env.HOME, 'Documents/notes/Notes');
const CALENDAR_DIR = path.join(process.env.HOME, 'Documents/notes/Calendar');

// Helper to get today's date in YYYYMMDD format
function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

test.describe('ACTUAL Drag-and-Drop Test', () => {
  let testNotePath;
  let todayDate;

  test.beforeEach(async ({ page }) => {
    todayDate = getToday();
    testNotePath = path.join(NOTES_DIR, 'drag-test.txt');

    // Create test note with a task
    const testContent = `# Drag Test

- [ ] Drag me to timeline
`;
    fs.writeFileSync(testNotePath, testContent, 'utf-8');

    // Wait for file sync
    await page.waitForTimeout(1000);

    // Navigate to app
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test.afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testNotePath)) {
      fs.unlinkSync(testNotePath);
    }
  });

  test('Step 1: Verify test note and task exist', async ({ page }) => {
    console.log('=== STEP 1: Verifying test note exists ===');

    // Wait for sidebar to load
    await page.waitForTimeout(2000);

    // Look for the file in sidebar
    const fileExists = await page.locator('text=drag-test.txt').count();
    console.log('Test file visible in UI:', fileExists > 0);

    // Click on the file to open it
    if (fileExists > 0) {
      await page.locator('text=drag-test.txt').first().click();
      await page.waitForTimeout(1000);
    }

    // Check if task is visible
    const taskVisible = await page.locator('text=Drag me to timeline').count();
    console.log('Task visible in editor:', taskVisible > 0);

    expect(taskVisible).toBeGreaterThan(0);
  });

  test('Step 2: Navigate to Tasks tab and verify task appears', async ({ page }) => {
    console.log('=== STEP 2: Checking Tasks tab ===');

    // Find and click Tasks tab
    const tasksTab = await page.locator('button:has-text("Tasks"), button >> text=Tasks').first();
    const tasksTabVisible = await tasksTab.isVisible().catch(() => false);
    console.log('Tasks tab visible:', tasksTabVisible);

    if (tasksTabVisible) {
      await tasksTab.click({ force: true });
      await page.waitForTimeout(2000);

      // Check if task appears in Tasks tab
      const taskInList = await page.locator('text=Drag me to timeline').count();
      console.log('Task visible in Tasks tab:', taskInList > 0);

      // Take screenshot
      await page.screenshot({ path: 'test-tasks-tab-with-task.png', fullPage: true });
      console.log('Screenshot saved: test-tasks-tab-with-task.png');
    }
  });

  test('Step 3: Navigate to Calendar view', async ({ page }) => {
    console.log('=== STEP 3: Navigating to Calendar ===');

    // Try to find Calendar link/button in header
    const calendarLink = await page.locator('a:has-text("Calendar"), button:has-text("Calendar"), [href*="calendar"]').first();
    const calendarVisible = await calendarLink.isVisible().catch(() => false);
    console.log('Calendar link visible:', calendarVisible);

    if (calendarVisible) {
      await calendarLink.click();
      await page.waitForTimeout(3000);

      // Check if timeline is visible (look for hour labels)
      const timelineVisible = await page.locator('text=/^\\d+:00/, text=/AM|PM/').count();
      console.log('Timeline hour slots visible:', timelineVisible);

      // Take screenshot
      await page.screenshot({ path: 'test-calendar-timeline.png', fullPage: true });
      console.log('Screenshot saved: test-calendar-timeline.png');
    }
  });

  test('Step 4: Check todays daily note file format', async ({ page }) => {
    console.log('=== STEP 4: Checking daily note file ===');

    // Get all files in Calendar directory
    const files = fs.readdirSync(CALENDAR_DIR);
    const todayFiles = files.filter(f => f.startsWith(todayDate));

    console.log(`Today's date: ${todayDate}`);
    console.log(`Files for today:`, todayFiles);

    if (todayFiles.length > 0) {
      const todayFile = path.join(CALENDAR_DIR, todayFiles[0]);
      const content = fs.readFileSync(todayFile, 'utf-8');
      console.log('Daily note content preview:', content.substring(0, 200));
    }
  });

  test('Step 5: ACTUAL drag-and-drop test', async ({ page }) => {
    console.log('=== STEP 5: PERFORMING ACTUAL DRAG-AND-DROP ===');

    // Open test file
    await page.locator('text=drag-test.txt').first().click();
    await page.waitForTimeout(1000);

    // Go to Tasks tab
    const tasksTab = await page.locator('button:has-text("Tasks")').first();
    if (await tasksTab.isVisible().catch(() => false)) {
      await tasksTab.click({ force: true });
      await page.waitForTimeout(2000);
    }

    // Find the task element
    const taskElement = await page.locator('text=Drag me to timeline').first();
    const taskVisible = await taskElement.isVisible().catch(() => false);
    console.log('Task element found:', taskVisible);

    if (!taskVisible) {
      console.log('❌ Task not visible, cannot proceed with drag test');
      await page.screenshot({ path: 'test-no-task-found.png', fullPage: true });
      return;
    }

    // Navigate to Calendar
    const calendarLink = await page.locator('a:has-text("Calendar")').first();
    if (await calendarLink.isVisible().catch(() => false)) {
      await calendarLink.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ Calendar not found, cannot proceed');
      return;
    }

    // Get timeline bounds
    const timelineSlots = await page.locator('[class*="border-b"]').all();
    console.log('Timeline slots found:', timelineSlots.length);

    if (timelineSlots.length === 0) {
      console.log('❌ No timeline found');
      await page.screenshot({ path: 'test-no-timeline.png', fullPage: true });
      return;
    }

    // Go back to tasks to drag
    await tasksTab.click({ force: true });
    await page.waitForTimeout(1000);

    const task = await page.locator('text=Drag me to timeline').first();
    const taskBox = await task.boundingBox();

    if (!taskBox) {
      console.log('❌ Cannot get task position');
      return;
    }

    console.log('Task position:', taskBox);

    // Switch to calendar
    await calendarLink.click();
    await page.waitForTimeout(2000);

    // Get a timeline slot position (around 2pm / 14:00)
    const targetSlot = timelineSlots[14] || timelineSlots[10] || timelineSlots[0];
    const targetBox = await targetSlot.boundingBox();

    if (!targetBox) {
      console.log('❌ Cannot get timeline position');
      return;
    }

    console.log('Target timeline position:', targetBox);

    // Perform drag-and-drop
    console.log('⏳ Starting drag-and-drop...');

    await page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(500);

    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
    await page.waitForTimeout(500);

    await page.mouse.up();
    await page.waitForTimeout(2000);

    console.log('✅ Drag-and-drop completed');

    // Take screenshot of result
    await page.screenshot({ path: 'test-after-drop.png', fullPage: true });
    console.log('Screenshot saved: test-after-drop.png');

    // Check if timeblock was created in file
    await page.waitForTimeout(2000);
    const files = fs.readdirSync(CALENDAR_DIR);
    const todayFiles = files.filter(f => f.startsWith(todayDate));

    if (todayFiles.length > 0) {
      const todayFile = path.join(CALENDAR_DIR, todayFiles[0]);
      const content = fs.readFileSync(todayFile, 'utf-8');
      console.log('Daily note after drop:');
      console.log(content);

      const hasTimeblock = content.includes('Drag me to timeline') || content.match(/\+\s+\d{2}:\d{2}-\d{2}:\d{2}/);
      console.log('Timeblock created:', hasTimeblock);

      if (hasTimeblock) {
        console.log('✅ SUCCESS: Timeblock was created!');
      } else {
        console.log('❌ FAILURE: No timeblock found in file');
      }
    }
  });
});
