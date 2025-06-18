// LoginScreen.js
import React, { useState } from 'react';

import { View, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  Card,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    console.log('🚀 Bắt đầu đăng nhập...');
    console.log('📧 Email:', email);
    console.log('🔒 Password length:', password.length);

    // Reset error
    setError('');

    // Validation
    if (!email.trim()) {
      console.log('❌ Email trống');
      return setError('Vui lòng nhập địa chỉ email');
    }

    if (!validateEmail(email.trim())) {
      console.log('❌ Email không hợp lệ');
      return setError('Định dạng email không hợp lệ');
    }

    if (!password) {
      console.log('❌ Password trống');
      return setError('Vui lòng nhập mật khẩu');
    }

    if (password.length < 6) {
      console.log('❌ Password quá ngắn');
      return setError('Mật khẩu phải có ít nhất 6 ký tự');
    }

    setLoading(true);
    console.log('⏳ Set loading = true');

    try {
      console.log('🔄 Gọi signIn function...');

      // Thêm timeout để tránh treo vô hạn
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 15000)
      );

      const signInPromise = signIn(email.trim().toLowerCase(), password);

      await Promise.race([signInPromise, timeoutPromise]);

      console.log('✅ Đăng nhập thành công!');

    } catch (e) {
      console.log('❌ Lỗi đăng nhập:', e);
      console.log('📝 Error code:', e.code);
      console.log('📝 Error message:', e.message);
      console.log('❌ Lỗi Google Sign-In:', error);
      console.log('📝 Error code:', error.code);
      console.log('📝 Error message:', error.message);

      if (e.message === 'Timeout') {
        setError('Quá thời gian chờ. Vui lòng thử lại');
      } else {
        switch (e.code) {
          case 'auth/invalid-email':
            setError('Địa chỉ email không hợp lệ');
            break;
          case 'auth/user-disabled':
            setError('Tài khoản của bạn đã bị tạm khóa');
            break;
          case 'auth/user-not-found':
            setError('Không tìm thấy tài khoản với email này');
            break;
          case 'auth/wrong-password':
            setError('Mật khẩu không chính xác');
            break;
          case 'auth/too-many-requests':
            setError('Quá nhiều lần thử. Vui lòng thử lại sau');
            break;
          case 'auth/network-request-failed':
            setError('Lỗi kết nối mạng. Vui lòng kiểm tra internet');
            break;
          case 'auth/invalid-credential':
            setError('Thông tin đăng nhập không chính xác');
            break;
          default:
            setError(`Đăng nhập thất bại: ${e.message || 'Lỗi không xác định'}`);
        }
      }
    } finally {
      console.log('🔄 Set loading = false');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError('');

      console.log('🔍 Bắt đầu đăng nhập Google...');

      await signInWithGoogle();
      console.log('✅ Google đăng nhập thành công!');

    } catch (error) {
      console.log('❌ Lỗi Google Sign-In:', error);
      setError(error.message || 'Lỗi đăng nhập Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    console.log('⚡ Quick login:', demoEmail);
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Logo/Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>🎓</Text>
            </View>
            <Text style={styles.title}>EduTrack</Text>
            <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>
          </View>

          {/* Quick Login Demo Section */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>🚀 Đăng nhập nhanh</Text>
            <View style={styles.demoButtons}>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => handleQuickLogin('student@edu.com', '123456')}
              >
                <Text style={styles.demoButtonText}>👨‍🎓 Học sinh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => handleQuickLogin('teacher@edu.com', '123456')}
              >
                <Text style={styles.demoButtonText}>👩‍🏫 Giáo viên</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Form */}
          <Card style={styles.formCard} elevation={4}>
            <Card.Content style={styles.formContent}>
              <View style={styles.inputContainer}>
                <TextInput
                  label="📧 Địa chỉ email"
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(''); // Clear error khi user nhập
                  }}
                  style={styles.input}
                  theme={{
                    colors: {
                      primary: '#6750A4',
                      outline: error && !email.trim() ? '#BA1A1A' : '#79747E'
                    }
                  }}
                  error={error && !email.trim()}
                />

                <TextInput
                  label="🔒 Mật khẩu"
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError(''); // Clear error khi user nhập
                  }}
                  style={styles.input}
                  right={
                    <TextInput.Icon
                      icon={() => <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>}
                      onPress={() => setShowPassword(!showPassword)}
                      forceTextInputFocus={false}
                    />
                  }
                  theme={{
                    colors: {
                      primary: '#6750A4',
                      outline: error && !password ? '#BA1A1A' : '#79747E'
                    }
                  }}
                  error={error && !password}
                />

                {error ? (
                  <HelperText type="error" style={styles.errorText}>
                    ⚠️ {error}
                  </HelperText>
                ) : null}
              </View>

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading || googleLoading}
                style={styles.loginButton}
                labelStyle={styles.loginButtonLabel}
              >
                {loading ? 'Đang đăng nhập...' : '🚀 Đăng nhập'}
              </Button>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordContainer}
                disabled={loading || googleLoading}
              >
                <Text style={styles.forgotPasswordText}>❓ Quên mật khẩu?</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialLoginContainer}>
            <Button
              mode="outlined"
              style={[
                styles.socialButton,
                googleLoading && styles.socialButtonLoading
              ]}
              labelStyle={[
                styles.socialButtonLabel,
                googleLoading && styles.socialButtonLabelLoading
              ]}
              onPress={handleGoogleLogin}
              loading={googleLoading}
              disabled={loading || googleLoading}
            >
              {googleLoading ? 'Đang đăng nhập...' : '🔍 Đăng nhập với Google'}
            </Button>
          </View>


          <Button
            mode="outlined"
            onPress={() => navigation.navigate('PhoneLogin')}
            style={{ marginTop: 10 }}
          >
            📞 Đăng nhập bằng SĐT
          </Button>


          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={loading || googleLoading}
            >
              <Text style={[
                styles.registerLink,
                (loading || googleLoading) && styles.disabledLink
              ]}>
                Đăng ký ngay
              </Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appVersion}>📱 EduTrack v1.0.0</Text>
            <Text style={styles.appCopyright}>© 2024 EduTrack Team</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6750A4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1B1F',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#49454F',
    textAlign: 'center',
    marginTop: 8,
  },
  demoSection: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 12,
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  demoButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
  },
  formContent: {
    padding: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 8,
    fontSize: 14,
  },
  loginButton: {
    marginTop: 8,
    paddingVertical: 4,
    backgroundColor: '#6750A4',
    borderRadius: 12,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#6750A4',
    fontSize: 14,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E7E0EC',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#49454F',
    fontSize: 14,
    fontWeight: '500',
  },
  socialLoginContainer: {
    marginBottom: 24,
  },
  socialButton: {
    paddingVertical: 4,
    borderColor: '#4285F4',
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  socialButtonLoading: {
    borderColor: '#E7E0EC',
  },
  socialButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4285F4',
  },
  socialButtonLabelLoading: {
    color: '#79747E',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    color: '#49454F',
    fontSize: 14,
  },
  registerLink: {
    color: '#6750A4',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledLink: {
    color: '#79747E',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  appVersion: {
    color: '#79747E',
    fontSize: 12,
    marginBottom: 4,
  },
  appCopyright: {
    color: '#79747E',
    fontSize: 10,
  },
});