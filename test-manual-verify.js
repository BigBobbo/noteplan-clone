// Manual verification script to check if task descriptions are working

const fs = require('fs');

// Read the test file
const testFile = '/Users/robertocallaghan/Documents/notes/Notes/task-description-test.txt';
const content = fs.readFileSync(testFile, 'utf-8');

console.log('Test file content:');
console.log('=================');
console.log(content);
console.log('=================\n');

// Parse tasks manually to check
const lines = content.split('\n');
let taskCount = 0;
let tasksWithDescriptions = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Check for tasks
  if (line.match(/^(\s*)-\s+\[[\s\w]\]/)) {
    taskCount++;
    const indent = line.match(/^(\s*)/)[1].length;
    const taskDepth = Math.floor(indent / 2);

    // Check next lines for description
    let hasDescription = false;
    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j];
      const nextIndent = nextLine.match(/^(\s*)/)[1].length;
      const nextDepth = Math.floor(nextIndent / 2);

      // If next line is indented more than task, it's a description
      if (nextLine.trim() && nextDepth > taskDepth) {
        // Stop if it's another task
        if (nextLine.match(/^(\s*)-\s+\[/)) break;

        hasDescription = true;
        break;
      }

      // If we hit content at same or lower depth, stop
      if (nextLine.trim() && nextDepth <= taskDepth) break;
    }

    console.log(`Task ${taskCount}: "${line.trim()}" - Has description: ${hasDescription}`);
    if (hasDescription) tasksWithDescriptions++;
  }
}

console.log(`\nTotal tasks: ${taskCount}`);
console.log(`Tasks with descriptions: ${tasksWithDescriptions}`);

// Expected results
console.log('\n✓ Expected: 7 total tasks (including subtasks)');
console.log('✓ Expected: 5 tasks with descriptions');