import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
} from '../screens/auth';
import PhoneLoginScreen from '../screens/PhoneLoginScreen';
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
        name="PhoneLogin"
        component={PhoneLoginScreen}
        options={{ title: 'Đăng nhập bằng SĐT' }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Trang chủ' }}
      />
    </Stack.Navigator>
  );
}
