export const DEFAULT_PRIORITY = 'medium';

export const DEFAULT_SETTINGS = {
  remindersEnabled: true,
  dailySummary: false,
  summaryTime: '08:00', // 'HH:MM', 24-hour
  defaultPriority: DEFAULT_PRIORITY,
  dismissedAlerts: {}, // taskId -> alert kind the user cleared from the Profile list
  habits: [], // repeating healthy-habit reminders, see data/habits.js
};

export const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const PRIORITY_COLOR_KEYS = {
  high: 'priorityHigh',
  medium: 'priorityMedium',
  low: 'priorityLow',
};

// `colors` is the current theme's palette. Tasks saved before priorities existed
// have no priority, so they count as medium.
export const getPriorityColor = (priority, colors) =>
  colors[PRIORITY_COLOR_KEYS[priority] ?? PRIORITY_COLOR_KEYS[DEFAULT_PRIORITY]];

export const getPriorityLabel = (priority) =>
  PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? 'Medium';

// value = minutes before the due time; null = no reminder
export const REMINDER_OPTIONS = [
  { value: null, label: 'None' },
  { value: 0, label: 'At due time' },
  { value: 10, label: '10 min before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export const getReminderLabel = (reminder) =>
  REMINDER_OPTIONS.find((option) => option.value === (reminder ?? null))?.label ?? 'None';

export const PRIORITY_FILTER_OPTIONS = [
  { value: 'all', label: 'Any priority' },
  ...PRIORITY_OPTIONS,
];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently added' },
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'alpha', label: 'A–Z' },
];

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };
export const getPriorityRank = (priority) =>
  PRIORITY_RANK[priority] ?? PRIORITY_RANK[DEFAULT_PRIORITY];

// value = how often a task comes back once completed; null = never
export const REPEAT_OPTIONS = [
  { value: null, label: 'Never' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const getRepeatLabel = (repeat) =>
  REPEAT_OPTIONS.find((option) => option.value === (repeat ?? null))?.label ?? 'Never';

// value = minutes the task takes; null = no estimate
export const ESTIMATE_OPTIONS = [
  { value: null, label: 'Not set' },
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
];

// Tasks without an estimate are assumed to take this long when matching them to free time.
export const DEFAULT_ESTIMATE = 15;

export const formatEstimate = (minutes) =>
  minutes % 60 === 0 && minutes >= 60 ? `${minutes / 60} hr` : `${minutes} min`;

export const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];
