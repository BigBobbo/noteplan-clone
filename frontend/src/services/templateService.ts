import matter from 'gray-matter';
import { format } from 'date-fns';

export interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
  type: 'note' | 'daily' | 'meeting' | 'project';
  description?: string;
}

/**
 * Parse a template from markdown content
 */
export const parseTemplate = (
  content: string,
  id: string = 'template'
): Template => {
  // Extract frontmatter if present
  const { data, content: body } = matter(content);

  // Find variables in template ({{variable}})
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables = [...body.matchAll(variableRegex)].map((m) => m[1]);

  return {
    id,
    name: data.title || 'Untitled Template',
    content: body,
    variables: [...new Set(variables)],
    type: data.type || 'note',
    description: data.description,
  };
};

/**
 * Render a template with variable substitution
 */
export const renderTemplate = (
  template: Template,
  values: Record<string, any> = {}
): string => {
  let rendered = template.content;

  // Add default values for common variables
  const defaultValues: Record<string, string> = {
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    datetime: format(new Date(), 'yyyy-MM-dd HH:mm'),
    today: format(new Date(), 'EEEE, MMMM d, yyyy'),
    year: format(new Date(), 'yyyy'),
    month: format(new Date(), 'MMMM'),
    day: format(new Date(), 'd'),
  };

  const allValues = { ...defaultValues, ...values };

  // Replace all variables
  template.variables.forEach((variable) => {
    const value = allValues[variable] || '';
    rendered = rendered.replace(
      new RegExp(`\\{\\{${variable}\\}\\}`, 'g'),
      value
    );
  });

  return rendered;
};

/**
 * Built-in templates
 */
export const builtInTemplates: Template[] = [
  {
    id: 'daily-note',
    name: 'Daily Note',
    type: 'daily',
    description: 'Standard daily note template',
    variables: ['date', 'today'],
    content: `# {{today}}

## Tasks
*

## Notes

## Journal

`,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    type: 'meeting',
    description: 'Template for meeting notes',
    variables: ['title', 'date', 'attendees'],
    content: `# {{title}}

**Date:** {{date}}
**Attendees:** {{attendees}}

## Agenda

## Discussion

## Action Items
*

## Next Steps

`,
  },
  {
    id: 'project',
    name: 'Project',
    type: 'project',
    description: 'Project planning template',
    variables: ['project_name', 'date'],
    content: `# {{project_name}}

**Created:** {{date}}

## Overview

## Goals
*

## Tasks
*

## Resources

## Timeline

## Notes

`,
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    type: 'note',
    description: 'Weekly reflection template',
    variables: ['date'],
    content: `# Weekly Review - {{date}}

## Accomplishments
*

## Challenges
*

## Learnings
*

## Next Week's Focus
*

## Gratitude
*

`,
  },
  {
    id: 'book-notes',
    name: 'Book Notes',
    type: 'note',
    description: 'Template for taking book notes',
    variables: ['book_title', 'author', 'date'],
    content: `# {{book_title}} by {{author}}

**Started:** {{date}}

## Key Takeaways
*

## Summary

## Favorite Quotes

## My Thoughts

## Action Items
*

`,
  },
];

/**
 * Get a template by ID
 */
export const getTemplate = (id: string): Template | undefined => {
  return builtInTemplates.find((t) => t.id === id);
};

/**
 * Get all templates
 */
export const getAllTemplates = (): Template[] => {
  return builtInTemplates;
};
