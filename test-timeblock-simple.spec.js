/**
 * Simple Playwright Test: TimeBlock Rendering
 * Just check if timeblocks appear on the calendar
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

test.describe('TimeBlock Simple Test', () => {
  test.beforeEach(async () => {
    if (!fs.existsSync(CALENDAR_DIR)) {
      fs.mkdirSync(CALENDAR_DIR, { recursive: true });
    }

    // Create today's file with timeblocks
    const content = `# ${getTodayFilename().replace('.txt', '')}

## Tasks

## Timeblocking
+ 09:00-10:00 Morning standup
+ 14:00-15:30 Afternoon meeting

## Notes
`;
    fs.writeFileSync(TODAY_FILE_PATH, content, 'utf-8');
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('Check if timeblocks render on calendar', async ({ page }) => {
    console.log('Opening app...');
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({ path: 'test-results/homepage.png' });
    console.log('Screenshot saved');

    // Check console for errors
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Look for Calendar button/tab
    console.log('Looking for Calendar tab...');
    const calendarButtons = await page.locator('button, a, [role="tab"]').all();
    console.log(`Found ${calendarButtons.length} buttons/tabs`);

    for (const btn of calendarButtons) {
      const text = await btn.textContent().catch(() => '');
      if (text && text.toLowerCase().includes('calendar')) {
        console.log(`Found Calendar button with text: "${text}"`);
        await btn.click();
        await page.waitForTimeout(2000);
        break;
      }
    }

    await page.screenshot({ path: 'test-results/after-calendar-click.png' });
    console.log('After calendar click screenshot saved');

    // Log page content
    const bodyText = await page.locator('body').textContent();
    console.log('Page contains "Morning standup"?', bodyText.includes('Morning standup'));
    console.log('Page contains "Afternoon meeting"?', bodyText.includes('Afternoon meeting'));

    // Look for any element with timeblock descriptions
    const morningBlock = await page.locator('text=Morning standup').first().isVisible().catch(() => false);
    const afternoonBlock = await page.locator('text=Afternoon meeting').first().isVisible().catch(() => false);

    console.log('Morning block visible?', morningBlock);
    console.log('Afternoon block visible?', afternoonBlock);

    // Print console messages
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => console.log(msg));

    if (!morningBlock && !afternoonBlock) {
      console.log('\n❌ TIMEBLOCKS NOT RENDERING');
      console.log('Taking debug screenshot...');
      await page.screenshot({ path: 'test-results/debug-full-page.png', fullPage: true });
    } else {
      console.log('\n✅ TIMEBLOCKS ARE RENDERING!');
    }
  });
});
