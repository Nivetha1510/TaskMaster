import { formatDate, formatTime } from './date';

// More than this many pending tasks on one day counts as an overloaded day.
export const MAX_TASKS_PER_DAY = 10;

const startOfDay = (value) => {
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
};

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// A task occupies [start, start + estimate). Without an estimate it counts as a single
// minute, so two tasks only clash when they start at the same time.
const getSpan = (task) => {
  const start = toMinutes(task.dueTime);
  return { start, end: start + Math.max(task.estimate ?? 0, 1) };
};

const overlaps = (a, b) => a.start < b.end && b.start < a.end;

// Checks a task that is about to be saved against the existing ones.
// `candidate` is { id?, dueDate (ISO string or Date), dueTime, estimate }.
// Returns { clashes, dayCount, isOverloaded, messages }:
//   clashes      pending tasks on the same day whose time overlaps
//   dayCount     pending tasks on that day including the candidate
//   isOverloaded dayCount is above MAX_TASKS_PER_DAY
//   messages     short sentences ready to show to the user
export function detectConflicts(tasks, candidate) {
  const none = { clashes: [], dayCount: 0, isOverloaded: false, messages: [] };
  if (!candidate.dueDate) return none;

  const day = startOfDay(candidate.dueDate);
  const sameDay = tasks.filter(
    (task) =>
      task.id !== candidate.id &&
      !task.completed &&
      !task.archived &&
      task.dueDate &&
      startOfDay(task.dueDate) === day
  );

  const clashes = candidate.dueTime
    ? sameDay.filter(
        (task) => task.dueTime && overlaps(getSpan(candidate), getSpan(task))
      )
    : [];

  const dayCount = sameDay.length + 1;
  const isOverloaded = dayCount > MAX_TASKS_PER_DAY;

  const messages = [];
  clashes.slice(0, 3).forEach((task) => {
    messages.push(`"${task.title}" is also scheduled at ${formatTime(task.dueTime)}.`);
  });
  if (clashes.length > 3) messages.push(`${clashes.length - 3} more tasks overlap this time.`);
  if (isOverloaded) {
    messages.push(
      `${formatDate(candidate.dueDate)} would have ${dayCount} tasks, more than ${MAX_TASKS_PER_DAY}.`
    );
  }
  return { clashes, dayCount, isOverloaded, messages };
}
