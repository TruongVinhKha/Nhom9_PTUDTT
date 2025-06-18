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

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      return setError('Email và mật khẩu không được để trống');
    }
    if (password !== confirm) {
      return setError('Mật khẩu xác nhận không khớp');
    }
    if (password.length < 6) {
      return setError('Mật khẩu tối thiểu 6 ký tự');
    }
    setLoading(true);
    setError('');
    try {
      await signUp(email, password);
    } catch (e) {
      switch (e.code) {
        case 'auth/email-already-in-use':
          setError('Email đã được sử dụng');
          break;
        case 'auth/invalid-email':
          setError('Email không hợp lệ');
          break;
        case 'auth/weak-password':
          setError('Mật khẩu quá yếu');
          break;
        default:
          setError('Đăng ký thất bại, thử lại sau');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Đăng ký</Text>

      <TextInput
        label="Email"
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        label="Mật khẩu"
        mode="outlined"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TextInput
        label="Xác nhận mật khẩu"
        mode="outlined"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        style={styles.input}
      />

      {error ? <HelperText type="error">{error}</HelperText> : null}

      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Đăng ký
      </Button>

      <View style={styles.footer}>
        <Text>Đã có tài khoản? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  input: { marginBottom: 16 },
  button: { marginTop: 8, paddingVertical: 6 },
  link: { color: '#3498db' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
});
