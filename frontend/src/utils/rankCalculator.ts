import type { ParsedTask } from '../services/taskService';

/**
 * Calculate new rank for task being moved to specific position
 */
export const calculateNewRank = (
  targetIndex: number,
  tasks: ParsedTask[]
): number => {
  // Moving to top
  if (targetIndex === 0) {
    const firstRank = tasks[0]?.rank ?? 1000;
    return firstRank - 1000;
  }

  // Moving to bottom
  if (targetIndex >= tasks.length) {
    const lastRank = tasks[tasks.length - 1]?.rank ?? 0;
    return lastRank + 1000;
  }

  // Moving between two tasks
  const prevRank = tasks[targetIndex - 1]?.rank ?? 0;
  const nextRank = tasks[targetIndex]?.rank ?? prevRank + 2000;
  return (prevRank + nextRank) / 2;
};

/**
 * Re-rank all tasks with evenly distributed values
 * Called when ranks get too close together
 */
export const reRankTasks = (tasks: ParsedTask[]): Map<string, number> => {
  const ranks = new Map<string, number>();
  const step = 1000;

  tasks.forEach((task, index) => {
    ranks.set(task.id, (index + 1) * step);
  });

  return ranks;
};

/**
 * Check if re-ranking is needed
 */
export const needsReRanking = (tasks: ParsedTask[]): boolean => {
  for (let i = 0; i < tasks.length - 1; i++) {
    const diff = Math.abs((tasks[i].rank ?? 0) - (tasks[i + 1].rank ?? 0));
    if (diff < 0.001) return true;
  }
  return false;
};
