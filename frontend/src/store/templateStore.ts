import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Template } from '../services/templateService';

interface TemplateStore {
  customTemplates: Template[];

  // Actions
  addTemplate: (template: Omit<Template, 'id'>) => void;
  updateTemplate: (id: string, template: Omit<Template, 'id'>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => Template | undefined;
  getAllCustomTemplates: () => Template[];
}

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      customTemplates: [],

      addTemplate: (template) => {
        const newTemplate: Template = {
          ...template,
          id: `custom-${Date.now()}`,
        };
        set((state) => ({
          customTemplates: [...state.customTemplates, newTemplate],
        }));
      },

      updateTemplate: (id, template) => {
        set((state) => ({
          customTemplates: state.customTemplates.map((t) =>
            t.id === id ? { ...template, id } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          customTemplates: state.customTemplates.filter((t) => t.id !== id),
        }));
      },

      getTemplate: (id) => {
        return get().customTemplates.find((t) => t.id === id);
      },

      getAllCustomTemplates: () => {
        return get().customTemplates;
      },
    }),
    {
      name: 'noteplan-templates-storage',
    }
  )
);
