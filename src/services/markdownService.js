const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');

// Initialize markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

/**
 * Markdown Service
 * Handles parsing of markdown files and extraction of NotePlan-specific elements
 */

// Regex patterns for NotePlan elements
const PATTERNS = {
  task: /^[-*+] (\[[ xX>\-!]?\] )?(.+)$/gm,  // Support -, *, and + markers; optional checkbox content
  timeBlock: /^\+ (\d{2}:\d{2})-(\d{2}:\d{2}) (.+)$/gm,
  wikiLink: /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g,
  tag: /#([a-zA-Z0-9_-]+)/g,
  mention: /@([a-zA-Z0-9_-]+)/g,
  dateReference: />(\d{4}-\d{2}-\d{2})/g
};

/**
 * Parse markdown file into structured data
 * @param {string} content - Raw markdown content
 * @returns {Object} Parsed structure
 */
function parseMarkdown(content) {
  if (!content || typeof content !== 'string') {
    return createEmptyParsedResult();
  }

  // Parse frontmatter
  const { data: frontmatter, content: body } = matter(content);

  // Extract all elements
  const tasks = extractTasks(body);
  const timeBlocks = extractTimeBlocks(body);
  const links = extractLinks(body);
  const tags = extractTags(body);
  const mentions = extractMentions(body);
  const dateReferences = extractDateReferences(body);

  return {
    frontmatter,
    body,
    tasks,
    timeBlocks,
    links,
    tags,
    mentions,
    dateReferences
  };
}

/**
 * Create empty parsed result
 * @returns {Object} Empty parsed structure
 */
function createEmptyParsedResult() {
  return {
    frontmatter: {},
    body: '',
    tasks: [],
    timeBlocks: [],
    links: [],
    tags: [],
    mentions: [],
    dateReferences: []
  };
}

/**
 * Extract tasks from markdown
 * Format: * Task name, * [x] Done task, * [ ] Todo task
 * @param {string} content - Markdown content
 * @returns {Array} Array of task objects
 */
function extractTasks(content) {
  const tasks = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for tasks with checkbox markers (with or without bullet prefix)
    // Matches: "[] Task", "[x] Task", "- [] Task", "* [x] Task", etc.
    const checkboxMatch = trimmed.match(/^(?:[-*+] )?(\[[ xX>\-!]?\]) (.+)$/);

    if (checkboxMatch) {
      const checkbox = checkboxMatch[1];
      const text = checkboxMatch[2];
      const completed = checkbox === '[x]' || checkbox === '[X]';
      const scheduled = checkbox === '[>]';
      const canceled = checkbox === '[-]';
      const important = checkbox === '[!]';

      tasks.push({
        text,
        completed,
        scheduled,
        canceled,
        important: important || false,
        line: index + 1
      });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ ')) {
      // Plain bullet task without checkbox
      const plainMatch = trimmed.match(/^[-*+] (.+)$/);
      if (plainMatch) {
        tasks.push({
          text: plainMatch[1],
          completed: false,
          scheduled: false,
          canceled: false,
          important: false,
          line: index + 1
        });
      }
    }
  });

  return tasks;
}

/**
 * Extract time blocks from markdown
 * Format: + HH:MM-HH:MM Description
 * @param {string} content - Markdown content
 * @returns {Array} Array of time block objects
 */
function extractTimeBlocks(content) {
  const timeBlocks = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const match = trimmed.match(/^\+ (\d{2}:\d{2})-(\d{2}:\d{2}) (.+)$/);

    if (match) {
      timeBlocks.push({
        start: match[1],
        end: match[2],
        description: match[3],
        line: index + 1
      });
    }
  });

  return timeBlocks;
}

/**
 * Extract wiki-style links
 * Format: [[Note Name]], [[Note|Alias]]
 * @param {string} content - Markdown content
 * @returns {Array} Array of link objects
 */
function extractLinks(content) {
  const links = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    let match;
    const regex = new RegExp(PATTERNS.wikiLink);

    while ((match = regex.exec(line)) !== null) {
      links.push({
        target: match[1],
        alias: match[3] || null,
        line: index + 1
      });
    }
  });

  return links;
}

/**
 * Extract hashtags
 * Format: #tag
 * @param {string} content - Markdown content
 * @returns {Array} Array of unique tags
 */
function extractTags(content) {
  const tagSet = new Set();
  let match;
  const regex = new RegExp(PATTERNS.tag);

  while ((match = regex.exec(content)) !== null) {
    tagSet.add('#' + match[1]);
  }

  return Array.from(tagSet);
}

/**
 * Extract mentions
 * Format: @username
 * @param {string} content - Markdown content
 * @returns {Array} Array of unique mentions
 */
function extractMentions(content) {
  const mentionSet = new Set();
  let match;
  const regex = new RegExp(PATTERNS.mention);

  while ((match = regex.exec(content)) !== null) {
    mentionSet.add('@' + match[1]);
  }

  return Array.from(mentionSet);
}

/**
 * Extract date references
 * Format: >YYYY-MM-DD
 * @param {string} content - Markdown content
 * @returns {Array} Array of unique date references
 */
function extractDateReferences(content) {
  const dateSet = new Set();
  let match;
  const regex = new RegExp(PATTERNS.dateReference);

  while ((match = regex.exec(content)) !== null) {
    dateSet.add(match[1]);
  }

  return Array.from(dateSet);
}

/**
 * Convert markdown to HTML
 * @param {string} content - Markdown content
 * @returns {string} HTML output
 */
function markdownToHtml(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Parse frontmatter first to remove it
  const { content: body } = matter(content);

  // Convert markdown to HTML
  return md.render(body);
}

/**
 * Get task statistics from content
 * @param {string} content - Markdown content
 * @returns {Object} Task statistics
 */
function getTaskStats(content) {
  const tasks = extractTasks(content);

  return {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed && !t.scheduled && !t.canceled).length,
    scheduled: tasks.filter(t => t.scheduled).length,
    canceled: tasks.filter(t => t.canceled).length
  };
}

/**
 * Check if content has frontmatter
 * @param {string} content - Markdown content
 * @returns {boolean} True if frontmatter exists
 */
function hasFrontmatter(content) {
  if (!content) return false;
  return content.trimStart().startsWith('---');
}

module.exports = {
  parseMarkdown,
  extractTasks,
  extractTimeBlocks,
  extractLinks,
  extractTags,
  extractMentions,
  extractDateReferences,
  markdownToHtml,
  getTaskStats,
  hasFrontmatter
};
