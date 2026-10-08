import { loadData, loadLocalFocusSessions, loadUsers } from './storageService';
import { hasDoc, writeDoc } from './cloudService';

// One-time upload of tasks saved on this device before cloud accounts existed.
// The old local account is matched by email. It only runs while the cloud account has
// no tasks yet, so it never overwrites data that is already online.
export async function migrateLocalData(uid, email) {
  try {
    if (!email || (await hasDoc(uid, 'tasks'))) return;

    const users = await loadUsers();
    const local = users.find((item) => item.email === email.trim().toLowerCase());
    if (!local) return;

    const [data, focus] = await Promise.all([loadData(local.id), loadLocalFocusSessions(local.id)]);
    if (data.tasks) await writeDoc(uid, 'tasks', data.tasks);
    if (data.categories) await writeDoc(uid, 'categories', data.categories);
    if (data.settings) await writeDoc(uid, 'settings', data.settings);
    if (focus.length > 0) await writeDoc(uid, 'focus', focus);
  } catch (error) {
    console.warn('Could not upload existing tasks:', error);
  }
}
