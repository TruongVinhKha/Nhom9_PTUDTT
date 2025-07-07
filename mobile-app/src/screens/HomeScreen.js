import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Modal, FlatList, TouchableHighlight, Dimensions, Animated, RefreshControl } from 'react-native';
import { Avatar, Button, Divider, Text, Card, Surface, Badge, Portal, Dialog } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useStudent } from '../contexts/StudentContext';
import { Easing } from 'react';

const { width } = Dimensions.get('window');

// Hiệu ứng scale khi nhấn
function ScaleTouchable({ onPress, children, style, accessibilityLabel, ...props }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View
      style={[{ transform: [{ scale }] }, style]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ flex: 1 }}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Khu vực thông tin người dùng (UserInfo)
function UserInfo({ user, selectedStudent }) {
  return (
    <Card style={sharedCardStyles.card} elevation={4}>
      <Card.Content style={sharedCardStyles.content}>
        <View style={sharedCardStyles.iconContainer}>
          <MaterialIcons name="account-circle" size={54} color="#00CAFF" />
        </View>
        <View style={sharedCardStyles.textContainer}>
          <Text style={sharedCardStyles.greeting}>{String('Xin chào,')}</Text>
          <Text style={sharedCardStyles.name}>Phụ huynh em: {String(selectedStudent?.fullName || '...')}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

// Thông tin học sinh (StudentInfo)
function StudentInfo({ students, onSelectStudent, selectedStudentIndex }) {
  if (!students?.length) return null;
  const student = students[selectedStudentIndex || 0];

  return (
    <Card style={sharedCardStyles.card} elevation={4}>
      <Card.Content style={sharedCardStyles.content}>
        <View style={sharedCardStyles.avatarContainer}>
          <Avatar.Text
            size={48}
            label={String(student.fullName.charAt(0).toUpperCase())}
            style={sharedCardStyles.avatar}
            labelStyle={sharedCardStyles.avatarLabel}
          />
        </View>
        <View style={sharedCardStyles.infoContainer}>
          <Text style={sharedCardStyles.name}>{String(student.fullName)}</Text>
          <Text style={sharedCardStyles.class}>
            {String(student.className || student.classId)}
            {student.academicYear ? ` (${String(student.academicYear)})` : ''}
          </Text>
          <Text style={sharedCardStyles.school}>{String(student.schoolName || '')}</Text>
        </View>
        {students.length > 1 && (
          <Surface style={sharedCardStyles.buttonSurface} elevation={0}>
            <Button
              mode="contained"
              onPress={onSelectStudent}
              buttonColor="#7AE582"
              textColor="#17375F"
              contentStyle={sharedCardStyles.buttonContent}
              labelStyle={sharedCardStyles.buttonLabel}
              icon="swap-horizontal"
              style={sharedCardStyles.button}
            >
              Chọn con
            </Button>
          </Surface>
        )}
      </Card.Content>
    </Card>
  );
}

// Tiện ích yêu thích (FavoriteUtilities)
function FavoriteUtilities({ onSelect, badgeCounts = {} }) {
  const favorites = [
    { icon: 'comment', label: 'Xem nhận xét', key: 'comments' },
    { icon: 'notifications', label: 'Thông báo lớp học', key: 'classNotifications' },
    { icon: 'campaign', label: 'Thông báo chung', key: 'generalNotifications' },
  ];

  return (
    <View style={favoriteStyles.wrapper}>
      <View style={favoriteStyles.header}>
        <Text style={favoriteStyles.title}>{String('Tiện ích yêu thích')}</Text>
      </View>
      <View style={favoriteStyles.cardRow}>
        {favorites.map((item) => (
          <ScaleTouchable
            key={item.key}
            onPress={() => onSelect(item.key)}
            accessibilityLabel={item.label}
            style={favoriteStyles.cardItem}
          >
            <View style={favoriteStyles.iconBadgeContainer}>
              <MaterialIcons name={item.icon} size={32} color="#00FFDE" style={favoriteStyles.icon} />
              {badgeCounts[item.key] > 0 && (
                <Badge
                  style={favoriteStyles.badge}
                  size={15}
                  accessibilityLabel={`Có ${badgeCounts[item.key]} thông báo mới`}
                >
                  {String(badgeCounts[item.key])}
                </Badge>
              )}
            </View>
            <Text style={favoriteStyles.label}>{String(item.label)}</Text>
          </ScaleTouchable>
        ))}
      </View>
    </View>
  );
}

const sharedCardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#F5ECD5',
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#17375F',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    backgroundColor: '#7AE582',
  },
  avatarLabel: {
    color: '#17375F',
    fontWeight: 'bold',
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  infoContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#17375F',
    marginBottom: 4,
    fontWeight: '500',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006A5C',
    lineHeight: 24,
  },
  class: {
    color: '#17375F',
    fontSize: 14,
    marginBottom: 2,
  },
  school: {
    color: '#17375F',
    fontSize: 13,
  },
  buttonSurface: {
    borderRadius: 10,
    marginLeft: 8,
    backgroundColor: 'transparent',
  },
  button: {
    borderRadius: 10,
    elevation: 0,
  },
  buttonContent: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});


