import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function TermsOfServiceScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Điều khoản sử dụng</Text>
      <Text style={styles.text}>
        Khi sử dụng ứng dụng EduTrack, bạn đồng ý tuân thủ các điều khoản sau:
      </Text>
      <Text style={styles.text}>
        1. Không sử dụng ứng dụng vào mục đích vi phạm pháp luật, phát tán thông tin sai lệch hoặc gây hại cho người khác.
      </Text>
      <Text style={styles.text}>
        2. Không chia sẻ, buôn bán tài khoản hoặc thông tin cá nhân của người khác khi chưa được phép.
      </Text>
      <Text style={styles.text}>
        3. Nhà phát triển có quyền thay đổi, cập nhật nội dung ứng dụng và điều khoản sử dụng bất cứ lúc nào.
      </Text>
      <Text style={styles.text}>
        4. Người dùng chịu trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình.
      </Text>
      <Text style={styles.text}>
        5. Mọi thắc mắc về điều khoản sử dụng, vui lòng liên hệ: support@edutrack.vn
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#17375F', textAlign: 'center' },
  text: { fontSize: 16, marginBottom: 12, color: '#17375F', lineHeight: 22 },
}); 