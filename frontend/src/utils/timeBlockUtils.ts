/**
 * Time Block utility functions for parsing and managing time blocks (TypeScript version)
 */

export interface TimeBlock {
  id: string;
  start: string;      // "09:00"
  end: string;        // "11:00"
  duration: number;   // minutes
  description: string;
  line: number;       // line number in markdown
}

/**
 * Parse time blocks from markdown content
 * Supports multiple formats:
 * - + 08:00-09:00 Description (original format)
 * - * 08:00-09:00 Description (markdown bullet)
 * - - 08:00-09:00 Description (markdown dash)
 * - 08:00-09:00 Description (no bullet)
 */
export function parseTimeBlocks(content: string): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Match various formats: +, *, -, or no prefix
    const trimmedLine = line.trim();
    const blockMatch = trimmedLine.match(/^[+*\-]?\s*(\d{2}:\d{2})-(\d{2}:\d{2})\s+(.+)$/);

    if (blockMatch) {
      const [_, start, end, description] = blockMatch;
      blocks.push({
        id: `${start}-${end}-${index}`,
        start,
        end,
        duration: calculateDuration(start, end),
        description: description.trim(),
        line: index + 1
      });
    }
  });

  return blocks;
}

/**
 * Calculate duration in minutes between two time strings
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return endMinutes - startMinutes;
}

/**
 * Format a time block as markdown
 */
export function formatTimeBlock(block: Omit<TimeBlock, 'id' | 'duration' | 'line'>): string {
  return `+ ${block.start}-${block.end} ${block.description}`;
}

/**
 * Validate time string format (HH:MM)
 */
export function isValidTime(time: string): boolean {
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
 */
export function blocksOverlap(block1: TimeBlock, block2: TimeBlock): boolean {
  const start1 = timeToMinutes(block1.start);
  const end1 = timeToMinutes(block1.end);
  const start2 = timeToMinutes(block2.start);
  const end2 = timeToMinutes(block2.end);

  return (start1 < end2 && end1 > start2);
}

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Find conflicts in a list of time blocks
 */
export function findConflicts(blocks: TimeBlock[]): [TimeBlock, TimeBlock][] {
  const conflicts: [TimeBlock, TimeBlock][] = [];

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
 */
export function sortTimeBlocks(blocks: TimeBlock[]): TimeBlock[] {
  return [...blocks].sort((a, b) => {
    const aMinutes = timeToMinutes(a.start);
    const bMinutes = timeToMinutes(b.start);
    return aMinutes - bMinutes;
  });
}

/**
 * Generate hour slots for timeline (0-23)
 */
export function generateHourSlots(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

/**
 * Format hour for display (e.g., "9 AM", "2 PM")
 */
export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Format hour for display (24-hour format, e.g., "09:00")
 */
export function formatHour24(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/**
 * Get time blocks for a specific hour
 */
export function getBlocksForHour(blocks: TimeBlock[], hour: number): TimeBlock[] {
  return blocks.filter(block => {
    const startHour = parseInt(block.start.split(':')[0], 10);
    return startHour === hour;
  });
}

/**
 * Calculate visual position for a time block in timeline
 * Returns { top: number, height: number } in pixels
 */
export function calculateBlockPosition(
  block: TimeBlock,
  hourHeight: number = 60
): { top: number; height: number } {
  const startMinutes = timeToMinutes(block.start);
  const endMinutes = timeToMinutes(block.end);

  const startHour = Math.floor(startMinutes / 60);
  const startMinutesInHour = startMinutes % 60;

  const top = startHour * hourHeight + (startMinutesInHour / 60) * hourHeight;
  const height = ((endMinutes - startMinutes) / 60) * hourHeight;

  return { top, height };
}

/**
 * Create a new time block from hour and duration
 */
export function createTimeBlock(
  hour: number,
  durationMinutes: number = 60,
  description: string = 'New task'
): Omit<TimeBlock, 'id' | 'line'> {
  const startMinutes = hour * 60;
  const endMinutes = startMinutes + durationMinutes;

  return {
    start: minutesToTime(startMinutes),
    end: minutesToTime(endMinutes),
    duration: durationMinutes,
    description
  };
}

/**
 * Insert a time block into markdown content
 */
export function insertTimeBlockInContent(
  content: string,
  block: Omit<TimeBlock, 'id' | 'duration' | 'line'>,
  sectionHeader: string = '## Timeblocking'
): string {
  const lines = content.split('\n');
  const blockLine = formatTimeBlock(block);

  // Find the timeblocking section
  const sectionIndex = lines.findIndex(line => line.trim() === sectionHeader);

  if (sectionIndex === -1) {
    // Section doesn't exist, append at end
    return content + `\n${sectionHeader}\n${blockLine}\n`;
  }

  // Find the next section or end of file
  let insertIndex = sectionIndex + 1;
  while (insertIndex < lines.length && !lines[insertIndex].startsWith('##')) {
    insertIndex++;
  }

  // Insert the block before the next section
  lines.splice(insertIndex, 0, blockLine);

  return lines.join('\n');
}

/**
 * Update a time block in markdown content
 */
export function updateTimeBlockInContent(
  content: string,
  oldBlock: TimeBlock,
  newBlock: Omit<TimeBlock, 'id' | 'duration' | 'line'>
): string {
  const lines = content.split('\n');
  const oldLine = formatTimeBlock({
    start: oldBlock.start,
    end: oldBlock.end,
    description: oldBlock.description
  });
  const newLine = formatTimeBlock(newBlock);

  // Find and replace the old block
  const lineIndex = lines.findIndex(line => line.trim() === oldLine.trim());
  if (lineIndex !== -1) {
    lines[lineIndex] = newLine;
  }

  return lines.join('\n');
}

/**
 * Delete a time block from markdown content
 */
export function deleteTimeBlockFromContent(
  content: string,
  block: TimeBlock
): string {
  const lines = content.split('\n');
  const blockLine = formatTimeBlock({
    start: block.start,
    end: block.end,
    description: block.description
  });

  // Find and remove the block
  const lineIndex = lines.findIndex(line => line.trim() === blockLine.trim());
  if (lineIndex !== -1) {
    lines.splice(lineIndex, 1);
  }

  return lines.join('\n');
}

/**
 * Add minutes to a time string
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const baseMinutes = timeToMinutes(time);
  const totalMinutes = baseMinutes + minutes;
  return minutesToTime(totalMinutes);
}

/**
 * Get time from pixel position on timeline
 */
export function getTimeFromPixelPosition(pixelY: number, hourHeight: number = 60): string {
  const totalMinutes = Math.round((pixelY / hourHeight) * 60);
  const snappedMinutes = Math.round(totalMinutes / 15) * 15;
  const constrainedMinutes = Math.max(0, Math.min(1440, snappedMinutes));
  return minutesToTime(constrainedMinutes);
}

/**
 * Calculate time from mouse position on timeline
 */
export function calculateTimeFromPosition(mouseY: number, timelineRect: { top: number; height: number }): string {
  const HOUR_HEIGHT = 60;
  const relativeY = mouseY - timelineRect.top;
  const totalMinutes = (relativeY / HOUR_HEIGHT) * 60;

  // Snap to 15-minute intervals
  const snappedMinutes = Math.round(totalMinutes / 15) * 15;

  // Constrain to 24-hour period (with 1 hour default duration)
  const constrainedMinutes = Math.max(0, Math.min(1440 - 60, snappedMinutes));

  return minutesToTime(constrainedMinutes);
}
