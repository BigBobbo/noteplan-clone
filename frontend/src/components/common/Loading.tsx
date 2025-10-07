import React from 'react';
import clsx from 'clsx';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  const spinner = (
    <div
      className={clsx(
        'animate-spin rounded-full border-amber-500 border-t-transparent',
        sizeClasses[size]
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 z-50">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          {text && (
            <p className="text-sm text-gray-600 dark:text-gray-300">{text}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-2">
        {spinner}
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-300">{text}</p>
        )}
      </div>
    </div>
  );
};
