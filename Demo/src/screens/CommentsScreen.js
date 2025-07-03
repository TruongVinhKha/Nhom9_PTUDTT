import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useStudent } from '../contexts/StudentContext';
import { Text } from 'react-native-paper';

export default function CommentsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { student: navStudent } = route.params || {};
  const { selectedStudent } = useStudent();
  const student = selectedStudent || navStudent || {};
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.id) return;
    const fetchComments = async () => {
      setLoading(true);
      try {
        const snap = await firestore()
          .collection('comments')
          .where('studentId', '==', student.id)
          .orderBy('createdAt', 'desc')
          .get();
        const commentList = [];
        const commentIds = snap.docs.map(doc => doc.id);
        // Lấy trạng thái đã đọc song song
        const readStatusPromises = commentIds.map(id =>
          firestore().collection('comments').doc(id).collection('isRead').doc(user.uid).get()
        );
        const readStatusResults = await Promise.all(readStatusPromises);
        const readStatusMap = {};
        commentIds.forEach((id, idx) => {
          const doc = readStatusResults[idx];
          readStatusMap[id] = doc.exists && doc.data()?.isRead === true;
        });
        snap.docs.forEach(doc => {
          commentList.push({
            ...doc.data(),
            id: doc.id,
            isReadByCurrentUser: readStatusMap[doc.id] || false
          });
        });
        setComments(commentList);
      } catch (e) {
        setComments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [student?.id, user?.uid]);

  const markAsRead = async (commentId) => {
    try {
      await firestore()
        .collection('comments')
        .doc(commentId)
        .collection('isRead')
        .doc(user.uid)
        .set({ 
          isRead: true, 
          parentName: user.email || '', 
          readAt: firestore.FieldValue.serverTimestamp() 
        });
      // Update local state
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId
            ? { ...comment, isReadByCurrentUser: true }
            : comment
        )
      );
    } catch (error) {
      console.error('Error marking comment as read:', error);
    }
  };

  const handleCommentPress = (comment) => {
    if (!comment.isReadByCurrentUser) {
      markAsRead(comment.id);
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
          <Text style={styles.headerTitle}>Nhận xét của học sinh</Text>
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
        ) : comments.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="comment" size={64} color="#ccc" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>Không có nhận xét</Text>
          </View>
        ) : (
          comments.map(comment => (
            <TouchableOpacity
              key={comment.id}
              style={[styles.commentItem, comment.isReadByCurrentUser ? styles.readItem : styles.unreadItem]}
              onPress={() => handleCommentPress(comment)}
              activeOpacity={0.7}
            >
              <View style={styles.commentHeader}>
                <View style={styles.commentMeta}>
                  <Text style={styles.commentSubject}>{comment.subject}</Text>
                  <Text style={styles.commentTeacher}>{comment.teacherName}</Text>
                </View>
                <View style={[styles.statusBadge, comment.isReadByCurrentUser ? styles.readBadge : styles.unreadBadge]}>
                  <Text style={styles.statusText}>
                    {comment.isReadByCurrentUser ? 'Đã xem' : 'Chưa xem'}
                  </Text>
                </View>
              </View>
              <Text style={styles.commentContent}>{comment.content}</Text>
              <View style={styles.commentFooter}>
                <Icon name="schedule" size={16} color="#666" />
                <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
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
  commentItem: { 
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
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentMeta: {
    flex: 1,
    marginRight: 12,
  },
  commentSubject: { 
    fontSize: 14, 
    color: '#006A5C', 
    fontWeight: '600',
    marginBottom: 2,
  },
  commentTeacher: { 
    fontSize: 12, 
    color: '#666' 
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
  commentContent: { 
    fontSize: 14, 
    color: '#17375F', 
    marginBottom: 12,
    lineHeight: 20,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentDate: { 
    fontSize: 12, 
    color: '#666', 
    marginLeft: 4,
  },
}); 