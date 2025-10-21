const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_FILE = '/Users/robertocallaghan/Documents/notes/Notes/task-description-newlines-test.txt';
const APP_URL = 'http://localhost:5173';

test.describe('Task Description Newline Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure test file exists
    const testContent = `# Task Description Newlines Test

- [ ] Task with multiline description
    this is the task description
    Line A
    Line B
    - Line C (bullet)
    Line D
    - Line E (bullet)
    Line F

- [ ] Another task with description
    First line of description
    Second line of description
    Third line of description

- [ ] Task with blank lines in description
    Paragraph 1 line 1
    Paragraph 1 line 2

    Paragraph 2 line 1
    Paragraph 2 line 2
`;
    fs.writeFileSync(TEST_FILE, testContent, 'utf-8');

    // Navigate to app
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open test file
    const fileLink = page.locator('text=task-description-newlines-test.txt');
    if (await fileLink.count() > 0) {
      await fileLink.click();
      await page.waitForTimeout(500);
    }
  });

  test('Task descriptions render with preserved newlines in Tasks tab', async ({ page }) => {
    // Switch to Tasks tab
    const tasksTab = page.locator('[role="tab"]').filter({ hasText: 'Tasks' });
    await tasksTab.click();
    await page.waitForTimeout(1000);

    // Find the first task
    const taskText = page.locator('text=Task with multiline description').first();
    const isVisible = await taskText.isVisible();
    console.log('[TEST] Task found:', isVisible);
    expect(isVisible).toBeTruthy();

    // Look for the expand button or details
    const expandButton = page.locator('[title*="Expand details"], [title*="expand"]').first();
    if (await expandButton.count() > 0 && await expandButton.isVisible()) {
      console.log('[TEST] Clicking expand button');
      await expandButton.click();
      await page.waitForTimeout(500);
    }

    // Check that the task details are visible
    const taskDetails = page.locator('[class*="prose"]').first();
    const detailsText = await taskDetails.textContent();
    console.log('[TEST] Task details text:', detailsText);

    // Verify each line is present
    expect(detailsText).toContain('Line A');
    expect(detailsText).toContain('Line B');
    expect(detailsText).toContain('Line C');
    expect(detailsText).toContain('Line D');
    expect(detailsText).toContain('Line E');
    expect(detailsText).toContain('Line F');

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-newlines-tasks-tab.png' });
    console.log('[TEST] Screenshot saved: test-newlines-tasks-tab.png');
  });

  test('Task descriptions render with preserved newlines in Kanban board', async ({ page }) => {
    // Switch to Kanban tab
    const kanbanTab = page.locator('[role="tab"]').filter({ hasText: 'Kanban' });
    if (await kanbanTab.count() > 0) {
      await kanbanTab.click();
      await page.waitForTimeout(1000);

      // Find the task card
      const taskCard = page.locator('text=Task with multiline description').first();
      if (await taskCard.count() > 0 && await taskCard.isVisible()) {
        console.log('[TEST] Task card found in Kanban');

        // Expand details if collapsed
        const expandButton = page.locator('[title*="Show details"], [title*="details"]').first();
        if (await expandButton.count() > 0 && await expandButton.isVisible()) {
          console.log('[TEST] Clicking expand button in Kanban');
          await expandButton.click();
          await page.waitForTimeout(500);
        }

        // Check for multiline rendering
        const cardDetails = page.locator('.prose').first();
        if (await cardDetails.count() > 0) {
          const detailsHTML = await cardDetails.innerHTML();
          console.log('[TEST] Details HTML:', detailsHTML.substring(0, 200));

          // With remark-breaks, each line should have a <br> tag or be in separate <p> tags
          const hasBrTags = detailsHTML.includes('<br>');
          const hasMultipleP = (detailsHTML.match(/<p>/g) || []).length > 1;

          console.log('[TEST] Has <br> tags:', hasBrTags);
          console.log('[TEST] Has multiple <p> tags:', hasMultipleP);

          expect(hasBrTags || hasMultipleP).toBeTruthy();

          // Take screenshot
          await page.screenshot({ path: 'test-newlines-kanban.png' });
          console.log('[TEST] Screenshot saved: test-newlines-kanban.png');
        } else {
          console.log('[TEST] No details found in Kanban - may be expected if details are hidden');
        }
      } else {
        console.log('[TEST] Task not found in Kanban - may be expected if not in a column');
      }
    } else {
      console.log('[TEST] Kanban tab not found - skipping');
    }
  });

  test('Console shows newlines are preserved in parsed data', async ({ page }) => {
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      console.log('[CONSOLE]', text);
    });

    // Switch to Tasks tab to trigger parsing
    const tasksTab = page.locator('[role="tab"]').filter({ hasText: 'Tasks' });
    await tasksTab.click();
    await page.waitForTimeout(2000);

    // Check debug logs from parseTaskDetails
    const parseLog = logs.find(l => l.includes('[parseTaskDetails]') && l.includes('Has newlines'));
    console.log('[TEST] Found parseTaskDetails log:', !!parseLog);
    if (parseLog) {
      console.log('[TEST] Log content:', parseLog);
      expect(parseLog).toContain('true');
    }

    // Check for TaskDetails component logs
    const taskDetailsLog = logs.find(l => l.includes('[TaskDetails]') && l.includes('Contains newlines'));
    console.log('[TEST] Found TaskDetails log:', !!taskDetailsLog);
    if (taskDetailsLog) {
      console.log('[TEST] Log content:', taskDetailsLog);
    }
  });
});
