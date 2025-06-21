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
  const { user, loading, registering, checkingPermission, initialized, loginInProgress, showLoading } = useAuth();
  const [forceAuth, setForceAuth] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkJustRegistered = async () => {
      try {
        const justRegistered = await AsyncStorage.getItem('justRegistered');
        if (justRegistered === 'true') {
          setForceAuth(true);
          await AsyncStorage.removeItem('justRegistered');
        } else {
          setForceAuth(false);
        }
      } catch (error) {
        setForceAuth(false);
      }
    };
    checkJustRegistered();
  }, [user]);

  // Kiểm tra role của user khi user thay đổi
  useEffect(() => {
    const checkUserRole = async () => {
      if (user?.uid) {
        try {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData && typeof userData === 'object' && 'role' in userData && userData.role) {
              setUserRole(userData.role);
              console.log('🎯 User role detected:', userData.role);
            } else {
              setUserRole('guest');
              console.log('🎯 User không có role, coi như guest');
            }
          } else {
            // User không có trong collection users (có thể là guest)
            setUserRole('guest');
            console.log('🎯 User là guest');
          }
        } catch (error) {
          console.log('⚠️ Không thể kiểm tra role:', error);
          setUserRole('guest');
        }
      } else {
        setUserRole(null);
      }
    };
    
    checkUserRole();
  }, [user?.uid]);

  // Chỉ hiển thị loading khi thực sự cần thiết
  if (!initialized || registering || (showLoading && !loginInProgress)) {
    return <LoadingScreen />;
  }

  if (forceAuth) {
    return <AuthNavigator />;
  }

  // Chuyển hướng dựa trên role
  if (user && userRole) {
    switch (userRole) {
      case 'admin':
        return <HomeScreen />; // Hoặc AdminScreen nếu có
      case 'teacher':
        return <HomeScreen />; // Hoặc TeacherScreen nếu có
      case 'parent':
        return <HomeScreen />;
      case 'student':
        return <HomeScreen />; // Hoặc StudentScreen nếu có
      case 'guest':
        return <AuthNavigator />; // Guest vẫn ở màn hình auth
      default:
        return <AuthNavigator />;
    }
  }
  
  return <AuthNavigator />;
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
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}