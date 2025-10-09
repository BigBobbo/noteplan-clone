import matter from 'gray-matter';
import { format } from 'date-fns';
import api from './api';

export interface Template {
  id: string;
  title: string;
  description?: string;
  trigger?: string;  // e.g., "/weekly"
  category?: string;
  icon?: string;
  content: string;
  filePath: string;
  variables: string[];
}

/**
 * Parse a template from markdown content
 */
export const parseTemplate = (
  content: string,
  filePath: string
): Template => {
  // Extract frontmatter if present
  const { data, content: body } = matter(content);

  // Find variables in template ({{variable}} or {{variable:format}})
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables = [...body.matchAll(variableRegex)].map((m) => m[1].split(':')[0]);

  // Generate ID from file path
  const id = filePath.replace(/@Templates\//, '').replace(/\.txt$/, '').toLowerCase().replace(/\s+/g, '-');

  return {
    id,
    title: data.title || filePath.replace(/@Templates\//, '').replace(/\.txt$/, ''),
    description: data.description,
    trigger: data.trigger,
    category: data.category || 'Uncategorized',
    icon: data.icon || '📄',
    content: body,
    filePath,
    variables: [...new Set(variables)],
  };
};

/**
 * Render a template with variable substitution
 */
export const renderTemplate = (
  template: Template,
  values: Record<string, any> = {}
): { content: string; cursorOffset?: number } => {
  let rendered = template.content;
  const now = new Date();

  // Handle date variables with custom formats: {{date:FORMAT}}
  rendered = rendered.replace(/\{\{date:([^}]+)\}\}/g, (_, formatStr) => {
    return format(now, formatStr);
  });

  // Handle standard date/time variables
  rendered = rendered.replace(/\{\{date\}\}/g, format(now, 'yyyy-MM-dd'));
  rendered = rendered.replace(/\{\{time\}\}/g, format(now, 'HH:mm'));
  rendered = rendered.replace(/\{\{day\}\}/g, format(now, 'EEEE'));
  rendered = rendered.replace(/\{\{week\}\}/g, format(now, 'w'));
  rendered = rendered.replace(/\{\{month\}\}/g, format(now, 'MMMM'));
  rendered = rendered.replace(/\{\{year\}\}/g, format(now, 'yyyy'));

  // Handle special variables
  // Note: {{selection}} and {{clipboard}} will be handled by the editor integration

  // Handle custom variables provided by user
  Object.entries(values).forEach(([key, value]) => {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
  });

  // Find cursor position before removing cursor marker
  const cursorMatch = rendered.match(/\{\{cursor\}\}/);
  const cursorOffset = cursorMatch?.index;

  // Remove cursor marker
  rendered = rendered.replace(/\{\{cursor\}\}/g, '');

  return { content: rendered, cursorOffset };
};

/**
 * Load templates from @Templates folder
 */
export const loadTemplates = async (): Promise<Template[]> => {
  try {
    const response = await api.listFiles('@Templates');
    const templates: Template[] = [];

    for (const file of response.files) {
      try {
        const fileData = await api.getFile(file.path);
        const template = parseTemplate(fileData.content, file.path);
        templates.push(template);
      } catch (error) {
        console.error(`Failed to load template from ${file.path}:`, error);
      }
    }

    return templates;
  } catch (error) {
    console.error('Failed to load templates:', error);
    return [];
  }
};

/**
 * Create a new template file
 */
export const createTemplate = async (
  title: string,
  content: string,
  metadata?: Partial<Template>
): Promise<Template> => {
  const frontmatter: Record<string, any> = {
    title,
    description: metadata?.description,
    trigger: metadata?.trigger,
    category: metadata?.category || 'Uncategorized',
    icon: metadata?.icon || '📄',
  };

  // Remove undefined values
  Object.keys(frontmatter).forEach(key => {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  const yamlStr = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const fileContent = `---\n${yamlStr}\n---\n\n${content}`;
  const filePath = `@Templates/${title}.txt`;

  await api.saveFile(filePath, fileContent);

  return parseTemplate(fileContent, filePath);
};

/**
 * Update an existing template
 */
export const updateTemplate = async (
  filePath: string,
  updates: Partial<Template>
): Promise<Template> => {
  const fileData = await api.getFile(filePath);
  const { data, content: body } = matter(fileData.content);

  const updatedFrontmatter = {
    ...data,
    title: updates.title || data.title,
    description: updates.description !== undefined ? updates.description : data.description,
    trigger: updates.trigger !== undefined ? updates.trigger : data.trigger,
    category: updates.category || data.category,
    icon: updates.icon || data.icon,
  };

  const yamlStr = Object.entries(updatedFrontmatter)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const updatedContent = updates.content || body;
  const fileContent = `---\n${yamlStr}\n---\n\n${updatedContent}`;

  await api.saveFile(filePath, fileContent);

  return parseTemplate(fileContent, filePath);
};

/**
 * Delete a template
 */
export const deleteTemplate = async (filePath: string): Promise<void> => {
  await api.deleteFile(filePath);
};
