import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';

export default function DeviceTokenHandler() {
  const { user } = useAuth();

  useEffect(() => {
    const updateDeviceToken = async () => {
      try {
        const token = await messaging().getToken();
        if (user && user.role === 'parent') {
          await firestore().collection('users').doc(user.uid).update({
            deviceToken: token,
          });
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
    const unsubscribe = messaging().onTokenRefresh(token => {
      if (user && user.role === 'parent') {
        firestore().collection('users').doc(user.uid).update({
          deviceToken: token,
        });
      }
    });
    return unsubscribe;
  }, [user]);

  return null;
} 