import { useRef, useCallback } from 'react';

export const useDebouncedSave = (delay = 300) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSave = useCallback(
    (callback: () => void) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback();
      }, delay);
    },
    [delay]
  );

  return debouncedSave;
};
