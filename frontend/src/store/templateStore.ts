import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Template } from '../services/templateService';
import * as templateService from '../services/templateService';

interface TemplateStore {
  templates: Template[];
  recentTemplates: string[]; // Template IDs
  loading: boolean;

  // Actions
  loadTemplates: () => Promise<void>;
  getTemplate: (id: string) => Template | undefined;
  getTemplateByTrigger: (trigger: string) => Template | undefined;
  createTemplate: (title: string, content: string, metadata?: Partial<Template>) => Promise<void>;
  updateTemplate: (filePath: string, updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (filePath: string) => Promise<void>;
  addToRecent: (id: string) => void;

  // Filters
  getTemplatesByCategory: (category: string) => Template[];
  searchTemplates: (query: string) => Template[];
}

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      templates: [],
      recentTemplates: [],
      loading: false,

      loadTemplates: async () => {
        set({ loading: true });
        try {
          const templates = await templateService.loadTemplates();
          set({ templates, loading: false });
        } catch (error) {
          console.error('Failed to load templates:', error);
          set({ loading: false });
        }
      },

      getTemplate: (id) => {
        return get().templates.find((t) => t.id === id);
      },

      getTemplateByTrigger: (trigger) => {
        return get().templates.find((t) => t.trigger === trigger);
      },

      createTemplate: async (title, content, metadata) => {
        try {
          const newTemplate = await templateService.createTemplate(title, content, metadata);
          set((state) => ({
            templates: [...state.templates, newTemplate],
          }));
        } catch (error) {
          console.error('Failed to create template:', error);
          throw error;
        }
      },

      updateTemplate: async (filePath, updates) => {
        try {
          const updatedTemplate = await templateService.updateTemplate(filePath, updates);
          set((state) => ({
            templates: state.templates.map((t) =>
              t.filePath === filePath ? updatedTemplate : t
            ),
          }));
        } catch (error) {
          console.error('Failed to update template:', error);
          throw error;
        }
      },

      deleteTemplate: async (filePath) => {
        try {
          await templateService.deleteTemplate(filePath);
          set((state) => ({
            templates: state.templates.filter((t) => t.filePath !== filePath),
          }));
        } catch (error) {
          console.error('Failed to delete template:', error);
          throw error;
        }
      },

      addToRecent: (id) => {
        set((state) => {
          const recent = [id, ...state.recentTemplates.filter((r) => r !== id)].slice(0, 5);
          return { recentTemplates: recent };
        });
      },

      getTemplatesByCategory: (category) => {
        return get().templates.filter((t) => t.category === category);
      },

      searchTemplates: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().templates.filter(
          (t) =>
            t.title.toLowerCase().includes(lowerQuery) ||
            t.description?.toLowerCase().includes(lowerQuery) ||
            t.category?.toLowerCase().includes(lowerQuery)
        );
      },
    }),
    {
      name: 'noteplan-templates-storage',
      partialize: (state) => ({ recentTemplates: state.recentTemplates }),
    }
  )
);
