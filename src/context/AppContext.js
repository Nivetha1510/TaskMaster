import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { loadData, saveTasks, saveCategories, saveSettings } from '../services/storageService';
import { SEED_CATEGORIES } from '../data/seedData';
import { generateId } from '../utils/id';
import { syncReminders } from '../services/reminderService';
import { DEFAULT_PRIORITY, DEFAULT_SETTINGS } from '../data/taskOptions';
import { getNextDueDate } from '../utils/date';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load the signed-in user's data. New accounts start with the default categories.
  // Logging out empties everything and cancels the reminders.
  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setCategories([]);
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(true);
      syncReminders([]);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    async function init() {
      const stored = await loadData(userId);
      if (cancelled) return;
      setTasks(stored.tasks ?? []);
      setCategories(stored.categories ?? SEED_CATEGORIES);
      setSettings({ ...DEFAULT_SETTINGS, ...stored.settings });
      setIsLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Save whenever data changes (but not before the first load finishes).
  useEffect(() => {
    if (userId && !isLoading) saveTasks(userId, tasks);
  }, [userId, tasks, isLoading]);

  useEffect(() => {
    if (userId && !isLoading) saveCategories(userId, categories);
  }, [userId, categories, isLoading]);

  useEffect(() => {
    if (userId && !isLoading) saveSettings(userId, settings);
  }, [userId, settings, isLoading]);

  // Keep scheduled reminders in step with the tasks and the reminders setting.
  useEffect(() => {
    if (userId && !isLoading) syncReminders(tasks, settings);
  }, [userId, tasks, settings, isLoading]);

  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((task) => !task.completed));
  }, []);

  const addTask = useCallback(
    ({
      title,
      categoryId,
      dueDate,
      dueTime = null,
      priority = DEFAULT_PRIORITY,
      reminder = null,
      repeat = null,
      favorite = false,
      pinned = false,
      subtasks = [],
    }) => {
      const newTask = {
        id: generateId(),
        title: title.trim(),
        categoryId,
        dueDate,
        dueTime,
        priority,
        reminder,
        repeat,
        favorite,
        pinned,
        nextTaskId: null,
        subtasks: subtasks
          .map((text) => text.trim())
          .filter(Boolean)
          .map((text) => ({ id: generateId(), title: text, completed: false })),
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    },
    []
  );

  // Completing a repeating task also creates its next occurrence. Un-completing it
  // removes that occurrence again (if it has not been completed itself).
  const toggleTask = useCallback((taskId) => {
    setTasks((prev) => {
      const task = prev.find((item) => item.id === taskId);
      if (!task) return prev;

      const now = new Date().toISOString();
      const completed = !task.completed;
      let next = prev.map((item) =>
        item.id === taskId ? { ...item, completed, completedAt: completed ? now : null } : item
      );

      if (completed && task.repeat && task.dueDate) {
        const nextTask = {
          ...task,
          id: generateId(),
          dueDate: getNextDueDate(task.dueDate, task.repeat),
          subtasks: task.subtasks.map((subtask) => ({
            ...subtask,
            id: generateId(),
            completed: false,
          })),
          completed: false,
          completedAt: null,
          nextTaskId: null,
          createdAt: now,
        };
        next = [
          nextTask,
          ...next.map((item) => (item.id === taskId ? { ...item, nextTaskId: nextTask.id } : item)),
        ];
      } else if (!completed && task.nextTaskId) {
        next = next
          .filter((item) => !(item.id === task.nextTaskId && !item.completed))
          .map((item) => (item.id === taskId ? { ...item, nextTaskId: null } : item));
      }
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((taskId) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, favorite: !task.favorite } : task))
    );
  }, []);

  const togglePin = useCallback((taskId) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, pinned: !task.pinned } : task))
    );
  }, []);

  const toggleSubtask = useCallback((taskId, subtaskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id !== taskId
          ? task
          : {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              ),
            }
      )
    );
  }, []);

  const updateTask = useCallback((taskId, updates) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, title: updates.title.trim() }
          : task
      )
    );
  }, []);

  const deleteTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  const duplicateTask = useCallback((taskId) => {
    setTasks((prev) => {
      const source = prev.find((task) => task.id === taskId);
      if (!source) return prev;
      const copy = {
        ...source,
        id: generateId(),
        title: `${source.title} (copy)`,
        subtasks: source.subtasks.map((subtask) => ({
          ...subtask,
          id: generateId(),
          completed: false,
        })),
        completed: false,
        completedAt: null,
        nextTaskId: null,
        createdAt: new Date().toISOString(),
      };
      return [copy, ...prev];
    });
  }, []);

  const addCategory = useCallback((name) => {
    const newCategory = { id: generateId(), name: name.trim() };
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  }, []);

  const updateCategory = useCallback((categoryId, name) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId ? { ...category, name: name.trim() } : category
      )
    );
  }, []);

  const getCategoryName = useCallback(
    (categoryId) =>
      categories.find((category) => category.id === categoryId)?.name ?? 'Uncategorized',
    [categories]
  );

  const value = useMemo(
    () => ({
      tasks,
      categories,
      settings,
      isLoading,
      addTask,
      toggleTask,
      toggleFavorite,
      togglePin,
      toggleSubtask,
      updateTask,
      deleteTask,
      duplicateTask,
      clearCompleted,
      updateSettings,
      addCategory,
      updateCategory,
      getCategoryName,
    }),
    [
      tasks,
      categories,
      settings,
      isLoading,
      addTask,
      toggleTask,
      toggleFavorite,
      togglePin,
      toggleSubtask,
      updateTask,
      deleteTask,
      duplicateTask,
      clearCompleted,
      updateSettings,
      addCategory,
      updateCategory,
      getCategoryName,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return context;
}