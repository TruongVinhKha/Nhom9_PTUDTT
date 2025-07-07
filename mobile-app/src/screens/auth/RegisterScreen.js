// RegisterScreen.js - Phiên bản tối ưu
import firestore from '@react-native-firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, View, Linking } from 'react-native';
import {
  Button,
  Card,
  Checkbox,
  Text,
  TextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../LoadingSceen';

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [fullName, setFullName] = useState('');
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirm) {
      return setError('Vui lòng điền đầy đủ thông tin');
    }
    if (!validateEmail(email.trim())) {
      return setError('Định dạng email không hợp lệ');
    }
    if (phoneNumber.trim() && !validatePhoneNumber(phoneNumber.trim())) {
      return setError('Số điện thoại không hợp lệ (10-11 chữ số)');
    }
    if (password !== confirm) {
      return setError('Mật khẩu xác nhận không khớp');
    }
    if (password.length < 6) {
      return setError('Mật khẩu tối thiểu 6 ký tự');
    }
    if (!acceptTerms) {
      return setError('Vui lòng đồng ý với điều khoản sử dụng');
    }
    setLoading(true);
    setError('');
    setShowLoading(true);
    try {
      const userCredential = await signUp({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
      });
      if (userCredential && userCredential.user && userCredential.user.uid) {
        // Lưu vào collection guests với trường role = null
        await firestore().collection('guests').doc(userCredential.user.uid).set({
          uid: userCredential.user.uid,
          email: email.trim().toLowerCase(),
          fullName: fullName.trim() || null,
          phone: phoneNumber.trim() || null,
          createdAt: firestore.FieldValue.serverTimestamp(),
          role: null,
        });
      }
      setTimeout(() => {
        setShowLoading(false);
        Alert.alert(
          'Thành công',
          'Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.',
          [
            {
              text: 'Đăng nhập',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }, 1500);
    } catch (e) {
      setShowLoading(false);
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
        case 'auth/network-request-failed':
          setError('Lỗi kết nối mạng, vui lòng thử lại');
          break;
        default:
          setError('Đăng ký thất bại, vui lòng thử lại sau');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPrivacy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const handleOpenTerms = () => {
    navigation.navigate('TermsOfService');
  };

  if (showLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoInner}>
                <Text style={styles.logoText}>🚀</Text>
              </View>
            </View>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Tham gia cộng đồng học tập EduTrack</Text>
          </View>
          {/* Registration Form */}
          <Card style={styles.formCard} elevation={8}>
            <Card.Content style={styles.formContent}>
              <View style={styles.inputContainer}>
                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Địa chỉ email</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Nhập email của bạn"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) setError('');
                    }}
                    style={[styles.input, { fontWeight: 'bold' }]}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="email-outline" />}
                    theme={{
                      colors: {
                        primary: '#006A5C',
                        outline: error && !email.trim() ? '#FF6B6B' : '#E0E0E0',
                        surfaceVariant: '#FFFFFF',
                        background: '#FFFFFF',
                        text: '#17375F',
                        placeholder: '#A0AEC0',
                        error: '#EF4444',
                      },
                    }}
                    error={error && !email.trim()}
                  />
                </View>
                {/* Phone Number Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Số điện thoại (tùy chọn)</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Nhập số điện thoại"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={(text) => {
                      setPhoneNumber(text);
                      if (error) setError('');
                    }}
                    style={[styles.input, { fontWeight: 'bold' }]}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="phone-outline" />}
                    theme={{
                      colors: {
                        primary: '#006A5C',
                        outline: '#E0E0E0',
                        surfaceVariant: '#FFFFFF',
                        background: '#FFFFFF',
                        text: '#17375F',
                        placeholder: '#A0AEC0',
                        error: '#EF4444',
                      },
                    }}
                  />
                </View>
                {/* Full Name Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Họ và tên</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Nhập họ và tên"
                    value={fullName}
                    onChangeText={(text) => setFullName(text)}
                    style={[styles.input, { fontWeight: 'bold' }]}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="account-outline" />}
                    theme={{
                      colors: {
                        primary: '#006A5C',
                        outline: '#E0E0E0',
                        surfaceVariant: '#FFFFFF',
                        background: '#FFFFFF',
                        text: '#17375F',
                        placeholder: '#A0AEC0',
                        error: '#EF4444',
                      },
                    }}
                  />
                </View>
                {/* Password Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Mật khẩu</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Tạo mật khẩu mạnh"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error) setError('');
                    }}
                    style={[styles.input, { fontWeight: 'bold' }]}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="lock-outline" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off-outline" : "eye-outline"}
                        onPress={() => setShowPassword(!showPassword)}
                        iconColor="#006A5C"
                        forceTextInputFocus={false}
                      />
                    }
                    theme={{
                      colors: {
                        primary: '#006A5C',
                        outline: error && !password ? '#FF6B6B' : '#E0E0E0',
                        surfaceVariant: '#FFFFFF',
                        background: '#FFFFFF',
                        text: '#17375F',
                        placeholder: '#A0AEC0',
                        error: '#EF4444',
                      },
                    }}
                    error={error && !password}
                  />
                </View>
                {/* Confirm Password Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Nhập lại mật khẩu"
                    secureTextEntry={!showConfirm}
                    value={confirm}
                    onChangeText={(text) => {
                      setConfirm(text);
                      if (error) setError('');
                    }}
                    style={[styles.input, { fontWeight: 'bold' }]}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="lock-check-outline" />}
                    right={
                      <TextInput.Icon
                        icon={showConfirm ? "eye-off-outline" : "eye-outline"}
                        onPress={() => setShowConfirm(!showConfirm)}
                        iconColor="#006A5C"
                        forceTextInputFocus={false}
                      />
                    }
                    theme={{
                      colors: {
                        primary: '#006A5C',
                        outline: error && !confirm ? '#FF6B6B' : '#E0E0E0',
                        surfaceVariant: '#FFFFFF',
                        background: '#FFFFFF',
                        text: '#17375F',
                        placeholder: '#A0AEC0',
                        error: '#EF4444',
                      },
                    }}
                    error={error && !confirm}
                  />
                </View>
                {/* Error Display */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
              </View>
              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <Checkbox
                  status={acceptTerms ? 'checked' : 'unchecked'}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                  color="#006A5C"
                  uncheckedIcon="checkbox-blank-outline"
                  checkedIcon="checkbox-marked"
                />
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>
                    Tôi đồng ý với{' '}
                    <Text style={styles.termsLink} onPress={handleOpenTerms}>Điều khoản sử dụng</Text>
                    {' '}và{' '}
                    <Text style={styles.termsLink} onPress={handleOpenPrivacy}>Chính sách bảo mật</Text>
                  </Text>
                </View>
              </View>
              {/* Register Button */}
              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.registerButton}
                labelStyle={styles.registerButtonLabel}
                buttonColor={loading ? '#E5E7EB' : '#7AE582'}
                textColor="#17375F"
                icon="account-plus-outline"
              >
                {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </Button>
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17375F'
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 20
  },
  content: {
    flex: 1
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 20
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#006A5C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#7AE582',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 16,
    color: '#7AE582',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  formContent: {
    padding: 24
  },
  inputContainer: {
    marginBottom: 16
  },
  inputWrapper: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17375F',
    marginBottom: 8,
    marginLeft: 4
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: 16
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 2
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    marginTop: 8
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
    flex: 1
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 4
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: 8,
    marginTop: 8
  },
  termsText: {
    fontSize: 14,
    color: '#17375F',
    lineHeight: 20
  },
  termsLink: {
    color: '#006A5C',
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  registerButton: {
    borderRadius: 16,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: '#7AE582',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  registerButtonLabel: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5
  },
});