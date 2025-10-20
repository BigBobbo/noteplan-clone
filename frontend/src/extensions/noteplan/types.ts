/**
 * NotePlan task state types
 */
export type TaskState = 'open' | 'completed' | 'cancelled' | 'scheduled' | 'important';

/**
 * Task state marker mapping
 */
export const TaskStateMarkers: Record<TaskState, string> = {
  open: ' ',
  completed: 'x',
  cancelled: '-',
  scheduled: '>',
  important: '!',
};

/**
 * Reverse mapping: marker to state
 */
export const MarkerToState: Record<string, TaskState> = {
  ' ': 'open',
  '': 'open',
  'x': 'completed',
  'X': 'completed',
  '-': 'cancelled',
  '>': 'scheduled',
  '!': 'important',
};

/**
 * NotePlanTask node attributes
 */
export interface NotePlanTaskAttrs {
  state: TaskState;
  indent: number;
  id?: string | null;
}

/**
 * Helper function to get state from marker
 */
export function getStateFromMarker(marker: string): TaskState {
  return MarkerToState[marker] || 'open';
}

/**
 * Helper function to get marker from state
 */
export function getMarkerFromState(state: TaskState): string {
  return TaskStateMarkers[state];
}

/**
 * Helper function to cycle to next task state
 * Open → Completed → Cancelled → Open
 * Special states (scheduled, important) → Completed
 */
export function getNextState(currentState: TaskState): TaskState {
  switch (currentState) {
    case 'open':
      return 'completed';
    case 'completed':
      return 'cancelled';
    case 'cancelled':
      return 'open';
    case 'scheduled':
    case 'important':
      return 'completed';
    default:
      return 'open';
  }
}
