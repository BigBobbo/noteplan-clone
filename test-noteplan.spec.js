const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_FILE_PATH = path.join(process.env.HOME, 'Documents/notes/Notes/automated-test.txt');
const APP_URL = 'http://localhost:5173';

test.describe('NotePlan Task Newline Preservation', () => {
  test.beforeAll(async () => {
    // Create test file with tasks on separate lines
    const testContent = `[] Test task 1
[] Test task 2
[] Test task 3
[] Test task 4`;

    fs.writeFileSync(TEST_FILE_PATH, testContent, 'utf-8');
    console.log('[TEST] Created test file with newlines');
  });

  test.afterAll(async () => {
    // Clean up test file
    if (fs.existsSync(TEST_FILE_PATH)) {
      fs.unlinkSync(TEST_FILE_PATH);
      console.log('[TEST] Cleaned up test file');
    }
  });

  test('should preserve newlines between tasks after load', async ({ page }) => {
    // Capture console logs
    const consoleLogs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log(`[BROWSER] ${text}`);
    });

    // Go to app
    console.log('[TEST] Navigating to app...');
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Wait for file list to load
    await page.waitForSelector('text=automated-test.txt', { timeout: 10000 });
    console.log('[TEST] File list loaded');

    // Click on the test file
    console.log('[TEST] Opening test file...');
    await page.click('text=automated-test.txt');

    // Wait for editor to load
    await page.waitForSelector('.ProseMirror', { timeout: 5000 });
    console.log('[TEST] Editor loaded');

    // Wait a moment for content to render
    await page.waitForTimeout(1000);

    // Check console logs for parsing
    const parsingLogs = consoleLogs.filter(log => log.includes('[NotePlanParser]'));
    console.log('[TEST] Parsing logs:', parsingLogs.length);

    const foundTaskLogs = consoleLogs.filter(log => log.includes('Found task'));
    console.log('[TEST] Found task logs:', foundTaskLogs.length);
    expect(foundTaskLogs.length).toBeGreaterThan(0);

    // Get the editor content
    const editorContent = await page.$eval('.ProseMirror', el => el.innerHTML);
    console.log('[TEST] Editor HTML:', editorContent.substring(0, 500));

    // Count noteplanTask nodes
    const taskNodes = await page.$$('[data-noteplan-task="true"]');
    console.log('[TEST] NotePlan task nodes found:', taskNodes.length);
    expect(taskNodes.length).toBe(4);

    // Check the file on disk still has newlines
    const fileContent = fs.readFileSync(TEST_FILE_PATH, 'utf-8');
    const lines = fileContent.split('\n').filter(l => l.trim());
    console.log('[TEST] File lines on disk:', lines.length);
    console.log('[TEST] File content:', JSON.stringify(fileContent));

    expect(lines.length).toBe(4);
  });

  test('should preserve newlines after typing and saving', async ({ page }) => {
    const consoleLogs = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
      console.log(`[BROWSER] ${msg.text()}`);
    });

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=automated-test.txt', { timeout: 10000 });
    await page.click('text=automated-test.txt');
    await page.waitForSelector('.ProseMirror', { timeout: 5000 });
    await page.waitForTimeout(1000);

    console.log('[TEST] Clicking into editor...');
    await page.click('.ProseMirror');

    // Type at the end
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('[] Test task 5');

    console.log('[TEST] Typed new task, waiting for auto-save...');
    await page.waitForTimeout(2000); // Wait for auto-save

    // Check serialization logs
    const serializationLogs = consoleLogs.filter(log => log.includes('[Editor] Serialized markdown'));
    console.log('[TEST] Serialization logs:', serializationLogs);

    if (serializationLogs.length > 0) {
      const lastLog = serializationLogs[serializationLogs.length - 1];
      console.log('[TEST] Last serialized content:', lastLog);
    }

    // Check node types
    const nodeTypeLogs = consoleLogs.filter(log => log.includes('Node') && log.includes('type='));
    console.log('[TEST] Node type logs:', nodeTypeLogs);

    // Check file on disk
    await page.waitForTimeout(1000);
    const fileContent = fs.readFileSync(TEST_FILE_PATH, 'utf-8');
    const lines = fileContent.split('\n').filter(l => l.trim());

    console.log('[TEST] Final file content:', JSON.stringify(fileContent));
    console.log('[TEST] Final file lines:', lines.length);
    console.log('[TEST] Lines:', lines);

    // This is the key assertion - newlines should be preserved
    expect(lines.length).toBeGreaterThanOrEqual(4);

    // Each line should be a separate task
    lines.forEach((line, i) => {
      console.log(`[TEST] Line ${i}: "${line}"`);
      expect(line).toMatch(/^\[\s?[xX\-!>]?\s?\]/);
    });
  });
});
