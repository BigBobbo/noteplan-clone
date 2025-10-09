import React from 'react';
import { useLinkStore } from '../../store/linkStore';
import { toShortDisplayDate } from '../../utils/dateUtils';
import { useFileStore } from '../../store/fileStore';

interface BacklinksPanelProps {
  taskId: string;
  taskText: string;
}

export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({ taskId, taskText }) => {
  const { getTaskBacklinks, navigateToTask } = useLinkStore();
  const { loadFile } = useFileStore();
  const backlinks = getTaskBacklinks(taskId);

  if (backlinks.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          References
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No references yet. Drag this task to the calendar to create a reference.
        </p>
      </div>
    );
  }

  const handleReferenceClick = async (reference: any) => {
    // Navigate to the daily note that contains the reference
    const datePath = `Calendar/${reference.date.toISOString().split('T')[0].replace(/-/g, '')}.txt`;
    await loadFile(datePath);
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Referenced in {backlinks.length} {backlinks.length === 1 ? 'note' : 'notes'}
      </h4>

      <div className="space-y-2">
        {backlinks.map((ref) => (
          <div
            key={ref.id}
            className="group flex items-start gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            onClick={() => handleReferenceClick(ref)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {ref.type === 'timeblock' ? (
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  {toShortDisplayDate(ref.date)}
                </span>
                {ref.type === 'timeblock' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Time Block
                  </span>
                )}
              </div>

              {ref.timeBlock && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {ref.timeBlock.start} - {ref.timeBlock.end} ({ref.timeBlock.duration} min)
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
