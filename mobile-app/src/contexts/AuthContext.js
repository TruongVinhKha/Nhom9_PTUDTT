// AuthContext.js - Sửa lỗi Google Sign-In
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [checkingPermission, setCheckingPermission] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(null);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  // Debounced loading state to prevent rapid changes
  const setLoadingWithDebounce = (value) => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    if (value === false) {
      // Delay turning off loading to prevent flicker
      const timeout = setTimeout(() => {
        setLoading(false);
        setLoginInProgress(false);
        setShowLoading(false);
      }, 200); // Giảm delay xuống 200ms
      setLoadingTimeout(timeout);
    } else {
      setLoading(value);
      setShowLoading(true);
      if (value === true) {
        setLoginInProgress(true);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (u) => {
      try {
        const justRegistered = await AsyncStorage.getItem('justRegistered');
        if (justRegistered === 'true') {
          console.log('🔄 User vừa đăng ký, giữ ở màn hình Auth');
          setUser(null);
          setAuthError(null);
          setLoadingWithDebounce(false);
          setInitialized(true);
          setShowLoading(false);
          return;
        }

        if (u) {
          setCheckingPermission(true);
          let retry = 0;
          let success = false;
          
          while (retry < 2 && !success) {
            try {
              const userDoc = await firestore().collection('users').doc(u.uid).get();
              if (!userDoc.exists) {
                // Không throw error ngay, chỉ log để debug
                console.log('⚠️ User không tồn tại trong Firestore:', u.uid);
                throw new Error('not-found');
              }
              
              const userData = userDoc.data();
              console.log('✅ User tồn tại trong Firestore với role:', userData.role);
              
              success = true;
              setUser({
                uid: u.uid,
                email: u.email,
                ...userData
              });
              setAuthError(null);
            } catch (err) {
              if (err.code === 'firestore/permission-denied') {
                retry++;
                if (retry >= 2) {
                  console.log('❌ Permission denied sau 2 lần thử');
                  setAuthError('Bạn không có quyền truy cập hệ thống. Vui lòng liên hệ nhà trường để được hỗ trợ.');
                  await auth().signOut();
                  setUser(null);
                }
              } else if (err.message === 'not-found') {
                // User không tồn tại trong Firestore - đây là trường hợp bình thường cho guests
                console.log('ℹ️ User không có trong collection users (có thể là guest)');
                setUser({
                  uid: u.uid,
                  email: u.email
                });
                setAuthError(null);
                success = true;
              } else {
                console.log('❌ Lỗi khác:', err);
                setAuthError('Lỗi kết nối hoặc hệ thống. Vui lòng thử lại sau.');
                await auth().signOut();
                setUser(null);
                break;
              }
            }
          }
          setCheckingPermission(false);
        } else {
          setUser(null);
          setAuthError(null);
        }
      } catch (error) {
        console.error('❌ Lỗi trong onAuthStateChanged:', error);
        setUser(null);
        setAuthError('Lỗi khởi tạo ứng dụng. Vui lòng thử lại.');
      } finally {
        setLoadingWithDebounce(false);
        setInitialized(true);
        setShowLoading(false);
      }
    });
    
    return () => {
      unsubscribe();
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, []);

  // Đăng nhập email/password
  const signIn = (email, pass) =>
    auth().signInWithEmailAndPassword(email, pass);

  // Đăng ký email/password
  const signUp = async (userData) => {
    setRegistering(true);
    try {
      console.log('📝 Bắt đầu đăng ký user với data:', { userData });
      
      const { email, password, phoneNumber, fullName } = userData;
      
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const { uid } = userCredential.user;
      
      console.log('✅ Tạo Firebase Auth user thành công, UID:', uid);
      
      // Chuẩn bị data cho Firestore (chỉ các trường cần thiết)
      const guestData = {
        uid,
        email: email.toLowerCase().trim(),
        fullName: fullName?.trim() || null,
        phone: phoneNumber?.trim() || null,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };
      
      // Tạo document trong Firestore với transaction
      await firestore().runTransaction(async (transaction) => {
        const guestRef = firestore().collection('guests').doc(uid);
        transaction.set(guestRef, guestData);
      });
      
      console.log('✅ Tạo guest document thành công');
      
      await AsyncStorage.setItem('justRegistered', 'true');
      console.log('🏁 Đã set flag justRegistered = true');
      
      await auth().signOut();
      console.log('🚪 Đã đăng xuất user sau khi đăng ký');
      
      return {
        success: true,
        user: userCredential.user,
        userData: guestData
      };
      
    } catch (error) {
      console.log('❌ Lỗi trong quá trình đăng ký:', error);
      
      if (error.code !== 'auth/email-already-in-use') {
        try {
          const currentUser = auth().currentUser;
          if (currentUser) {
            await currentUser.delete();
            console.log('🧹 Đã xóa user auth do lỗi tạo document');
          }
        } catch (deleteError) {
          console.log('⚠️ Không thể xóa user auth:', deleteError);
        }
      }
      
      try {
        await AsyncStorage.removeItem('justRegistered');
      } catch (clearError) {
        console.log('⚠️ Không thể clear flag justRegistered:', clearError);
      }
      
      throw error;
    } finally {
      setRegistering(false);
    }
  };

  // Đăng nhập Google - SỬA LỖI GOOGLE PLAY SERVICES
  const signInWithGoogle = async () => {
    try {
      console.log('🔍 Bắt đầu Google Sign-In...');
      
      // Cleanup session cũ
      try {
        await GoogleSignin.signOut();
        console.log('🧹 Đã clear Google session cũ');
      } catch (signOutError) {
        console.log('⚠️ Không thể clear session cũ:', signOutError.message);
      }
      
      // Kiểm tra Google Play Services CHỈ KHI THỰC SỰ CẦN
      if (Platform.OS === 'android') {
        try {
          console.log('🔧 Kiểm tra Google Play Services...');
          await GoogleSignin.hasPlayServices({ 
            showPlayServicesUpdateDialog: true 
          });
          console.log('✅ Google Play Services OK');
        } catch (playServicesError) {
          console.log('❌ Google Play Services Error:', playServicesError);
          
          // Xử lý lỗi cụ thể cho Google Play Services
          if (playServicesError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            throw new Error('Google Play Services không khả dụng. Vui lòng cài đặt hoặc cập nhật Google Play Services từ CH Play Store.');
          } else if (playServicesError.code === statusCodes.PLAY_SERVICES_OUTDATED) {
            throw new Error('Google Play Services đã lỗi thời. Vui lòng cập nhật từ CH Play Store.');
          } else {
            throw new Error('Lỗi Google Play Services. Vui lòng thử lại sau.');
          }
        }
      }
      
      // Thực hiện đăng nhập Google
      console.log('🔑 Thực hiện đăng nhập Google...');
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In thành công!');

      if (!userInfo.idToken) {
        throw new Error('Không nhận được idToken từ Google');
      }
      
      // Tạo credential và đăng nhập Firebase
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      // Kiểm tra và tạo guest document nếu chưa có
      const guestDoc = await firestore().collection('guests').doc(userCredential.user.uid).get();
      
      if (!guestDoc.exists) {
        const googleGuestData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          fullName: userCredential.user.displayName || null,
          phone: userCredential.user.phoneNumber || null,
          createdAt: firestore.FieldValue.serverTimestamp(),
        };
        
        await firestore().collection('guests').doc(userCredential.user.uid).set(googleGuestData);
        console.log('✅ Tạo guest document cho Google user');
      }
      
      console.log('🎉 Google Sign-In hoàn tất, UID:', userCredential.user.uid);
      return userCredential;
      
    } catch (error) {
      console.log('❌ Chi tiết lỗi Google Sign-In:', error);
      
      // Enhanced error handling
      const getGoogleErrorMessage = (error) => {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            return 'Bạn đã hủy đăng nhập';
          case statusCodes.IN_PROGRESS:
            return 'Đang trong quá trình đăng nhập, vui lòng đợi';
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            return 'Google Play Services không khả dụng. Vui lòng cài đặt từ CH Play Store';
          case statusCodes.SIGN_IN_REQUIRED:
            return 'Cần đăng nhập lại. Vui lòng thử lại';
          default:
            if (error.message?.includes('Network error')) {
              return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại';
            } else if (error.message?.includes('ApiException')) {
              return 'Lỗi Google API. Vui lòng thử lại sau';
            } else if (error.message?.includes('Google Play Services')) {
              return error.message; // Sử dụng message đã được format ở trên
            } else {
              return `Đăng nhập Google thất bại: ${error.message || 'Lỗi không xác định'}`;
            }
        }
      };
      
      const friendlyMessage = getGoogleErrorMessage(error);
      throw new Error(friendlyMessage);
    }
  };

  // Đăng xuất
  const signOut = async () => {
    try {
      console.log('🚪 Bắt đầu đăng xuất...');
      
      try {
        await AsyncStorage.removeItem('justRegistered');
        console.log('🧹 Đã clear flag justRegistered');
      } catch (clearError) {
        console.log('⚠️ Không thể clear flag justRegistered:', clearError);
      }
      
      // Kiểm tra và đăng xuất Google nếu cần
      const currentUser = auth().currentUser;
      if (currentUser?.providerData?.some(provider => provider.providerId === 'google.com')) {
        try {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
          console.log('✅ Google đăng xuất thành công');
        } catch (googleError) {
          console.log('⚠️ Lỗi đăng xuất Google (không ảnh hưởng):', googleError.message);
        }
      }
      
      await auth().signOut();
      console.log('✅ Đăng xuất hoàn tất!');
    } catch (error) {
      console.log('❌ Lỗi đăng xuất:', error);
      try {
        await auth().signOut();
      } catch (firebaseError) {
        console.log('❌ Lỗi đăng xuất Firebase:', firebaseError);
      }
    }
  };

  // Reset password
  const resetPassword = email => auth().sendPasswordResetEmail(email);

  // Helper function để clear registration flag
  const clearRegistrationFlag = async () => {
    try {
      await AsyncStorage.removeItem('justRegistered');
      console.log('🧹 Đã clear registration flag');
    } catch (error) {
      console.log('⚠️ Lỗi clear registration flag:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        loading, 
        registering, 
        initialized,
        loginInProgress,
        showLoading,
        setLoading: setLoadingWithDebounce,
        signIn, 
        signUp, 
        signInWithGoogle, 
        signOut, 
        resetPassword,
        clearRegistrationFlag,
        authError,
        checkingPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};