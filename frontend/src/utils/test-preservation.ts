/**
 * Manual test script for preserveTaskDetailsIndentation
 * Run this in the browser console to test the function
 */

import { preserveTaskDetailsIndentation, validateTaskDetailsIndentation, logTaskStructure } from './preserveTaskDetailsIndentation';

// Test Case 1: Simple task with detail
console.group('Test 1: Simple task with detail');
const test1Input = `* Task 1
Detail line 1
Detail line 2`;

const test1Output = preserveTaskDetailsIndentation(test1Input);
console.log('Input:', test1Input);
console.log('Output:', test1Output);

const test1Expected = `* Task 1
    Detail line 1
    Detail line 2`;
console.log('Expected:', test1Expected);
console.log('Match:', test1Output === test1Expected);
logTaskStructure(test1Output);
console.groupEnd();

// Test Case 2: Nested task with details
console.group('Test 2: Nested task with details');
const test2Input = `* Parent task
Parent detail
    * Child task
    Child detail`;

const test2Output = preserveTaskDetailsIndentation(test2Input);
console.log('Input:', test2Input);
console.log('Output:', test2Output);

const test2Expected = `* Parent task
    Parent detail
    * Child task
        Child detail`;
console.log('Expected:', test2Expected);
console.log('Match:', test2Output === test2Expected);
logTaskStructure(test2Output);
console.groupEnd();

// Test Case 3: Task with blank line in details
console.group('Test 3: Task with blank line in details');
const test3Input = `* Task with details
Detail line 1

Detail line 2`;

const test3Output = preserveTaskDetailsIndentation(test3Input);
console.log('Input:', test3Input);
console.log('Output:', test3Output);
logTaskStructure(test3Output);
console.groupEnd();

// Test Case 4: Multiple tasks
console.group('Test 4: Multiple tasks');
const test4Input = `* Task 1
Detail 1
* Task 2
Detail 2
* Task 3
Detail 3`;

const test4Output = preserveTaskDetailsIndentation(test4Input);
console.log('Input:', test4Input);
console.log('Output:', test4Output);
logTaskStructure(test4Output);
console.groupEnd();

// Test Case 5: Real-world example from test-kanban.md
console.group('Test 5: Real-world example');
const test5Input = `# Test Kanban Tasks

## Todo Tasks
* Task 1 in todo #status-todo #p1
This is a detailed description of Task 1.
It can span multiple lines and include:
- Bullet points for steps
- Links: https://example.com
- **Bold** and *italic* text
- Code: \`npm install\`

* Task 2 in todo #status-todo #work
Quick notes about Task 2.
Remember to check the API documentation.`;

const test5Output = preserveTaskDetailsIndentation(test5Input);
console.log('Input:', test5Input);
console.log('Output:', test5Output);
logTaskStructure(test5Output);

const validation = validateTaskDetailsIndentation(test5Output);
console.log('Validation:', validation);
console.groupEnd();

export const runTests = () => {
  console.log('Running preserveTaskDetailsIndentation tests...');
  // Run all test cases above
};
