import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useStudent } from '../contexts/StudentContext';
import { Text } from 'react-native-paper';

export default function ClassNotificationsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { student: navStudent } = route.params || {};
  const { selectedStudent } = useStudent();
  const student = selectedStudent || navStudent || {};
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.classId) return;
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const snap = await firestore()
          .collection('notifications')
          .where('classId', '==', student.classId)
          .orderBy('createdAt', 'desc')
          .get();
        const notiList = [];
        const notificationIds = snap.docs.map(doc => doc.id);
        // Lấy trạng thái đã đọc song song
        const readStatusPromises = notificationIds.map(id =>
          firestore().collection('notifications').doc(id).collection('isRead').doc(user.uid).get()
        );
        const readStatusResults = await Promise.all(readStatusPromises);
        const readStatusMap = {};
        notificationIds.forEach((id, idx) => {
          const doc = readStatusResults[idx];
          readStatusMap[id] = doc.exists && doc.data()?.isRead === true;
        });
        snap.docs.forEach(doc => {
          notiList.push({
            ...doc.data(),
            id: doc.id,
            isReadByCurrentUser: readStatusMap[doc.id] || false
          });
        });
        setNotifications(notiList);
      } catch (e) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [student?.classId, user?.uid]);

  const markAsRead = async (notificationId) => {
    try {
      await firestore()
        .collection('notifications')
        .doc(notificationId)
        .collection('isRead')
        .doc(user.uid)
        .set({ 
          isRead: true, 
          parentName: user.email || '', 
          readAt: firestore.FieldValue.serverTimestamp() 
        });
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isReadByCurrentUser: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = (notification) => {
    if (!notification.isReadByCurrentUser) {
      markAsRead(notification.id);
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
    let date;
    if (typeof value.toDate === 'function') date = value.toDate();
    else date = new Date(value);
    if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Thông báo lớp học</Text>
          <Text style={styles.headerSubtitle}>
            Học sinh: <Text style={styles.studentName}>{student?.fullName || '---'}</Text>
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="notifications-none" size={64} color="#ccc" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>Không có thông báo</Text>
          </View>
        ) : (
          notifications.map(noti => (
            <TouchableOpacity
              key={noti.id}
              style={[styles.notiItem, noti.isReadByCurrentUser ? styles.readItem : styles.unreadItem]}
              onPress={() => handleNotificationPress(noti)}
              activeOpacity={0.7}
            >
              <View style={styles.notiHeader}>
                <Text style={styles.notiTitle}>{noti.title}</Text>
                <View style={[styles.statusBadge, noti.isReadByCurrentUser ? styles.readBadge : styles.unreadBadge]}>
                  <Text style={styles.statusText}>
                    {noti.isReadByCurrentUser ? 'Đã xem' : 'Chưa xem'}
                  </Text>
                </View>
              </View>
              <Text style={styles.notiContent}>{noti.content}</Text>
              <View style={styles.notiFooter}>
                <Icon name="schedule" size={16} color="#666" />
                <Text style={styles.notiDate}>{formatDate(noti.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { 
    backgroundColor: '#17375F', 
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: { 
    color: '#FFFFFF', 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  headerSubtitle: { 
    color: '#7AE582', 
    fontSize: 14 
  },
  studentName: { 
    color: '#FFFFFF', 
    fontWeight: 'bold' 
  },
  container: { 
    flex: 1, 
    padding: 16 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: { 
    color: '#17375F', 
    fontSize: 16,
    textAlign: 'center' 
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: { 
    color: '#17375F', 
    fontSize: 16,
    textAlign: 'center' 
  },
  notiItem: { 
    backgroundColor: '#F8F9FA', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#006A5C',
    elevation: 2,
  },
  unreadItem: { 
    borderLeftWidth: 6, 
    borderLeftColor: '#FF6F00',
    backgroundColor: '#FFE082',
    elevation: 3,
  },
  readItem: { 
    borderLeftWidth: 6, 
    borderLeftColor: '#4CAF50',
    backgroundColor: '#F5F5F5'
  },
  notiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notiTitle: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    color: '#17375F', 
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readBadge: {
    backgroundColor: '#4CAF50',
  },
  unreadBadge: {
    backgroundColor: '#FF6F00',
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  notiContent: { 
    fontSize: 14, 
    color: '#17375F', 
    marginBottom: 12,
    lineHeight: 20,
  },
  notiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notiDate: { 
    fontSize: 12, 
    color: '#666', 
    marginLeft: 4,
  },
}); 