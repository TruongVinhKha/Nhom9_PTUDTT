// App.tsx - Sửa lỗi Google Sign-In cấu hình
import messaging from '@react-native-firebase/messaging';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { StudentProvider } from './src/contexts/StudentContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import LoadingScreen from './src/screens/LoadingSceen';

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

    // --- Thêm chức năng nhận thông báo đẩy ---
    // Xin quyền nhận thông báo
    messaging().requestPermission().then(authStatus => {
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        console.log('Đã được cấp quyền nhận thông báo!');
      }
    });

    // Lắng nghe thông báo khi app đang mở (foreground)
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'Thông báo',
        remoteMessage.notification?.body || 'Bạn có thông báo mới!'
      );
    });

    // (Tùy chọn) Lắng nghe khi user bấm vào thông báo khi app đang background/quit
    const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage) {
        Alert.alert(
          remoteMessage.notification?.title || 'Thông báo',
          remoteMessage.notification?.body || 'Bạn có thông báo mới!'
        );
      }
    });

    // (Tùy chọn) Kiểm tra nếu app được mở từ thông báo khi đã quit
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        Alert.alert(
          remoteMessage.notification?.title || 'Thông báo',
          remoteMessage.notification?.body || 'Bạn có thông báo mới!'
        );
      }
    });

    // Lấy FCM token và log ra console
    messaging()
      .getToken()
      .then(token => {
        console.log('FCM Token:', token);
      })
      .catch(error => {
        console.log('Lỗi lấy FCM token:', error);
      });

    return () => {
      unsubscribe();
      unsubscribeOpened();
    };
    // --- Kết thúc thêm chức năng nhận thông báo đẩy ---
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