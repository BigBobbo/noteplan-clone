import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { useTemplates } from '../../hooks/useTemplates';
import { format } from 'date-fns';

export const CommandPalette: React.FC = () => {
  const [search, setSearch] = useState('');
  const { files, openFile, createFile, currentFile, saveFile } = useFileStore();
  const { theme, toggleTheme, commandPaletteOpen, closeCommandPalette } = useUIStore();
  const { templates, insertTemplate } = useTemplates();

  // Reset search when palette closes
  useEffect(() => {
    if (!commandPaletteOpen) {
      setSearch('');
    }
  }, [commandPaletteOpen]);

  const handleCreateNote = async () => {
    const filename = search || `Note ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
    const path = `Notes/${filename}.txt`;
    await createFile(path, '');
    closeCommandPalette();
  };

  const handleOpenFile = async (path: string) => {
    await openFile(path);
    closeCommandPalette();
  };

  const handleToggleTheme = () => {
    toggleTheme();
    closeCommandPalette();
  };

  const handleGoToToday = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const path = `Calendar/${today}.txt`;

    // Check if today's note exists
    const exists = files.some((f) => f.path === path);

    if (exists) {
      await openFile(path);
    } else {
      await createFile(path, `# ${format(new Date(), 'EEEE, MMMM d, yyyy')}\n\n`);
    }

    closeCommandPalette();
  };

  const handleInsertTemplate = async (templateId: string) => {
    if (!currentFile) return;

    const templateContent = insertTemplate(templateId);
    const newContent = currentFile.content + '\n\n' + templateContent;
    await saveFile(currentFile.metadata.path, newContent);
    closeCommandPalette();
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50">
      <Command
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        shouldFilter={true}
      >
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search..."
            className="w-full px-4 py-4 text-sm bg-transparent border-none focus:outline-none text-gray-900 dark:text-gray-100"
            autoFocus
          />
          <button
            onClick={closeCommandPalette}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="text-xs">ESC</span>
          </button>
        </div>

        <Command.List className="max-h-96 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No results found.
          </Command.Empty>

          <Command.Group
            heading="Actions"
            className="mb-2"
          >
            <Command.Item
              onSelect={handleCreateNote}
              className="flex items-center gap-3 px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <span>➕</span>
              <span>New Note {search && `"${search}"`}</span>
            </Command.Item>
            <Command.Item
              onSelect={handleGoToToday}
              className="flex items-center gap-3 px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <span>📅</span>
              <span>Go to Today</span>
            </Command.Item>
            <Command.Item
              onSelect={handleToggleTheme}
              className="flex items-center gap-3 px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span>Toggle Theme</span>
            </Command.Item>
          </Command.Group>

          {currentFile && templates.length > 0 && (
            <Command.Group heading="Templates">
              {templates.map((template) => (
                <Command.Item
                  key={template.id}
                  value={template.name}
                  onSelect={() => handleInsertTemplate(template.id)}
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <span>📋</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{template.name}</div>
                    {template.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {template.description}
                      </div>
                    )}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {files.length > 0 && (
            <Command.Group heading="Files">
              {files.slice(0, 20).map((file) => (
                <Command.Item
                  key={file.path}
                  value={file.name}
                  onSelect={() => handleOpenFile(file.path)}
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <span>📄</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{file.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {file.path}
                    </div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
};
