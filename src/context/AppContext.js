import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { subscribeDoc, writeDoc, forgetUser } from '../services/cloudService';
import { migrateLocalData } from '../services/migrationService';
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

  // Load the signed-in user's data from the cloud and keep it live: a change made on
  // another phone or browser shows up here. New accounts start with the default categories.
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
    const unsubscribers = [];
    const loaded = new Set();
    setIsLoading(true);

    // `apply` runs for the first snapshot of each document, then only for real changes.
    const listen = (key, apply) => {
      unsubscribers.push(
        subscribeDoc(
          userId,
          key,
          (value, changed) => {
            if (cancelled) return;
            const isFirst = !loaded.has(key);
            if (!isFirst && !changed) return;
            apply(value);
            loaded.add(key);
            if (loaded.size === 3) setIsLoading(false);
          },
          (error) => console.warn(`Could not sync ${key}:`, error)
        )
      );
    };

    async function init() {
      await migrateLocalData(userId, user.email);
      if (cancelled) return;
      listen('tasks', (value) => setTasks(value ?? []));
      listen('categories', (value) => setCategories(value ?? SEED_CATEGORIES));
      listen('settings', (value) => setSettings({ ...DEFAULT_SETTINGS, ...value }));
    }
    init();

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      forgetUser(userId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Save whenever data changes (but not before the first load finishes).
  useEffect(() => {
    if (userId && !isLoading) writeDoc(userId, 'tasks', tasks);
  }, [userId, tasks, isLoading]);

  useEffect(() => {
    if (userId && !isLoading) writeDoc(userId, 'categories', categories);
  }, [userId, categories, isLoading]);

  useEffect(() => {
    if (userId && !isLoading) writeDoc(userId, 'settings', settings);
  }, [userId, settings, isLoading]);

  // Keep scheduled reminders in step with the tasks and the reminders setting.
  useEffect(() => {
    if (userId && !isLoading) syncReminders(tasks, settings);
  }, [userId, tasks, settings, isLoading]);

  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // "Clear completed" archives finished tasks instead of deleting them: they leave the
  // Tasks list but still count towards Insights (streak, weekly chart). Returns the ids
  // that were archived so the caller can offer an undo.
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const clearCompleted = useCallback(() => {
    const ids = tasksRef.current
      .filter((task) => task.completed && !task.archived)
      .map((task) => task.id);
    if (ids.length > 0) {
      const archived = new Set(ids);
      setTasks((prev) =>
        prev.map((task) => (archived.has(task.id) ? { ...task, archived: true } : task))
      );
    }
    return ids;
  }, []);

  const restoreArchived = useCallback((ids) => {
    const restored = new Set(ids);
    setTasks((prev) =>
      prev.map((task) => (restored.has(task.id) ? { ...task, archived: false } : task))
    );
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
      estimate = null,
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
        estimate,
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
        item.id === taskId
          ? {
              ...item,
              completed,
              completedAt: completed ? now : null,
              // Un-completing an archived task brings it back to the list.
              ...(completed ? {} : { archived: false }),
            }
          : item
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

  // Tasks in a deleted category are kept and show as "Uncategorized".
  const deleteCategory = useCallback((categoryId) => {
    setCategories((prev) => prev.filter((category) => category.id !== categoryId));
    setTasks((prev) =>
      prev.map((task) => (task.categoryId === categoryId ? { ...task, categoryId: null } : task))
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
      restoreArchived,
      updateSettings,
      addCategory,
      updateCategory,
      deleteCategory,
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
      restoreArchived,
      updateSettings,
      addCategory,
      updateCategory,
      deleteCategory,
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