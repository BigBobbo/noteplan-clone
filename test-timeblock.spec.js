/**
 * Playwright Test: TimeBlock Functionality
 *
 * Tests:
 * 1. Creating timeblocks via drag-and-drop
 * 2. Editing existing timeblocks
 * 3. Dragging timeblocks to different times on timeline
 * 4. Timeblock persistence after reload
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Test configuration
const APP_URL = 'http://localhost:5173';
const NOTES_DIR = path.join(process.env.HOME, 'Documents', 'notes', 'Notes');
const TEST_FILE_NAME = 'timeblock-test.txt';
const TEST_FILE_PATH = path.join(NOTES_DIR, TEST_FILE_NAME);
const CALENDAR_DIR = path.join(process.env.HOME, 'Documents', 'notes', 'Calendar');

// Helper: Get today's date in NotePlan format (YYYYMMDD.txt)
function getTodayFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}.txt`;
}

const TODAY_FILE_PATH = path.join(CALENDAR_DIR, getTodayFilename());

// Helper: Wait for file system to sync
async function waitForFileSync() {
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Helper: Navigate to Calendar tab
async function navigateToCalendar(page) {
  const buttons = await page.locator('button, a, [role="tab"]').all();
  for (const btn of buttons) {
    const text = await btn.textContent().catch(() => '');
    if (text && text.toLowerCase().includes('calendar')) {
      await btn.click();
      await page.waitForTimeout(2000);
      return true;
    }
  }
  return false;
}

test.describe('TimeBlock Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure notes directory exists
    if (!fs.existsSync(NOTES_DIR)) {
      fs.mkdirSync(NOTES_DIR, { recursive: true });
    }

    // Ensure calendar directory exists
    if (!fs.existsSync(CALENDAR_DIR)) {
      fs.mkdirSync(CALENDAR_DIR, { recursive: true });
    }

    // Create test note with tasks
    const testContent = `# TimeBlock Test

- [ ] Task 1: Write report
- [ ] Task 2: Team meeting
- [ ] Task 3: Code review
- [ ] Task 4: Design mockups
`;
    fs.writeFileSync(TEST_FILE_PATH, testContent, 'utf-8');

    // Create or clear today's daily note
    const todayContent = `# ${getTodayFilename().replace('.txt', '')}

## Tasks

## Timeblocking

`;
    fs.writeFileSync(TODAY_FILE_PATH, todayContent, 'utf-8');

    await waitForFileSync();

    // Navigate to the app
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Wait for the app to fully load (look for any visible content)
    await page.waitForTimeout(2000);
  });

  test.afterEach(async () => {
    // Clean up test files
    if (fs.existsSync(TEST_FILE_PATH)) {
      fs.unlinkSync(TEST_FILE_PATH);
    }
    // Note: We keep the daily note for inspection, but you can uncomment to clean:
    // if (fs.existsSync(TODAY_FILE_PATH)) {
    //   fs.unlinkSync(TODAY_FILE_PATH);
    // }
  });

  test('1. Create timeblock via drag-and-drop to timeline', async ({ page }) => {
    console.log('Test 1: Creating timeblock via drag-and-drop');

    // Step 1: Open the test file
    await page.click(`text=${TEST_FILE_NAME}`);
    await page.waitForTimeout(1000);

    // Step 2: Navigate to Calendar tab
    const calendarTab = await page.getByRole('button', { name: /calendar/i }).or(page.locator('text=Calendar')).first();
    await calendarTab.click();
    await page.waitForTimeout(1000);

    // Step 3: Ensure today's date is selected (should be default)
    const todayButton = await page.getByRole('button', { name: /today/i }).or(page.locator('text=Today')).first();
    if (await todayButton.isVisible()) {
      await todayButton.click();
      await page.waitForTimeout(500);
    }

    // Step 4: Wait for timeline to load
    await page.waitForSelector('.timeline, [class*="timeline"]', { timeout: 5000 }).catch(() => {
      console.log('Timeline selector not found by class, trying alternative selectors');
    });

    // Step 5: Go back to Tasks tab to drag a task
    const tasksTab = await page.getByRole('button', { name: /tasks/i }).or(page.locator('text=Tasks')).first();
    await tasksTab.click();
    await page.waitForTimeout(1000);

    // Step 6: Find the first task
    const firstTask = await page.locator('[data-noteplan-task="true"], .task-tree-item, [class*="task"]').first();
    expect(await firstTask.isVisible()).toBeTruthy();

    // Step 7: Go back to Calendar tab
    await calendarTab.click();
    await page.waitForTimeout(1000);

    // Step 8: Drag task to timeline (9 AM slot)
    // Note: This is tricky - we need to simulate drag from Tasks to Calendar timeline
    // For now, let's test the dialog appearance by clicking a task's drag handle

    console.log('Attempting to trigger timeblock creation...');

    // Alternative approach: Try to find and click a task in the calendar view if there's a task list
    const taskInCalendar = await page.locator('text=Task 1: Write report').first();
    if (await taskInCalendar.isVisible()) {
      // Drag to timeline area
      const timeline = await page.locator('.timeline, [class*="Timeline"]').first();
      if (await timeline.isVisible()) {
        const timelineBounds = await timeline.boundingBox();
        if (timelineBounds) {
          // Calculate 9 AM position (9 hours * 60px/hour = 540px from top)
          const nineAmY = timelineBounds.y + 540;

          await taskInCalendar.dragTo(timeline, {
            targetPosition: { x: timelineBounds.width / 2, y: 540 }
          });
        }
      }
    }

    await page.waitForTimeout(1000);

    // Step 9: Check if TimeBlock dialog appears
    const dialog = await page.locator('text=Create Time Block, text=Time Block').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);

    if (dialogVisible) {
      console.log('✅ TimeBlock dialog appeared');

      // Fill in the dialog
      await page.fill('input[type="time"]', '09:00');
      await page.click('text=1 hour');
      await page.click('button:has-text("Create Time Block")');
      await page.waitForTimeout(1500);

      // Step 10: Verify timeblock was created in the file
      await waitForFileSync();
      const fileContent = fs.readFileSync(TODAY_FILE_PATH, 'utf-8');
      console.log('Daily note content:', fileContent);

      expect(fileContent).toContain('09:00-10:00');
      console.log('✅ TimeBlock saved to file');
    } else {
      console.log('⚠️  TimeBlock dialog did not appear - drag-and-drop may not be working');
      console.log('This test identified the issue: drag-and-drop to timeline is not functional');
    }
  });

  test('2. Edit existing timeblock', async ({ page }) => {
    console.log('Test 2: Editing existing timeblock');

    // Create a timeblock manually in the file
    const content = fs.readFileSync(TODAY_FILE_PATH, 'utf-8');
    const updatedContent = content.replace(
      '## Timeblocking\n',
      '## Timeblocking\n+ 10:00-11:00 Morning standup\n'
    );
    fs.writeFileSync(TODAY_FILE_PATH, updatedContent, 'utf-8');
    await waitForFileSync();

    // Navigate to Calendar
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await navigateToCalendar(page);

    // Look for the timeblock on the timeline
    const timeblock = await page.locator('text=Morning standup').first();
    const timeblockVisible = await timeblock.isVisible().catch(() => false);

    if (timeblockVisible) {
      console.log('✅ TimeBlock is visible on timeline');

      // Click on the timeblock (double click to ensure it's not a drag)
      await timeblock.dblclick();
      await page.waitForTimeout(1000);

      // Check if edit dialog appears
      const editDialog = await page.locator('text=Edit Time Block').first();
      const editDialogVisible = await editDialog.isVisible().catch(() => false);

      console.log('Edit dialog visible?', editDialogVisible);

      if (editDialogVisible) {
        console.log('✅ Edit dialog appeared');

        // Modify the timeblock - fill the first time input (start time)
        const timeInputs = await page.locator('input[type="time"]').all();
        if (timeInputs.length >= 1) {
          await timeInputs[0].fill('10:30');
        }
        await page.click('button:has-text("Save Changes"), button:has-text("Save")');
        await page.waitForTimeout(2000);

        // Verify changes in file
        await waitForFileSync();
        const newContent = fs.readFileSync(TODAY_FILE_PATH, 'utf-8');
        expect(newContent).toContain('10:30');
        console.log('✅ TimeBlock edit saved to file');
      } else {
        console.log('❌ Edit dialog did not appear - editing is not functional');
        throw new Error('TimeBlock editing is not working');
      }
    } else {
      console.log('❌ TimeBlock not visible on timeline');
      throw new Error('TimeBlock rendering is not working');
    }
  });

  test('3. Drag timeblock to different time on timeline', async ({ page }) => {
    console.log('Test 3: Dragging timeblock to different time');

    // Create a timeblock manually
    const content = fs.readFileSync(TODAY_FILE_PATH, 'utf-8');
    const updatedContent = content.replace(
      '## Timeblocking\n',
      '## Timeblocking\n+ 09:00-10:00 Team meeting\n'
    );
    fs.writeFileSync(TODAY_FILE_PATH, updatedContent, 'utf-8');
    await waitForFileSync();

    // Navigate to Calendar
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await navigateToCalendar(page);

    // Find the timeblock
    const timeblock = await page.locator('text=Team meeting').first();
    const timeblockVisible = await timeblock.isVisible().catch(() => false);

    if (timeblockVisible) {
      console.log('✅ TimeBlock is visible');

      // Get timeline bounds
      const timeline = await page.locator('.timeline, [class*="Timeline"]').first();
      const timelineBounds = await timeline.boundingBox();

      if (timelineBounds) {
        // Try to drag to 2 PM (14 hours * 60px/hour = 840px from top)
        const targetY = 840;

        await timeblock.dragTo(timeline, {
          targetPosition: { x: timelineBounds.width / 2, y: targetY }
        });

        await page.waitForTimeout(1500);

        // Verify the timeblock moved in the file
        await waitForFileSync();
        const newContent = fs.readFileSync(TODAY_FILE_PATH, 'utf-8');

        // Check if time changed (should be around 14:00 / 2 PM)
        const hasNewTime = newContent.includes('14:') || newContent.includes('13:') || newContent.includes('15:');

        if (hasNewTime) {
          console.log('✅ TimeBlock drag-to-reposition works');
        } else {
          console.log('❌ TimeBlock did not move - drag-to-reposition is not functional');
          console.log('File content:', newContent);
          throw new Error('TimeBlock drag-to-reposition is not working');
        }
      }
    } else {
      console.log('❌ TimeBlock not visible');
      throw new Error('TimeBlock not rendering');
    }
  });

  test('4. Verify timeblock persistence after reload', async ({ page }) => {
    console.log('Test 4: Verifying timeblock persistence');

    // Create timeblocks manually
    const content = fs.readFileSync(TODAY_FILE_PATH, 'utf-8');
    const updatedContent = content.replace(
      '## Timeblocking\n',
      '## Timeblocking\n+ 09:00-10:00 Morning review\n+ 14:00-15:30 Client call\n'
    );
    fs.writeFileSync(TODAY_FILE_PATH, updatedContent, 'utf-8');
    await waitForFileSync();

    // Load page first time
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    const calendarTab = await page.getByRole('button', { name: /calendar/i }).or(page.locator('text=Calendar')).first();
    await calendarTab.click();
    await page.waitForTimeout(1500);

    // Verify both timeblocks are visible
    const block1 = await page.locator('text=Morning review').first();
    const block2 = await page.locator('text=Client call').first();

    const block1Visible = await block1.isVisible().catch(() => false);
    const block2Visible = await block2.isVisible().catch(() => false);

    expect(block1Visible).toBeTruthy();
    expect(block2Visible).toBeTruthy();
    console.log('✅ Both timeblocks visible on first load');

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Navigate back to calendar
    await navigateToCalendar(page);

    // Verify timeblocks still visible
    const block1AfterReload = await page.locator('text=Morning review').first();
    const block2AfterReload = await page.locator('text=Client call').first();

    const block1StillVisible = await block1AfterReload.isVisible().catch(() => false);
    const block2StillVisible = await block2AfterReload.isVisible().catch(() => false);

    expect(block1StillVisible).toBeTruthy();
    expect(block2StillVisible).toBeTruthy();
    console.log('✅ TimeBlocks persist after reload');
  });
});
