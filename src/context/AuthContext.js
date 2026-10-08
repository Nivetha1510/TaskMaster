import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import {
  deleteUserData,
  readProfile,
  subscribeProfile,
  writeProfile,
} from '../services/cloudService';
import { isValidEmail, MIN_PASSWORD_LENGTH } from '../utils/validation';

const AuthContext = createContext(null);

const normalizeEmail = (email) => email.trim().toLowerCase();

const NOT_CONFIGURED_ERROR =
  'Cloud sync is not set up yet. Add your Firebase settings to the .env file and restart the app.';

// A recent sign-in is required to delete an account; Firebase allows about 5 minutes.
const RECENT_LOGIN_MS = 4 * 60 * 1000;

// Turns a Firebase error into a message the user can act on.
function describeAuthError(error) {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/invalid-email':
      return 'Please enter a valid email address';
    case 'auth/weak-password':
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'No internet connection. Please check your network and try again.';
    case 'auth/operation-not-allowed':
      return 'Email sign-in is not enabled for this project in Firebase.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

// What the rest of the app sees. `id` is the Firebase user id.
const toPublicUser = (firebaseUser, profile) => ({
  id: firebaseUser.uid,
  name: profile?.name ?? firebaseUser.displayName ?? firebaseUser.email.split('@')[0],
  email: firebaseUser.email,
  createdAt: profile?.createdAt ?? firebaseUser.metadata.creationTime,
  photo: profile?.photo ?? null,
});

// Accounts and profiles are stored online (Firebase), so signing in on any phone or
// browser gives the same profile and tasks.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isRestoring, setIsRestoring] = useState(isFirebaseConfigured);
  const pendingName = useRef(null); // the name typed on the sign-up form

  // Follow the sign-in state, and keep the profile (name, photo) live.
  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;

    let unsubscribeProfile = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = null;

      if (!firebaseUser) {
        setUser(null);
        setIsRestoring(false);
        return;
      }

      try {
        // First sign-in on a new account: create the profile.
        if (!(await readProfile(firebaseUser.uid))) {
          await writeProfile(firebaseUser.uid, {
            name:
              pendingName.current?.trim() ||
              firebaseUser.displayName ||
              firebaseUser.email.split('@')[0],
            email: firebaseUser.email,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn('Could not load profile:', error);
      }
      pendingName.current = null;

      unsubscribeProfile = subscribeProfile(
        firebaseUser.uid,
        (profile) => {
          setUser(toPublicUser(firebaseUser, profile));
          setIsRestoring(false);
        },
        (error) => {
          console.warn('Could not sync profile:', error);
          setUser(toPublicUser(firebaseUser, null));
          setIsRestoring(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  const signUp = useCallback(async ({ name, email, password }) => {
    if (!name.trim()) return { error: 'Please enter your name' };
    if (!isValidEmail(email)) return { error: 'Please enter a valid email address' };
    if (password.length < MIN_PASSWORD_LENGTH) {
      return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
    }
    if (!isFirebaseConfigured) return { error: NOT_CONFIGURED_ERROR };

    pendingName.current = name.trim();
    try {
      await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
      return { ok: true };
    } catch (error) {
      pendingName.current = null;
      return { error: describeAuthError(error) };
    }
  }, []);

  const logIn = useCallback(async ({ email, password }) => {
    if (!isFirebaseConfigured) return { error: NOT_CONFIGURED_ERROR };
    try {
      await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
      return { ok: true };
    } catch (error) {
      return { error: describeAuthError(error) };
    }
  }, []);

  const logOut = useCallback(async () => {
    await signOut(auth);
  }, []);

  const updateProfile = useCallback(
    // Pass `name` and/or `photo` (a data URI, or null to remove the photo).
    async ({ name, photo }) => {
      if (name !== undefined && !name.trim()) return { error: 'Please enter your name' };
      const fields = {};
      if (name !== undefined) fields.name = name.trim();
      if (photo !== undefined) fields.photo = photo;
      try {
        await writeProfile(user.id, fields);
        return { ok: true };
      } catch (error) {
        return { error: 'Could not save your profile. Please check your connection.' };
      }
    },
    [user]
  );

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
    }
    const current = auth.currentUser;
    try {
      await reauthenticateWithCredential(
        current,
        EmailAuthProvider.credential(current.email, currentPassword)
      );
    } catch (error) {
      if (error?.code === 'auth/network-request-failed') {
        return { error: describeAuthError(error) };
      }
      return { error: 'Current password is incorrect' };
    }
    try {
      await updatePassword(current, newPassword);
      return { ok: true };
    } catch (error) {
      return { error: describeAuthError(error) };
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    const current = auth.currentUser;
    const lastSignIn = Date.parse(current.metadata.lastSignInTime);
    if (!lastSignIn || Date.now() - lastSignIn > RECENT_LOGIN_MS) {
      return { error: 'For security, please log out and log back in, then try deleting again.' };
    }
    try {
      await deleteUserData(current.uid);
      await deleteUser(current);
      return { ok: true };
    } catch (error) {
      return { error: describeAuthError(error) };
    }
  }, []);

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
