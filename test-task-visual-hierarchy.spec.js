const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const APP_URL = 'http://localhost:5173';
const TEST_FILE = '/Users/robertocallaghan/Documents/notes/Notes/visual-hierarchy-test.txt';

test.describe('Task Description Visual Hierarchy', () => {
  test.beforeEach(async ({ page }) => {
    // Create test file with complex task structure
    const content = `# Visual Hierarchy Test

- [ ] Task with simple description
    This is a simple one-line description.

- [ ] Task with multi-paragraph description
    This is the first paragraph of the description.

    This is the second paragraph with more details.

    This is the third paragraph.

- [ ] Task with bullet list description
    Requirements for this task:
    - First requirement
    - Second requirement
    - Third requirement

- [>] Scheduled task with mixed content
    This task has a description paragraph.

    And a bullet list:
    - Item one
    - Item two

    And another paragraph at the end.

- [!] Important task with bold text
    This description contains bold text and regular text.

    Key Points:
    - Bold bullet one
    - Regular bullet two

- [ ] Task without any description

- [ ] Another task without description
`;

    fs.writeFileSync(TEST_FILE, content, 'utf-8');

    // Capture all console messages
    page.on('console', msg => {
      console.log(`[Browser ${msg.type()}]:`, msg.text());
    });

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Task descriptions render as styled blockquotes', async ({ page }) => {
    // Open test file
    await page.click(`text="visual-hierarchy-test"`);
    await page.waitForTimeout(1500);

    // Check TaskDetails nodes are present
    const taskDetailsNodes = await page.locator('[data-task-details="true"]').all();
    console.log(`Found ${taskDetailsNodes.length} task details nodes`);

    // Should have 5 tasks with descriptions
    expect(taskDetailsNodes.length).toBe(5);

    // Check first task details has correct styling
    const firstDetails = taskDetailsNodes[0];
    const styles = await firstDetails.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        borderLeft: computed.borderLeftWidth,
        borderColor: computed.borderLeftColor,
        background: computed.backgroundColor,
        marginLeft: computed.marginLeft,
      };
    });

    // Should have left border
    expect(styles.borderLeft).toBe('3px');

    // Should have background color (not transparent)
    expect(styles.background).not.toBe('rgba(0, 0, 0, 0)');

    // Should have left margin for indentation
    expect(parseFloat(styles.marginLeft)).toBeGreaterThan(0);
  });

  test('Subtasks show visual hierarchy with indentation', async ({ page }) => {
    await page.click(`text="visual-hierarchy-test"`);
    await page.waitForTimeout(1500);

    // Find task with bullet list (index 2)
    const bulletListDetails = await page.locator('[data-task-details="true"]').nth(2);

    // Check it contains a bullet list
    const bulletList = await bulletListDetails.locator('ul').first();
    expect(await bulletList.isVisible()).toBeTruthy();

    // Check list items
    const listItems = await bulletList.locator('li').all();
    expect(listItems.length).toBe(3);

    // Verify text content
    const firstItemText = await listItems[0].textContent();
    expect(firstItemText).toContain('First requirement');
  });

  test('Multiple paragraph descriptions are formatted correctly', async ({ page }) => {
    await page.click(`text="visual-hierarchy-test"`);
    await page.waitForTimeout(1500);

    // Find task with multi-paragraph description (index 1)
    const multiParagraphDetails = await page.locator('[data-task-details="true"]').nth(1);

    // Count paragraphs
    const paragraphs = await multiParagraphDetails.locator('p').all();
    console.log(`Found ${paragraphs.length} paragraphs in multi-paragraph task`);

    // Should have 3 paragraphs
    expect(paragraphs.length).toBe(3);

    // Verify content
    const para1 = await paragraphs[0].textContent();
    const para2 = await paragraphs[1].textContent();
    const para3 = await paragraphs[2].textContent();

    expect(para1).toContain('first paragraph');
    expect(para2).toContain('second paragraph');
    expect(para3).toContain('third paragraph');
  });

  test('Task state determines border color', async ({ page }) => {
    await page.click(`text="visual-hierarchy-test"`);
    await page.waitForTimeout(1500);

    // Check scheduled task (index 3)
    const scheduledDetails = await page.locator('.task-details-scheduled').first();
    expect(await scheduledDetails.isVisible()).toBeTruthy();

    // Check important task (index 4)
    const importantDetails = await page.locator('.task-details-important').first();
    expect(await importantDetails.isVisible()).toBeTruthy();

    const importantBorder = await importantDetails.evaluate(el => {
      return window.getComputedStyle(el).borderLeftWidth;
    });

    // Important tasks should have thicker border
    expect(importantBorder).toBe('4px');
  });

  test('CRITICAL: Formatting persists through file save and reload', async ({ page }) => {
    // Step 1: Open file and verify initial state
    await page.click(`text="visual-hierarchy-test"`);
    await page.waitForTimeout(1500);

    const initialDetails = await page.locator('[data-task-details="true"]').all();
    const initialCount = initialDetails.length;
    console.log(`Initial TaskDetails count: ${initialCount}`);

    // Step 2: Switch to Raw tab to trigger save
    await page.click('text="Raw"');
    await page.waitForTimeout(1000);

    // Step 3: Verify file content on disk
    const fileContent = fs.readFileSync(TEST_FILE, 'utf-8');
    console.log('File content after save:');
    console.log(fileContent.substring(0, 500));

    // Verify indented content is preserved
    expect(fileContent).toContain('    This is a simple one-line description.');
    expect(fileContent).toContain('    This is the first paragraph');
    expect(fileContent).toContain('    - First requirement');

    // Step 4: Switch back to Editor tab
    await page.click('text="Editor"');
    await page.waitForTimeout(1500);

    // Step 5: Verify TaskDetails nodes re-rendered
    const reloadedDetails = await page.locator('[data-task-details="true"]').all();
    const reloadedCount = reloadedDetails.length;
    console.log(`Reloaded TaskDetails count: ${reloadedCount}`);

    // CRITICAL: Count must match
    expect(reloadedCount).toBe(initialCount);
    expect(reloadedCount).toBe(5);

    // Verify content still correct
    const firstDetailsText = await reloadedDetails[0].textContent();
    expect(firstDetailsText).toContain('simple one-line description');
  });

  test('CRITICAL: Full round trip test (load → edit → save → reload)', async ({ page }) => {
    // Load file
    await page.click(`text="visual-hierarchy-test"`);
    await page.waitForTimeout(1500);

    // Get initial state
    const initialDetails = await page.locator('[data-task-details="true"]').all();
    const initialCount = initialDetails.length;

    // Edit a task description - click on the first task details paragraph
    const firstDetails = await page.locator('[data-task-details="true"]').first();
    const firstPara = await firstDetails.locator('p').first();

    // Click at the end of the paragraph
    await firstPara.click();
    await page.keyboard.press('End');

    // Type new content
    await page.keyboard.type(' EDITED TEXT');
    await page.waitForTimeout(2000); // Wait for auto-save

    // Verify file was updated
    const savedContent = fs.readFileSync(TEST_FILE, 'utf-8');
    console.log('Saved content after edit:');
    console.log(savedContent.substring(0, 500));
    expect(savedContent).toContain('EDITED TEXT');

    // Reload browser
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Re-open file
    await page.click(`text="visual-hierarchy-test"`);
    await page.waitForTimeout(1500);

    // Verify edit persisted
    const reloadedDetails = await page.locator('[data-task-details="true"]').all();
    expect(reloadedDetails.length).toBe(initialCount);

    const reloadedFirstDetails = await reloadedDetails[0];
    const reloadedText = await reloadedFirstDetails.textContent();
    expect(reloadedText).toContain('EDITED TEXT');
  });

  test('Tasks without descriptions show no TaskDetails node', async ({ page }) => {
    await page.click(`text="visual-hierarchy-test"`);
    await page.waitForTimeout(1500);

    // Get all tasks
    const allTasks = await page.locator('[data-noteplan-task="true"]').all();
    console.log(`Total tasks: ${allTasks.length}`);

    // Get all task details
    const allDetails = await page.locator('[data-task-details="true"]').all();
    console.log(`Total task details: ${allDetails.length}`);

    // Should have 7 tasks total (5 with descriptions, 2 without)
    expect(allTasks.length).toBe(7);
    expect(allDetails.length).toBe(5);
  });

  test('Task descriptions are always visible (not collapsible)', async ({ page }) => {
    await page.click(`text="visual-hierarchy-test"`);
    await page.waitForTimeout(1500);

    // Get all task details
    const allDetails = await page.locator('[data-task-details="true"]').all();

    // All should be visible (no collapse/expand functionality)
    for (const details of allDetails) {
      expect(await details.isVisible()).toBeTruthy();
    }

    // Should not have any expand/collapse buttons
    const collapseButtons = await page.locator('button:has-text("expand"), button:has-text("collapse")').all();
    expect(collapseButtons.length).toBe(0);
  });

  test('Blockquote-style border and background are visible', async ({ page }) => {
    await page.click(`text="visual-hierarchy-test"`);
    await page.waitForTimeout(1500);

    const firstDetails = await page.locator('[data-task-details="true"]').first();

    // Check for blockquote-style visual elements
    const styles = await firstDetails.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        borderLeftWidth: computed.borderLeftWidth,
        borderLeftStyle: computed.borderLeftStyle,
        backgroundColor: computed.backgroundColor,
        padding: computed.padding,
        marginLeft: computed.marginLeft,
        borderRadius: computed.borderRadius,
      };
    });

    // Should have solid left border
    expect(styles.borderLeftStyle).toBe('solid');
    expect(parseInt(styles.borderLeftWidth)).toBeGreaterThanOrEqual(3);

    // Should have padding
    expect(parseFloat(styles.padding)).toBeGreaterThan(0);

    // Should have border radius for rounded corners
    expect(styles.borderRadius).not.toBe('0px');

    // Background should not be transparent
    expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('Mixed content (paragraphs + bullets) renders correctly', async ({ page }) => {
    await page.click(`text="visual-hierarchy-test"`);
    await page.waitForTimeout(1500);

    // Find scheduled task with mixed content (index 3)
    const mixedContentDetails = await page.locator('[data-task-details="true"]').nth(3);

    // Should have paragraphs
    const paragraphs = await mixedContentDetails.locator('p').all();
    expect(paragraphs.length).toBeGreaterThan(0);

    // Should have bullet list
    const bulletList = await mixedContentDetails.locator('ul').first();
    expect(await bulletList.isVisible()).toBeTruthy();

    const listItems = await bulletList.locator('li').all();
    expect(listItems.length).toBe(2);

    // Verify content order (paragraph, then list, then paragraph)
    const allText = await mixedContentDetails.textContent();
    expect(allText).toContain('description paragraph');
    expect(allText).toContain('Item one');
    expect(allText).toContain('Item two');
    expect(allText).toContain('another paragraph at the end');
  });

  test.afterEach(async () => {
    // Cleanup: remove test file
    if (fs.existsSync(TEST_FILE)) {
      fs.unlinkSync(TEST_FILE);
    }
  });
});
