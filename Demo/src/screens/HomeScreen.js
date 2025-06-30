import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Card, Avatar, Divider, Modal, Portal, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import firestore from '@react-native-firebase/firestore';
import LoadingScreen from './LoadingSceen';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useStudent } from '../contexts/StudentContext';

// Khu vực thông tin người dùng (UserInfo)
function UserInfo({ user, selectedStudent }) {
  return (
    <View style={userInfoStyles.container}>
      <MaterialIcons name="account-circle" size={48} color="#00CAFF" style={{ marginRight: 12 }} />
      <View>
        <Text style={userInfoStyles.greeting}>Xin chào,</Text>
        <Text style={userInfoStyles.name}>Phụ huynh em: {selectedStudent?.fullName || '...'}</Text>
      </View>
    </View>
  );
}
const userInfoStyles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: '#F5ECD5', 
    borderRadius: 12, 
    marginHorizontal: 16, 
    marginVertical: 8, 
    elevation: 2 
  },
  greeting: { fontSize: 16, color: '#17375F' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#006A5C' },
});

// Thông tin học sinh (StudentInfo)
function StudentInfo({ students, onSelectStudent, selectedStudentIndex }) {
  if (!students?.length) return null;
  const student = students[selectedStudentIndex || 0];
  return (
    <View style={studentInfoStyles.container}>
      <View style={{ flex: 1 }}>
        <Text style={studentInfoStyles.name}>{student.fullName}</Text>
        <Text style={studentInfoStyles.class}>
          {student.className || student.classId}
          {student.academicYear ? ` (${student.academicYear})` : ''}
        </Text>
        <Text style={studentInfoStyles.school}>{student.schoolName || ''}</Text>
      </View>
      {students.length > 1 && (
        <TouchableOpacity style={studentInfoStyles.button} onPress={onSelectStudent}>
          <Text style={studentInfoStyles.buttonText}>Chọn con</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const studentInfoStyles = StyleSheet.create({
  container: { 
    backgroundColor: '#578FCA', 
    borderRadius: 12, 
    padding: 12, 
    marginHorizontal: 16, 
    marginVertical: 8, 
    elevation: 2, 
    borderWidth: 1, 
    borderColor: '#7AE582',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: { fontWeight: 'bold', fontSize: 16, color: '#FFFFFF' },
  class: { color: '#F5ECD5' },
  school: { color: '#F5ECD5' },
  button: { 
    backgroundColor: '#7AE582', 
    borderRadius: 6, 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    alignSelf: 'auto',
  },
  buttonText: { color: '#17375F', fontWeight: 'bold' },
});

// Tiện ích yêu thích (FavoriteUtilities)
function FavoriteUtilities({ onSelect }) {
  const favorites = [
    { icon: 'comment', label: 'Xem nhận xét', key: 'comments' },
    { icon: 'notifications', label: 'Thông báo lớp học', key: 'classNotifications' },
    { icon: 'campaign', label: 'Thông báo chung', key: 'generalNotifications' },
  ];
  return (
    <View>
      <View style={favoriteStyles.header}>
        <Text style={favoriteStyles.title}>Tiện ích yêu thích</Text>
      </View>
      <View style={favoriteStyles.container}>
        {favorites.map((item, idx) => (
          <TouchableOpacity key={idx} style={favoriteStyles.item} onPress={() => onSelect(item.key)}>
            <MaterialIcons name={item.icon} size={28} color="#00FFDE" />
            <Text style={favoriteStyles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const favoriteStyles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16 },
  title: { fontWeight: 'bold', fontSize: 16, color: '#17375F' },
  customize: { color: '#006A5C', fontSize: 14 },
  container: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginHorizontal: 16, 
    marginVertical: 8, 
    backgroundColor: '#ECFAE5', 
    borderRadius: 12, 
    paddingVertical: 12, 
    elevation: 2 
  },
  item: { width: '33%', alignItems: 'center', marginVertical: 8 },
  label: { marginTop: 4, fontSize: 13, color: '#006A5C' },
});

export default function HomeScreen() {
  const { user, signOut, initialized, loginInProgress } = useAuth();
  const { students, selectedStudent, setSelectedStudent } = useStudent();
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  // Helper lấy ngày đẹp
  const formatDate = (value) => {
    if (!value) {
      return '';
    }

    let date;

    // Xử lý trường hợp value là đối tượng Timestamp của Firestore
    if (typeof value.toDate === 'function') {
      date = value.toDate();
    } 
    // Xử lý trường hợp value là chuỗi (string)
    else {
      date = new Date(value);
    }

    // Kiểm tra nếu date không hợp lệ sau khi chuyển đổi
    if (isNaN(date.getTime())) {
      return 'Ngày không hợp lệ';
    }
    
    // Định dạng lại ngày tháng theo chuẩn Việt Nam
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const getRatingColor = (rating) => {
    if (rating === 'Tốt') return '#4CAF50';
    if (rating === 'Khá') return '#FF9800';
    if (rating === 'Trung bình') return '#FF9800';
    if (rating === 'Yếu') return '#F44336';
    if (rating === 'Kém') return '#F44336';
    return '#FF9800'; // default
  };

  const getRatingStars = (rating) => {
    const ratingMap = {
      'Tốt': 5,
      'Khá': 4,
      'Trung bình': 3,
      'Yếu': 2,
      'Kém': 1
    };
    const score = ratingMap[rating] || 3;
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  };

  const fetchData = async () => {
    if (!user?.uid) return;
    
    try {
      // 1. Lấy user Firestore để lấy linkedStudentIds
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      if (!userDoc.exists) {
        return;
      }
      const userData = userDoc.data();
      const linkedStudentIds = userData.linkedStudentIds || [];
      console.log('linkedStudentIds:', linkedStudentIds);
      
      // 2. Lấy thông tin từng học sinh
      const studentDocs = await Promise.all(
        linkedStudentIds.map(id => firestore().collection('students').doc(id).get())
      );
      const studentsArr = studentDocs.map(doc => doc.exists ? { ...doc.data(), id: doc.id } : null).filter(Boolean);
      console.log('studentsArr:', studentsArr);
      
      // 3. Lấy nhận xét cho từng học sinh từ collection comments riêng
      const commentsObj = {};
      if (studentsArr.length > 0) {
        const studentIds = studentsArr.map(s => s.id);
        const commentsSnap = await firestore()
          .collection('comments')
          .where('studentId', 'in', studentIds)
          .orderBy('createdAt', 'desc')
          .get();
        
        // Batch kiểm tra trạng thái đọc cho tất cả comments
        const commentIds = commentsSnap.docs.map(doc => doc.id);
        const readStatusPromises = commentIds.map(commentId => 
          firestore()
            .collection('comments')
            .doc(commentId)
            .collection('isRead')
            .doc(user.uid)
            .get()
        );
        
        const readStatusResults = await Promise.all(readStatusPromises);
        const readStatusMap = {};
        commentIds.forEach((commentId, index) => {
          const doc = readStatusResults[index];
          readStatusMap[commentId] = doc.exists && doc.data()?.isRead === true;
        });
        
        commentsSnap.docs.forEach(doc => {
          const comment = { 
            ...doc.data(), 
            commentId: doc.id,
            isReadByCurrentUser: readStatusMap[doc.id] || false
          };
          const studentId = comment.studentId;
          
          if (!commentsObj[studentId]) {
            commentsObj[studentId] = [];
          }
          commentsObj[studentId].push(comment);
        });
      }
      console.log('commentsObj:', commentsObj);
      
      // 4. Lấy thông báo cho từng lớp
      const classIds = studentsArr.map(s => s.classId);
      console.log('classIds:', classIds);
      
      // 4a. Thông báo cho từng lớp (notifications)
      const notiObj = {};
      if (classIds.length > 0) {
        const notiSnap = await firestore().collection('notifications').where('classId', 'in', classIds).get();
        if (notiSnap.docs.length > 0) {
          // Batch kiểm tra trạng thái đọc cho notifications
          const notificationIds = notiSnap.docs.map(doc => doc.id);
          const notiReadStatusPromises = notificationIds.map(notificationId => 
            firestore()
              .collection('notifications')
              .doc(notificationId)
              .collection('isRead')
              .doc(user.uid)
              .get()
          );
          
          const notiReadStatusResults = await Promise.all(notiReadStatusPromises);
          const notiReadStatusMap = {};
          notificationIds.forEach((notificationId, index) => {
            const doc = notiReadStatusResults[index];
            notiReadStatusMap[notificationId] = doc.exists && doc.data()?.isRead === true;
          });
          
          notiSnap.docs.forEach(doc => {
            const n = { 
              ...doc.data(), 
              id: doc.id,
              isReadByCurrentUser: notiReadStatusMap[doc.id] || false
            };
            
            if (!notiObj[n.classId]) notiObj[n.classId] = [];
            notiObj[n.classId].push(n);
          });
        }
      }
      console.log('notifications:', notiObj);
      
      // 4b. Thông báo nhiều lớp (notificationsForClass)
      const notiForClassObj = {};
      if (classIds.length > 0) {
        const notiForClassSnap = await firestore().collection('notificationsForClass').where('classIds', 'array-contains-any', classIds).get();
        if (notiForClassSnap.docs.length > 0) {
          // Batch kiểm tra trạng thái đọc cho notificationsForClass
          const notiForClassIds = notiForClassSnap.docs.map(doc => doc.id);
          const notiForClassReadStatusPromises = notiForClassIds.map(notificationId => 
            firestore()
              .collection('notificationsForClass')
              .doc(notificationId)
              .collection('isRead')
              .doc(user.uid)
              .get()
          );
          
          const notiForClassReadStatusResults = await Promise.all(notiForClassReadStatusPromises);
          const notiForClassReadStatusMap = {};
          notiForClassIds.forEach((notificationId, index) => {
            const doc = notiForClassReadStatusResults[index];
            notiForClassReadStatusMap[notificationId] = doc.exists && doc.data()?.isRead === true;
          });
          
          notiForClassSnap.docs.forEach(doc => {
            const n = { 
              ...doc.data(), 
              id: doc.id,
              isReadByCurrentUser: notiForClassReadStatusMap[doc.id] || false
            };
            
            (n.classIds || []).forEach(cid => {
              if (classIds.includes(cid)) {
                if (!notiForClassObj[cid]) notiForClassObj[cid] = [];
                // Tránh thêm trùng lặp
                if (!notiForClassObj[cid].some(item => item.id === n.id)) {
                  notiForClassObj[cid].push(n);
                }
              }
            });
          });
        }
      }
      console.log('notificationsForClass:', notiForClassObj);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  const handleSelectStudent = () => {
    if (students.length > 1) {
      setModalVisible(true);
    }
  };

  const handleStudentPick = (student) => {
    setSelectedStudent(student);
    setModalVisible(false);
  };

  const handleFeatureSelect = (key) => {
    if (!selectedStudent) return;
    if (key === 'comments') {
      navigation.navigate('CommentsScreen', { student: selectedStudent });
    } else if (key === 'classNotifications') {
      navigation.navigate('ClassNotificationsScreen', { student: selectedStudent });
    } else if (key === 'generalNotifications') {
      navigation.navigate('GeneralNotificationsScreen', { student: selectedStudent });
    }
  };

  useEffect(() => {
    if (user && initialized && !loginInProgress) {
      // Thêm delay nhỏ để đảm bảo quá trình đăng nhập hoàn tất
      const timer = setTimeout(() => {
        fetchData();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user?.uid, initialized, loginInProgress]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <View style={styles.userInfo}>
                <Avatar.Text 
                  size={64} 
                  label={user?.email ? user.email.charAt(0).toUpperCase() : 'U'} 
                  style={styles.avatar}
                />
                <View style={styles.greetingContainer}>
                  <Text style={styles.greeting}>{getGreeting()},</Text>
                  <Text style={styles.userName}>{user?.fullName || user?.email?.split('@')[0] || 'Bạn'}!</Text>
                  <Text style={styles.subGreeting}>Hôm nay là {formatDate(new Date().toISOString())}</Text>
                </View>
              </View>
            </View>
          </View>
          <Divider style={styles.divider} />
          <UserInfo user={user} selectedStudent={selectedStudent} />
          {selectedStudent && (
            <View style={studentInfoStyles.container}>
              <View style={{ flex: 1 }}>
                <Text style={studentInfoStyles.name}>{selectedStudent.fullName}</Text>
                <Text style={studentInfoStyles.class}>
                  {selectedStudent.className || selectedStudent.classId}
                  {selectedStudent.academicYear ? ` (${selectedStudent.academicYear})` : ''}
                </Text>
                <Text style={studentInfoStyles.school}>{selectedStudent.schoolName || ''}</Text>
              </View>
              {students.length > 1 && (
                <TouchableOpacity style={studentInfoStyles.button} onPress={handleSelectStudent}>
                  <Text style={studentInfoStyles.buttonText}>Chọn con</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <FavoriteUtilities onSelect={handleFeatureSelect} />
        </ScrollView>
        <Button 
          mode="outlined" 
          onPress={signOut} 
          style={styles.signOutButton}
          textColor="#006A5C"
          buttonColor="transparent"
        >
          Đăng xuất
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  headerContainer: {
    backgroundColor: '#17375F',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#7AE582',
    marginRight: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7AE582',
    marginBottom: 2,
  },
  subGreeting: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  divider: {
    backgroundColor: 'transparent',
    height: 0,
  },
  signOutButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderColor: '#006A5C',
    borderWidth: 1,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    elevation: 5,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    color: '#17375F',
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#7AE582',
  },
});