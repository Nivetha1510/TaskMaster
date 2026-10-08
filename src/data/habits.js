import { formatTime } from '../utils/date';

// A habit reminder repeats every `intervalMinutes` between `startTime` and `endTime`
// (24-hour 'HH:MM'), every day.

// Repeating local notifications are scheduled one per time slot, and phones cap how many
// can be scheduled at once (iOS: 64), so each habit is limited to this many per day.
export const MAX_SLOTS_PER_HABIT = 20;

// For testing: repeats every 2 minutes starting right away, ignoring the start/end hours.
export const TEST_INTERVAL = 2;

export const INTERVAL_OPTIONS = [
  { value: TEST_INTERVAL, label: '2 min (test)' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '90 min' },
  { value: 120, label: '2 hours' },
];

export const HABIT_PRESETS = [
  {
    icon: 'water',
    title: 'Drink water',
    message: 'Time to drink a glass of water.',
    intervalMinutes: 60,
    startTime: '08:00',
    endTime: '20:00',
  },
  {
    icon: 'walk',
    title: 'Walk and fresh air',
    message: "You've been sitting for a while. Take a short walk and get some fresh air.",
    intervalMinutes: 60,
    startTime: '10:00',
    endTime: '17:00',
  },
  {
    icon: 'body',
    title: 'Stretch',
    message: 'Stand up and stretch your neck, shoulders and back.',
    intervalMinutes: 90,
    startTime: '09:00',
    endTime: '18:00',
  },
  {
    icon: 'eye',
    title: 'Rest your eyes',
    message: 'Look at something 20 feet away for 20 seconds.',
    intervalMinutes: 30,
    startTime: '09:00',
    endTime: '18:00',
  },
];

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Every time of day the habit should fire: [{ hour, minute }, ...].
export function getHabitSlots(habit) {
  if (habit.intervalMinutes === TEST_INTERVAL) return [];
  const start = toMinutes(habit.startTime);
  const end = toMinutes(habit.endTime);
  const slots = [];
  for (let at = start; at <= end && slots.length < MAX_SLOTS_PER_HABIT; at += habit.intervalMinutes) {
    slots.push({ hour: Math.floor(at / 60), minute: at % 60 });
  }
  return slots;
}

export const formatInterval = (minutes) =>
  INTERVAL_OPTIONS.find((option) => option.value === minutes)?.label ?? `${minutes} min`;

// "Every 1 hour, 9:00 AM - 6:00 PM"
export const describeHabit = (habit) =>
  habit.intervalMinutes === TEST_INTERVAL
    ? 'Every 2 min (test), starts right away'
    : `Every ${formatInterval(habit.intervalMinutes)}, ${formatTime(habit.startTime)} - ${formatTime(habit.endTime)}`;

// True when the window is too short to hold even one reminder, or end is before start.
export const isValidWindow = (habit) => toMinutes(habit.endTime) >= toMinutes(habit.startTime);
