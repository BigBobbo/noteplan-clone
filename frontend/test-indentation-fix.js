/**
 * Test script for preserveTaskDetailsIndentation function
 * Run with: node test-indentation-fix.js
 */

// Simulate the function logic
function preserveTaskDetailsIndentation(markdown) {
  const lines = markdown.split('\n');
  const result = [];
  let lastTaskDepth = null;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      lastTaskDepth = null;
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Strip trailing backslashes
    const hasBackslash = line.trimEnd().endsWith('\\');
    if (hasBackslash) {
      line = line.trimEnd().slice(0, -1).trimEnd();
    }

    const isBlank = !line.trim();
    const isTask = /^\s*[*+]\s/.test(line);
    const isBlockElement = line.trim().startsWith('#') ||
                           line.trim().startsWith('---') ||
                           line.trim().startsWith('|');

    // Blank line
    if (isBlank) {
      result.push(line);
      continue;
    }

    // Block element
    if (isBlockElement) {
      result.push(line);
      lastTaskDepth = null;
      continue;
    }

    // Task line
    if (isTask) {
      const tiptapIndent = line.match(/^(\s*)/)?.[1]?.length || 0;
      const notePlanDepth = Math.floor(tiptapIndent / 2);
      const notePlanIndent = '    '.repeat(notePlanDepth);
      const taskContent = line.trim();
      const normalizedTaskLine = notePlanIndent + taskContent;

      result.push(normalizedTaskLine);
      lastTaskDepth = notePlanDepth;
      continue;
    }

    // Detail line
    if (lastTaskDepth !== null) {
      const expectedIndent = (lastTaskDepth + 1) * 4;
      const indentString = ' '.repeat(expectedIndent);
      const content = line.trim();

      if (content) {
        result.push(indentString + content);
      } else {
        result.push('');
      }
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

// Test Case 1: Simple task with details (TipTap format with backslashes)
console.log('=== Test 1: Simple task with details ===');
const test1Input = `+ Task 1 with details #test\\
This is a detail line for task 1\\
This is another detail line\\
Details can span multiple lines`;

const test1Output = preserveTaskDetailsIndentation(test1Input);
console.log('Input:');
console.log(test1Input);
console.log('\nOutput:');
console.log(test1Output);
console.log('\nExpected format:');
console.log(`+ Task 1 with details #test
    This is a detail line for task 1
    This is another detail line
    Details can span multiple lines`);
console.log('\nMatch:', test1Output === `+ Task 1 with details #test
    This is a detail line for task 1
    This is another detail line
    Details can span multiple lines`);

// Test Case 2: Nested task with details (2-space TipTap indent)
console.log('\n\n=== Test 2: Nested task with details ===');
const test2Input = `+ Parent task #test\\
Parent detail line 1\\
Parent detail line 2
  + Child task #test\\
  Child detail line 1\\
  Child detail line 2`;

const test2Output = preserveTaskDetailsIndentation(test2Input);
console.log('Input:');
console.log(test2Input);
console.log('\nOutput:');
console.log(test2Output);
console.log('\nExpected format:');
console.log(`+ Parent task #test
    Parent detail line 1
    Parent detail line 2
    + Child task #test
        Child detail line 1
        Child detail line 2`);
console.log('\nMatch:', test2Output === `+ Parent task #test
    Parent detail line 1
    Parent detail line 2
    + Child task #test
        Child detail line 1
        Child detail line 2`);

// Test Case 3: Deep nesting (4-space TipTap indent = depth 2)
console.log('\n\n=== Test 3: Deep nesting ===');
const test3Input = `+ Root task\\
Root detail
  + Level 1 task\\
  Level 1 detail
    + Level 2 task\\
    Level 2 detail`;

const test3Output = preserveTaskDetailsIndentation(test3Input);
console.log('Input:');
console.log(test3Input);
console.log('\nOutput:');
console.log(test3Output);
console.log('\nExpected format (4-space per level):');
console.log(`+ Root task
    Root detail
    + Level 1 task
        Level 1 detail
        + Level 2 task
            Level 2 detail`);

console.log('\n\n=== Summary ===');
console.log('The function should:');
console.log('1. Strip backslashes from all lines ✓');
console.log('2. Convert 2-space TipTap indents to 4-space NotePlan indents ✓');
console.log('3. Indent details at (taskDepth + 1) * 4 spaces ✓');
