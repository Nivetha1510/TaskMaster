import { DEFAULT_ESTIMATE, DEFAULT_PRIORITY, getPriorityLabel } from '../data/taskOptions';
import { getDueDateTime } from './date';

const DAY_MS = 24 * 60 * 60 * 1000;
const PRIORITY_POINTS = { high: 30, medium: 20, low: 10 };

const startOfDay = (value) => {
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  return day;
};

// How long the task is expected to take; tasks with no estimate get a default.
export const getTaskMinutes = (task) => task.estimate ?? DEFAULT_ESTIMATE;

// Deadline urgency: points plus a short label (null when there is no deadline).
function getDeadlineInfo(task, now) {
  if (!task.dueDate) return { points: 0, label: null };

  const dueDay = startOfDay(task.dueDate).getTime();
  const today = startOfDay(now).getTime();
  const isOverdue = task.dueTime ? getDueDateTime(task) < now : dueDay < today;
  if (isOverdue) return { points: 60, label: 'Overdue' };

  const daysAway = Math.round((dueDay - today) / DAY_MS);
  if (daysAway === 0) return { points: 45, label: 'Due today' };
  if (daysAway === 1) return { points: 30, label: 'Due tomorrow' };
  if (daysAway <= 3) return { points: 20, label: `Due in ${daysAway} days` };
  if (daysAway <= 7) return { points: 15, label: `Due in ${daysAway} days` };
  return { points: 5, label: `Due in ${daysAway} days` };
}

// Pending tasks that fit in `availableMinutes` (null = any amount of time), best first.
// Score = priority + deadline urgency + a small bonus for pinned tasks and for using
// the free time well. Each result is { task, score, reason, minutes }.
export function getRecommendations(tasks, availableMinutes = null, now = new Date()) {
  return tasks
    .filter((task) => !task.completed)
    .filter((task) => availableMinutes === null || getTaskMinutes(task) <= availableMinutes)
    .map((task) => {
      const priority = task.priority ?? DEFAULT_PRIORITY;
      const deadline = getDeadlineInfo(task, now);
      const minutes = getTaskMinutes(task);

      let score = PRIORITY_POINTS[priority] + deadline.points;
      if (task.pinned) score += 5;
      if (availableMinutes !== null) score += Math.round((minutes / availableMinutes) * 10);

      const reason = [deadline.label, `${getPriorityLabel(priority)} priority`]
        .filter(Boolean)
        .join(' · ');
      return { task, score, reason, minutes };
    })
    .sort((a, b) => b.score - a.score);
}
