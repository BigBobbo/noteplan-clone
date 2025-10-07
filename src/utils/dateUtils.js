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
 * Get the calendar file path for a date
 * @param {string} dateStr - Date in YYYYMMDD format
 * @returns {string} File path (e.g., "Calendar/20251007.txt")
 */
function getCalendarPath(dateStr) {
  return `Calendar/${dateStr}.txt`;
}

/**
 * Check if a path is a calendar file
 * @param {string} filePath - File path to check
 * @returns {boolean} True if it's a calendar file
 */
function isCalendarFile(filePath) {
  return /^Calendar\/\d{8}\.(txt|md)$/.test(filePath);
}

/**
 * Extract date from calendar file path
 * @param {string} filePath - Calendar file path
 * @returns {string|null} Date string or null if not a calendar file
 */
function extractDateFromPath(filePath) {
  const match = filePath.match(/^Calendar\/(\d{8})\.(txt|md)$/);
  return match ? match[1] : null;
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
  getCalendarPath,
  isCalendarFile,
  extractDateFromPath,
  toISOString
};
