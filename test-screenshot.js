const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Opening app...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  console.log('Looking for task-description-demo file...');

  // Try to click the file
  try {
    await page.click('button:has-text("task-description-demo")');
    console.log('Clicked on file');
  } catch (e) {
    console.log('Could not find file button');

    // List all buttons
    const buttons = await page.locator('button').all();
    for (let i = 0; i < Math.min(5, buttons.length); i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: ${text}`);
    }
  }

  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'visual-test-editor.png', fullPage: true });
  console.log('Screenshot saved: visual-test-editor.png');

  // Check for indicators
  const indicators = await page.locator('.task-details-indicator').count();
  console.log(`Found ${indicators} task detail indicators`);

  // Check for tasks
  const tasks = await page.locator('.noteplan-task').count();
  console.log(`Found ${tasks} noteplan tasks`);

  // Check if has-details class is applied
  const tasksWithDetails = await page.locator('.noteplan-task.has-details').count();
  console.log(`Found ${tasksWithDetails} tasks with has-details class`);

  // Get some console logs
  page.on('console', msg => {
    if (msg.text().includes('hasDetails')) {
      console.log('Console:', msg.text());
    }
  });

  // Try Tasks tab
  console.log('\nSwitching to Tasks tab...');
  try {
    await page.click('button:has-text("Tasks")');
    await page.waitForTimeout(2000);

    const expandButtons = await page.locator('button[title*="Expand details"]').count();
    console.log(`Found ${expandButtons} expandable tasks in Tasks tab`);

    await page.screenshot({ path: 'visual-test-tasks.png', fullPage: true });
    console.log('Tasks tab screenshot saved: visual-test-tasks.png');
  } catch (e) {
    console.log('Could not switch to Tasks tab');
  }

  console.log('\n✅ Test complete - check screenshots');
  await browser.close();
})();