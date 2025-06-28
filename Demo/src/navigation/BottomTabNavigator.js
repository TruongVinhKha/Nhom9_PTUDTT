import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator initialRouteName="Trang chủ">
      <Tab.Screen
        name="Trang chủ"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Tài khoản"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" color={color} size={size} />,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
} 