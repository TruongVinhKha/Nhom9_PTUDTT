// LoginScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, Card, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import LoadingScreen from '../LoadingSceen';

export default function LoginScreen({ navigation }) {
  const { signIn, signInWithGoogle, signOut, authError, loading: authLoading, initialized, loginInProgress, setLoading: setAuthLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [rememberMe, setRememberMe] = useState(false);

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

  useEffect(() => {
    const loadSaved = async () => {
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      const savedPassword = await AsyncStorage.getItem('savedPassword');
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
      if (savedEmail && savedPassword) setRememberMe(true);
    };
    loadSaved();
  }, []);

  useEffect(() => {
    const checkLastError = async () => {
      const lastError = await AsyncStorage.getItem('lastAuthError');
      if (lastError) {
        setError(lastError);
        await AsyncStorage.removeItem('lastAuthError');
      }
    };
    checkLastError();
  }, []);

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkUserInFirestore = async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) return false;
    
    try {
      const userDoc = await firestore().collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('✅ User tồn tại trong Firestore với role:', userData.role);
        return true;
      }
      
      console.log('⚠️ User không tồn tại trong collection users');
      return false;
    } catch (error) {
      console.log('❌ Lỗi kiểm tra Firestore:', error);
      return false;
    }
  };

  const handleLogin = async () => {
    console.log('🚀 Bắt đầu đăng nhập...');
    console.log('📧 Email:', email);

    setError('');

    if (!email.trim()) {
      console.log('❌ Email trống');
      setError('Vui lòng nhập địa chỉ email');
      return;
    }

    if (!validateEmail(email.trim())) {
      console.log('❌ Email không hợp lệ');
      setError('Định dạng email không hợp lệ');
      return;
    }

    if (!password) {
      console.log('❌ Password trống');
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    if (password.length < 6) {
      console.log('❌ Password quá ngắn');
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setAuthLoading(true);
    console.log('⏳ Set loading = true');

    try {
      // Bước 1: Đăng nhập Firebase Auth
      const userCredential = await signIn(email.trim().toLowerCase(), password);
      console.log('✅ Firebase Auth đăng nhập thành công');

      // Bước 2: Kiểm tra trong Firestore
      const inFirestore = await checkUserInFirestore();
      
      if (!inFirestore) {
        // Đăng xuất ngay nếu không có trong Firestore
        await signOut();
        setError('Tài khoản của bạn chưa có trong hệ thống EduTrack. Vui lòng liên hệ nhà trường để được hỗ trợ.');
        setAuthLoading(false);
        return;
      }

      // Bước 3: Lưu thông tin nếu nhớ tài khoản
      if (rememberMe) {
        await AsyncStorage.setItem('savedEmail', email);
        await AsyncStorage.setItem('savedPassword', password);
      } else {
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
      }

      // Bước 4: Chuyển hướng dựa trên role (sẽ được xử lý trong AuthContext)
      console.log('✅ Đăng nhập thành công, chuyển hướng...');
      
    } catch (e) {
      console.log('❌ Lỗi đăng nhập:', e);
      
      if (e.code === 'firestore/permission-denied' || (e.message && e.message.includes('permission-denied'))) {
        setError('Bạn không có quyền truy cập hệ thống. Vui lòng liên hệ nhà trường để được hỗ trợ.');
      } else if (e.code === 'auth/user-not-found') {
        setError('Tài khoản không tồn tại. Vui lòng kiểm tra lại email.');
      } else if (e.code === 'auth/wrong-password') {
        setError('Mật khẩu không đúng. Vui lòng thử lại.');
      } else if (e.code === 'auth/invalid-email') {
        setError('Email không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (e.code === 'auth/too-many-requests') {
        setError('Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.');
      } else {
        setError(e.message || 'Lỗi đăng nhập. Vui lòng thử lại.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    
    try {
      // Bước 1: Đăng nhập Google
      const userCredential = await signInWithGoogle();
      console.log('✅ Google Sign-In thành công');

      // Bước 2: Kiểm tra trong Firestore
      const inFirestore = await checkUserInFirestore();
      
      if (!inFirestore) {
        // Đăng xuất ngay nếu không có trong Firestore
        await signOut();
        setError('Tài khoản Google của bạn chưa được đăng ký trong hệ thống EduTrack. Vui lòng liên hệ nhà trường để được hỗ trợ.');
        setGoogleLoading(false);
        return;
      }

      // Bước 3: Lưu thông tin nếu nhớ tài khoản
      if (rememberMe) {
        await AsyncStorage.setItem('savedEmail', userCredential.user.email);
        await AsyncStorage.setItem('savedPassword', ''); // Google không có password
      } else {
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
      }

      // Bước 4: Chuyển hướng dựa trên role (sẽ được xử lý trong AuthContext)
      console.log('✅ Google đăng nhập thành công, chuyển hướng...');
      
    } catch (error) {
      console.log('❌ Lỗi Google đăng nhập:', error);
      
      if (error.code === 'firestore/permission-denied' || (error.message && error.message.includes('permission-denied'))) {
        setError('Bạn không có quyền truy cập hệ thống. Vui lòng liên hệ nhà trường để được hỗ trợ.');
      } else if (error.message?.includes('Google Play Services')) {
        setError(error.message);
      } else if (error.message?.includes('Network error')) {
        setError('Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.');
      } else {
        setError(error.message || 'Lỗi đăng nhập Google. Vui lòng thử lại.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const signUp = async (userData) => {
    // ...
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    // ... lưu Firestore nếu muốn, hoặc return userCredential
    return userCredential;
  };

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
          {/* Header với gradient background */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoInner}>
                <Text style={styles.logoText}>🎓</Text>
              </View>
            </View>
            <Text style={styles.title}>EduTrack</Text>
            <Text style={styles.subtitle}>Nền tảng học tập thông minh</Text>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Chào mừng trở lại!</Text>
              <Text style={styles.welcomeSubtext}>Đăng nhập để tiếp tục hành trình học tập</Text>
            </View>
          </View>

          {/* Login Form Card với shadow đẹp */}
          <Card style={styles.formCard} elevation={8}>
            <Card.Content style={styles.formContent}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Địa chỉ email</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Nhập email của bạn"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error && text.trim()) setError('');
                    }}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
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
                    left={<TextInput.Icon icon="account-school-outline" iconColor="#006A5C" />}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Mật khẩu</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Nhập mật khẩu của bạn"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error && text) setError('');
                    }}
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off-outline" : "eye-outline"}
                        onPress={() => setShowPassword(!showPassword)}
                        iconColor="#006A5C"
                        forceTextInputFocus={false}
                      />
                    }
                    left={<TextInput.Icon icon="shield-lock-outline" iconColor="#006A5C" />}
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

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Checkbox
                    status={rememberMe ? 'checked' : 'unchecked'}
                    onPress={() => setRememberMe(!rememberMe)}
                    color="#006A5C"
                  />
                  <Text style={{ color: '#17375F', fontWeight: '500' }}>Nhớ tài khoản và mật khẩu</Text>
                </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>🚨</Text>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordContainer}
                disabled={googleLoading}
              >
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={authLoading}
                disabled={authLoading || googleLoading}
                style={styles.loginButton}
                labelStyle={styles.loginButtonLabel}
                buttonColor={authLoading ? '#E5E7EB' : '#7AE582'}
                textColor="#17375F"
                icon="login"
              >
                {authLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </Card.Content>
          </Card>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerTextContainer}>
              <Text style={styles.dividerText}>Hoặc đăng nhập với</Text>
            </View>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialLoginContainer}>
            <Button
              mode="outlined"
              style={styles.socialButton}
              labelStyle={styles.socialButtonLabel}
              onPress={handleGoogleLogin}
              loading={googleLoading}
              disabled={authLoading || googleLoading}
              icon="google"
              buttonColor={googleLoading ? '#006A5C' : '#FFFFFF'}
              textColor={googleLoading ? '#FFFFFF' : '#006A5C'}
            >
              {googleLoading ? 'Đang đăng nhập...' : 'Google'}
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Register')} 
              disabled={authLoading || googleLoading}
              style={styles.registerButton}
            >
              <Text style={[styles.registerLink, (authLoading || googleLoading) && styles.disabledLink]}>
                Đăng ký ngay
              </Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <View style={styles.appVersionContainer}>
              <Text style={styles.appVersion}>EduTrack v1.0.0</Text>
              <View style={styles.dotSeparator} />
              <Text style={styles.appCopyright}>© 2024 EduTrack Team</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#17375F' // Navy blue background
  },
  scrollContent: { 
    flexGrow: 1, 
    padding: 24,
    paddingTop: 40
  },
  content: { 
    flex: 1, 
    justifyContent: 'center',
    minHeight: '100%'
  },
  
  // Header Styles
  headerSection: { 
    alignItems: 'center', 
    marginBottom: 32 
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#006A5C', // Teal
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7AE582', // Light green
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { 
    fontSize: 36,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#FFFFFF', // White
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1
  },
  subtitle: { 
    fontSize: 16, 
    color: '#7AE582', // Light green
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 24
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: 20
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8
  },
  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20
  },
  
  // Form Styles
  formCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    marginBottom: 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  formContent: { 
    padding: 28 
  },
  inputContainer: { 
    marginBottom: 20 
  },
  inputWrapper: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17375F', // Navy blue
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
  
  // Error Styles
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
  
  // Button Styles
  forgotPasswordContainer: { 
    alignItems: 'flex-end',
    marginBottom: 24
  },
  forgotPasswordText: { 
    color: '#006A5C', // Teal
    fontWeight: '600',
    fontSize: 14
  },
  loginButton: {
    borderRadius: 16,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: '#7AE582',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonLabel: { 
    fontWeight: '700', 
    fontSize: 16,
    letterSpacing: 0.5
  },
  
  // Divider Styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 20
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerTextContainer: {
    backgroundColor: '#17375F',
    paddingHorizontal: 16
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    fontSize: 14
  },
  
  // Social Login Styles
  socialLoginContainer: { 
    marginBottom: 32 
  },
  socialButton: {
    borderColor: '#006A5C', // Teal
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#006A5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  socialButtonLabel: {
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5
  },
  
  // Footer Styles
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20
  },
  footerText: { 
    fontSize: 16, 
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400'
  },
  registerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  registerLink: { 
    color: '#7AE582', // Light green
    fontWeight: '700', 
    fontSize: 16,
    textDecorationLine: 'underline'
  },
  disabledLink: { 
    color: 'rgba(255, 255, 255, 0.5)' 
  },
  
  // App Info Styles
  appInfo: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  appVersionContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  appVersion: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500'
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 8
  },
  appCopyright: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500'
  },
});