import React from 'react';
import type { Reference } from '../../types';
import {
  HashtagIcon,
  LinkIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface ReferenceItemProps {
  reference: Reference;
  onNavigate: (refId: string) => void;
  onLink?: (refId: string, linkType: 'wikilink' | 'tag') => void;
}

export const ReferenceItem: React.FC<ReferenceItemProps> = ({
  reference,
  onNavigate,
  onLink,
}) => {
  const getTypeIcon = () => {
    switch (reference.type) {
      case 'tag':
        return <HashtagIcon className="h-4 w-4 text-purple-500" />;
      case 'wikilink':
        return <LinkIcon className="h-4 w-4 text-blue-500" />;
      case 'task':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'unlinked':
        return <ChatBubbleLeftIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getFileIcon = () => {
    if (reference.isDaily) {
      return <CalendarIcon className="h-3 w-3" />;
    }
    return <DocumentTextIcon className="h-3 w-3" />;
  };

  const highlightMatch = (text: string) => {
    // Simple highlighting - find the target name and highlight it
    const regex = new RegExp(
      `(${reference.targetName}|#${reference.targetName}|\\[\\[${reference.targetName}\\]\\])`,
      'gi'
    );

    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              className="bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 px-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="group border-b border-gray-200 dark:border-gray-700 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-2 px-4">
        {/* Type Icon */}
        <div className="mt-1 flex-shrink-0">{getTypeIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* File info */}
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              {getFileIcon()}
              <button
                onClick={() => onNavigate(reference.id)}
                className="hover:text-amber-600 dark:hover:text-amber-400 hover:underline truncate max-w-xs"
                title={reference.sourceFile}
              >
                {reference.sourceName}
              </button>
            </div>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">Line {reference.line + 1}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">
              {new Date(reference.dateModified).toLocaleDateString()}
            </span>
          </div>

          {/* Context */}
          <div className="mt-2 space-y-1">
            {reference.context.map((line, idx) => {
              const isMatchLine = idx === Math.floor(reference.context.length / 2);
              return (
                <div
                  key={idx}
                  className={clsx(
                    'text-sm font-mono leading-relaxed',
                    isMatchLine
                      ? 'text-gray-900 dark:text-gray-100 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {isMatchLine ? (
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 select-none">
                        →
                      </span>
                      <span className="flex-1">{highlightMatch(line)}</span>
                    </div>
                  ) : (
                    <span className="pl-5">{line}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions for unlinked mentions */}
          {reference.type === 'unlinked' && onLink && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => onLink(reference.id, 'wikilink')}
                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Link as [[Note]]
              </button>
              <button
                onClick={() => onLink(reference.id, 'tag')}
                className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                Link as #tag
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
