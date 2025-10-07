const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');
const dateUtils = require('../utils/dateUtils');
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

  const filePath = dateUtils.getCalendarPath(date);

  // Check if file exists
  const exists = await fileService.fileExists(filePath);

  if (exists) {
    // Return existing file
    const fileData = await fileService.getFile(filePath);
    res.json({
      ...fileData,
      created: false
    });
  } else {
    // Create new daily note with template
    const dateObj = dateUtils.fromNotePlanDate(date);
    const displayDate = dateUtils.toFullDisplayDate(dateObj);

    const content = `# ${displayDate}\n\n## Tasks\n\n## Notes\n\n`;

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
  const filePath = dateUtils.getCalendarPath(today);

  // Check if already exists
  const exists = await fileService.fileExists(filePath);

  if (exists) {
    const fileData = await fileService.getFile(filePath);
    res.json({
      ...fileData,
      created: false,
      message: 'Daily note already exists'
    });
  } else {
    // Create new daily note
    const dateObj = new Date();
    const displayDate = dateUtils.toFullDisplayDate(dateObj);

    const content = `# ${displayDate}\n\n## Tasks\n\n## Notes\n\n`;

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

module.exports = router;
