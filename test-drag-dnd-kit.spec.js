/**
 * Test TimeBlock Drag with dnd-kit properly
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

test('Test drag using Playwright dragTo', async ({ page }) => {
  // Setup
  if (!fs.existsSync(CALENDAR_DIR)) {
    fs.mkdirSync(CALENDAR_DIR, { recursive: true });
  }

  const content = `# ${getTodayFilename().replace('.txt', '')}

## Tasks

## Timeblocking
+ 09:00-10:00 Drag test

## Notes
`;
  fs.writeFileSync(TODAY_FILE_PATH, content, 'utf-8');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Capture console
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('handleDragEnd') || text.includes('Updating timeblock')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  // Navigate
  await page.goto(APP_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await navigateToCalendar(page);
  await page.waitForTimeout(1000);

  // Find timeblock
  const timeblock = await page.locator('text=Drag test').first();
  expect(await timeblock.isVisible()).toBeTruthy();
  console.log('✅ Timeblock visible');

  // Find timeline area to drag to
  const timeline = await page.locator('.timeline, [class*="Timeline"], [class*="timeline"]').first();
  const timelineBox = await timeline.boundingBox();

  if (!timelineBox) {
    console.log('❌ Timeline not found');
    throw new Error('Timeline element not found');
  }

  console.log('Timeline bounds:', timelineBox);

  // Try using Playwright's dragTo method
  console.log('Attempting dragTo...');
  await timeblock.dragTo(timeline, {
    targetPosition: { x: 200, y: 660 } // Target 11:00 (660px = 11 hours * 60px)
  });

  await page.waitForTimeout(2000);

  // Check console
  const dragLogs = logs.filter(l => l.includes('handleDragEnd') || l.includes('Updating'));
  console.log('\nDrag handler logs:', dragLogs.length > 0 ? dragLogs : 'NONE');

  // Check file
  const newContent = fs.readFileSync(TODAY_FILE_PATH, 'utf-8');
  console.log('\nFile content:\n', newContent);

  const has09 = newContent.includes('09:00');
  const has11 = newContent.includes('11:00');

  console.log('\nHas 09:00:', has09);
  console.log('Has 11:00:', has11);

  if (has09 && !has11) {
    console.log('❌ FAIL: Drag did not update time');
  } else if (has11) {
    console.log('✅ SUCCESS: Time updated to 11:00');
  }
});
