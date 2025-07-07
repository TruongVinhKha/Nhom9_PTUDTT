// App.tsx - Sửa lỗi Google Sign-In cấu hình
import messaging from '@react-native-firebase/messaging';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Text, Dimensions, StyleSheet, PermissionsAndroid } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { StudentProvider } from './src/contexts/StudentContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import LoadingScreen from './src/screens/LoadingSceen';
import firestore from '@react-native-firebase/firestore';
import DeviceTokenHandler from './src/contexts/DeviceTokenHandler';
import { Snackbar } from 'react-native-paper';
import InitialNotificationHandler from './src/contexts/InitialNotificationHandler';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NotificationPopupHandler from './src/contexts/NotificationPopupHandler';
import notifee, { AndroidImportance } from '@notifee/react-native';

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

async function requestNotificationPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Thông báo',
        message: 'Ứng dụng cần quyền gửi thông báo cho bạn.',
        buttonPositive: 'Đồng ý',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

export default function App() {
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarTitle, setSnackbarTitle] = useState('');
  const [currentCommentId, setCurrentCommentId] = useState(null);

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

    // --- Thêm xin quyền thông báo Android 13+ ---
    requestNotificationPermission();
    // --- Kết thúc xin quyền ---

    // --- Thêm chức năng nhận thông báo đẩy ---
    messaging().requestPermission().then(authStatus => {
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        console.log('Đã được cấp quyền nhận thông báo!');
      }
    });

    // Lắng nghe notification push từ FCM khi app đang foreground
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      setSnackbarTitle(remoteMessage.notification?.title || 'Thông báo');
      setSnackbarMessage(remoteMessage.notification?.body || 'Bạn có thông báo mới!');
      setSnackbarVisible(true);
    });

    // Lắng nghe khi user bấm vào thông báo khi app đang background/quit
    const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage) {
        setSnackbarTitle(remoteMessage.notification?.title || 'Thông báo');
        setSnackbarMessage(remoteMessage.notification?.body || 'Bạn có thông báo mới!');
        setSnackbarVisible(true);
      }
    });

    // Kiểm tra nếu app được mở từ thông báo khi đã quit
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        setSnackbarTitle(remoteMessage.notification?.title || 'Thông báo');
        setSnackbarMessage(remoteMessage.notification?.body || 'Bạn có thông báo mới!');
        setSnackbarVisible(true);
      }
    });

    // Tạo notification channel cho Android để hỗ trợ heads-up notification
    async function createChannel() {
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });
      }
    }
    createChannel();

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
          <DeviceTokenHandler />
          <NotificationPopupHandler
            setSnackbarTitle={setSnackbarTitle}
            setSnackbarMessage={setSnackbarMessage}
            setSnackbarVisible={setSnackbarVisible}
            setCurrentCommentId={setCurrentCommentId}
          />
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => {
              setSnackbarVisible(false);
            }}
            duration={4000}
            action={{
              label: 'Đóng',
              onPress: () => {
                setSnackbarVisible(false);
              },
              textColor: '#fff'
            }}
            style={styles.centeredSnackbar}
            wrapperStyle={styles.snackbarWrapper}
          >
            <MaterialCommunityIcons name="bell-ring" size={28} color="#fff" style={{ marginBottom: 6, alignSelf: 'center' }} />
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 4, color: '#fff', textAlign: 'center' }}>
              {snackbarTitle}
            </Text>
            <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>{snackbarMessage}</Text>
          </Snackbar>
        </StudentProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

// Thêm style ở cuối file
const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  dialogBox: {
    borderRadius: 24,
    backgroundColor: '#fff',
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignSelf: 'center',
    width: '85%',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  centeredSnackbar: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: height / 2 - 80,
    backgroundColor: '#1976d2',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    elevation: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    opacity: 0.98,
  },
  snackbarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});