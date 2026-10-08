import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// Each user's data lives under users/{uid}:
//   users/{uid}                 profile: { name, email, photo, createdAt }
//   users/{uid}/data/{key}      { json } for key = tasks | categories | settings | focus
// The app data is stored as one JSON string per document, which keeps the existing
// "save the whole array" logic and avoids Firestore's limits on nested arrays.

export const DATA_KEYS = ['tasks', 'categories', 'settings', 'focus'];

const profileRef = (uid) => doc(db, 'users', uid);
const dataRef = (uid, key) => doc(db, 'users', uid, 'data', key);

// The last JSON seen for each document. Writing the same JSON again is skipped, which
// is what stops a change that arrives from another device from being written back.
const lastSeen = new Map();
const seenKey = (uid, key) => `${uid}/${key}`;

const readJsonField = (snapshot) => (snapshot.exists() ? snapshot.data().json ?? null : null);

export async function readDoc(uid, key) {
  try {
    const json = readJsonField(await getDoc(dataRef(uid, key)));
    if (json !== null) lastSeen.set(seenKey(uid, key), json);
    return json === null ? null : JSON.parse(json);
  } catch (error) {
    console.warn(`Could not read ${key}:`, error);
    return null;
  }
}

export async function hasDoc(uid, key) {
  try {
    return (await getDoc(dataRef(uid, key))).exists();
  } catch (error) {
    return true; // when unsure, do not risk overwriting with old local data
  }
}

export async function writeDoc(uid, key, value) {
  const json = JSON.stringify(value);
  const id = seenKey(uid, key);
  if (lastSeen.get(id) === json) return;
  lastSeen.set(id, json);
  try {
    await setDoc(dataRef(uid, key), { json, updatedAt: Date.now() });
  } catch (error) {
    lastSeen.delete(id); // so the next change tries again
    console.warn(`Could not save ${key}:`, error);
  }
}

// Calls `onValue(value, changed)` now and whenever the document changes on any device.
// `value` is null when the document does not exist yet. `changed` is false when the
// snapshot only echoes what this device just wrote. Returns an unsubscribe function.
export function subscribeDoc(uid, key, onValue, onError) {
  return onSnapshot(
    dataRef(uid, key),
    (snapshot) => {
      const json = readJsonField(snapshot);
      const id = seenKey(uid, key);
      const changed = json !== (lastSeen.get(id) ?? null);
      if (json !== null) lastSeen.set(id, json);
      onValue(json === null ? null : JSON.parse(json), changed);
    },
    onError
  );
}

export const forgetUser = (uid) => {
  DATA_KEYS.forEach((key) => lastSeen.delete(seenKey(uid, key)));
};

// ---- Profile ----

export const getProfileRef = profileRef;
export const readProfile = async (uid) => {
  const snapshot = await getDoc(profileRef(uid));
  return snapshot.exists() ? snapshot.data() : null;
};
export const writeProfile = (uid, fields) => setDoc(profileRef(uid), fields, { merge: true });
export const subscribeProfile = (uid, onValue, onError) =>
  onSnapshot(profileRef(uid), (snapshot) => onValue(snapshot.exists() ? snapshot.data() : null), onError);

// Removes everything stored for the user (used when deleting an account).
export async function deleteUserData(uid) {
  await Promise.all(DATA_KEYS.map((key) => deleteDoc(dataRef(uid, key))));
  await deleteDoc(profileRef(uid));
  forgetUser(uid);
}
