import { useEffect, useRef, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';
import InitialNotificationHandler from './InitialNotificationHandler';

export default function NotificationPopupHandler({ setSnackbarTitle, setSnackbarMessage, setSnackbarVisible, setCurrentCommentId }) {
  const { user } = useAuth();
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [isPopupActive, setIsPopupActive] = useState(false);
  const currentNotificationRef = useRef(null);

  // Khi InitialNotificationHandler phát hiện comment chưa đọc, push vào queue
  const handleShow = ({ title, message, commentId }) => {
    setNotificationQueue(prev => [...prev, { title, message, commentId }]);
  };

  // Khi queue thay đổi và không có popup đang hiện, show popup tiếp theo
  useEffect(() => {
    if (!isPopupActive && notificationQueue.length > 0) {
      const { title, message, commentId } = notificationQueue[0];
      setSnackbarTitle(title);
      setSnackbarMessage(message);
      setSnackbarVisible(true);
      setCurrentCommentId(commentId || null);
      currentNotificationRef.current = { commentId };
      setIsPopupActive(true);
    }
  }, [notificationQueue, isPopupActive, setSnackbarTitle, setSnackbarMessage, setSnackbarVisible, setCurrentCommentId]);

  // Theo dõi khi popup đóng để cập nhật isRead và hiện popup tiếp theo
  useEffect(() => {
    if (!isPopupActive && currentNotificationRef.current && user && user.role === 'parent') {
      const { commentId } = currentNotificationRef.current;
      if (commentId) {
        firestore()
          .collection('comments')
          .doc(commentId)
          .collection('isRead')
          .doc(user.uid)
          .set({ isRead: true, readAt: new Date() }, { merge: true })
          .catch(e => console.log('Lỗi cập nhật isRead:', e));
      }
      setNotificationQueue(prev => prev.slice(1));
      setCurrentCommentId(null);
      currentNotificationRef.current = null;
    }
  }, [isPopupActive, user, setCurrentCommentId]);

  // Hàm này nên được gọi từ App khi popup đóng
  NotificationPopupHandler.onPopupClose = () => {
    setIsPopupActive(false);
    setSnackbarVisible(false);
  };

  return <InitialNotificationHandler onShow={handleShow} />;
} 