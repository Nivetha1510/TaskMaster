import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApp, getApps } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

// Values come from the .env file (see .env.example). EXPO_PUBLIC_ variables are
// inlined at build time, so each one must be written out in full like this.
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

function createAuth(app) {
  if (Platform.OS === 'web') return FirebaseAuth.getAuth(app);
  try {
    // Keeps the user signed in between app launches.
    return FirebaseAuth.initializeAuth(app, {
      persistence: FirebaseAuth.getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    return FirebaseAuth.getAuth(app); // already initialised (fast refresh)
  }
}

function createFirestore(app) {
  try {
    // Long polling avoids connection problems on some mobile networks and in Expo Go.
    return initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch (error) {
    return getFirestore(app); // already initialised (fast refresh)
  }
}

let auth = null;
let db = null;
if (isFirebaseConfigured) {
  const app = getApps().length ? getApp() : initializeApp(config);
  auth = createAuth(app);
  db = createFirestore(app);
}

export { auth, db };
