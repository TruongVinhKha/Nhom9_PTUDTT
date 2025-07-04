import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Chính sách bảo mật</Text>
      <Text style={styles.text}>
        Ứng dụng EduTrack cam kết bảo vệ thông tin cá nhân và quyền riêng tư của người dùng. Chúng tôi chỉ thu thập các thông tin cần thiết để cung cấp dịch vụ và không chia sẻ dữ liệu cá nhân cho bên thứ ba khi chưa có sự đồng ý của bạn.
      </Text>
      <Text style={styles.text}>
        1. Thông tin thu thập: Email, họ tên, số điện thoại (nếu có), thông tin học sinh liên quan.
      </Text>
      <Text style={styles.text}>
        2. Mục đích sử dụng: Quản lý tài khoản, hỗ trợ học tập, gửi thông báo liên quan đến lớp học.
      </Text>
      <Text style={styles.text}>
        3. Bảo mật: Dữ liệu được lưu trữ an toàn trên hệ thống của chúng tôi và tuân thủ các quy định bảo mật của Google/Firebase.
      </Text>
      <Text style={styles.text}>
        4. Quyền của người dùng: Bạn có thể yêu cầu chỉnh sửa hoặc xóa tài khoản bất cứ lúc nào trong phần cài đặt tài khoản. Khi bạn xóa tài khoản, toàn bộ dữ liệu cá nhân liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống theo đúng quy định của Google Play. Nếu bạn cần hỗ trợ hoặc xác nhận việc xóa dữ liệu, vui lòng liên hệ với chúng tôi qua email bên dưới.
      </Text>
      <Text style={styles.text}>
        5. Liên hệ: Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ qua email: support@edutrack.vn
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