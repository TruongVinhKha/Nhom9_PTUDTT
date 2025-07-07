import React, { useState } from 'react';
import { Dimensions, Text as RNText, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  HelperText,
  Text,
  TextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

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

  const theme = {
    colors: {
      primary: '#7AE582',
      secondary: '#006A5C',
      surface: '#FFFFFF',
      background: '#F8F9FA',
      text: '#17375F',
      disabled: '#E5E7EB',
      error: '#EF4444',
      navy: '#17375F',
      teal: '#006A5C',
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centeredContent}>
          <Card style={styles.formCard} elevation={8}>
            <Card.Content>
              {success ? (
                <View style={styles.successContainer}>
                  <View style={styles.successIconContainer}>
                    <RNText style={styles.successIcon}>✓</RNText>
                  </View>
                  <Text style={styles.successTitle}>Email đã được gửi!</Text>
                  <Text style={styles.successMessage}>
                    Email đặt lại mật khẩu đã được gửi đến:
                  </Text>
                  <Text style={styles.emailText}>{email}</Text>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('Login')}
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                  >
                    Quay lại đăng nhập
                  </Button>
                  <Text style={styles.helperText}>
                    Không nhận được email? Kiểm tra thư mục spam
                  </Text>
                </View>
              ) : (
                <View style={styles.formContainer}>
                  <View style={styles.headerSection}>
                    <View style={styles.iconContainer}>
                      <RNText style={styles.iconText}>✉</RNText>
                    </View>
                    <Text style={styles.title}>Quên mật khẩu</Text>
                    <Text style={styles.subtitle}>
                      Nhập email để nhận liên kết đặt lại mật khẩu
                    </Text>
                  </View>
                  <Text style={styles.formTitle}>Nhập địa chỉ email</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Email"
                      mode="outlined"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setError('');
                      }}
                      style={styles.input}
                      outlineColor={theme.colors.disabled}
                      activeOutlineColor={theme.colors.secondary}
                      theme={{
                        colors: {
                          primary: theme.colors.secondary,
                          text: theme.colors.text,
                          background: '#FFFFFF',
                          placeholder: '#A0AEC0',
                          error: theme.colors.error,
                        },
                      }}
                      left={<TextInput.Icon icon="email-outline" />}
                    />
                    {error ? (
                      <HelperText type="error" style={styles.errorText}>
                        ⚠ {error}
                      </HelperText>
                    ) : null}
                  </View>
                  <Button
                    mode="contained"
                    onPress={handleReset}
                    loading={loading}
                    disabled={loading || !email.trim()}
                    style={[
                      styles.button,
                      {
                        backgroundColor: (!email.trim() || loading)
                          ? theme.colors.disabled
                          : theme.colors.primary
                      }
                    ]}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                  >
                    {loading ? 'Đang gửi...' : 'Nhận mã đặt lại'}
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17375F',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#17375F',
  },
  centeredContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 28,
    paddingHorizontal: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  formContainer: {
    alignItems: 'center',
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7AE582',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  iconText: {
    fontSize: 36,
    color: '#7AE582',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#17375F',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#17375F',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    borderRadius: 12,
    elevation: 1,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
    color: '#EF4444',
    fontWeight: '500',
  },
  button: {
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#7AE582',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17375F',
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#7AE582',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  successIcon: {
    fontSize: 40,
    color: '#7AE582',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#17375F',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#006A5C',
    marginBottom: 32,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});