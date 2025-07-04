import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Modal, Portal, Text, TextInput, Dialog } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useStudent } from '../contexts/StudentContext';
import auth from '@react-native-firebase/auth';

export default function ProfileScreen() {
  const { user, resetPassword, signOut } = useAuth();
  const { students } = useStudent();
  const [teacherMap, setTeacherMap] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [sending, setSending] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchTeachers = async () => {
      if (!students || students.length === 0) return;
      const classIds = students.map(s => s.classId);
      if (!classIds.length) return;
      const teacherSnap = await firestore()
        .collection('teachers')
        .where('classIds', 'array-contains-any', classIds)
        .get();
      const map = {};
      teacherSnap.docs.forEach(doc => {
        const data = doc.data();
        (data.classIds || []).forEach(cid => {
          if (classIds.includes(cid)) {
            map[cid] = data;
          }
        });
      });
      setTeacherMap(map);
    };
    fetchTeachers();
  }, [students]);

  const handleResetPassword = async () => {
    if (!emailInput) return;
    setSending(true);
    try {
      await resetPassword(emailInput);
      Alert.alert('Thành công', 'Đã gửi email đổi mật khẩu. Vui lòng kiểm tra hộp thư.');
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể gửi email đổi mật khẩu.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Xác nhận xóa tài khoản',
      'Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive', onPress: async () => {
            try {
              await auth().currentUser.delete();
              Alert.alert('Đã xóa tài khoản', 'Tài khoản của bạn đã được xóa thành công.');
              signOut();
            } catch (e) {
              if (e.code === 'auth/requires-recent-login') {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập lại để xóa tài khoản.');
              } else {
                Alert.alert('Lỗi', 'Không thể xóa tài khoản.');
              }
            }
          }
        }
      ]
    );
  };

  function formatDateVN(dateString) {
    if (!dateString) return '---';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* Header Avatar + Tên */}
      <View style={styles.headerSection}>
        <Avatar.Icon size={90} icon="account" style={styles.avatar} color="#17375F" />
        <Text style={styles.headerTitle}>Trang tài khoản</Text>
        <Text style={styles.headerSub}>{user?.fullName || user?.email || '---'}</Text>
      </View>

      {/* Thông tin phụ huynh */}
      <Card style={styles.card} elevation={4}>
        <Card.Title titleStyle={styles.sectionTitle}>Thông tin phụ huynh</Card.Title>
        <Card.Content>
          <View style={styles.infoRow}><Text style={styles.label}>Họ tên:</Text><Text style={styles.value}>{user?.fullName || '---'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{user?.email || '---'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.label}>Số điện thoại:</Text><Text style={styles.value}>{user?.phone || '---'}</Text></View>
          <Button mode="outlined" style={styles.changePassBtn} onPress={() => setModalVisible(true)} textColor="#006A5C">
            Đổi mật khẩu
          </Button>
        </Card.Content>
      </Card>

      {/* Thông tin các con */}
      <Card style={styles.card} elevation={4}>
        <Card.Title titleStyle={styles.sectionTitle}>Thông tin các con</Card.Title>
        <Card.Content>
          {students.length === 0 && <Text style={styles.value}>Không có dữ liệu</Text>}
          {students.map((student, idx) => (
            <Card key={student.id} style={styles.childCard} elevation={2}>
              <Card.Content>
                <View style={styles.childHeader}>
                  <Avatar.Text size={40} label={student.fullName?.charAt(0).toUpperCase() || '?'} style={styles.childAvatar} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.childName}>{student.fullName}</Text>
                    <Text style={styles.childInfo}>Mã học sinh: <Text style={styles.childValue}>{student.id || '---'}</Text></Text>
                  </View>
                </View>
                <View style={styles.childInfoBlock}>
                  <Text style={styles.childInfo}>Lớp: <Text style={styles.childValue}>{student.className || student.classId || '---'}</Text></Text>
                  <Text style={styles.childInfo}>Năm học: <Text style={styles.childValue}>{student.academicYear || '---'}</Text></Text>
                  <Text style={styles.childInfo}>Ngày sinh: <Text style={styles.childValue}>{formatDateVN(student.dateOfBirth)}</Text></Text>
                  <Text style={styles.childInfo}>Giới tính: <Text style={styles.childValue}>{student.gender || '---'}</Text></Text>
                </View>
                {teacherMap[student.classId] && (
                  <Card style={styles.teacherBox} elevation={0}>
                    <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Avatar.Icon size={36} icon="account" style={{ backgroundColor: '#5F8B4C', marginRight: 10 }} color="#fff" />
                      <View>
                        <Text style={styles.teacherTitle}>Giáo viên chủ nhiệm:</Text>
                        <Text style={styles.teacherName}>{teacherMap[student.classId].fullName}</Text>
                        <Text style={styles.teacherInfo}>Email: {teacherMap[student.classId].email}</Text>
                        <Text style={styles.teacherInfo}>SĐT: {teacherMap[student.classId].phone}</Text>
                      </View>
                    </Card.Content>
                  </Card>
                )}
              </Card.Content>
            </Card>
          ))}
        </Card.Content>
      </Card>

      {/* Nút đăng xuất */}
      <Button
        mode="contained-tonal"
        style={styles.signOutBtn}
        textColor="#D32F2F"
        onPress={signOut}
        icon="logout"
      >
        Đăng xuất
      </Button>
      {/* Nút xóa tài khoản */}
      <Button
        mode="contained"
        style={{ marginHorizontal: 20, marginTop: 8, backgroundColor: '#FF6B6B' }}
        textColor="#fff"
        onPress={handleDeleteAccount}
        icon="delete"
      >
        Xóa tài khoản
      </Button>

      {/* Modal đổi mật khẩu */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContainer}>
          <View style={{ alignItems: 'flex-end' }}>
            <Button icon="close" onPress={() => setModalVisible(false)} compact />
          </View>
          <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
          <Text style={styles.modalDesc}>Nhập email để nhận link đổi mật khẩu.</Text>
          <TextInput
            label="Email"
            value={emailInput}
            onChangeText={setEmailInput}
            style={styles.modalInput}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
          />
          <Button
            mode="contained"
            onPress={handleResetPassword}
            loading={sending}
            disabled={sending || !emailInput}
            style={styles.modalButton}
            contentStyle={{ paddingVertical: 8 }}
            labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
          >
            Gửi email đổi mật khẩu
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6FA' },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 0 },
  
  headerSection: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 24,
    backgroundColor: '#17375F',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  avatar: { backgroundColor: '#7AE582', marginBottom: 10 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  headerSub: { color: '#B2FFB2', fontSize: 16, fontWeight: '500', marginTop: 4 },
  
  card: {
    marginHorizontal: 20,
    marginBottom: 22,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: { fontWeight: 'bold', fontSize: 18, color: '#006A5C' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  label: { fontSize: 14, color: '#555', fontWeight: '500', width: 110 },
  value: { fontSize: 15, color: '#17375F', fontWeight: '600' },
  changePassBtn: { marginTop: 16, alignSelf: 'flex-end', borderColor: '#006A5C', borderRadius: 8 },

  childCard: {
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: '#E9F7EF',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  childHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  childAvatar: { backgroundColor: '#7AE582' },
  childName: { fontWeight: 'bold', fontSize: 17, color: '#17375F' },
  childInfoBlock: { marginLeft: 52, marginBottom: 6 },
  childInfo: { color: '#444', fontSize: 13, marginBottom: 3 },
  childValue: { color: '#17375F', fontWeight: '600' },

  teacherBox: {
    backgroundColor: '#DDF6D2',
    borderRadius: 10,
    marginTop: 12,
    padding: 10,
  },
  teacherTitle: { fontWeight: '600', color: '#333', fontSize: 13 },
  teacherName: { fontWeight: 'bold', color: '#006A5C', fontSize: 14 },
  teacherInfo: { color: '#555', fontSize: 12 },

  signOutBtn: {
    marginHorizontal: 40,
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: '#D32F2F',
    elevation: 3,
  },

  modalContainer: {
    backgroundColor: '#fff',
    padding: 28,
    margin: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#17375F',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalDesc: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 18,
    fontSize: 14,
  },
  modalInput: {
    marginBottom: 18,
    backgroundColor: '#F4F6FA',
    borderRadius: 10,
  },
  modalButton: {
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: '#7C4DFF',
  },
});