const favoriteStyles = StyleSheet.create({
  wrapper: {
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#17375F',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: 8,
  },
  cardItem: {
    flex: 1,
    backgroundColor: '#F5ECD5',
    borderRadius: 18,
    marginHorizontal: 6,
    alignItems: 'center',
    paddingVertical: 18,
    minWidth: 110,
    minHeight: 120,
    elevation: 4,
    shadowColor: '#17375F',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    justifyContent: 'flex-start',
  },
  iconBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center', 
    position: 'relative',
    marginBottom: 10,
    marginTop: 2,
  },
  
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF',
    elevation: 2,
    minWidth: 16,
    height: 16,
    textAlign: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    color: '#006A5C',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 2,
    flex: 1,
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
});

export default function HomeScreen() {
  const { user, signOut, initialized, loginInProgress } = useAuth();
  const { students, selectedStudent, setSelectedStudent } = useStudent();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({ comments: 0, classNotifications: 0, generalNotifications: 0 });
  const [commentsObj, setCommentsObj] = useState({});
  const [notiObj, setNotiObj] = useState({});
  const [notiForClassObj, setNotiForClassObj] = useState({});
  const [refreshing, setRefreshing] = useState(false);

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
      // 2. Lấy thông tin từng học sinh
      const studentDocs = await Promise.all(
        linkedStudentIds.map(id => firestore().collection('students').doc(id).get())
      );
      const studentsArr = studentDocs.map(doc => doc.exists ? { ...doc.data(), id: doc.id } : null).filter(Boolean);
      // 3. Lấy nhận xét cho từng học sinh từ collection comments riêng
      const commentsObj = {};
      if (studentsArr.length > 0) {
        const studentIds = studentsArr.map(s => s.id);
        const commentsSnap = await firestore()
          .collection('comments')
          .where('studentId', 'in', studentIds)
          .orderBy('createdAt', 'desc')
          .get();
        // Batch kiểm tra trạng thái đọc cho tất cả comments song song
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
      // 4. Lấy thông báo cho từng lớp
      const classIds = studentsArr.map(s => s.classId);
      // 4a. Thông báo cho từng lớp (notifications)
      const notiObj = {};
      if (classIds.length > 0) {
        const notiSnap = await firestore().collection('notifications').where('classId', 'in', classIds).get();
        if (notiSnap.docs.length > 0) {
          // Batch kiểm tra trạng thái đọc cho notifications song song
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
      // 4b. Thông báo nhiều lớp (notificationsForClass)
      const notiForClassObj = {};
      if (classIds.length > 0) {
        const notiForClassSnap = await firestore().collection('notificationsForClass').where('classIds', 'array-contains-any', classIds).get();
        if (notiForClassSnap.docs.length > 0) {
          // Batch kiểm tra trạng thái đọc cho notificationsForClass song song
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
      // Sau khi lấy xong dữ liệu, lưu vào state để đồng bộ badge
      setCommentsObj(commentsObj);
      setNotiObj(notiObj);
      setNotiForClassObj(notiForClassObj);
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

  // Đếm số chưa đọc cho từng mục
  const updateBadgeCounts = (commentsObj, notiObj, notiForClassObj) => {
    let commentsUnread = 0;
    let classNotiUnread = 0;
    let generalNotiUnread = 0;
    if (selectedStudent) {
      // Đếm nhận xét chưa đọc
      const comments = commentsObj?.[selectedStudent.id] || [];
      commentsUnread = comments.filter(c => !c.isReadByCurrentUser).length;
      // Đếm thông báo lớp học chưa đọc
      const classNotis = notiObj?.[selectedStudent.classId] || [];
      classNotiUnread = classNotis.filter(n => !n.isReadByCurrentUser).length;
      // Đếm thông báo chung chưa đọc
      const generalNotis = notiForClassObj?.[selectedStudent.classId] || [];
      generalNotiUnread = generalNotis.filter(n => !n.isReadByCurrentUser).length;
    }
    setBadgeCounts({
      comments: commentsUnread,
      classNotifications: classNotiUnread,
      generalNotifications: generalNotiUnread,
    });
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

  // Đồng bộ badgeCounts mỗi khi dữ liệu hoặc học sinh thay đổi
  useEffect(() => {
    updateBadgeCounts(commentsObj, notiObj, notiForClassObj);
  }, [selectedStudent, commentsObj, notiObj, notiForClassObj]);

  // Hàm xử lý khi kéo để làm mới
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <>
      <Surface style={styles.headerSurface} elevation={10}>
        <View style={[styles.headerContainer, { paddingTop: insets.top + 28 }]}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Avatar.Text
                size={72}
                label={user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>{String(getGreeting())},</Text>
                <Text style={styles.userName}>{String(user?.fullName || user?.email?.split('@')[0] || 'Bạn')}!</Text>
                <Text style={styles.subGreeting}>Hôm nay là {String(formatDate(new Date().toISOString()))}</Text>
              </View>
            </View>
          </View>
        </View>
      </Surface>
      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)} style={modalStyles.dialog}>
          <Dialog.Title style={modalStyles.title}>
            Chọn học sinh
          </Dialog.Title>
          <Dialog.Content>
            <FlatList
              data={students}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <ScaleTouchable
                  onPress={() => handleStudentPick(item)}
                  accessibilityLabel={`Chọn học sinh ${item.fullName}`}
                  style={{ borderRadius: 14, marginVertical: 5 }}
                >
                  <Surface style={modalStyles.itemSurface} elevation={2}>
                    <View style={modalStyles.itemContent}>
                      <Avatar.Text
                        size={36}
                        label={String(item.fullName.charAt(0).toUpperCase())}
                        style={modalStyles.itemAvatar}
                        labelStyle={{ fontSize: 15, fontWeight: 'bold' }}
                      />
                      <Text style={modalStyles.itemText}>{String(item.fullName)}</Text>
                    </View>
                  </Surface>
                </ScaleTouchable>
              )}
              showsVerticalScrollIndicator={false}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setModalVisible(false)} textColor="#006A5C">
              Đóng
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Divider style={{ marginVertical: 10, marginHorizontal: 24, backgroundColor: '#7AE582', height: 2, borderRadius: 2 }} />
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#7AE582"]}
              tintColor="#7AE582"
            />
          }
        >
          <UserInfo user={user} selectedStudent={selectedStudent} />
          {selectedStudent && (
            <StudentInfo
              students={students}
              onSelectStudent={handleSelectStudent}
              selectedStudentIndex={students.findIndex(s => s.id === selectedStudent.id)}
            />
          )}
          <FavoriteUtilities onSelect={handleFeatureSelect} badgeCounts={badgeCounts} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 110,
    paddingTop: 8,
  },
  headerSurface: {
    elevation: 10,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#17375F',
    shadowOpacity: 0.13,
    shadowRadius: 10,
  },
  headerContainer: {
    backgroundColor: '#17375F',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 28,
    paddingVertical: 28,
    marginBottom: 18,
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
    marginRight: 22,
    elevation: 4,
  },
  avatarLabel: {
    color: '#17375F',
    fontWeight: 'bold',
    fontSize: 26,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#7AE582',
    marginBottom: 4,
    lineHeight: 33,
  },
  subGreeting: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});

const modalStyles = StyleSheet.create({
  dialog: {
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 21,
    color: '#17375F',
    textAlign: 'center',
    marginBottom: 4,
  },
  item: {
    marginVertical: 5,
  },
  itemSurface: {
    borderRadius: 14,
    elevation: 2,
    backgroundColor: '#F5ECD5',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemAvatar: {
    backgroundColor: '#7AE582',
    marginRight: 14,
  },
  itemText: {
    fontSize: 17,
    color: '#17375F',
    fontWeight: '500',
  },
});