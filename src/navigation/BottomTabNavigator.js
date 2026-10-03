import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TasksStack from './TasksStack';
import CategoriesScreen from '../screens/CategoriesScreen';
import CompletedScreen from '../screens/CompletedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BottomTabBar from '../components/BottomTabBar';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Tasks" component={TasksStack} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Completed" component={CompletedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}