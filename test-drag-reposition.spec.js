/**
 * Test: TimeBlock Drag Repositioning
 * Verify that dragging a timeblock updates its time in the file
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const APP_URL = 'http://localhost:5173';
const CALENDAR_DIR = path.join(process.env.HOME, 'Documents', 'notes', 'Calendar');

function getTodayFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}.txt`;
}

const TODAY_FILE_PATH = path.join(CALENDAR_DIR, getTodayFilename());

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

test.describe('TimeBlock Drag Repositioning', () => {
  test.beforeEach(async () => {
    if (!fs.existsSync(CALENDAR_DIR)) {
      fs.mkdirSync(CALENDAR_DIR, { recursive: true });
    }

    // Create today's file with a timeblock at 10:00
    const content = `# ${getTodayFilename().replace('.txt', '')}

## Tasks

## Timeblocking
+ 10:00-11:00 Test meeting

## Notes
`;
    fs.writeFileSync(TODAY_FILE_PATH, content, 'utf-8');
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('Drag timeblock down 2 hours and verify time updates', async ({ page }) => {
    console.log('Test: Drag timeblock repositioning');

    // Setup console logging
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log('BROWSER:', text);
    });

    // Open app and navigate to calendar
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await navigateToCalendar(page);

    // Find the timeblock
    const timeblock = await page.locator('text=Test meeting').first();
    const isVisible = await timeblock.isVisible().catch(() => false);

    if (!isVisible) {
      throw new Error('Timeblock not visible');
    }

    console.log('✅ Timeblock is visible');

    // Get the timeline element to calculate drag target
    const timeline = await page.locator('.timeline, [class*="Timeline"], [style*="height"]').first();
    const timelineBounds = await timeline.boundingBox();
    const blockBounds = await timeblock.boundingBox();

    if (!timelineBounds || !blockBounds) {
      throw new Error('Could not get element bounds');
    }

    console.log('Timeline bounds:', timelineBounds);
    console.log('Block bounds:', blockBounds);

    // Drag down 120 pixels (2 hours at 60px/hour)
    const dragDistance = 120;
    const targetY = blockBounds.y + dragDistance;

    console.log(`Dragging from ${blockBounds.y} to ${targetY} (${dragDistance}px down)`);

    // Perform drag
    await timeblock.hover();
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(blockBounds.x + blockBounds.width / 2, targetY, { steps: 10 });
    await page.waitForTimeout(100);
    await page.mouse.up();

    console.log('Drag completed, waiting for save...');
    await page.waitForTimeout(3000);

    // Check file content
    const newContent = fs.readFileSync(TODAY_FILE_PATH, 'utf-8');
    console.log('File content after drag:');
    console.log(newContent);

    // Check console logs for update confirmation
    console.log('\n=== Console Logs ===');
    consoleLogs.forEach(log => console.log(log));

    // The time should have changed from 10:00 to approximately 12:00
    // (allowing for 15-minute snapping: 12:00, 12:15, 11:45, etc.)
    const has12Hour = newContent.includes('12:00') || newContent.includes('12:15') || newContent.includes('11:45');

    if (has12Hour) {
      console.log('✅ Timeblock time updated successfully!');
    } else {
      console.log('❌ Time did not update. Still shows:', newContent.match(/\d{2}:\d{2}-\d{2}:\d{2}/));
      throw new Error('Timeblock drag-to-reposition is not working - time did not change');
    }

    expect(has12Hour).toBeTruthy();
  });
});
