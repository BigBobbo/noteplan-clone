import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { Template } from '../../services/templateService';

interface SlashCommandListProps {
  items: Template[];
  command: (item: Template) => void;
}

export const SlashCommandList = forwardRef((props: SlashCommandListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  if (props.items.length === 0) {
    return (
      <div className="slash-command-list bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
        <div className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
          No templates found
        </div>
      </div>
    );
  }

  return (
    <div className="slash-command-list bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-[300px] max-h-[400px] overflow-y-auto">
      {props.items.map((item, index) => (
        <button
          key={item.id}
          className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-3 ${
            index === selectedIndex
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100'
              : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => selectItem(index)}
        >
          <span className="text-xl">{item.icon || '📄'}</span>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{item.title}</div>
            {item.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {item.description}
              </div>
            )}
            {item.trigger && (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Trigger: {item.trigger}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
});

SlashCommandList.displayName = 'SlashCommandList';
