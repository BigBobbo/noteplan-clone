import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: {
      type: 'timeblock',
      block,
    },
  });

  const [clickStart, setClickStart] = React.useState<number>(0);

  const handleMouseDown = () => {
    setClickStart(Date.now());
  };

  const handleClick = (e: React.MouseEvent) => {
    const clickDuration = Date.now() - clickStart;
    // Only trigger edit if it was a quick click (not a drag)
    // and not currently dragging
    if (clickDuration < 200 && !isDragging && onEdit) {
      e.stopPropagation();
      onEdit(block);
    }
  };

  const style = {
    top: `${top}px`,
    height: `${Math.max(height, 24)}px`,
    // Apply transform while dragging for visual feedback
    ...(transform && {
      transform: CSS.Translate.toString(transform),
    }),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={clsx(
        'absolute left-12 right-2 bg-blue-500/90 hover:bg-blue-600/90 rounded-md px-3 py-2 cursor-grab active:cursor-grabbing transition-colors border border-blue-600 shadow-sm',
        {
          'opacity-90': height < 30,
          'cursor-grabbing': isDragging,
        }
      )}
      style={style}
      onMouseDown={handleMouseDown}
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
