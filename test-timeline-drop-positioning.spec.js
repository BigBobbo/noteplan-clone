/**
 * Test Suite: Timeline Smart Drop Positioning
 * Tests the new feature where tasks and timeblocks can be dropped at specific times
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const APP_URL = 'http://localhost:5173';
const CALENDAR_DIR = path.join(process.env.HOME, 'Documents', 'notes', 'Calendar');
const NOTES_DIR = path.join(process.env.HOME, 'Documents', 'notes', 'Notes');

function getTodayFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}.txt`;
}

const TODAY_FILE = path.join(CALENDAR_DIR, getTodayFilename());
const TASK_FILE = path.join(NOTES_DIR, 'test-tasks.txt');

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

async function navigateToTasks(page) {
  const buttons = await page.locator('button, a, [role="tab"]').all();
  for (const btn of buttons) {
    const text = await btn.textContent().catch(() => '');
    if (text && text.toLowerCase() === 'tasks') {
      await btn.click();
      await page.waitForTimeout(2000);
      return true;
    }
  }
  return false;
}

test.describe('Timeline Smart Drop Positioning', () => {
  test.beforeEach(async () => {
    // Ensure directories exist
    if (!fs.existsSync(CALENDAR_DIR)) {
      fs.mkdirSync(CALENDAR_DIR, { recursive: true });
    }
    if (!fs.existsSync(NOTES_DIR)) {
      fs.mkdirSync(NOTES_DIR, { recursive: true });
    }
  });

  test('Drop task at specific time creates timeblock at that time', async ({ page }) => {
    console.log('Test: Drop task at specific time');

    // Setup files
    const calendarContent = `# ${getTodayFilename().replace('.txt', '')}

## Tasks

## Timeblocking

## Notes
`;
    const taskContent = `# Test Tasks
- [ ] Test task for timeline drop
- [ ] Another task
`;

    fs.writeFileSync(TODAY_FILE, calendarContent, 'utf-8');
    fs.writeFileSync(TASK_FILE, taskContent, 'utf-8');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Capture console messages
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('[Task Drop') || text.includes('TimeBlock created')) {
        console.log('BROWSER:', text);
      }
    });

    // Navigate to app
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to tasks tab first
    await navigateToTasks(page);

    // Find the task
    const task = await page.locator('text=Test task for timeline drop').first();
    const taskVisible = await task.isVisible().catch(() => false);

    if (!taskVisible) {
      throw new Error('Task not visible in Tasks tab');
    }

    // Navigate to calendar
    await navigateToCalendar(page);

    // Get timeline element
    const timeline = await page.locator('div').filter({
      has: page.locator('text=/AM|PM/')
    }).first();

    const timelineBox = await timeline.boundingBox();
    if (!timelineBox) {
      throw new Error('Timeline not found');
    }

    // Navigate back to tasks to get the task
    await navigateToTasks(page);

    // Calculate position for 11:00 AM (11 hours * 60 pixels per hour)
    const targetY = timelineBox.top + (11 * 60);

    // Drag task from Tasks tab to Calendar timeline
    await task.hover();
    await page.mouse.down();
    await page.waitForTimeout(100);

    // Switch to calendar while dragging
    await navigateToCalendar(page);
    await page.waitForTimeout(500);

    // Move to the 11:00 position on timeline
    await page.mouse.move(timelineBox.left + 100, targetY, { steps: 10 });
    await page.waitForTimeout(100);
    await page.mouse.up();

    console.log('Drag completed, waiting for save...');
    await page.waitForTimeout(3000);

    // Check file content
    const updatedContent = fs.readFileSync(TODAY_FILE, 'utf-8');
    console.log('Updated calendar content:', updatedContent);

    // Check console logs for confirmation
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('Task Drop') ||
      log.includes('TimeBlock created') ||
      log.includes('calculatedTime')
    );
    console.log('Relevant logs:', relevantLogs);

    // Verify timeblock was created at around 11:00
    const has11Hour = updatedContent.includes('11:00-12:00') ||
                      updatedContent.includes('11:15-12:15') ||
                      updatedContent.includes('10:45-11:45');

    if (has11Hour) {
      console.log('✅ Timeblock created at correct time!');
    } else {
      console.log('❌ Timeblock not created at expected time');
      const timeblockMatches = updatedContent.match(/\d{2}:\d{2}-\d{2}:\d{2}/g);
      console.log('Found timeblocks:', timeblockMatches);
      throw new Error('Timeblock not created at drop position');
    }

    expect(has11Hour).toBeTruthy();
  });

  test('Drag existing timeblock to new position updates time', async ({ page }) => {
    console.log('Test: Drag timeblock to new position');

    // Setup with existing timeblock at 09:00
    const content = `# ${getTodayFilename().replace('.txt', '')}

## Tasks

## Timeblocking
+ 09:00-10:00 Morning meeting

## Notes
`;
    fs.writeFileSync(TODAY_FILE, content, 'utf-8');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Capture console messages
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('TimeBlock Reposition') || text.includes('Timeblock updated')) {
        console.log('BROWSER:', text);
      }
    });

    // Navigate to calendar
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await navigateToCalendar(page);

    // Find the timeblock
    const timeblock = await page.locator('text=Morning meeting').first();
    const isVisible = await timeblock.isVisible().catch(() => false);

    if (!isVisible) {
      throw new Error('Timeblock not visible');
    }

    console.log('✅ Timeblock is visible');

    // Get timeline bounds
    const timeline = await page.locator('div').filter({
      has: page.locator('text=/AM|PM/')
    }).first();
    const timelineBox = await timeline.boundingBox();
    const blockBox = await timeblock.boundingBox();

    if (!timelineBox || !blockBox) {
      throw new Error('Could not get element bounds');
    }

    // Drag to 14:00 (2 PM) - 14 hours * 60 pixels per hour
    const targetY = timelineBox.top + (14 * 60);

    console.log(`Dragging from Y=${blockBox.y} to Y=${targetY}`);

    // Perform drag
    await timeblock.hover();
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(blockBox.x + blockBox.width / 2, targetY, { steps: 10 });
    await page.waitForTimeout(100);
    await page.mouse.up();

    console.log('Drag completed, waiting for save...');
    await page.waitForTimeout(3000);

    // Check file content
    const updatedContent = fs.readFileSync(TODAY_FILE, 'utf-8');
    console.log('Updated content:', updatedContent);

    // Check console logs
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('TimeBlock Reposition') ||
      log.includes('newTime')
    );
    console.log('Relevant logs:', relevantLogs);

    // Verify time updated to around 14:00 (allowing for snapping)
    const has14Hour = updatedContent.includes('14:00-15:00') ||
                      updatedContent.includes('14:15-15:15') ||
                      updatedContent.includes('13:45-14:45');
    const still09Hour = updatedContent.includes('09:00-10:00');

    if (has14Hour && !still09Hour) {
      console.log('✅ Timeblock time updated successfully!');
    } else {
      console.log('❌ Timeblock time did not update correctly');
      throw new Error('Timeblock repositioning failed');
    }

    expect(has14Hour).toBeTruthy();
    expect(still09Hour).toBeFalsy();
  });

  test('Drop position snaps to 15-minute intervals', async ({ page }) => {
    console.log('Test: 15-minute snapping');

    // Setup
    const calendarContent = `# ${getTodayFilename().replace('.txt', '')}

## Tasks
- [ ] Snap test task

## Timeblocking

## Notes
`;
    fs.writeFileSync(TODAY_FILE, calendarContent, 'utf-8');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('calculatedTime')) {
        consoleLogs.push(text);
        console.log('BROWSER:', text);
      }
    });

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await navigateToCalendar(page);

    const timeline = await page.locator('div').filter({
      has: page.locator('text=/AM|PM/')
    }).first();
    const timelineBox = await timeline.boundingBox();

    if (!timelineBox) {
      throw new Error('Timeline not found');
    }

    // Find task in the calendar (it's in Tasks section)
    const task = await page.locator('text=Snap test task').first();

    // Test dropping at 10:07 (should snap to 10:00)
    const targetY1 = timelineBox.top + (10 * 60 + 7); // 10:07

    await task.hover();
    await page.mouse.down();
    await page.mouse.move(timelineBox.left + 100, targetY1, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(2000);

    let content = fs.readFileSync(TODAY_FILE, 'utf-8');
    const snappedTo10 = content.includes('10:00-11:00');

    console.log('Drop at 10:07:', snappedTo10 ? '✅ Snapped to 10:00' : '❌ Did not snap correctly');
    expect(snappedTo10).toBeTruthy();

    // Clean up for next test
    fs.writeFileSync(TODAY_FILE, calendarContent, 'utf-8');
    await page.reload();
    await page.waitForTimeout(2000);

    // Test dropping at 10:08 (should snap to 10:15)
    const targetY2 = timelineBox.top + (10 * 60 + 8); // 10:08

    const task2 = await page.locator('text=Snap test task').first();
    await task2.hover();
    await page.mouse.down();
    await page.mouse.move(timelineBox.left + 100, targetY2, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(2000);

    content = fs.readFileSync(TODAY_FILE, 'utf-8');
    const snappedTo1015 = content.includes('10:15-11:15');

    console.log('Drop at 10:08:', snappedTo1015 ? '✅ Snapped to 10:15' : '❌ Did not snap correctly');
    expect(snappedTo1015).toBeTruthy();
  });

  test('Visual feedback shows drop position during drag', async ({ page }) => {
    console.log('Test: Visual feedback during drag');

    const calendarContent = `# ${getTodayFilename().replace('.txt', '')}

## Tasks
- [ ] Visual feedback test task

## Timeblocking

## Notes
`;
    fs.writeFileSync(TODAY_FILE, calendarContent, 'utf-8');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await navigateToCalendar(page);

    const task = await page.locator('text=Visual feedback test task').first();
    const timeline = await page.locator('div').filter({
      has: page.locator('text=/AM|PM/')
    }).first();
    const timelineBox = await timeline.boundingBox();

    if (!timelineBox) {
      throw new Error('Timeline not found');
    }

    // Start dragging
    await task.hover();
    await page.mouse.down();

    // Move to timeline
    await page.mouse.move(timelineBox.left + 100, timelineBox.top + 300, { steps: 10 });
    await page.waitForTimeout(500);

    // Check for visual feedback elements
    const dropIndicator = await page.locator('.bg-blue-500.pointer-events-none').count();
    const timeLabel = await page.locator('span:has-text(/\\d{2}:\\d{2}/)').first();
    const hasTimeLabel = await timeLabel.isVisible().catch(() => false);

    console.log('Drop indicator elements found:', dropIndicator);
    console.log('Time label visible:', hasTimeLabel);

    // Release drag
    await page.mouse.up();

    if (dropIndicator > 0 || hasTimeLabel) {
      console.log('✅ Visual feedback displayed during drag');
    } else {
      console.log('⚠️ Visual feedback may not be showing (could be timing issue)');
    }

    // We expect at least some visual feedback
    expect(dropIndicator).toBeGreaterThan(0);
  });
});