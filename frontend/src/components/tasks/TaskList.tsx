import { useTasks } from '../../hooks/useTasks';
import { TaskItem } from './TaskItem';
import { TaskFilters } from './TaskFilters';

export const TaskList: React.FC = () => {
  const { tasks, allTasks, filter, setFilter, toggleTask, rescheduleTask } =
    useTasks();

  // Calculate counts for each filter
  const taskCounts = {
    all: allTasks.length,
    active: allTasks.filter((t) => !t.completed && !t.cancelled).length,
    completed: allTasks.filter((t) => t.completed).length,
    today: allTasks.filter((t) => {
      if (!t.date) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(t.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    }).length,
    scheduled: allTasks.filter((t) => t.date !== undefined).length,
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
              <TaskItem
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
