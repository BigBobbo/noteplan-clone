const { format, parse, isValid, startOfDay, addDays, subDays } = require('date-fns');

/**
 * Date utility functions for NotePlan-style date handling
 */

/**
 * Format date to NotePlan's YYYYMMDD format
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string (e.g., "20251007")
 */
function toNotePlanDate(date = new Date()) {
  return format(date, 'yyyyMMdd');
}

/**
 * Parse NotePlan date format to Date object
 * @param {string} dateStr - Date string in YYYYMMDD format
 * @returns {Date} Parsed date
 * @throws {Error} If date format is invalid
 */
function fromNotePlanDate(dateStr) {
  if (!/^\d{8}$/.test(dateStr)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYYMMDD`);
  }

  const parsed = parse(dateStr, 'yyyyMMdd', new Date());

  if (!isValid(parsed)) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  return parsed;
}

/**
 * Format date for display (e.g., "October 7, 2025")
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function toDisplayDate(date = new Date()) {
  return format(date, 'MMMM d, yyyy');
}

/**
 * Format date for display with day of week (e.g., "Monday, October 7, 2025")
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function toFullDisplayDate(date = new Date()) {
  return format(date, 'EEEE, MMMM d, yyyy');
}

/**
 * Get today's date in NotePlan format
 * @returns {string} Today's date (e.g., "20251007")
 */
function getToday() {
  return toNotePlanDate(new Date());
}

/**
 * Get yesterday's date in NotePlan format
 * @returns {string} Yesterday's date
 */
function getYesterday() {
  return toNotePlanDate(subDays(new Date(), 1));
}

/**
 * Get tomorrow's date in NotePlan format
 * @returns {string} Tomorrow's date
 */
function getTomorrow() {
  return toNotePlanDate(addDays(new Date(), 1));
}

/**
 * Generate a date range in NotePlan format
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string[]} Array of date strings
 */
function getDateRange(startDate, endDate) {
  const dates = [];
  let currentDate = startOfDay(startDate);
  const end = startOfDay(endDate);

  while (currentDate <= end) {
    dates.push(toNotePlanDate(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

/**
 * Format date as daily note filename (new readable format)
 * Example: 20251021 - Monday - Oct 21st.txt
 * @param {Date} date - Date to format
 * @returns {string} Formatted filename
 */
function toDailyNoteFileName(date = new Date()) {
  const yyyymmdd = format(date, 'yyyyMMdd');
  const dayName = format(date, 'EEEE');        // Monday
  const monthDay = format(date, 'MMM do');     // Oct 21st (ordinal)

  return `${yyyymmdd} - ${dayName} - ${monthDay}.txt`;
}

/**
 * Extract YYYYMMDD from daily note filename (supports both old and new formats)
 * Returns null if not a valid daily note filename
 *
 * Supports:
 * - New format: "20251021 - Monday - Oct 21st.txt"
 * - Old format: "20251021.txt"
 *
 * @param {string} fileName - Filename to parse
 * @returns {string|null} YYYYMMDD date string or null
 */
function extractDateFromDailyNote(fileName) {
  // New format: "20251021 - Monday - Oct 21st.txt"
  const newFormatMatch = fileName.match(/^(\d{8}) - \w+ - \w+ \d{1,2}\w{2}\.txt$/);
  if (newFormatMatch) {
    return newFormatMatch[1];
  }

  // Old format: "20251021.txt"
  const oldFormatMatch = fileName.match(/^(\d{8})\.txt$/);
  if (oldFormatMatch) {
    return oldFormatMatch[1];
  }

  return null;
}

/**
 * Get all possible calendar file paths for a date
 * Used for lookup when we don't know which format exists
 * Returns paths in order of preference (new format first)
 *
 * @param {string} dateStr - Date in YYYYMMDD format
 * @returns {string[]} Array of possible file paths
 */
function getPossibleCalendarPaths(dateStr) {
  const date = fromNotePlanDate(dateStr);
  const newFormat = toDailyNoteFileName(date);
  const oldFormat = `${dateStr}.txt`;

  return [
    `Calendar/${newFormat}`,
    `Calendar/${oldFormat}`
  ];
}

/**
 * Get the calendar file path for a date (using new format)
 * @param {string} dateStr - Date in YYYYMMDD format
 * @returns {string} File path (e.g., "Calendar/20251021 - Monday - Oct 21st.txt")
 */
function getCalendarPath(dateStr) {
  const date = fromNotePlanDate(dateStr);
  return `Calendar/${toDailyNoteFileName(date)}`;
}

/**
 * Check if a path is a calendar file (supports both old and new formats)
 * @param {string} filePath - File path to check
 * @returns {boolean} True if it's a calendar file
 */
function isCalendarFile(filePath) {
  // New format: Calendar/20251021 - Monday - Oct 21st.txt
  const newFormat = /^Calendar\/\d{8} - \w+ - \w+ \d{1,2}\w{2}\.(txt|md)$/;
  // Old format: Calendar/20251021.txt
  const oldFormat = /^Calendar\/\d{8}\.(txt|md)$/;

  return newFormat.test(filePath) || oldFormat.test(filePath);
}

/**
 * Extract date from calendar file path (supports both old and new formats)
 * @param {string} filePath - Calendar file path
 * @returns {string|null} Date string or null if not a calendar file
 */
function extractDateFromPath(filePath) {
  // Try new format first
  const newMatch = filePath.match(/^Calendar\/(\d{8}) - \w+ - \w+ \d{1,2}\w{2}\.(txt|md)$/);
  if (newMatch) {
    return newMatch[1];
  }

  // Try old format
  const oldMatch = filePath.match(/^Calendar\/(\d{8})\.(txt|md)$/);
  if (oldMatch) {
    return oldMatch[1];
  }

  return null;
}

/**
 * Format ISO date string
 * @param {Date} date - Date to format
 * @returns {string} ISO formatted date string
 */
function toISOString(date = new Date()) {
  return date.toISOString();
}

module.exports = {
  toNotePlanDate,
  fromNotePlanDate,
  toDisplayDate,
  toFullDisplayDate,
  getToday,
  getYesterday,
  getTomorrow,
  getDateRange,
  toDailyNoteFileName,
  extractDateFromDailyNote,
  getPossibleCalendarPaths,
  getCalendarPath,
  isCalendarFile,
  extractDateFromPath,
  toISOString
};
