import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Card, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import firestore from '@react-native-firebase/firestore';
import LoadingScreen from './LoadingSceen';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';

export default function HomeScreen() {
  const { user, signOut, initialized, loginInProgress } = useAuth();
  const [students, setStudents] = useState([]);
  const [comments, setComments] = useState({});
  const [notifications, setNotifications] = useState({});
  const [notificationsForClass, setNotificationsForClass] = useState({});
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

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
    
    setLoading(true);
    try {
      // 1. Lấy user Firestore để lấy linkedStudentIds
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      if (!userDoc.exists) {
        setStudents([]);
        setLoading(false);
        setDataLoaded(true);
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
      setStudents(studentsArr);
      console.log('studentsArr:', studentsArr);
      
      // 3. Lấy nhận xét cho từng học sinh từ collection comments riêng
      const commentsObj = {};
      if (studentsArr.length > 0) {
        const studentIds = studentsArr.map(s => s.id);
        const commentsSnap = await firestore()
          .collection('comments')
          .where('studentId', 'in', studentIds)
          .orderBy('timestamp', 'desc')
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
      setComments(commentsObj);
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
      setNotifications(notiObj);
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
      setNotificationsForClass(notiForClassObj);
      console.log('notificationsForClass:', notiForClassObj);
    } catch (e) {
      console.error('Error fetching data:', e);
      setStudents([]);
    } finally {
      setLoading(false);
      setDataLoaded(true);
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Enhanced Header Section */}
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

        {/* Quick Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{students.length}</Text>
            <Text style={styles.summaryLabel}>Con em</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {Object.values(comments).reduce((total, studentComments) => total + studentComments.length, 0)}
            </Text>
            <Text style={styles.summaryLabel}>Nhận xét</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {Object.values(notifications).reduce((total, classNotis) => total + classNotis.length, 0) + 
               Object.values(notificationsForClass).reduce((total, classNotis) => total + classNotis.length, 0)}
            </Text>
            <Text style={styles.summaryLabel}>Thông báo</Text>
          </View>
        </View>

        <View>
          {/* Danh sách các con */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={{fontWeight: 'bold', color: '#17375F', fontSize: 20}}>Con của bạn</Text>
            </View>
            {students.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Không có dữ liệu học sinh liên kết.</Text>
                <Text style={styles.emptySubText}>Vui lòng liên hệ nhà trường để được hỗ trợ</Text>
              </View>
            ) : (
              students.map(student => (
                <Card key={student.id} style={styles.studentCard}>
                  <View style={styles.studentHeader}>
                    <Avatar.Text
                      size={48}
                      label={student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
                      style={styles.studentAvatar}
                    />
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.fullName}</Text>
                      <View style={styles.classTag}>
                        <Text style={styles.classTagText}>Lớp {student.classId}</Text>
                      </View>
                    </View>
                  </View>

                  <Card.Content style={styles.cardContent}>
                    {/* Nhận xét giáo viên */}
                    <View style={styles.subSection}>
                      <View style={styles.subSectionHeader}>
                        <Text style={{fontWeight: 'bold', color: '#17375F', fontSize: 16}}>Nhận xét giáo viên</Text>
                      </View>
                      {comments[student.id]?.length ? (
                        comments[student.id].map(comment => (
                          <TouchableOpacity
                            key={comment.commentId}
                            onPress={async () => {
                              if (!comment.isReadByCurrentUser) {
                                try {
                                  await firestore()
                                    .collection('comments')
                                    .doc(comment.commentId)
                                    .collection('isRead')
                                    .doc(user.uid)
                                    .set({
                                      isRead: true,
                                      readAt: firestore.FieldValue.serverTimestamp(),
                                      parentName: user.fullName || user.email || '',
                                    }, { merge: true });
                                  // Cập nhật UI ngay
                                  setComments(prev => {
                                    const updated = { ...prev };
                                    updated[comment.studentId] = updated[comment.studentId].map(c =>
                                      c.commentId === comment.commentId ? { ...c, isReadByCurrentUser: true } : c
                                    );
                                    return updated;
                                  });
                                } catch (error) {
                                  console.error('Lỗi khi cập nhật trạng thái đã xem cho comment:', error);
                                }
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[
                              styles.commentItem,
                              !comment.isReadByCurrentUser ? styles.unreadItem : styles.readItem
                            ]}>
                              <View style={styles.row}>
                                {!comment.isReadByCurrentUser ? (
                                  <Text style={styles.commentContent}>{comment.content}</Text>
                                ) : (
                                  <Text style={styles.commentContent}>{comment.content}</Text>
                                )}
                                <Text style={
                                  !comment.isReadByCurrentUser ? styles.unreadStatusText : styles.readStatusText
                                }>
                                  {comment.isReadByCurrentUser ? 'Đã xem' : 'Chưa xem'}
                                </Text>
                              </View>
                              <View style={styles.commentMeta}>
                                <View style={styles.commentInfo}>
                                  <View style={styles.commentDetail}>
                                    <Text style={styles.commentSubject}>{comment.subject}</Text>
                                  </View>
                                  <View style={styles.commentDetail}>
                                    <Text style={styles.commentTeacher}>{comment.teacherName}</Text>
                                  </View>
                                </View>
                                <View style={styles.ratingContainer}>
                                  <Text style={[styles.ratingStars, { color: getRatingColor(comment.rating) }]}>
                                    {getRatingStars(comment.rating)}
                                  </Text>
                                  <Text style={[styles.ratingText, { color: getRatingColor(comment.rating) }]}>
                                    {comment.rating}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.commentFooter}>
                                <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={styles.placeholderContainer}>
                          <Text style={styles.placeholder}>Chưa có nhận xét từ giáo viên</Text>
                        </View>
                      )}
                    </View>

                    {/* Thông báo cho lớp */}
                    <View style={styles.subSection}>
                      <View style={styles.subSectionHeader}>
                        <Text style={{fontWeight: 'bold', color: '#17375F', fontSize: 16}}>Thông báo lớp học</Text>
                      </View>
                      {notifications[student.classId]?.length ? (
                        notifications[student.classId].map(n => (
                          <TouchableOpacity
                            key={n.id}
                            onPress={async () => {
                              if (!n.isReadByCurrentUser) {
                                try {
                                  await firestore()
                                    .collection('notifications')
                                    .doc(n.id)
                                    .collection('isRead')
                                    .doc(user.uid)
                                    .set({
                                      isRead: true,
                                      readAt: firestore.FieldValue.serverTimestamp(),
                                      parentName: user.fullName || user.email || '',
                                    }, { merge: true });
                                  // Cập nhật UI ngay
                                  setNotifications(prev => {
                                    const updated = { ...prev };
                                    updated[n.classId] = updated[n.classId].map(item =>
                                      item.id === n.id ? { ...item, isReadByCurrentUser: true } : item
                                    );
                                    return updated;
                                  });
                                } catch (error) {
                                  console.error('Lỗi khi cập nhật trạng thái đã xem cho notification:', error);
                                }
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[
                              styles.notificationBase,
                              n.isReadByCurrentUser ? styles.notificationClassRead : styles.unreadItem
                            ]}>
                              <View style={styles.notificationHeader}>
                                {!n.isReadByCurrentUser ? (
                                  <Text style={styles.notificationTitle}>{n.title}</Text>
                                ) : (
                                  <Text style={styles.notificationTitle}>{n.title}</Text>
                                )}
                                <View style={[styles.tagBase, styles.classTagColor]}>
                                  <Text style={styles.tagText}>Riêng lớp</Text>
                                </View>
                              </View>
                              <Text style={styles.notificationContent}>{n.content}</Text>
                              <View style={styles.notificationFooter}>
                                <Text style={styles.notificationDate}>{formatDate(n.createdAt)}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={styles.placeholderContainer}>
                          <Text style={styles.placeholder}>Không có thông báo riêng cho lớp</Text>
                        </View>
                      )}
                    </View>

                    {/* Thông báo chung nhiều lớp */}
                    <View style={styles.subSection}>
                      <View style={styles.subSectionHeader}>
                        <Text style={{fontWeight: 'bold', color: '#FFB300', fontSize: 16}}>Thông báo chung</Text>
                      </View>
                      {notificationsForClass[student.classId]?.length ? (
                        notificationsForClass[student.classId].map(n => (
                          <TouchableOpacity
                            key={n.id}
                            onPress={async () => {
                              if (!n.isReadByCurrentUser) {
                                try {
                                  await firestore()
                                    .collection('notificationsForClass')
                                    .doc(n.id)
                                    .collection('isRead')
                                    .doc(user.uid)
                                    .set({
                                      isRead: true,
                                      readAt: firestore.FieldValue.serverTimestamp(),
                                      parentName: user.fullName || user.email || '',
                                    }, { merge: true });
                                  // Cập nhật UI ngay
                                  setNotificationsForClass(prev => {
                                    const updated = { ...prev };
                                    (n.classIds || []).forEach(cid => {
                                      if (updated[cid]) {
                                        updated[cid] = updated[cid].map(item =>
                                          item.id === n.id ? { ...item, isReadByCurrentUser: true } : item
                                        );
                                      }
                                    });
                                    return updated;
                                  });
                                } catch (error) {
                                  console.error('Lỗi khi cập nhật trạng thái đã xem cho notificationForClass:', error);
                                }
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[
                              styles.notificationBase,
                              n.isReadByCurrentUser ? styles.notificationGeneralRead : styles.unreadItem
                            ]}>
                              <View style={styles.notificationHeader}>
                                {!n.isReadByCurrentUser ? (
                                  <Text style={styles.notificationTitle}>{n.title}</Text>
                                ) : (
                                  <Text style={styles.notificationTitle}>{n.title}</Text>
                                )}
                                <View style={[styles.tagBase, styles.generalTagColor]}>
                                  <Text style={styles.tagText}>Chung</Text>
                                </View>
                              </View>
                              <Text style={styles.notificationContent}>{n.content}</Text>
                              <View style={styles.notificationFooter}>
                                <Text style={styles.notificationDate}>{formatDate(n.createdAt)}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={styles.placeholderContainer}>
                          <Text style={styles.placeholder}>Không có thông báo chung</Text>
                        </View>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        </View>

        {/* Sign Out Button */}
        <Button 
          mode="outlined" 
          onPress={signOut} 
          style={styles.signOutButton}
          textColor="#D32F2F"
          buttonColor="transparent"
        >
          Đăng xuất
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    backgroundColor: '#006A5C',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subGreeting: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  divider: {
    backgroundColor: 'transparent',
    height: 0,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    margin: 0,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#17375F',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
  },
  emptyIcon: {
    margin: 0,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  studentAvatar: {
    backgroundColor: '#E3F2FD',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#17375F',
    marginBottom: 4,
  },
  classTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006A5C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  classIcon: {
    margin: 0,
    marginRight: 4,
  },
  classTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 0,
  },
  subSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subSectionIcon: {
    margin: 0,
    marginRight: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17375F',
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  placeholderIcon: {
    margin: 0,
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  commentItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  unreadItem: {
    backgroundColor: '#FFF3E0', // vàng nhạt
    borderLeftColor: '#FFB300',
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  unreadIcon: {
    margin: 0,
    marginRight: 8,
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    flex: 1,
  },
  unreadText: {
    fontWeight: '600',
    color: '#17375F',
  },
  commentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  commentInfo: {
    flex: 1,
  },
  commentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentDetailIcon: {
    margin: 0,
    marginRight: 4,
  },
  commentSubject: {
    fontSize: 12,
    color: '#006A5C',
    fontWeight: '600',
  },
  commentTeacher: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  ratingStars: {
    fontSize: 16,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    margin: 0,
    marginRight: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  notificationBase: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  notificationClassRead: {
    backgroundColor: '#F8F9FA',
    borderLeftColor: '#E0E0E0',
  },
  notificationGeneralRead: {
    backgroundColor: '#F8F9FA',
    borderLeftColor: '#E0E0E0',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17375F',
    flex: 1,
    marginRight: 8,
  },
  tagBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  classTagColor: {
    backgroundColor: '#4CAF50',
  },
  generalTagColor: {
    backgroundColor: '#FF9800',
  },
  tagIcon: {
    margin: 0,
    marginRight: 2,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  notificationContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 12,
    color: '#666',
  },
  signOutButton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
  readItem: {
    backgroundColor: '#E8F5E9', // xanh nhạt
    borderLeftColor: '#4CAF50',
  },
  readText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  readStatusText: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 8,
    alignSelf: 'center',
  },
  unreadStatusText: {
    fontSize: 10,
    color: '#FFB300',
    marginLeft: 8,
    alignSelf: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#17375F',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
});