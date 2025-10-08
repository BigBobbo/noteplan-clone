import { useState } from 'react';
import { useTemplates } from '../../hooks/useTemplates';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (content: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { templates, insertTemplate } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplate(templateId);
    // Reset variables
    setVariables({});
  };

  const handleInsert = () => {
    if (!selectedTemplate) return;

    const content = insertTemplate(selectedTemplate, variables);
    onSelect(content);
    onClose();
    setSelectedTemplate(null);
    setVariables({});
  };

  const selectedTemplateObj = templates.find((t) => t.id === selectedTemplate);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Insert Template" size="lg">
      <div>

        {!selectedTemplate ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template.id)}
                className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="text-lg mb-1 text-gray-900 dark:text-gray-100">
                  {template.name}
                </div>
                {template.description && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {template.description}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.variables.length > 0 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {template.variables.length} variable(s)
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
            >
              ← Back to templates
            </button>

            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {selectedTemplateObj?.name}
            </h3>

            {selectedTemplateObj && selectedTemplateObj.variables.length > 0 ? (
              <div className="space-y-3 mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Fill in the template variables:
                </p>
                {selectedTemplateObj.variables
                  .filter((v) => !['date', 'time', 'datetime', 'today', 'year', 'month', 'day'].includes(v))
                  .map((variable) => (
                    <div key={variable}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {variable.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        value={variables[variable] || ''}
                        onChange={(e) =>
                          setVariables({ ...variables, [variable]: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                      />
                    </div>
                  ))}
              </div>
            ) : null}

            <div className="flex gap-3 justify-end">
              <Button onClick={onClose} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleInsert}>Insert Template</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
