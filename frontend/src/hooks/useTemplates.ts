import { useCallback, useEffect } from 'react';
import {
  renderTemplate,
  type Template,
} from '../services/templateService';
import { useTemplateStore } from '../store/templateStore';

export const useTemplates = () => {
  const {
    templates,
    recentTemplates,
    loading,
    loadTemplates,
    getTemplate,
    getTemplateByTrigger,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addToRecent,
    getTemplatesByCategory,
    searchTemplates,
  } = useTemplateStore();

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const insertTemplate = useCallback(
    (templateId: string, values: Record<string, any> = {}): { content: string; cursorOffset?: number } => {
      const template = getTemplate(templateId);

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      addToRecent(templateId);
      return renderTemplate(template, values);
    },
    [getTemplate, addToRecent]
  );

  const insertTemplateByTrigger = useCallback(
    (trigger: string, values: Record<string, any> = {}): { content: string; cursorOffset?: number } | null => {
      const template = getTemplateByTrigger(trigger);

      if (!template) {
        return null;
      }

      addToRecent(template.id);
      return renderTemplate(template, values);
    },
    [getTemplateByTrigger, addToRecent]
  );

  const getRecentTemplates = useCallback(
    (): Template[] => {
      return recentTemplates
        .map((id) => getTemplate(id))
        .filter((t): t is Template => t !== undefined);
    },
    [recentTemplates, getTemplate]
  );

  return {
    templates,
    loading,
    recentTemplates: getRecentTemplates(),
    insertTemplate,
    insertTemplateByTrigger,
    getTemplate,
    getTemplateByTrigger,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByCategory,
    searchTemplates,
    loadTemplates,
  };
};
