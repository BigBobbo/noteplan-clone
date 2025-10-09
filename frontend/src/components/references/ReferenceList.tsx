import React, { useState } from 'react';
import type { Reference } from '../../types';
import { ReferenceItem } from './ReferenceItem';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ReferenceListProps {
  references: Reference[];
  groupedReferences: {
    direct: Reference[];
    tasks: Reference[];
    unlinked: Reference[];
  };
  counts: {
    total: number;
    filtered: number;
    byType: {
      tag: number;
      wikilink: number;
      task: number;
      unlinked: number;
    };
  };
  onNavigate: (refId: string) => void;
  onLink?: (refId: string, linkType: 'wikilink' | 'tag') => void;
}

export const ReferenceList: React.FC<ReferenceListProps> = ({
  references,
  groupedReferences,
  onNavigate,
  onLink,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    direct: true,
    tasks: true,
    unlinked: true,
    dailyNotes: true,
    regularNotes: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Further group direct references by daily vs regular notes
  const dailyDirectRefs = groupedReferences.direct.filter((r) => r.isDaily);
  const regularDirectRefs = groupedReferences.direct.filter((r) => !r.isDaily);

  // Section component
  const Section: React.FC<{
    title: string;
    count: number;
    sectionKey: keyof typeof expandedSections;
    children: React.ReactNode;
  }> = ({ title, count, sectionKey, children }) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="mb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {title}
            </span>
            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
              {count}
            </span>
          </div>
        </button>
        {isExpanded && <div className="mt-2">{children}</div>}
      </div>
    );
  };

  if (references.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Direct References */}
      {groupedReferences.direct.length > 0 && (
        <Section
          title="Direct References"
          count={groupedReferences.direct.length}
          sectionKey="direct"
        >
          {/* Daily Notes subsection */}
          {dailyDirectRefs.length > 0 && (
            <div className="mb-3">
              <button
                onClick={() => toggleSection('dailyNotes')}
                className="w-full flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors rounded"
              >
                {expandedSections.dailyNotes ? (
                  <ChevronDownIcon className="h-3 w-3" />
                ) : (
                  <ChevronRightIcon className="h-3 w-3" />
                )}
                <span>Daily Notes ({dailyDirectRefs.length})</span>
              </button>
              {expandedSections.dailyNotes && (
                <div className="mt-1">
                  {dailyDirectRefs.map((ref) => (
                    <ReferenceItem
                      key={ref.id}
                      reference={ref}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Regular Notes subsection */}
          {regularDirectRefs.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('regularNotes')}
                className="w-full flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors rounded"
              >
                {expandedSections.regularNotes ? (
                  <ChevronDownIcon className="h-3 w-3" />
                ) : (
                  <ChevronRightIcon className="h-3 w-3" />
                )}
                <span>Notes ({regularDirectRefs.length})</span>
              </button>
              {expandedSections.regularNotes && (
                <div className="mt-1">
                  {regularDirectRefs.map((ref) => (
                    <ReferenceItem
                      key={ref.id}
                      reference={ref}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Task References */}
      {groupedReferences.tasks.length > 0 && (
        <Section
          title="Task References"
          count={groupedReferences.tasks.length}
          sectionKey="tasks"
        >
          {groupedReferences.tasks.map((ref) => (
            <ReferenceItem key={ref.id} reference={ref} onNavigate={onNavigate} />
          ))}
        </Section>
      )}

      {/* Unlinked Mentions */}
      {groupedReferences.unlinked.length > 0 && (
        <Section
          title="Unlinked Mentions"
          count={groupedReferences.unlinked.length}
          sectionKey="unlinked"
        >
          {groupedReferences.unlinked.map((ref) => (
            <ReferenceItem
              key={ref.id}
              reference={ref}
              onNavigate={onNavigate}
              onLink={onLink}
            />
          ))}
        </Section>
      )}
    </div>
  );
};
