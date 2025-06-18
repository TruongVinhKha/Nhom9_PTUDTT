import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email.trim()) {
      return setError('Nhập email để tiếp tục');
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (e) {
      switch (e.code) {
        case 'auth/invalid-email':
          setError('Email không hợp lệ');
          break;
        case 'auth/user-not-found':
          setError('Không tìm thấy tài khoản');
          break;
        default:
          setError('Gửi email thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Quên mật khẩu</Text>

      {success ? (
        <View style={styles.successBox}>
          <Text>Email đặt lại đã được gửi đến:</Text>
          <Text style={{ fontWeight: 'bold' }}>{email}</Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
          >
            Quay lại đăng nhập
          </Button>
        </View>
      ) : (
        <>
          <TextInput
            label="Email"
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          {error ? <HelperText type="error">{error}</HelperText> : null}
          <Button
            mode="contained"
            onPress={handleReset}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Nhận mã
          </Button>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Quay lại</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
  link: { color: '#3498db', marginTop: 12, textAlign: 'center' },
  successBox: { alignItems: 'center' },
});
