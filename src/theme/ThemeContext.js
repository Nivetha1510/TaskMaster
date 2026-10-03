import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from './colors';

const STORAGE_KEY = '@taskmaster/theme';

export const THEME_OPTIONS = [
  { value: 'system', label: 'System default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const ThemeContext = createContext(null);

// The theme belongs to the device (not the account), so it also applies on the login screens.
export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState('system'); // 'system' | 'light' | 'dark'

  useEffect(() => {
    async function restore() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setPreferenceState(saved);
      } catch (error) {
        console.warn('Could not read theme:', error);
      }
    }
    restore();
  }, []);

  const setPreference = useCallback(async (value) => {
    setPreferenceState(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      console.warn('Could not save theme:', error);
    }
  }, []);

  const isDark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';

  const value = useMemo(
    () => ({
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
      isDark,
      preference,
      setPreference,
    }),
    [isDark, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}
