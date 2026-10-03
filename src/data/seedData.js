export const SEED_CATEGORIES = [
  { id: 'cat-work', name: 'Work' },
  { id: 'cat-personal', name: 'Personal' },
  { id: 'cat-study', name: 'Study' },
  { id: 'cat-shopping', name: 'Shopping' },
  { id: 'cat-health', name: 'Health' },
  { id: 'cat-errands', name: 'Errands' },
];

const createdAt = new Date().toISOString();

const makePendingTask = (id, title, categoryId, subtasks = []) => ({
  id,
  title,
  categoryId,
  dueDate: null,
  subtasks,
  completed: false,
  completedAt: null,
  createdAt,
});

const makeCompletedTask = (id, title, categoryId, completedDate) => ({
  id,
  title,
  categoryId,
  dueDate: null,
  subtasks: [],
  completed: true,
  completedAt: `${completedDate}T12:00:00.000Z`,
  createdAt,
});

export const SEED_TASKS = [
  makePendingTask('task-1', 'Prepare presentation for team meeting', 'cat-work'),
  makePendingTask('task-2', "Schedule doctor's appointment", 'cat-personal'),
  makePendingTask('task-3', 'Grocery shopping', 'cat-errands', [
    { id: 'sub-1', title: 'Buy milk', completed: false },
    { id: 'sub-2', title: 'Buy eggs', completed: false },
    { id: 'sub-3', title: 'Buy bread', completed: false },
  ]),
  makePendingTask('task-4', "Read a chapter of 'The Great Gatsby'", 'cat-personal'),
  makePendingTask('task-5', 'Respond to emails', 'cat-work'),

  makeCompletedTask('task-6', 'Grocery Shopping', 'cat-shopping', '2024-01-20'),
  makeCompletedTask('task-7', 'Book Appointment', 'cat-health', '2024-01-18'),
  makeCompletedTask('task-8', 'Pay Bills', 'cat-personal', '2024-01-15'),
  makeCompletedTask('task-9', 'Workout', 'cat-health', '2024-01-12'),
  makeCompletedTask('task-10', 'Read a Book', 'cat-personal', '2024-01-10'),
];