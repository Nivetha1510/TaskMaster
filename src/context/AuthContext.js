import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as Crypto from 'expo-crypto';
import {
  loadUsers,
  saveUsers,
  loadSessionUserId,
  saveSessionUserId,
  claimLegacyData,
  removeUserData,
} from '../services/storageService';
import { generateId } from '../utils/id';
import { isValidEmail, MIN_PASSWORD_LENGTH } from '../utils/validation';

const AuthContext = createContext(null);

const normalizeEmail = (email) => email.trim().toLowerCase();

const hashPassword = (password, salt) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}${password}`);

// The app only ever sees this; the hash and salt stay inside this file.
const toPublicUser = ({ id, name, email, createdAt }) => ({ id, name, email, createdAt });

// Accounts live on this device only (there is no server).
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore the previous session, if any.
  useEffect(() => {
    async function restore() {
      const [users, sessionUserId] = await Promise.all([loadUsers(), loadSessionUserId()]);
      const existing = users.find((item) => item.id === sessionUserId);
      setUser(existing ? toPublicUser(existing) : null);
      setIsRestoring(false);
    }
    restore();
  }, []);

  const signUp = useCallback(async ({ name, email, password }) => {
    if (!name.trim()) return { error: 'Please enter your name' };
    if (!isValidEmail(email)) return { error: 'Please enter a valid email address' };
    if (password.length < MIN_PASSWORD_LENGTH) {
      return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
    }

    const users = await loadUsers();
    if (users.some((item) => item.email === normalizeEmail(email))) {
      return { error: 'An account with this email already exists' };
    }

    const salt = generateId();
    const newUser = {
      id: generateId(),
      name: name.trim(),
      email: normalizeEmail(email),
      salt,
      passwordHash: await hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    };
    await saveUsers([...users, newUser]);
    // The very first account inherits any tasks saved before accounts existed.
    if (users.length === 0) await claimLegacyData(newUser.id);
    await saveSessionUserId(newUser.id);
    setUser(toPublicUser(newUser));
    return { ok: true };
  }, []);

  const logIn = useCallback(async ({ email, password }) => {
    const users = await loadUsers();
    const existing = users.find((item) => item.email === normalizeEmail(email));
    const hash = existing ? await hashPassword(password, existing.salt) : null;
    if (!existing || hash !== existing.passwordHash) {
      return { error: 'Incorrect email or password' };
    }
    await saveSessionUserId(existing.id);
    setUser(toPublicUser(existing));
    return { ok: true };
  }, []);

  const logOut = useCallback(async () => {
    await saveSessionUserId(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async ({ name }) => {
      if (!name.trim()) return { error: 'Please enter your name' };
      const users = await loadUsers();
      const updated = users.map((item) =>
        item.id === user.id ? { ...item, name: name.trim() } : item
      );
      await saveUsers(updated);
      setUser(toPublicUser(updated.find((item) => item.id === user.id)));
      return { ok: true };
    },
    [user]
  );

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
      }
      const users = await loadUsers();
      const existing = users.find((item) => item.id === user.id);
      if ((await hashPassword(currentPassword, existing.salt)) !== existing.passwordHash) {
        return { error: 'Current password is incorrect' };
      }
      const salt = generateId();
      const passwordHash = await hashPassword(newPassword, salt);
      await saveUsers(
        users.map((item) => (item.id === user.id ? { ...item, salt, passwordHash } : item))
      );
      return { ok: true };
    },
    [user]
  );

  const deleteAccount = useCallback(async () => {
    const users = await loadUsers();
    await saveUsers(users.filter((item) => item.id !== user.id));
    await removeUserData(user.id);
    await saveSessionUserId(null);
    setUser(null);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isRestoring,
      signUp,
      logIn,
      logOut,
      updateProfile,
      changePassword,
      deleteAccount,
    }),
    [user, isRestoring, signUp, logIn, logOut, updateProfile, changePassword, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
