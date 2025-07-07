import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import ClassNotificationsScreen from '../screens/ClassNotificationsScreen';
import CommentsScreen from '../screens/CommentsScreen';
import GeneralNotificationsScreen from '../screens/GeneralNotificationsScreen';
import BottomTabNavigator from './BottomTabNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="CommentsScreen" component={CommentsScreen} />
      <Stack.Screen name="ClassNotificationsScreen" component={ClassNotificationsScreen} />
      <Stack.Screen name="GeneralNotificationsScreen" component={GeneralNotificationsScreen} />
    </Stack.Navigator>
  );
} 