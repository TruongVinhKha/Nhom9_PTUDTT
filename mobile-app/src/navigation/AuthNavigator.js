import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import {
  ForgotPasswordScreen,
  LoginScreen,
  RegisterScreen,
} from '../screens/auth';
import HomeScreen from '../screens/HomeScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Đăng ký' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'Quên mật khẩu' }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Trang chủ' }}
      />
    </Stack.Navigator>
  );
}
