const STORAGE_KEY_PREFIX = 'taskOrder:';
const CLEANUP_INTERVAL = 100; // operations between cleanups
let operationCount = 0;

export interface TaskOrderData {
  [taskId: string]: number | undefined; // rank or metadata
}

export const saveTaskOrder = (
  filePath: string,
  ranks: Map<string, number>
): void => {
  try {
    const data: TaskOrderData = {
      ...Object.fromEntries(ranks),
      _lastUpdated: Date.now(),
    };

    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${filePath}`,
      JSON.stringify(data)
    );

    operationCount++;
    if (operationCount >= CLEANUP_INTERVAL) {
      cleanupOldEntries();
      operationCount = 0;
    }
  } catch (error: any) {
    console.error('Failed to save task order:', error);
    // Handle quota exceeded
    if (error.name === 'QuotaExceededError') {
      cleanupOldEntries();
      // Retry save
      try {
        const data: TaskOrderData = {
          ...Object.fromEntries(ranks),
          _lastUpdated: Date.now(),
        };
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}${filePath}`,
          JSON.stringify(data)
        );
      } catch (retryError) {
        console.error('Failed to save after cleanup:', retryError);
      }
    }
  }
};

export const loadTaskOrder = (filePath: string): Map<string, number> => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${filePath}`);
    if (!stored) return new Map();

    const data: TaskOrderData = JSON.parse(stored);
    const { _lastUpdated, ...ranks } = data;

    return new Map(Object.entries(ranks).map(([k, v]) => [k, Number(v)]));
  } catch (error) {
    console.error('Failed to load task order:', error);
    return new Map();
  }
};

export const clearTaskOrder = (filePath: string): void => {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${filePath}`);
};

/**
 * Remove entries older than 30 days
 */
const cleanupOldEntries = (): void => {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith(STORAGE_KEY_PREFIX)) return;

    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      if (data._lastUpdated && now - data._lastUpdated > thirtyDaysMs) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      // Remove corrupted entries
      localStorage.removeItem(key);
    }
  });
};

/**
 * Clean up orphaned task ranks (tasks that no longer exist)
 */
export const cleanupOrphanedRanks = (
  filePath: string,
  validTaskIds: string[]
): void => {
  const ranks = loadTaskOrder(filePath);
  const validSet = new Set(validTaskIds);
  let modified = false;

  // Remove ranks for tasks that no longer exist
  ranks.forEach((_, taskId) => {
    if (!validSet.has(taskId)) {
      ranks.delete(taskId);
      modified = true;
    }
  });

  if (modified) {
    saveTaskOrder(filePath, ranks);
  }
};
