/**
 * Basic Test: Timeline drop functionality
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

const TODAY_FILE = path.join(CALENDAR_DIR, getTodayFilename());

test('Basic: Create timeblock by dropping task', async ({ page }) => {
  console.log('=== Basic Timeline Drop Test ===');

  // Setup
  if (!fs.existsSync(CALENDAR_DIR)) {
    fs.mkdirSync(CALENDAR_DIR, { recursive: true });
  }

  const content = `# ${getTodayFilename().replace('.txt', '')}

## Tasks
- [ ] Test task to drop

## Timeblocking

## Notes
`;
  fs.writeFileSync(TODAY_FILE, content, 'utf-8');
  console.log('Created test file:', TODAY_FILE);

  // Capture console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Task Drop') || text.includes('TimeBlock') || text.includes('calculatedTime')) {
      console.log('BROWSER LOG:', text);
    }
  });

  // Navigate to app
  await page.goto(APP_URL);
  await page.waitForLoadState('networkidle');

  // Click on Calendar tab
  console.log('Looking for Calendar tab...');
  const calendarTab = await page.locator('button:has-text("Calendar"), a:has-text("Calendar")').first();

  if (await calendarTab.isVisible()) {
    console.log('Found Calendar tab, clicking...');
    await calendarTab.click();
    await page.waitForTimeout(2000);
  } else {
    console.log('Calendar tab not found, might already be on calendar view');
  }

  // Find the task
  console.log('Looking for task...');
  const task = await page.locator('text=Test task to drop').first();
  const taskVisible = await task.isVisible().catch(() => false);

  if (!taskVisible) {
    console.log('Task not immediately visible, checking file content...');
    const fileContent = fs.readFileSync(TODAY_FILE, 'utf-8');
    console.log('File content:', fileContent);
    throw new Error('Task not visible on page');
  }

  console.log('✅ Task found');

  // Find timeline - look for the hours
  console.log('Looking for timeline...');
  const timeline = await page.locator('div').filter({ hasText: /12 PM|11 AM|10 AM/ }).first();
  let timelineBounds = await timeline.boundingBox().catch(() => null);

  if (!timelineBounds || timelineBounds.x === 0) {
    console.log('Timeline not found or positioned at 0,0, trying alternate selector...');
    const altTimeline = await page.locator('[class*="timeline"], [class*="Timeline"]').first();
    timelineBounds = await altTimeline.boundingBox().catch(() => null);
    if (!timelineBounds) {
      // Try the viewport itself as fallback
      timelineBounds = await page.viewportSize();
      timelineBounds = { x: 200, y: 100, width: timelineBounds.width - 200, height: timelineBounds.height - 100 };
      console.log('Using viewport as fallback bounds');
    }
  }

  console.log('✅ Timeline bounds:', timelineBounds);

  // Simple drag from task to timeline
  console.log('Performing drag...');
  await task.hover();
  await page.mouse.down();
  await page.waitForTimeout(100);

  // Move to a position on timeline (roughly 10 AM)
  const dropX = (timelineBounds.x || 200) + 100;
  const dropY = (timelineBounds.y || 100) + 600; // 10 hours * 60px

  console.log(`Moving to position: ${dropX}, ${dropY}`);
  await page.mouse.move(dropX, dropY, { steps: 5 });
  await page.waitForTimeout(100);
  await page.mouse.up();

  console.log('Drag completed, waiting for changes...');
  await page.waitForTimeout(3000);

  // Check file for changes
  const updatedContent = fs.readFileSync(TODAY_FILE, 'utf-8');
  console.log('\n=== Updated File Content ===');
  console.log(updatedContent);

  // Look for any timeblock
  const hasTimeblock = updatedContent.match(/\d{2}:\d{2}-\d{2}:\d{2}/);

  if (hasTimeblock) {
    console.log('✅ SUCCESS: Timeblock created:', hasTimeblock[0]);
  } else {
    console.log('❌ FAILURE: No timeblock created');
    throw new Error('Timeblock not created after drop');
  }

  expect(hasTimeblock).toBeTruthy();
});