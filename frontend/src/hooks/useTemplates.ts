import { useCallback, useMemo } from 'react';
import {
  getAllTemplates,
  getTemplate as getBuiltInTemplate,
  renderTemplate,
  type Template,
} from '../services/templateService';
import { useTemplateStore } from '../store/templateStore';

export const useTemplates = () => {
  const { customTemplates, addTemplate, updateTemplate, deleteTemplate } = useTemplateStore();

  const builtInTemplates = getAllTemplates();

  // Combine built-in and custom templates
  const templates = useMemo(
    () => [...builtInTemplates, ...customTemplates],
    [builtInTemplates, customTemplates]
  );

  const insertTemplate = useCallback(
    (templateId: string, values: Record<string, any> = {}): string => {
      // Try to find in built-in templates first
      let template = getBuiltInTemplate(templateId);

      // If not found, try custom templates
      if (!template) {
        template = customTemplates.find((t) => t.id === templateId);
      }

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      return renderTemplate(template, values);
    },
    [customTemplates]
  );

  const getTemplateById = useCallback(
    (templateId: string): Template | undefined => {
      return templates.find((t) => t.id === templateId);
    },
    [templates]
  );

  return {
    templates,
    builtInTemplates,
    customTemplates,
    insertTemplate,
    getTemplateById,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
