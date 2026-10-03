import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BottomTabNavigator from './BottomTabNavigator';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

const MIN_SPLASH_MS = 1800;

export default function AppNavigator() {
  const { user, isRestoring } = useAuth();
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const showSplash = isRestoring || !minSplashDone;

  // Which screens exist depends on the login state, so logging in or out
  // switches between the auth screens and the app automatically.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {showSplash ? (
        <Stack.Screen name="Splash" component={SplashScreen} />
      ) : user ? (
        <>
          <Stack.Screen name="Main" component={BottomTabNavigator} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
