import { format, parse, isValid, startOfDay, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

/**
 * Date utility functions for NotePlan-style date handling (TypeScript version)
 */

/**
 * Format date to NotePlan's YYYYMMDD format
 */
export function toNotePlanDate(date: Date = new Date()): string {
  return format(date, 'yyyyMMdd');
}

/**
 * Parse NotePlan date format to Date object
 */
export function fromNotePlanDate(dateStr: string): Date {
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
 */
export function toDisplayDate(date: Date = new Date()): string {
  return format(date, 'MMMM d, yyyy');
}

/**
 * Format date for display with day of week (e.g., "Monday, October 7, 2025")
 */
export function toFullDisplayDate(date: Date = new Date()): string {
  return format(date, 'EEEE, MMMM d, yyyy');
}

/**
 * Format date for display with short month (e.g., "Oct 7, 2025")
 */
export function toShortDisplayDate(date: Date = new Date()): string {
  return format(date, 'MMM d, yyyy');
}

/**
 * Get today's date in NotePlan format
 */
export function getToday(): string {
  return toNotePlanDate(new Date());
}

/**
 * Get yesterday's date in NotePlan format
 */
export function getYesterday(): string {
  return toNotePlanDate(subDays(new Date(), 1));
}

/**
 * Get tomorrow's date in NotePlan format
 */
export function getTomorrow(): string {
  return toNotePlanDate(addDays(new Date(), 1));
}

/**
 * Generate a date range in NotePlan format
 */
export function getDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
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
 */
export function getCalendarPath(dateStr: string): string {
  return `Calendar/${dateStr}.txt`;
}

/**
 * Check if a path is a calendar file
 */
export function isCalendarFile(filePath: string): boolean {
  return /^Calendar\/\d{8}\.(txt|md)$/.test(filePath);
}

/**
 * Extract date from calendar file path
 */
export function extractDateFromPath(filePath: string): string | null {
  const match = filePath.match(/^Calendar\/(\d{8})\.(txt|md)$/);
  return match ? match[1] : null;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return toNotePlanDate(date) === getToday();
}

/**
 * Get all days in a month
 */
export function getDaysInMonth(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
}

/**
 * Get calendar month grid (including leading/trailing days from adjacent months)
 */
export function getCalendarMonthGrid(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

/**
 * Get week days for a given date
 */
export function getWeekDays(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

/**
 * Format month and year (e.g., "October 2025")
 */
export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

/**
 * Format day of week (e.g., "Mon")
 */
export function formatDayOfWeek(date: Date, short = true): string {
  return format(date, short ? 'EEE' : 'EEEE');
}

/**
 * Format day of month (e.g., "7")
 */
export function formatDayOfMonth(date: Date): string {
  return format(date, 'd');
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return toNotePlanDate(date1) === toNotePlanDate(date2);
}

/**
 * Check if date is in the same month
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  return format(date1, 'yyyyMM') === format(date2, 'yyyyMM');
}

/**
 * Add days to a date
 */
export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

/**
 * Subtract days from a date
 */
export function subtractDaysFromDate(date: Date, days: number): Date {
  return subDays(date, days);
}

/**
 * Navigate to previous day
 */
export function getPreviousDay(date: Date): Date {
  return subDays(date, 1);
}

/**
 * Navigate to next day
 */
export function getNextDay(date: Date): Date {
  return addDays(date, 1);
}

/**
 * Navigate to previous month
 */
export function getPreviousMonth(date: Date): Date {
  const currentMonth = date.getMonth();
  const newDate = new Date(date);
  newDate.setMonth(currentMonth - 1);
  return newDate;
}

/**
 * Navigate to next month
 */
export function getNextMonth(date: Date): Date {
  const currentMonth = date.getMonth();
  const newDate = new Date(date);
  newDate.setMonth(currentMonth + 1);
  return newDate;
}
