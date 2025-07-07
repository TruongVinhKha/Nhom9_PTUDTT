import { useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';

export default function InitialNotificationHandler({ onShow }) {
  const { user } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user && user.role === 'parent' && user.linkedStudentIds?.length > 0) {
        const db = getFirestore();
        // Lấy tất cả nhận xét cho các studentId mà phụ huynh này quản lý
        // Nếu số lượng studentId > 10, cần chia nhỏ truy vấn do Firestore giới hạn 'in' tối đa 10 phần tử
        const studentIdChunks = [];
        for (let i = 0; i < user.linkedStudentIds.length; i += 10) {
          studentIdChunks.push(user.linkedStudentIds.slice(i, i + 10));
        }
        for (const chunk of studentIdChunks) {
          const commentsQuery = query(
            collection(db, 'comments'),
            where('studentId', 'in', chunk)
          );
          const commentsSnap = await getDocs(commentsQuery);
          for (const docSnap of commentsSnap.docs) {
            const commentId = docSnap.id;
            // Kiểm tra subcollection isRead cho parent hiện tại
            const isReadDocRef = doc(db, 'comments', commentId, 'isRead', user.uid);
            const isReadDoc = await getDoc(isReadDocRef);
            if (!isReadDoc.exists() || isReadDoc.data()?.isRead !== true) {
              onShow && onShow({
                title: 'Nhận xét cho con bạn',
                message: docSnap.data().content,
                commentId,
              });
            }
          }
        }
      }
    };
    fetchNotifications();
  }, [user, onShow]);

  return null;
} 