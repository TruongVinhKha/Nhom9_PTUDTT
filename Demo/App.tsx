// App.tsx - Sửa lỗi Google Sign-In cấu hình
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './src/navigation/AuthNavigator';
import HomeScreen from './src/screens/HomeScreen';
import LoadingScreen from './src/screens/LoadingSceen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Alert, Platform, View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import AppNavigator from './src/navigation/AppNavigator';
import { StudentProvider } from './src/contexts/StudentContext';
import { Provider as PaperProvider } from 'react-native-paper';

// Cấu hình Google Sign-in - PHIÊN BẢN SỬA LỖI
const configureGoogleSignIn = async () => {
  try {
    console.log('🔧 Bắt đầu cấu hình Google Sign-In...');
    
    // Cấu hình cơ bản - GỠ BỎ CÁC OPTION GÂY LỖI
    GoogleSignin.configure({
      webClientId: '462857112524-diaumjhsupjftohan52nhjfhcq9it4jr.apps.googleusercontent.com',
      offlineAccess: false, // Tắt offline access để tránh lỗi
    });
    
    console.log('✅ Google Sign-In cấu hình cơ bản thành công');
    
    // KHÔNG kiểm tra Google Play Services trong quá trình cấu hình
    // Sẽ kiểm tra khi user thực sự đăng nhập
    console.log('✅ Google Sign-In sẵn sàng sử dụng');
    
    return true;
    
  } catch (error) {
    console.error('❌ Lỗi cấu hình Google Sign-In:', error);
    
    // Chỉ log lỗi, không crash app
    if (__DEV__) {
      console.log('🔍 Debug info:');
      console.log('- Platform:', Platform.OS);
      console.log('- Error details:', error);
    }
    
    // Return false nhưng không crash app
    return false;
  }
};

// RootNavigator - Tối ưu hóa loading và navigation
function RootNavigator() {
  const { user, initialized, registering, showLoading, loginInProgress } = useAuth();

  if (!initialized || registering || (showLoading && !loginInProgress)) {
    return <LoadingScreen />;
  }

  // Nếu chưa đăng nhập thì render AuthNavigator
  if (!user) {
    return <AuthNavigator />;
  }

  // Nếu đã đăng nhập thì render AppNavigator
  return <AppNavigator />;
}

export default function App() {
  const [googleConfigured, setGoogleConfigured] = useState(false);

  useEffect(() => {
    const initGoogleSignIn = async () => {
      try {
        const success = await configureGoogleSignIn();
        setGoogleConfigured(success);
        if (!success && __DEV__) {
          console.log('⚠️ Google Sign-In không được cấu hình, nhưng app vẫn hoạt động bình thường');
        }
      } catch (error) {
        console.error('❌ Không thể khởi tạo Google Sign-In:', error);
        setGoogleConfigured(false);
      }
    };
    initGoogleSignIn();
  }, []);

  return (
    <PaperProvider>
      <AuthProvider>
        <StudentProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </StudentProvider>
      </AuthProvider>
    </PaperProvider>
  );
}