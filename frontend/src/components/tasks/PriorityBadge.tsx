import clsx from 'clsx';

interface PriorityBadgeProps {
  priority: 1 | 2 | 3 | 4;
  size?: 'sm' | 'md';
}

const priorityConfig = {
  1: {
    label: 'P1',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-300',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  2: {
    label: 'P2',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-800 dark:text-orange-300',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  3: {
    label: 'P3',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-800 dark:text-yellow-300',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  4: {
    label: 'P4',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-800 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'sm',
}) => {
  const config = priorityConfig[priority];

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded border font-medium',
        config.bgColor,
        config.textColor,
        config.borderColor,
        size === 'sm' && 'px-1.5 py-0.5 text-xs',
        size === 'md' && 'px-2 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  );
};
