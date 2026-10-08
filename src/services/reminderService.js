import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { getDueDateTime } from '../utils/date';
import { TEST_INTERVAL, getHabitSlots } from '../data/habits';

const CHANNEL_ID = 'reminders';
const ID_PREFIX = 'task-reminder-';
const SUMMARY_ID = 'daily-summary';
const HABIT_CHANNEL_ID = 'habits';
const HABIT_PREFIX = 'habit-';

// expo-notifications does not work on web, and on Android it crashes the moment it is
// imported inside Expo Go (SDK 53+). So it is only loaded where it can run; use a
// development build to get reminders on Android.
const isExpoGoAndroid = Platform.OS === 'android' && isRunningInExpoGo();
const isSupported = Platform.OS !== 'web' && !isExpoGoAndroid;

let Notifications = null;
if (isSupported) {
  Notifications = require('expo-notifications');
}

if (isSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// 'granted' | 'denied' (blocked in system settings) | 'undetermined' | 'unsupported' (web)
// | 'expo-go' (Android Expo Go, which has no notification support)
export async function getNotificationStatus() {
  if (isExpoGoAndroid) return 'expo-go';
  if (!isSupported) return 'unsupported';
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return 'granted';
    return current.canAskAgain ? 'undetermined' : 'denied';
  } catch (error) {
    console.warn('Could not read notification permission:', error);
    return 'undetermined';
  }
}

// Asks for permission if it has not been decided yet. Returns true when notifications are allowed.
export async function ensurePermission() {
  if (!isSupported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// When the reminder should fire, or null if there is nothing to schedule.
function getReminderDate(task) {
  if (task.completed || task.reminder === null || task.reminder === undefined) return null;
  const due = getDueDateTime(task);
  if (!due) return null;
  const reminderDate = new Date(due.getTime() - task.reminder * 60 * 1000);
  return reminderDate.getTime() > Date.now() ? reminderDate : null;
}

// Pending tasks due today or already overdue.
function countDueToday(tasks) {
  const tomorrowStart = new Date();
  tomorrowStart.setHours(0, 0, 0, 0);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  return tasks.filter(
    (task) => !task.completed && task.dueDate && new Date(task.dueDate) < tomorrowStart
  ).length;
}

function getSummaryBody(count) {
  if (count === 0) return 'Nothing due today. Enjoy your day!';
  return `You have ${count} ${count === 1 ? 'task' : 'tasks'} due today.`;
}

// Makes the scheduled notifications match the app state:
// - one reminder per pending task that has a future reminder (when reminders are on)
// - one repeating daily summary at `summaryTime` (when the summary is on)
// A fixed identifier per notification means re-scheduling replaces the old one.
// The summary text is refreshed whenever the tasks change, so it can be out of date
// if the app has not been opened for a while.
export async function syncReminders(
  tasks,
  { remindersEnabled = true, dailySummary = false, summaryTime = '08:00', habits = [] } = {}
) {
  if (!isSupported) return;
  try {
    const wanted = (remindersEnabled ? tasks : [])
      .map((task) => ({ task, date: getReminderDate(task) }))
      .filter((item) => item.date);
    const wantedIds = new Set(wanted.map(({ task }) => `${ID_PREFIX}${task.id}`));
    if (dailySummary) wantedIds.add(SUMMARY_ID);

    // Habit reminders: one repeating daily notification per time slot of each enabled habit.
    const habitRequests = habits
      .filter((habit) => habit.enabled)
      .flatMap((habit) =>
        getHabitSlots(habit).map((slot, index) => ({
          identifier: `${HABIT_PREFIX}${habit.id}-${index}`,
          habit,
          slot,
        }))
      );
    habitRequests.forEach(({ identifier }) => wantedIds.add(identifier));

    // Test habits repeat every few minutes from now, so they can be tried without waiting.
    const testHabits = habits.filter(
      (habit) => habit.enabled && habit.intervalMinutes === TEST_INTERVAL
    );
    testHabits.forEach((habit) => wantedIds.add(`${HABIT_PREFIX}${habit.id}-test`));

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter(
          (n) =>
            (n.identifier.startsWith(ID_PREFIX) ||
              n.identifier.startsWith(HABIT_PREFIX) ||
              n.identifier === SUMMARY_ID) &&
            !wantedIds.has(n.identifier)
        )
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );

    if (wantedIds.size === 0) return;
    if (!(await ensurePermission())) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Task reminders',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    if (Platform.OS === 'android' && (habitRequests.length > 0 || testHabits.length > 0)) {
      await Notifications.setNotificationChannelAsync(HABIT_CHANNEL_ID, {
        name: 'Healthy habits',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const requests = wanted.map(({ task, date }) =>
      Notifications.scheduleNotificationAsync({
        identifier: `${ID_PREFIX}${task.id}`,
        content: { title: 'Task reminder', body: task.title },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: CHANNEL_ID,
        },
      })
    );

    if (dailySummary) {
      const [hour, minute] = summaryTime.split(':').map(Number);
      requests.push(
        Notifications.scheduleNotificationAsync({
          identifier: SUMMARY_ID,
          content: { title: 'Your day', body: getSummaryBody(countDueToday(tasks)) },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: CHANNEL_ID,
          },
        })
      );
    }

    // Re-scheduling would restart the countdown, so leave an existing test reminder alone.
    testHabits.forEach((habit) => {
      const identifier = `${HABIT_PREFIX}${habit.id}-test`;
      if (scheduled.some((n) => n.identifier === identifier)) return;
      requests.push(
        Notifications.scheduleNotificationAsync({
          identifier,
          content: { title: habit.title, body: habit.message },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: TEST_INTERVAL * 60,
            repeats: true,
            channelId: HABIT_CHANNEL_ID,
          },
        })
      );
    });

    habitRequests.forEach(({ identifier, habit, slot }) => {
      requests.push(
        Notifications.scheduleNotificationAsync({
          identifier,
          content: { title: habit.title, body: habit.message },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: slot.hour,
            minute: slot.minute,
            channelId: HABIT_CHANNEL_ID,
          },
        })
      );
    });

    await Promise.all(requests);
  } catch (error) {
    console.warn('Could not update reminders:', error);
  }
}
