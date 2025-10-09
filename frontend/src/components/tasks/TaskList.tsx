import { useTasks } from '../../hooks/useTasks';
import { TaskTreeItem } from './TaskTreeItem';
import { TaskFilters } from './TaskFilters';
import type { ParsedTask } from '../../services/taskService';

export const TaskList: React.FC = () => {
  const { tasks, allTasks, filter, setFilter, toggleTask, rescheduleTask } =
    useTasks();

  // Recursively count tasks
  const countTasks = (tasks: ParsedTask[]): number => {
    return tasks.reduce((count, task) => {
      return count + 1 + countTasks(task.children);
    }, 0);
  };

  // Recursively count tasks matching a filter
  const countFilteredTasks = (
    tasks: ParsedTask[],
    filterFn: (task: ParsedTask) => boolean
  ): number => {
    return tasks.reduce((count, task) => {
      const matches = filterFn(task) ? 1 : 0;
      return count + matches + countFilteredTasks(task.children, filterFn);
    }, 0);
  };

  // Calculate counts for each filter
  const taskCounts = {
    all: countTasks(allTasks),
    active: countFilteredTasks(
      allTasks,
      (t) => !t.completed && !t.cancelled
    ),
    completed: countFilteredTasks(allTasks, (t) => t.completed),
    today: countFilteredTasks(allTasks, (t) => {
      if (!t.date) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(t.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    }),
    scheduled: countFilteredTasks(allTasks, (t) => t.date !== undefined),
  };

  const handleReschedule = (taskId: string) => {
    // For now, we'll just use today's date
    // In a real implementation, we'd show a date picker
    const today = new Date();
    rescheduleTask(taskId, today);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tasks
        </h2>
      </div>

      <TaskFilters
        currentFilter={filter}
        onFilterChange={setFilter}
        taskCounts={taskCounts}
      />

      <div className="flex-1 overflow-y-auto p-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No tasks found</p>
            <p className="text-xs mt-1">
              Create tasks by starting a line with *
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <TaskTreeItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onReschedule={handleReschedule}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
