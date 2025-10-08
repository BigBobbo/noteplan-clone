const { format, parse } = require('date-fns');

/**
 * Time Block utility functions for parsing and managing time blocks
 */

/**
 * Parse time blocks from markdown content
 * Supports multiple formats:
 * - + 08:00-09:00 Description (original format)
 * - * 08:00-09:00 Description (markdown bullet)
 * - - 08:00-09:00 Description (markdown dash)
 * - 08:00-09:00 Description (no bullet)
 * @param {string} content - Markdown content
 * @returns {Array} Array of time block objects
 */
function parseTimeBlocks(content) {
  const blocks = [];

  // Split content into lines to track line numbers
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Match various formats: +, *, -, or no prefix
    // Also handle potential markdown list markers
    const trimmedLine = line.trim();
    const blockMatch = trimmedLine.match(/^[+*\-]?\s*(\d{2}:\d{2})-(\d{2}:\d{2})\s+(.+)$/);

    if (blockMatch) {
      const [_, start, end, description] = blockMatch;
      blocks.push({
        id: `${start}-${end}-${index}`, // Use line index for ID
        start,
        end,
        duration: calculateDuration(start, end),
        description: description.trim(),
        line: index + 1 // 1-based line number
      });
    }
  });

  return blocks;
}

/**
 * Calculate duration in minutes between two time strings
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @returns {number} Duration in minutes
 */
function calculateDuration(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return endMinutes - startMinutes;
}

/**
 * Format a time block as markdown
 * @param {Object} block - Time block object
 * @returns {string} Formatted markdown string
 */
function formatTimeBlock(block) {
  return `+ ${block.start}-${block.end} ${block.description}`;
}

/**
 * Validate time string format (HH:MM)
 * @param {string} time - Time string
 * @returns {boolean} True if valid
 */
function isValidTime(time) {
  if (!time || typeof time !== 'string') return false;

  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;

  const [_, hours, minutes] = match;
  const h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);

  return h >= 0 && h < 24 && m >= 0 && m < 60;
}

/**
 * Check if two time blocks overlap
 * @param {Object} block1 - First time block
 * @param {Object} block2 - Second time block
 * @returns {boolean} True if blocks overlap
 */
function blocksOverlap(block1, block2) {
  const start1 = timeToMinutes(block1.start);
  const end1 = timeToMinutes(block1.end);
  const start2 = timeToMinutes(block2.start);
  const end2 = timeToMinutes(block2.end);

  return (start1 < end2 && end1 > start2);
}

/**
 * Convert time string to minutes since midnight
 * @param {string} time - Time string (HH:MM)
 * @returns {number} Minutes since midnight
 */
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time string (HH:MM)
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Find conflicts in a list of time blocks
 * @param {Array} blocks - Array of time blocks
 * @returns {Array} Array of conflict pairs
 */
function findConflicts(blocks) {
  const conflicts = [];

  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (blocksOverlap(blocks[i], blocks[j])) {
        conflicts.push([blocks[i], blocks[j]]);
      }
    }
  }

  return conflicts;
}

/**
 * Sort time blocks by start time
 * @param {Array} blocks - Array of time blocks
 * @returns {Array} Sorted array
 */
function sortTimeBlocks(blocks) {
  return [...blocks].sort((a, b) => {
    const aMinutes = timeToMinutes(a.start);
    const bMinutes = timeToMinutes(b.start);
    return aMinutes - bMinutes;
  });
}

module.exports = {
  parseTimeBlocks,
  calculateDuration,
  formatTimeBlock,
  isValidTime,
  blocksOverlap,
  timeToMinutes,
  minutesToTime,
  findConflicts,
  sortTimeBlocks
};
