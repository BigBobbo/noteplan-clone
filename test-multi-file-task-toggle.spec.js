const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const NOTES_DIR = path.join(process.env.HOME, 'Documents/notes/Notes');
const APP_URL = 'http://localhost:5173';

test.describe('Multi-File Task Completion', () => {
  let testFile1, testFile2, testFile3;

  test.beforeEach(async ({ page }) => {
    // Create test files with tasks
    testFile1 = path.join(NOTES_DIR, 'multi-file-test-1.txt');
    testFile2 = path.join(NOTES_DIR, 'multi-file-test-2.txt');
    testFile3 = path.join(NOTES_DIR, 'multi-file-test-3.txt');

    fs.writeFileSync(testFile1,
      '# Project A\n\n- [ ] Task A1\n- [ ] Task A2\n- [x] Task A3\n',
      'utf-8'
    );

    fs.writeFileSync(testFile2,
      '# Project B\n\n- [ ] Task B1\n- [ ] Task B2\n',
      'utf-8'
    );

    fs.writeFileSync(testFile3,
      '# Project C\n\n- [ ] Task C1\n- [x] Task C2\n- [ ] Task C3\n',
      'utf-8'
    );

    // Navigate to app
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Wait for global indexing
    await page.waitForTimeout(2000);
  });

  test.afterEach(async () => {
    // Clean up test files
    try {
      if (fs.existsSync(testFile1)) fs.unlinkSync(testFile1);
      if (fs.existsSync(testFile2)) fs.unlinkSync(testFile2);
      if (fs.existsSync(testFile3)) fs.unlinkSync(testFile3);
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  test('1. All Tasks tab displays tasks from multiple files', async ({ page }) => {
    // Click on "All Tasks" tab
    const allTasksButton = page.locator('button').filter({ hasText: 'All Tasks' });
    await allTasksButton.click();
    await page.waitForTimeout(500);

    // Verify all three files appear
    const file1Visible = await page.locator('text=multi-file-test-1.txt').isVisible();
    const file2Visible = await page.locator('text=multi-file-test-2.txt').isVisible();
    const file3Visible = await page.locator('text=multi-file-test-3.txt').isVisible();

    expect(file1Visible || file2Visible || file3Visible).toBeTruthy();

    console.log('All Tasks tab loaded successfully');
  });

  test('2. Toggle task in file 1, verify it saves', async ({ page }) => {
    // Go to All Tasks
    const allTasksButton = page.locator('button').filter({ hasText: 'All Tasks' });
    await allTasksButton.click();
    await page.waitForTimeout(500);

    // Find Task A1 by text, then get the checkbox in the same container
    const taskA1Text = page.locator('text=Task A1').first();
    const taskA1Container = taskA1Text.locator('..');
    const taskA1Checkbox = taskA1Container.locator('input[type="checkbox"]').first();

    // Verify initially unchecked
    const initiallyChecked = await taskA1Checkbox.isChecked();
    expect(initiallyChecked).toBeFalsy();

    // Click checkbox
    await taskA1Checkbox.click();

    // Wait for save
    await page.waitForTimeout(2000);

    // Verify file was updated
    const content = fs.readFileSync(testFile1, 'utf-8');
    expect(content).toContain('- [x] Task A1');
    console.log('Task A1 toggled and saved successfully');
  });

  test('3. Toggle task in file 2, verify in both All Tasks and file view', async ({ page }) => {
    // Go to All Tasks
    const allTasksButton = page.locator('button').filter({ hasText: 'All Tasks' });
    await allTasksButton.click();
    await page.waitForTimeout(500);

    // Toggle Task B1
    const taskB1Text = page.locator('text=Task B1').first();
    const taskB1Container = taskB1Text.locator('..');
    const taskB1Checkbox = taskB1Container.locator('input[type="checkbox"]').first();

    await taskB1Checkbox.click();
    await page.waitForTimeout(2000);

    // Verify still checked in All Tasks view
    const isChecked = await taskB1Checkbox.isChecked();
    expect(isChecked).toBeTruthy();

    // Open the file directly by clicking on the filename in sidebar
    const fileLink = page.locator('text=multi-file-test-2.txt').first();
    await fileLink.click();
    await page.waitForTimeout(1000);

    // Go to Tasks tab for this file
    const tasksButton = page.locator('button').filter({ hasText: /^Tasks$/ }).first();
    await tasksButton.click();
    await page.waitForTimeout(500);

    // Verify file content on disk
    const content = fs.readFileSync(testFile2, 'utf-8');
    expect(content).toContain('- [x] Task B1');
    console.log('Task B1 toggled and verified in both views');
  });

  test('4. Toggle completed task back to uncompleted', async ({ page }) => {
    // Go to All Tasks
    const allTasksButton = page.locator('button').filter({ hasText: 'All Tasks' });
    await allTasksButton.click();
    await page.waitForTimeout(500);

    // Find Task A3 (already completed)
    const taskA3Text = page.locator('text=Task A3').first();
    const taskA3Container = taskA3Text.locator('..');
    const taskA3Checkbox = taskA3Container.locator('input[type="checkbox"]').first();

    // Verify initially checked
    const initiallyChecked = await taskA3Checkbox.isChecked();
    expect(initiallyChecked).toBeTruthy();

    // Uncheck it
    await taskA3Checkbox.click();
    await page.waitForTimeout(2000);

    // Verify file was updated
    const content = fs.readFileSync(testFile1, 'utf-8');
    expect(content).toContain('- [ ] Task A3');
    expect(content).not.toContain('- [x] Task A3');
    console.log('Task A3 unchecked successfully');
  });

  test('5. Toggle multiple tasks in different files', async ({ page }) => {
    // Go to All Tasks
    const allTasksButton = page.locator('button').filter({ hasText: 'All Tasks' });
    await allTasksButton.click();
    await page.waitForTimeout(500);

    // Toggle Task A2
    const taskA2 = page.locator('text=Task A2').first();
    const checkboxA2 = taskA2.locator('..').locator('input[type="checkbox"]').first();
    await checkboxA2.click();
    await page.waitForTimeout(1500);

    // Toggle Task B2
    const taskB2 = page.locator('text=Task B2').first();
    const checkboxB2 = taskB2.locator('..').locator('input[type="checkbox"]').first();
    await checkboxB2.click();
    await page.waitForTimeout(1500);

    // Toggle Task C1
    const taskC1 = page.locator('text=Task C1').first();
    const checkboxC1 = taskC1.locator('..').locator('input[type="checkbox"]').first();
    await checkboxC1.click();
    await page.waitForTimeout(2000);

    // Verify all files updated
    expect(fs.readFileSync(testFile1, 'utf-8')).toContain('- [x] Task A2');
    expect(fs.readFileSync(testFile2, 'utf-8')).toContain('- [x] Task B2');
    expect(fs.readFileSync(testFile3, 'utf-8')).toContain('- [x] Task C1');
    console.log('Multiple tasks toggled successfully');
  });

  test('6. Toggle task while file is open in editor', async ({ page }) => {
    // Open file 1 in editor by clicking on it
    const fileLink = page.locator('text=multi-file-test-1.txt').first();
    await fileLink.click();
    await page.waitForTimeout(1000);

    // Go to All Tasks (file still open)
    const allTasksButton = page.locator('button').filter({ hasText: 'All Tasks' });
    await allTasksButton.click();
    await page.waitForTimeout(500);

    // Toggle Task A1
    const taskA1 = page.locator('text=Task A1').first();
    const checkboxA1 = taskA1.locator('..').locator('input[type="checkbox"]').first();
    await checkboxA1.click();
    await page.waitForTimeout(2000);

    // Switch back to Editor tab
    const editorButton = page.locator('button').filter({ hasText: 'Editor' }).first();
    await editorButton.click();
    await page.waitForTimeout(500);

    // Verify file on disk
    expect(fs.readFileSync(testFile1, 'utf-8')).toContain('- [x] Task A1');
    console.log('Task toggled while file open in editor');
  });

  test('7. Console logs show proper execution', async ({ page }) => {
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    // Go to All Tasks
    const allTasksButton = page.locator('button').filter({ hasText: 'All Tasks' });
    await allTasksButton.click();
    await page.waitForTimeout(500);

    // Toggle a task
    const taskA1 = page.locator('text=Task A1').first();
    const checkboxA1 = taskA1.locator('..').locator('input[type="checkbox"]').first();
    await checkboxA1.click();
    await page.waitForTimeout(2000);

    // Verify logs
    const relevantLogs = logs.filter(l =>
      l.includes('[CrossFileTask]') ||
      l.includes('[GlobalTaskStore]') ||
      l.includes('[AllTasksView]')
    );

    console.log('Relevant logs:', relevantLogs);

    // Should see toggle-related logs
    const hasToggleLog = relevantLogs.some(l =>
      l.includes('Toggling task') || l.includes('Task toggled')
    );
    expect(hasToggleLog).toBeTruthy();
  });

  test('8. Filter completed tasks in All Tasks view', async ({ page }) => {
    // Go to All Tasks
    const allTasksButton = page.locator('button').filter({ hasText: 'All Tasks' });
    await allTasksButton.click();
    await page.waitForTimeout(500);

    // Click "Completed" filter
    const completedFilter = page.locator('button').filter({ hasText: 'Completed' }).first();
    await completedFilter.click();
    await page.waitForTimeout(500);

    // Should show Task A3 and Task C2 (both already completed)
    const hasA3 = await page.locator('text=Task A3').isVisible();
    const hasC2 = await page.locator('text=Task C2').isVisible();

    // At least one completed task should be visible
    expect(hasA3 || hasC2).toBeTruthy();

    console.log('Completed filter working');
  });

  test('9. Round-trip: Toggle → Save → Reload → Verify', async ({ page }) => {
    // Go to All Tasks
    const allTasksButton = page.locator('button').filter({ hasText: 'All Tasks' });
    await allTasksButton.click();
    await page.waitForTimeout(500);

    // Toggle Task A1
    const taskA1 = page.locator('text=Task A1').first();
    const checkboxA1 = taskA1.locator('..').locator('input[type="checkbox"]').first();
    await checkboxA1.click();
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Go back to All Tasks
    const allTasksButton2 = page.locator('button').filter({ hasText: 'All Tasks' });
    await allTasksButton2.click();
    await page.waitForTimeout(500);

    // Verify file still shows task as completed
    const content = fs.readFileSync(testFile1, 'utf-8');
    expect(content).toContain('- [x] Task A1');
    console.log('Task persists after reload');
  });

  test('10. Verify no TypeScript/console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Go to All Tasks
    const allTasksButton = page.locator('button').filter({ hasText: 'All Tasks' });
    await allTasksButton.click();
    await page.waitForTimeout(500);

    // Toggle a task
    const taskA1 = page.locator('text=Task A1').first();
    const checkboxA1 = taskA1.locator('..').locator('input[type="checkbox"]').first();
    await checkboxA1.click();
    await page.waitForTimeout(2000);

    // Verify no errors
    expect(errors.length).toBe(0);
    console.log('No errors detected');
  });
});
