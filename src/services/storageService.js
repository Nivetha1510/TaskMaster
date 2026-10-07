import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  users: '@taskmaster/users',
  session: '@taskmaster/session',
  // Data saved before accounts existed; the first account created takes it over.
  legacyTasks: '@taskmaster/tasks',
  legacyCategories: '@taskmaster/categories',
};

const userKeys = (userId) => ({
  tasks: `@taskmaster/${userId}/tasks`,
  categories: `@taskmaster/${userId}/categories`,
  settings: `@taskmaster/${userId}/settings`,
  focus: `@taskmaster/${userId}/focus`,
});

async function readJson(key, fallback = null) {
  try {
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key}:`, error);
    return fallback;
  }
}

async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save ${key}:`, error);
  }
}

// ---- Per-user app data ----

export async function loadData(userId) {
  const keys = userKeys(userId);
  const [tasks, categories, settings] = await Promise.all([
    readJson(keys.tasks),
    readJson(keys.categories),
    readJson(keys.settings),
  ]);
  return { tasks, categories, settings };
}

export const saveTasks = (userId, tasks) => writeJson(userKeys(userId).tasks, tasks);
export const saveCategories = (userId, categories) =>
  writeJson(userKeys(userId).categories, categories);
export const saveSettings = (userId, settings) =>
  writeJson(userKeys(userId).settings, settings);

export const loadFocusSessions = async (userId) =>
  (await readJson(userKeys(userId).focus, [])) ?? [];
export const saveFocusSessions = (userId, sessions) =>
  writeJson(userKeys(userId).focus, sessions);

export async function claimLegacyData(userId) {
  const [tasks, categories] = await Promise.all([
    readJson(KEYS.legacyTasks),
    readJson(KEYS.legacyCategories),
  ]);
  if (tasks) await saveTasks(userId, tasks);
  if (categories) await saveCategories(userId, categories);
  try {
    await AsyncStorage.multiRemove([KEYS.legacyTasks, KEYS.legacyCategories]);
  } catch (error) {
    console.warn('Could not clear old data:', error);
  }
}

export async function removeUserData(userId) {
  try {
    await AsyncStorage.multiRemove(Object.values(userKeys(userId)));
  } catch (error) {
    console.warn('Could not remove account data:', error);
  }
}

// ---- Accounts and session ----

export const loadUsers = () => readJson(KEYS.users, []);
export const saveUsers = (users) => writeJson(KEYS.users, users);

export async function loadSessionUserId() {
  try {
    return await AsyncStorage.getItem(KEYS.session);
  } catch (error) {
    console.warn('Could not read session:', error);
    return null;
  }
}

export async function saveSessionUserId(userId) {
  try {
    if (userId) await AsyncStorage.setItem(KEYS.session, userId);
    else await AsyncStorage.removeItem(KEYS.session);
  } catch (error) {
    console.warn('Could not save session:', error);
  }
}
