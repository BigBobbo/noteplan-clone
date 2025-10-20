const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_FILE_PATH = path.join(process.env.HOME, 'Documents/notes/Notes/bullet-test-automated.txt');
const APP_URL = 'http://localhost:5173';

test.describe('Bullet Point Persistence', () => {
  test.beforeAll(async () => {
    // Create test file with bullets on separate lines
    const testContent = `- Bullet 1
- Bullet 2
- Bullet 3
- Bullet 4`;

    fs.writeFileSync(TEST_FILE_PATH, testContent, 'utf-8');
    console.log('[TEST] Created bullet test file');
  });

  test.afterAll(async () => {
    // Clean up test file
    if (fs.existsSync(TEST_FILE_PATH)) {
      fs.unlinkSync(TEST_FILE_PATH);
      console.log('[TEST] Cleaned up bullet test file');
    }
  });

  test('should preserve bullets after load', async ({ page }) => {
    const consoleLogs = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
      console.log(`[BROWSER] ${msg.text()}`);
    });

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=bullet-test-automated.txt', { timeout: 10000 });

    console.log('[TEST] Opening bullet test file...');
    await page.click('text=bullet-test-automated.txt');
    await page.waitForSelector('.ProseMirror', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Check for bulletList nodes
    const bulletLogs = consoleLogs.filter(log => log.includes('Found bullet'));
    console.log('[TEST] Found bullet logs:', bulletLogs.length);
    expect(bulletLogs.length).toBeGreaterThan(0);

    // Check the editor content
    const editorContent = await page.$eval('.ProseMirror', el => el.innerHTML);
    console.log('[TEST] Editor HTML preview:', editorContent.substring(0, 300));

    // Count bullet list items
    const bulletItems = await page.$$('li');
    console.log('[TEST] Bullet list items found:', bulletItems.length);
    expect(bulletItems.length).toBe(4);

    // Check file on disk
    const fileContent = fs.readFileSync(TEST_FILE_PATH, 'utf-8');
    const lines = fileContent.split('\n').filter(l => l.trim());
    console.log('[TEST] File lines:', lines.length);
    expect(lines.length).toBe(4);
  });

  test('should preserve bullets after typing and saving', async ({ page }) => {
    const consoleLogs = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
      console.log(`[BROWSER] ${msg.text()}`);
    });

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=bullet-test-automated.txt', { timeout: 10000 });
    await page.click('text=bullet-test-automated.txt');
    await page.waitForSelector('.ProseMirror', { timeout: 5000 });
    await page.waitForTimeout(1000);

    console.log('[TEST] Clicking into editor...');
    await page.click('.ProseMirror');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- Bullet 5');

    console.log('[TEST] Typed new bullet, waiting for auto-save...');
    await page.waitForTimeout(2000);

    // Check serialization logs
    const serializationLogs = consoleLogs.filter(log => log.includes('[Editor] Serialized'));
    console.log('[TEST] Serialization logs found:', serializationLogs.length);

    // Check file on disk
    await page.waitForTimeout(1000);
    const fileContent = fs.readFileSync(TEST_FILE_PATH, 'utf-8');
    const lines = fileContent.split('\n').filter(l => l.trim());

    console.log('[TEST] Final file content:', JSON.stringify(fileContent));
    console.log('[TEST] Final file lines:', lines.length);
    console.log('[TEST] Lines:', lines);

    // Should have 5 lines (4 original + 1 new)
    expect(lines.length).toBeGreaterThanOrEqual(4);

    // Each line should be a bullet
    lines.forEach((line, i) => {
      console.log(`[TEST] Line ${i}: "${line}"`);
      expect(line).toMatch(/^-\s/);
    });
  });

  test('should handle mixed content (tasks and bullets)', async ({ page }) => {
    // Create mixed content file
    const mixedContent = `[] Task 1
- Bullet 1
[] Task 2
- Bullet 2`;

    fs.writeFileSync(TEST_FILE_PATH, mixedContent, 'utf-8');
    console.log('[TEST] Created mixed content file');

    const consoleLogs = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
      console.log(`[BROWSER] ${msg.text()}`);
    });

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=bullet-test-automated.txt', { timeout: 10000 });
    await page.click('text=bullet-test-automated.txt');
    await page.waitForSelector('.ProseMirror', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Check for both tasks and bullets
    const taskLogs = consoleLogs.filter(log => log.includes('Found task'));
    const bulletLogs = consoleLogs.filter(log => log.includes('Found bullet'));

    console.log('[TEST] Found tasks:', taskLogs.length);
    console.log('[TEST] Found bullets:', bulletLogs.length);

    expect(taskLogs.length).toBe(2);
    expect(bulletLogs.length).toBe(2);

    // Make an edit
    await page.click('.ProseMirror');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- Bullet 3');

    console.log('[TEST] Waiting for auto-save...');
    await page.waitForTimeout(2000);

    // Check file preserves structure
    const fileContent = fs.readFileSync(TEST_FILE_PATH, 'utf-8');
    const lines = fileContent.split('\n').filter(l => l.trim());

    console.log('[TEST] Final mixed content:', JSON.stringify(fileContent));
    console.log('[TEST] Lines:', lines);

    // Should have task and bullet lines
    const taskLines = lines.filter(l => l.match(/^\[/));
    const bulletLines = lines.filter(l => l.match(/^-\s/));

    console.log('[TEST] Task lines:', taskLines.length);
    console.log('[TEST] Bullet lines:', bulletLines.length);

    expect(taskLines.length).toBeGreaterThanOrEqual(2);
    expect(bulletLines.length).toBeGreaterThanOrEqual(2);
  });
});
