const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_FILE_PATH = path.join(process.env.HOME, 'Documents/notes/Notes/typing-test.txt');
const APP_URL = 'http://localhost:5173';

test.describe('Typing Tasks', () => {
  test.beforeAll(async () => {
    // Create empty test file
    fs.writeFileSync(TEST_FILE_PATH, '# Test Note\n', 'utf-8');
    console.log('[TEST] Created test file');
  });

  test.afterAll(async () => {
    if (fs.existsSync(TEST_FILE_PATH)) {
      fs.unlinkSync(TEST_FILE_PATH);
    }
  });

  test('should persist tasks typed in editor', async ({ page }) => {
    const consoleLogs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('[Editor') || text.includes('Node')) {
        console.log(`[BROWSER] ${text}`);
      }
    });

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=typing-test.txt', { timeout: 10000 });

    console.log('[TEST] Opening file...');
    await page.click('text=typing-test.txt');
    await page.waitForSelector('.ProseMirror', { timeout: 5000 });
    await page.waitForTimeout(1000);

    console.log('[TEST] Clicking into editor...');
    await page.click('.ProseMirror');
    await page.keyboard.press('End');

    // Type first task with the input rule pattern
    console.log('[TEST] Typing: [] ');
    await page.keyboard.type('[] ');
    await page.waitForTimeout(500);

    console.log('[TEST] Typing: My first task');
    await page.keyboard.type('My first task');
    await page.waitForTimeout(500);

    // Press Enter to create new line
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Type second task
    console.log('[TEST] Typing second task');
    await page.keyboard.type('[] Second task');

    console.log('[TEST] Waiting for auto-save...');
    await page.waitForTimeout(2000);

    // Check what was serialized
    const serializeLogs = consoleLogs.filter(l => l.includes('Serialized markdown'));
    if (serializeLogs.length > 0) {
      console.log('[TEST] Last serialized:', serializeLogs[serializeLogs.length - 1]);
    }

    // Check nodes
    const nodeLogs = consoleLogs.filter(l => l.includes('Node') && l.includes('type='));
    console.log('[TEST] Node types:', nodeLogs.slice(-5));

    // Check file on disk
    const fileContent = fs.readFileSync(TEST_FILE_PATH, 'utf-8');
    console.log('[TEST] File content:', JSON.stringify(fileContent));

    const lines = fileContent.split('\n').filter(l => l.trim());
    console.log('[TEST] Lines:', lines);

    // Should have heading + 2 tasks = 3 lines
    expect(lines.length).toBeGreaterThanOrEqual(3);

    // Check that tasks have content
    const taskLines = lines.filter(l => l.match(/^\[/));
    console.log('[TEST] Task lines:', taskLines);

    // Verify tasks with content exist
    const tasksWithContent = taskLines.filter(l => l.match(/\]\s+\w+/));
    console.log('[TEST] Tasks with content:', tasksWithContent);
    expect(tasksWithContent.length).toBeGreaterThanOrEqual(2);

    // Now reload the page and check if tasks persist
    console.log('[TEST] Reloading page...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Reopen the file
    await page.waitForSelector('text=typing-test.txt', { timeout: 10000 });
    await page.click('text=typing-test.txt');
    await page.waitForSelector('.ProseMirror', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Check if tasks are still rendered
    const taskNodesAfterReload = await page.$$('[data-noteplan-task="true"]');
    console.log('[TEST] Task nodes after reload:', taskNodesAfterReload.length);

    // Check file again
    const fileContentAfterReload = fs.readFileSync(TEST_FILE_PATH, 'utf-8');
    console.log('[TEST] File after reload:', JSON.stringify(fileContentAfterReload));

    const linesAfterReload = fileContentAfterReload.split('\n').filter(l => l.trim());
    const taskLinesAfterReload = linesAfterReload.filter(l => l.match(/^\[/));
    console.log('[TEST] Task lines after reload:', taskLinesAfterReload);

    expect(taskLinesAfterReload.length).toBeGreaterThanOrEqual(2);
    expect(taskNodesAfterReload.length).toBeGreaterThanOrEqual(2);
  });
});
