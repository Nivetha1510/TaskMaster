import { getDueDateTime, formatTime } from './date';

const startOfDay = (date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

// The in-app notification list: pending tasks that need attention right now.
//   overdue  - past its due date (or due time, when it has one)
//   today    - due today and not overdue yet
//   reminder - its reminder time has passed, but it is due later than today
// A cleared alert stays hidden until it changes kind (for example due today -> overdue).
// `dismissed` maps taskId -> the kind that was cleared.
export const withoutDismissed = (alerts, dismissed = {}) =>
  alerts.filter(({ task, kind }) => dismissed[task.id] !== kind);

// Sorted with overdue first, then by due time.
export function getTaskAlerts(tasks, remindersEnabled = true, now = new Date()) {
  const today = startOfDay(now).getTime();
  const alerts = [];

  tasks.forEach((task) => {
    if (task.completed || !task.dueDate) return;

    const due = getDueDateTime(task);
    const dueDay = startOfDay(task.dueDate).getTime();

    // Without a due time, a task is only overdue once its day has passed.
    const isOverdue = task.dueTime ? due < now : dueDay < today;

    if (isOverdue) {
      alerts.push({ task, kind: 'overdue', label: 'Overdue', due });
    } else if (dueDay === today) {
      alerts.push({
        task,
        kind: 'today',
        label: task.dueTime ? `Today ${formatTime(task.dueTime)}` : 'Today',
        due,
      });
    } else if (
      remindersEnabled &&
      task.reminder !== null &&
      task.reminder !== undefined &&
      due.getTime() - task.reminder * 60 * 1000 <= now.getTime()
    ) {
      alerts.push({ task, kind: 'reminder', label: 'Reminder', due });
    }
  });

  const rank = { overdue: 0, today: 1, reminder: 2 };
  return alerts.sort((a, b) => rank[a.kind] - rank[b.kind] || a.due - b.due);
}
