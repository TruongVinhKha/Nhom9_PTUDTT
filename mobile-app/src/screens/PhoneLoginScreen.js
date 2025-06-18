import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import auth from '@react-native-firebase/auth';

export default function PhoneLoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Gửi mã xác minh đến số điện thoại
  const handleSendCode = async () => {
  setError('');
  let formattedPhone = phone.trim();

  // Nếu người dùng không nhập +84, thì tự thêm vào
  if (!formattedPhone.startsWith('+84')) {
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+84' + formattedPhone.slice(1);
    } else {
      formattedPhone = '+84' + formattedPhone;
    }
  }

  try {
    setLoading(true);
    const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
    setConfirm(confirmation);
  } catch (e) {
    console.log(e);
    setError('Không thể gửi mã xác minh. Hãy thử lại.');
  } finally {
    setLoading(false);
  }
};

  // Xác minh mã OTP nhập từ người dùng
  const handleConfirmCode = async () => {
    if (!confirm) return;

    try {
      setLoading(true);
      await confirm.confirm(code);

      // Nếu xác minh thành công
      Alert.alert('Thành công', 'Đăng nhập thành công!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }], // Bạn cần đảm bảo đã có screen tên 'Home'
      });
    } catch (e) {
      console.log(e);
      setError('Mã xác minh không đúng hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!confirm ? (
        <>
          <TextInput
            label="Số điện thoại (+84...)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />
          <HelperText type="error" visible={!!error}>{error}</HelperText>
          <Button mode="contained" onPress={handleSendCode} loading={loading}>
            Gửi mã OTP
          </Button>
        </>
      ) : (
        <>
          <TextInput
            label="Mã OTP"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            style={styles.input}
          />
          <HelperText type="error" visible={!!error}>{error}</HelperText>
          <Button mode="contained" onPress={handleConfirmCode} loading={loading}>
            Xác minh
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { marginBottom: 16 },
});
