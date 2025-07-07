import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';
import { Platform, PermissionsAndroid } from 'react-native';

async function hasNotificationPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return granted;
  }
  return true;
}

export default function DeviceTokenHandler() {
  const { user } = useAuth();

  useEffect(() => {
    const updateDeviceToken = async () => {
      try {
        const hasPermission = await hasNotificationPermission();
        if (!hasPermission) {
          console.log('Chưa được cấp quyền thông báo, không lấy token');
          return;
        }
        const token = await messaging().getToken();
        if (user && user.role === 'parent') {
          await firestore().collection('users').doc(user.uid).update({
            deviceToken: token,
          });
          console.log('Đã lưu device token cho phụ huynh:', token);
        }
      } catch (error) {
        console.log('Lỗi lấy hoặc cập nhật FCM token:', error);
      }
    };
    if (user && user.role === 'parent') {
      updateDeviceToken();
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(async token => {
      if (user && user.role === 'parent') {
        await firestore().collection('users').doc(user.uid).update({
          deviceToken: token,
        });
        console.log('Đã cập nhật device token mới cho phụ huynh:', token);
      }
    });
    return unsubscribe;
  }, [user]);

  return null;
} 