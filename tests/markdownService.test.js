const markdownService = require('../src/services/markdownService');

describe('Markdown Service', () => {
  describe('parseMarkdown', () => {
    test('should parse frontmatter', () => {
      const content = `---
title: Test Note
tags: [test, sample]
---

# Content here`;

      const result = markdownService.parseMarkdown(content);

      expect(result.frontmatter).toEqual({
        title: 'Test Note',
        tags: ['test', 'sample']
      });
    });

    test('should extract tasks', () => {
      const content = `
* Task 1
* [x] Completed task
* [ ] Todo task
* [>] Scheduled task
`;

      const result = markdownService.parseMarkdown(content);

      expect(result.tasks).toHaveLength(4);
      expect(result.tasks[0]).toEqual({
        text: 'Task 1',
        completed: false,
        scheduled: false,
        canceled: false,
        line: 2
      });
      expect(result.tasks[1].completed).toBe(true);
      expect(result.tasks[3].scheduled).toBe(true);
    });

    test('should extract time blocks', () => {
      const content = `
+ 09:00-10:00 Morning meeting
+ 14:00-15:30 Afternoon session
`;

      const result = markdownService.parseMarkdown(content);

      expect(result.timeBlocks).toHaveLength(2);
      expect(result.timeBlocks[0]).toEqual({
        start: '09:00',
        end: '10:00',
        description: 'Morning meeting',
        line: 2
      });
    });

    test('should extract wiki links', () => {
      const content = `
This is a [[Simple Link]].
This is a [[Link|With Alias]].
`;

      const result = markdownService.parseMarkdown(content);

      expect(result.links).toHaveLength(2);
      expect(result.links[0]).toEqual({
        target: 'Simple Link',
        alias: null,
        line: 2
      });
      expect(result.links[1]).toEqual({
        target: 'Link',
        alias: 'With Alias',
        line: 3
      });
    });

    test('should extract tags and mentions', () => {
      const content = `
This has #tag1 and #tag2.
Mention @person1 and @person2.
`;

      const result = markdownService.parseMarkdown(content);

      expect(result.tags).toContain('#tag1');
      expect(result.tags).toContain('#tag2');
      expect(result.mentions).toContain('@person1');
      expect(result.mentions).toContain('@person2');
    });
  });

  describe('markdownToHtml', () => {
    test('should convert markdown to HTML', () => {
      const content = '# Heading\n\nParagraph with **bold** text.';
      const html = markdownService.markdownToHtml(content);

      expect(html).toContain('<h1>Heading</h1>');
      expect(html).toContain('<strong>bold</strong>');
    });
  });

  describe('getTaskStats', () => {
    test('should calculate task statistics', () => {
      const content = `
* Task 1
* [x] Done 1
* [x] Done 2
* [>] Scheduled
* [-] Canceled
`;

      const stats = markdownService.getTaskStats(content);

      expect(stats).toEqual({
        total: 5,
        completed: 2,
        pending: 1,
        scheduled: 1,
        canceled: 1
      });
    });
  });
});
