const pad = (number) => String(number).padStart(2, '0');

export function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatIsoDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}


// Reminders for tasks that have a date but no time fire at this hour.
export const DEFAULT_DUE_HOUR = 9;

// '14:05' -> '2:05 PM'
export function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${pad(minutes)} ${period}`;
}

// 'DD/MM/YYYY' plus ' at h:mm AM' when the task has a due time.
export function formatDueDate(task) {
  if (!task.dueDate) return '';
  const date = formatDate(task.dueDate);
  return task.dueTime ? `${date} at ${formatTime(task.dueTime)}` : date;
}

// The exact moment a task is due, or null when it has no due date.
export function getDueDateTime(task) {
  if (!task.dueDate) return null;
  const due = new Date(task.dueDate);
  const [hours, minutes] = task.dueTime
    ? task.dueTime.split(':').map(Number)
    : [DEFAULT_DUE_HOUR, 0];
  due.setHours(hours, minutes, 0, 0);
  return due;
}


// The next due date for a repeating task, as an ISO string. It keeps stepping forward
// until the date is no longer in the past, so an overdue task does not return overdue.
export function getNextDueDate(isoString, repeat) {
  const original = new Date(isoString);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  let next = new Date(original);
  let step = 0;
  do {
    step += 1;
    if (repeat === 'monthly') {
      // Clamp the day so Jan 31 + 1 month is the end of February, not March.
      const target = new Date(original.getFullYear(), original.getMonth() + step, 1);
      const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      next = new Date(target);
      next.setDate(Math.min(original.getDate(), lastDay));
      next.setHours(original.getHours(), original.getMinutes(), 0, 0);
    } else {
      next = new Date(original);
      next.setDate(original.getDate() + step * (repeat === 'weekly' ? 7 : 1));
    }
  } while (next < startOfToday);

  return next.toISOString();
}
