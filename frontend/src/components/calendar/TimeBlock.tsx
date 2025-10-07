import React from 'react';
import type { TimeBlock as TimeBlockType } from '../../utils/timeBlockUtils';
import { calculateBlockPosition } from '../../utils/timeBlockUtils';
import clsx from 'clsx';

interface TimeBlockProps {
  block: TimeBlockType;
  hourHeight?: number;
  onEdit?: (block: TimeBlockType) => void;
}

export const TimeBlock: React.FC<TimeBlockProps> = ({
  block,
  hourHeight = 60,
  onEdit,
}) => {
  const { top, height } = calculateBlockPosition(block, hourHeight);

  const handleClick = () => {
    if (onEdit) {
      onEdit(block);
    }
  };

  return (
    <div
      className={clsx(
        'absolute left-12 right-2 bg-blue-500/90 hover:bg-blue-600/90 rounded-md px-3 py-2 cursor-pointer transition-colors border border-blue-600 shadow-sm',
        {
          'opacity-90': height < 30,
        }
      )}
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 24)}px`,
      }}
      onClick={handleClick}
    >
      <div className="text-white text-sm font-medium truncate">
        {block.description}
      </div>
      {height > 40 && (
        <div className="text-blue-100 text-xs mt-1">
          {block.start} - {block.end}
        </div>
      )}
    </div>
  );
};
