/**
 * Debug Test: TimeBlock Drag to Reposition
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

test('Debug: Drag timeblock and check console logs', async ({ page }) => {
  // Setup
  if (!fs.existsSync(CALENDAR_DIR)) {
    fs.mkdirSync(CALENDAR_DIR, { recursive: true });
  }

  const content = `# ${getTodayFilename().replace('.txt', '')}

## Tasks

## Timeblocking
+ 09:00-10:00 Debug test block

## Notes
`;
  fs.writeFileSync(TODAY_FILE_PATH, content, 'utf-8');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    console.log(`[BROWSER] ${text}`);
  });

  // Navigate to app
  console.log('Opening app...');
  await page.goto(APP_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Go to calendar
  console.log('Navigating to calendar...');
  await navigateToCalendar(page);

  // Wait for timeblock to appear
  await page.waitForTimeout(1000);
  const timeblock = await page.locator('text=Debug test block').first();
  const isVisible = await timeblock.isVisible().catch(() => false);

  if (!isVisible) {
    console.log('❌ Timeblock not visible');
    throw new Error('Timeblock not rendering');
  }

  console.log('✅ Timeblock is visible');

  // Get initial position
  const initialBox = await timeblock.boundingBox();
  console.log('Initial position:', initialBox);

  // Drag the timeblock down by 120 pixels (2 hours)
  console.log('Attempting to drag timeblock down 120px...');

  await timeblock.hover();
  await page.mouse.down();
  await page.mouse.move(initialBox.x + 50, initialBox.y + 120, { steps: 10 });
  await page.waitForTimeout(500);
  await page.mouse.up();
  await page.waitForTimeout(2000);

  // Check console for our debug messages
  console.log('\n=== Console Messages ===');
  const relevantLogs = consoleMessages.filter(msg =>
    msg.includes('handleDragEnd') ||
    msg.includes('Updating timeblock') ||
    msg.includes('sourceType') ||
    msg.includes('Failed')
  );

  relevantLogs.forEach(log => console.log(log));

  if (relevantLogs.length === 0) {
    console.log('⚠️  No drag handler logs found - handler may not be triggered');
  }

  // Check if file was updated
  await new Promise(resolve => setTimeout(resolve, 2000));
  const newContent = fs.readFileSync(TODAY_FILE_PATH, 'utf-8');
  console.log('\n=== File Content ===');
  console.log(newContent);

  const hasOldTime = newContent.includes('09:00');
  const hasNewTime = newContent.includes('11:00') || newContent.includes('10:');

  console.log('\n=== Results ===');
  console.log('Original time (09:00) still in file:', hasOldTime);
  console.log('New time in file:', hasNewTime);

  if (hasOldTime && !hasNewTime) {
    console.log('❌ FAIL: Timeblock did not update after drag');

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/drag-debug-failed.png', fullPage: true });

    throw new Error('Drag-to-reposition not working: time did not change in file');
  } else if (hasNewTime) {
    console.log('✅ SUCCESS: Timeblock time was updated!');
  }
});
