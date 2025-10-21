const { test, expect } = require('@playwright/test');

const APP_URL = 'http://localhost:5173';

test('Check for console errors', async ({ page }) => {
  const errors = [];

  // Capture ALL console messages
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Navigate to app
  await page.goto(APP_URL);
  await page.waitForTimeout(3000);

  // Print errors
  console.log('\n=== ERRORS FOUND ===');
  console.log('Total errors:', errors.length);
  errors.forEach((err, i) => {
    console.log(`${i + 1}. ${err}`);
  });
  console.log('===================\n');
});
