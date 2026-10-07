const startOfDay = (value) => {
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  return day;
};

const dayKey = (value) => startOfDay(value).getTime();

// Number of tasks completed on each calendar day, keyed by start-of-day timestamp.
function completionsByDay(tasks) {
  const counts = new Map();
  tasks.forEach((task) => {
    if (!task.completed || !task.completedAt) return;
    const key = dayKey(task.completedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

const previousDay = (key) => {
  const date = new Date(key);
  date.setDate(date.getDate() - 1);
  return date.getTime();
};

// Consecutive days with at least one completed task. Today not being finished yet
// does not break the streak - it counts back from yesterday in that case.
export function getStreak(tasks, now = new Date()) {
  const counts = completionsByDay(tasks);
  let cursor = dayKey(now);
  if (!counts.has(cursor)) cursor = previousDay(cursor);
  let streak = 0;
  while (counts.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}

// The last 7 days, oldest first: { key, label, completed, focusMinutes, isToday }.
export function getWeekStats(tasks, sessions, now = new Date()) {
  const counts = completionsByDay(tasks);
  const focus = new Map();
  sessions.forEach((session) => {
    const key = dayKey(session.endedAt);
    focus.set(key, (focus.get(key) ?? 0) + session.minutes);
  });

  const today = startOfDay(now);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.getTime();
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3),
      completed: counts.get(key) ?? 0,
      focusMinutes: focus.get(key) ?? 0,
      isToday: index === 6,
    };
  });
}

// Hour of day (0-23) with the most completions, or null when there is no data.
export function getBestHour(tasks) {
  const hours = new Array(24).fill(0);
  tasks.forEach((task) => {
    if (task.completed && task.completedAt) hours[new Date(task.completedAt).getHours()] += 1;
  });
  const max = Math.max(...hours);
  return max === 0 ? null : hours.indexOf(max);
}

export function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12} ${period}`;
}
