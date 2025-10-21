const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');
const dateUtils = require('../utils/dateUtils');
const timeBlockUtils = require('../utils/timeBlockUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const { ValidationError } = require('../middleware/errorHandler');

/**
 * Calendar Routes
 * API endpoints for calendar/daily note operations
 */

/**
 * GET /api/calendar/daily/:date
 * Get or create daily note
 * Params: date (YYYYMMDD)
 */
router.get('/daily/:date', asyncHandler(async (req, res) => {
  const { date } = req.params;

  // Validate date format
  if (!/^\d{8}$/.test(date)) {
    throw new ValidationError('Invalid date format. Expected YYYYMMDD');
  }

  // Validate date is valid
  try {
    dateUtils.fromNotePlanDate(date);
  } catch (error) {
    throw new ValidationError(`Invalid date: ${date}`);
  }

  // Try both new and old formats
  const possiblePaths = dateUtils.getPossibleCalendarPaths(date);
  let existingPath = null;

  for (const filePath of possiblePaths) {
    if (await fileService.fileExists(filePath)) {
      existingPath = filePath;
      break; // Use first match (new format is first in array)
    }
  }

  if (existingPath) {
    // Return existing file
    const fileData = await fileService.getFile(existingPath);
    res.json({
      ...fileData,
      created: false
    });
  } else {
    // Create new daily note with NEW format
    const dateObj = dateUtils.fromNotePlanDate(date);
    const displayDate = dateUtils.toFullDisplayDate(dateObj);
    const newFileName = dateUtils.toDailyNoteFileName(dateObj);
    const filePath = `Calendar/${newFileName}`;

    const content = `# ${displayDate}

## Routines
* Check [[Monthly Goals]]
* Check [[Weekly Calendar]]
* Check [[Waiting For]]

## Timeblocking
+ 08:00-09:00 Morning routine
+ 09:00-11:00 Deep work
+ 11:00-12:00 Break

## To Do
*

## Notes

`;

    await fileService.saveFile(filePath, content);

    const fileData = await fileService.getFile(filePath);

    res.json({
      ...fileData,
      created: true
    });
  }
}));

/**
 * POST /api/calendar/daily
 * Create daily note for today
 */
router.post('/daily', asyncHandler(async (req, res) => {
  const today = dateUtils.getToday();

  // Try both new and old formats
  const possiblePaths = dateUtils.getPossibleCalendarPaths(today);
  let existingPath = null;

  for (const filePath of possiblePaths) {
    if (await fileService.fileExists(filePath)) {
      existingPath = filePath;
      break; // Use first match (new format is first in array)
    }
  }

  if (existingPath) {
    const fileData = await fileService.getFile(existingPath);
    res.json({
      ...fileData,
      created: false,
      message: 'Daily note already exists'
    });
  } else {
    // Create new daily note with NEW format
    const dateObj = new Date();
    const displayDate = dateUtils.toFullDisplayDate(dateObj);
    const newFileName = dateUtils.toDailyNoteFileName(dateObj);
    const filePath = `Calendar/${newFileName}`;

    const content = `# ${displayDate}

## Routines
* Check [[Monthly Goals]]
* Check [[Weekly Calendar]]
* Check [[Waiting For]]

## Timeblocking
+ 08:00-09:00 Morning routine
+ 09:00-11:00 Deep work
+ 11:00-12:00 Break

## To Do
*

## Notes

`;

    await fileService.saveFile(filePath, content);

    const fileData = await fileService.getFile(filePath);

    res.json({
      ...fileData,
      created: true
    });
  }
}));

/**
 * GET /api/calendar/today
 * Get today's daily note
 */
router.get('/today', asyncHandler(async (req, res) => {
  const today = dateUtils.getToday();

  // Redirect to daily/:date endpoint
  req.params.date = today;
  return router.handle(req, res);
}));

/**
 * GET /api/calendar/range
 * Get all daily notes in a date range
 * Query params: start (YYYYMMDD), end (YYYYMMDD)
 */
router.get('/range', asyncHandler(async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    throw new ValidationError('Missing required parameters: start and end');
  }

  // Validate date formats
  if (!/^\d{8}$/.test(start) || !/^\d{8}$/.test(end)) {
    throw new ValidationError('Invalid date format. Expected YYYYMMDD');
  }

  // Parse dates
  const startDate = dateUtils.fromNotePlanDate(start);
  const endDate = dateUtils.fromNotePlanDate(end);

  // Generate date range
  const dates = dateUtils.getDateRange(startDate, endDate);

  // Check which dates have files
  const results = await Promise.all(
    dates.map(async (date) => {
      const filePath = dateUtils.getCalendarPath(date);
      const exists = await fileService.fileExists(filePath);

      if (exists) {
        const fileData = await fileService.getFile(filePath);
        return {
          date,
          path: filePath,
          hasContent: fileData.content.trim().length > 0,
          exists: true
        };
      } else {
        return {
          date,
          path: filePath,
          hasContent: false,
          exists: false
        };
      }
    })
  );

  res.json({
    start,
    end,
    count: results.length,
    dates: results
  });
}));

/**
 * GET /api/calendar/timeblocks/:date
 * Extract time blocks from a daily note
 * Params: date (YYYYMMDD)
 */
router.get('/timeblocks/:date', asyncHandler(async (req, res) => {
  const { date } = req.params;

  // Validate date format
  if (!/^\d{8}$/.test(date)) {
    throw new ValidationError('Invalid date format. Expected YYYYMMDD');
  }

  // Validate date is valid
  try {
    dateUtils.fromNotePlanDate(date);
  } catch (error) {
    throw new ValidationError(`Invalid date: ${date}`);
  }

  const filePath = dateUtils.getCalendarPath(date);

  // Check if file exists
  const exists = await fileService.fileExists(filePath);

  if (!exists) {
    return res.json({
      date,
      path: filePath,
      timeBlocks: [],
      conflicts: []
    });
  }

  // Get file content
  const fileData = await fileService.getFile(filePath);

  // Parse time blocks
  const timeBlocks = timeBlockUtils.parseTimeBlocks(fileData.content);

  // Find conflicts
  const conflicts = timeBlockUtils.findConflicts(timeBlocks);

  res.json({
    date,
    path: filePath,
    timeBlocks: timeBlockUtils.sortTimeBlocks(timeBlocks),
    conflicts,
    totalDuration: timeBlocks.reduce((sum, block) => sum + block.duration, 0)
  });
}));

module.exports = router;
