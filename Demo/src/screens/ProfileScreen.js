import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useStudent } from '../contexts/StudentContext';
import firestore from '@react-native-firebase/firestore';
import { Button, Avatar, Modal, Portal, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user, resetPassword } = useAuth();
  const { students } = useStudent();
  const [teacherMap, setTeacherMap] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [sending, setSending] = useState(false);
  const navigation = useNavigation();

  // Lấy thông tin giáo viên chủ nhiệm cho từng học sinh
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
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#17375F', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12 }}>
          <Avatar.Icon size={32} icon="arrow-left" style={{ backgroundColor: '#7AE582' }} color="#17375F" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', marginRight: 44 }}>
          <Avatar.Icon size={64} icon="account" style={{ backgroundColor: '#7AE582', marginBottom: 8 }} color="#17375F" />
          <Text style={styles.headerTitle}>Trang tài khoản</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin phụ huynh</Text>
        <Text style={styles.label}>Họ tên:</Text>
        <Text style={styles.value}>{user?.fullName || '---'}</Text>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user?.email || '---'}</Text>
        <Text style={styles.label}>Số điện thoại:</Text>
        <Text style={styles.value}>{user?.phone || '---'}</Text>
        <Button mode="outlined" style={styles.changePassBtn} onPress={() => setModalVisible(true)} textColor="#FE7743">
          Đổi mật khẩu
        </Button>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin các con</Text>
        {students.length === 0 && <Text style={styles.value}>Không có dữ liệu</Text>}
        {students.map((student, idx) => (
          <View key={student.id} style={styles.childCard}>
            <Text style={styles.childName}>{student.fullName}</Text>
            <Text style={styles.childInfo}>Mã học sinh: {student.id || '---'}</Text>
            <Text style={styles.childInfo}>Lớp: {student.className || student.classId || '---'}</Text>
            <Text style={styles.childInfo}>Năm học: {student.academicYear || '---'}</Text>
            <Text style={styles.childInfo}>Ngày sinh: {formatDateVN(student.dateOfBirth)}</Text>
            <Text style={styles.childInfo}>Giới tính: {student.gender || '---'}</Text>
            {teacherMap[student.classId] && (
              <View style={styles.teacherBox}>
                <Text style={styles.teacherTitle}>Giáo viên chủ nhiệm:</Text>
                <View style={styles.teacherRow}>
                  <Avatar.Icon size={40} icon="account" style={{ backgroundColor: '#5F8B4C' }} color="#fff" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.teacherName}>{teacherMap[student.classId].fullName}</Text>
                    <Text style={styles.teacherInfo}>Email: {teacherMap[student.classId].email}</Text>
                    <Text style={styles.teacherInfo}>SĐT: {teacherMap[student.classId].phone}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
          <TextInput
            label="Email"
            value={emailInput}
            onChangeText={setEmailInput}
            style={{ marginBottom: 16 }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button mode="contained" onPress={handleResetPassword} loading={sending} disabled={sending || !emailInput}>
            Gửi email đổi mật khẩu
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { backgroundColor: '#17375F', padding: 24, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  section: { backgroundColor: '#ECFAE5', borderRadius: 12, margin: 16, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#006A5C', marginBottom: 8 },
  label: { fontSize: 14, color: '#17375F', fontWeight: 'bold', marginTop: 8 },
  value: { fontSize: 15, color: '#17375F', marginBottom: 4 },
  changePassBtn: { marginTop: 16, borderColor: '#006A5C' },
  childCard: { backgroundColor: '#DDF6D2', borderRadius: 12, padding: 12, marginBottom: 12 },
  childName: { fontWeight: 'bold', fontSize: 16, color: '#17375F' },
  childInfo: { color: '#006A5C', fontSize: 13, marginBottom: 2 },
  teacherBox: { backgroundColor: '#CAE8BD', borderRadius: 12, padding: 8, marginTop: 8, borderWidth: 1, borderColor: '#B0DB9C' },
  teacherTitle: { fontWeight: 'bold', color: '#17375F', marginBottom: 4 },
  teacherRow: { flexDirection: 'row', alignItems: 'center' },
  teacherName: { fontWeight: 'bold', color: '#006A5C' },
  teacherInfo: { color: '#17375F', fontSize: 13 },
  modalContainer: { backgroundColor: '#FFFFFF', padding: 24, margin: 24, borderRadius: 12 },
  modalTitle: { fontWeight: 'bold', fontSize: 18, color: '#17375F', marginBottom: 16, textAlign: 'center' },
}); 