// Import not possible in Node, so we'll just validate the file format

const fs = require('fs');

const content = fs.readFileSync('/Users/robertocallaghan/Documents/notes/Notes/indentation-test.txt', 'utf8');

console.log('=== VALIDATION SUMMARY ===\n');

const lines = content.split('\n');

// Check indentation
let detailsFound = 0;
let correctIndent = 0;
let incorrectIndent = 0;

lines.forEach((line, i) => {
  if (line.trim() && !line.trim().startsWith('+') && !line.trim().startsWith('*') && !line.trim().startsWith('#')) {
    detailsFound++;
    const spaces = line.match(/^(\s*)/)[1].length;
    if (spaces === 4 || spaces === 8 || spaces === 12) {
      correctIndent++;
      console.log(`✓ Line ${i+1}: ${spaces} spaces - "${line.trim().substring(0, 30)}..."`);
    } else {
      incorrectIndent++;
      console.log(`✗ Line ${i+1}: ${spaces} spaces (WRONG) - "${line.trim()}"`);
    }
  }
});

console.log(`\n=== RESULTS ===`);
console.log(`Detail lines found: ${detailsFound}`);
console.log(`Correctly indented: ${correctIndent}`);
console.log(`Incorrectly indented: ${incorrectIndent}`);
console.log(`\nIndentation preservation: ${incorrectIndent === 0 ? '✅ WORKING' : '❌ BROKEN'}`);
