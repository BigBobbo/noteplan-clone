import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useFolderStore } from '../../store/folderStore';
import clsx from 'clsx';

interface BreadcrumbNavProps {
  currentPath?: string | null;
  onNavigate?: (path: string) => void;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  currentPath,
  onNavigate,
}) => {
  const { selectFolder } = useFolderStore();

  // Parse the current path into breadcrumb segments
  const pathSegments = currentPath
    ? currentPath.split('/').filter(seg => seg.length > 0)
    : [];

  const handleNavigate = (index: number) => {
    if (index === -1) {
      // Navigate to root
      selectFolder(null);
      onNavigate?.('');
    } else {
      // Navigate to specific segment
      const targetPath = pathSegments.slice(0, index + 1).join('/');
      selectFolder(targetPath);
      onNavigate?.(targetPath);
    }
  };

  if (!currentPath || pathSegments.length === 0) {
    return (
      <div className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
        <HomeIcon className="h-4 w-4" />
        <span>All Notes</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
      {/* Home/Root */}
      <button
        onClick={() => handleNavigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex-shrink-0"
        title="Go to root"
      >
        <HomeIcon className="h-4 w-4" />
      </button>

      {/* Path segments */}
      {pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;

        return (
          <React.Fragment key={index}>
            {/* Separator */}
            <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />

            {/* Segment */}
            <button
              onClick={() => handleNavigate(index)}
              className={clsx(
                'text-sm transition-colors whitespace-nowrap',
                isLast
                  ? 'font-semibold text-amber-600 dark:text-amber-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400'
              )}
              title={pathSegments.slice(0, index + 1).join(' / ')}
            >
              {segment}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
