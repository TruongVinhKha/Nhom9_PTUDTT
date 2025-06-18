// App.tsx - Cấu hình Google Sign-In đã được sửa lỗi
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './src/navigation/AuthNavigator';
import HomeScreen from './src/screens/HomeScreen';
import LoadingScreen from './src/screens/LoadingSceen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Alert, Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import PhoneLoginScreen from './src/screens/PhoneLoginScreen';
// Cấu hình Google Sign-in đã được sửa lỗi
const configureGoogleSignIn = async () => {
  try {
    console.log('🔧 Cấu hình Google Sign-In...');
    
    GoogleSignin.configure({
      // Web Client ID từ Firebase Console (QUAN TRỌNG: phải là Web client)
      webClientId: '462857112524-diaumjhsupjftohan52nhjfhcq9it4jr.apps.googleusercontent.com',
      
      // Cấu hình cơ bản và ổn định
      offlineAccess: true, // Để lấy refresh token
      hostedDomain: '', // Để trống nếu không giới hạn domain
      forceCodeForRefreshToken: Platform.OS === 'ios', // Chỉ bật cho iOS
      
      // Loại bỏ các cấu hình không cần thiết có thể gây lỗi
      // accountName: '', // Bỏ dòng này
      // iosClientId: '', // Bỏ dòng này nếu không có
      // googleServicePlistPath: '', // Bỏ dòng này
    });
    
    console.log('✅ Google Sign-In đã được cấu hình thành công');
    
    // Kiểm tra Google Play Services (chỉ Android)
    if (Platform.OS === 'android') {
      try {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        console.log('✅ Google Play Services đã sẵn sàng');
      } catch (playServicesError) {
        console.log('⚠️ Google Play Services không khả dụng:', playServicesError);
        throw new Error('Google Play Services không khả dụng');
      }
    }
    
    // Kiểm tra trạng thái đăng nhập hiện tại
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      const isSignedIn = currentUser !== null;
      console.log('📊 Trạng thái Google Sign-In:', isSignedIn ? 'Đã đăng nhập' : 'Chưa đăng nhập');
      
      if (isSignedIn && currentUser) {
        console.log('👤 User hiện tại:', currentUser.user?.email || 'Không có thông tin email');
      }
    } catch (statusError) {
      console.log('📊 Chưa có user nào đăng nhập hoặc lỗi kiểm tra:', statusError);
    }
    
  } catch (error: unknown) {
    console.error('❌ Lỗi cấu hình Google Sign-In:', error);
    
    // Type guard để kiểm tra error
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    
    // Hiển thị cảnh báo chi tiết cho developer
    if (__DEV__) {
      let troubleshootingMessage = `Chi tiết lỗi: ${errorMessage}\n\n`;
      troubleshootingMessage += `Checklist khắc phục:\n`;
      troubleshootingMessage += `✓ Kiểm tra Web Client ID trong Firebase Console\n`;
      troubleshootingMessage += `✓ Đảm bảo SHA-1 fingerprint đã được thêm vào Firebase\n`;
      troubleshootingMessage += `✓ Kiểm tra file google-services.json đã cập nhật\n`;
      troubleshootingMessage += `✓ Package name phải khớp: com.demo\n`;
      troubleshootingMessage += `✓ Rebuild app sau khi thay đổi cấu hình`;
      
      Alert.alert(
        'Lỗi Google Sign-In',
        troubleshootingMessage,
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Copy lỗi', 
            onPress: () => {
              // Có thể thêm copy to clipboard ở đây
              console.log('Lỗi đầy đủ:', error);
            }
          }
        ]
      );
    }
    
    // Không throw error để app không crash
    return false;
  }
};

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  return user ? <HomeScreen /> : <AuthNavigator />;
}

export default function App() {
  useEffect(() => {
    // Cấu hình Google Sign-In khi app khởi động
    const initGoogleSignIn = async () => {
      try {
        await configureGoogleSignIn();
      } catch (error) {
        console.error('Không thể khởi tạo Google Sign-In:', error);
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