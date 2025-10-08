import { useState } from 'react';
import { useTemplates } from '../../hooks/useTemplates';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Template } from '../../services/templateService';

export const TemplateManager: React.FC = () => {
  const { builtInTemplates, customTemplates, deleteTemplate, addTemplate } = useTemplates();
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
  };

  const handleDuplicate = (template: Template) => {
    const duplicatedTemplate = {
      name: `${template.name} (Copy)`,
      description: template.description,
      content: template.content,
      type: template.type,
      variables: template.variables,
    };
    addTemplate(duplicatedTemplate);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(id);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Templates
          </h2>
          <Button onClick={handleCreateNew}>
            ➕ New Template
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Built-in Templates */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            Built-in Templates
          </h3>
          <div className="space-y-2">
            {builtInTemplates.map((template) => (
              <div
                key={template.id}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {template.name}
                    </h4>
                    {template.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {template.description}
                      </p>
                    )}
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      title="Duplicate this template to edit it"
                    >
                      Duplicate
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      Built-in
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Templates */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            Custom Templates
          </h3>
          {customTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No custom templates yet</p>
              <p className="text-xs mt-1">Click "New Template" to create one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {template.name}
                      </h4>
                      {template.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {template.description}
                        </p>
                      )}
                      {template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variables.map((variable) => (
                            <span
                              key={variable}
                              className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                            >
                              {variable}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Editor Modal */}
      {(editingTemplate || isCreating) && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => {
            setEditingTemplate(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
};

interface TemplateEditorProps {
  template: Template | null;
  onClose: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onClose }) => {
  const { addTemplate, updateTemplate } = useTemplates();
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [content, setContent] = useState(template?.content || '');
  const [type, setType] = useState<Template['type']>(template?.type || 'note');

  // Extract variables from content
  const variables = [...content.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
  const uniqueVariables = [...new Set(variables)];

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      alert('Name and content are required');
      return;
    }

    const templateData = {
      name: name.trim(),
      description: description.trim(),
      content,
      type,
      variables: uniqueVariables,
    };

    if (template) {
      updateTemplate(template.id, templateData);
    } else {
      addTemplate(templateData);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={template ? 'Edit Template' : 'Create New Template'}
      size="xl"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Template Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Daily Standup"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the template"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Template['type'])}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="note">Note</option>
            <option value="daily">Daily</option>
            <option value="meeting">Meeting</option>
            <option value="project">Project</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Template Content *
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Use {`{{variable}}`} for placeholders. Available auto-fill: date, time, today, year, month, day
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`# {{title}}

## Section 1

## Section 2
`}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
          />
        </div>

        {uniqueVariables.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Detected Variables
            </label>
            <div className="flex flex-wrap gap-2">
              {uniqueVariables.map((variable) => (
                <span
                  key={variable}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                >
                  {variable}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
