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

// ---- Web: browser notifications, shown while the page is open ----
// Browsers cannot schedule notifications for a closed page, so on web the habit reminders
// are timers that fire while TaskMaster is open in a tab.
const hasWebNotifications = Platform.OS === 'web' && typeof Notification !== 'undefined';
const webTimers = new Map(); // key -> { id, kind: 'timeout' | 'interval' }

function showWebNotification(title, body) {
  try {
    new Notification(title, { body, icon: '/favicon.ico' });
  } catch (error) {
    console.warn('Could not show notification:', error);
  }
}

function clearWebTimer(key) {
  const timer = webTimers.get(key);
  if (!timer) return;
  if (timer.kind === 'interval') clearInterval(timer.id);
  else clearTimeout(timer.id);
  webTimers.delete(key);
}

// Fires at hour:minute every day.
function scheduleDaily(key, slot, title, body) {
  const next = new Date();
  next.setHours(slot.hour, slot.minute, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  const id = setTimeout(() => {
    showWebNotification(title, body);
    scheduleDaily(key, slot, title, body);
  }, next.getTime() - Date.now());
  webTimers.set(key, { id, kind: 'timeout' });
}

function syncWebHabits(habits) {
  if (!hasWebNotifications || Notification.permission !== 'granted') {
    [...webTimers.keys()].forEach(clearWebTimer);
    return;
  }
  const wanted = new Set();
  habits
    .filter((habit) => habit.enabled)
    .forEach((habit) => {
      if (habit.intervalMinutes === TEST_INTERVAL) {
        const key = `${HABIT_PREFIX}${habit.id}-test`;
        wanted.add(key);
        if (webTimers.has(key)) return; // keep the running countdown
        const id = setInterval(
          () => showWebNotification(habit.title, habit.message),
          TEST_INTERVAL * 60 * 1000
        );
        webTimers.set(key, { id, kind: 'interval' });
        return;
      }
      getHabitSlots(habit).forEach((slot, index) => {
        const key = `${HABIT_PREFIX}${habit.id}-${index}`;
        wanted.add(key);
        clearWebTimer(key);
        scheduleDaily(key, slot, habit.title, habit.message);
      });
    });
  [...webTimers.keys()].filter((key) => !wanted.has(key)).forEach(clearWebTimer);
}

// 'granted' | 'denied' (blocked in system settings) | 'undetermined' | 'unsupported' (web)
// | 'expo-go' (Android Expo Go, which has no notification support)
export async function getNotificationStatus() {
  if (Platform.OS === 'web') {
    if (!hasWebNotifications) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return Notification.permission === 'denied' ? 'denied' : 'undetermined';
  }
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
  if (hasWebNotifications) {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
  }
  if (!isSupported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Shows a notification about 5 seconds from now, so notifications can be tried right away.
// Returns { ok: true } or { error } explaining why it cannot work here.
export async function sendTestNotification() {
  if (hasWebNotifications) {
    if (!(await ensurePermission())) {
      return { error: 'Notifications are blocked. Allow them in your browser settings.' };
    }
    setTimeout(
      () => showWebNotification('Drink water', 'This is a test reminder. Notifications are working!'),
      5000
    );
    return { ok: true };
  }
  if (isExpoGoAndroid) {
    return { error: 'Expo Go on Android cannot show notifications. Use a development build.' };
  }
  if (!isSupported) return { error: 'Notifications only work in the mobile app, not the browser.' };
  try {
    if (!(await ensurePermission())) {
      return { error: 'Notifications are blocked. Allow them in your phone settings.' };
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(HABIT_CHANNEL_ID, {
        name: 'Healthy habits',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Drink water', body: 'This is a test reminder. Notifications are working!' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId: HABIT_CHANNEL_ID,
      },
    });
    return { ok: true };
  } catch (error) {
    return { error: 'Could not send the test notification.' };
  }
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
  if (hasWebNotifications) {
    syncWebHabits(habits);
    return;
  }
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
