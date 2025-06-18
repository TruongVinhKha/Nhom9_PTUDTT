// AuthContext.js - Đã sửa lỗi Google Sign-In
import React, { createContext, useState, useEffect, useContext } from 'react';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(u => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Đăng nhập email/password
  const signIn = (email, pass) =>
    auth().signInWithEmailAndPassword(email, pass);

  // Đăng ký email/password
  const signUp = (email, pass) =>
    auth().createUserWithEmailAndPassword(email, pass);

  // Đăng nhập Google - ĐÃ SỬA LỖI
  const signInWithGoogle = async () => {
    try {
      console.log('🔍 Bắt đầu Google Sign-In...');
      
      // Bước 1: Đăng xuất trước để tránh conflict
      try {
        await GoogleSignin.signOut();
        console.log('🧹 Đã clear Google session cũ');
      } catch (signOutError) {
        console.log('⚠️ Không thể clear session cũ:', signOutError.message);
      }
      
      // Bước 2: Kiểm tra Google Play Services
      console.log('🔧 Kiểm tra Google Play Services...');
      await GoogleSignin.hasPlayServices({ 
        showPlayServicesUpdateDialog: true 
      });
      
      // Bước 3: Thực hiện đăng nhập Google
      console.log('🔑 Thực hiện đăng nhập Google...');
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In thành công!');
      console.log('👤 User info:', {
        email: userInfo.user?.email,
        name: userInfo.user?.name,
        hasIdToken: !!userInfo.idToken
      });

      // Bước 4: Kiểm tra idToken
      if (!userInfo.idToken) {
        throw new Error('Không nhận được idToken từ Google');
      }
      
      // Bước 5: Tạo credential Firebase
      console.log('🔐 Tạo Firebase credential...');
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
      
      // Bước 6: Đăng nhập Firebase
      console.log('🔥 Đăng nhập Firebase...');
      const userCredential = await auth().signInWithCredential(googleCredential);
      console.log('✅ Firebase đăng nhập thành công!');
      console.log('🎉 User UID:', userCredential.user.uid);
      
      return userCredential;
      
    } catch (error) {
      console.log('❌ Chi tiết lỗi Google Sign-In:');
      console.log('- Error code:', error.code);
      console.log('- Error message:', error.message);
      console.log('- Full error:', error);
      
      // Xử lý các loại lỗi cụ thể
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Bạn đã hủy đăng nhập');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Đang trong quá trình đăng nhập, vui lòng đợi');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services không khả dụng. Vui lòng cập nhật Google Play Services');
      } else if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        throw new Error('Cần đăng nhập lại. Vui lòng thử lại');
      } else if (error.message?.includes('non-recoverable')) {
        // Lỗi non-recoverable - thường do cấu hình
        throw new Error('Lỗi cấu hình Google Sign-In. Vui lòng liên hệ quản trị viên');
      } else if (error.message?.includes('Network error')) {
        throw new Error('Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại');
      } else if (error.message?.includes('ApiException')) {
        throw new Error('Lỗi Google API. Vui lòng thử lại sau');
      } else {
        // Lỗi chung
        throw new Error(`Đăng nhập Google thất bại: ${error.message || 'Lỗi không xác định'}`);
      }
    }
  };

  // Đăng xuất - CẢI THIỆN
  const signOut = async () => {
    try {
      console.log('🚪 Bắt đầu đăng xuất...');
      
      // Kiểm tra xem user có đăng nhập bằng Google không
      const currentUser = auth().currentUser;
      if (currentUser) {
        const providerData = currentUser.providerData;
        const isGoogleUser = providerData.some(provider => provider.providerId === 'google.com');
        
        if (isGoogleUser) {
          try {
            console.log('🔍 Đăng xuất Google...');
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
            console.log('✅ Google đăng xuất thành công');
          } catch (googleError) {
            console.log('⚠️ Lỗi đăng xuất Google (không ảnh hưởng):', googleError.message);
          }
        }
      }
      
      // Đăng xuất Firebase
      await auth().signOut();
      console.log('✅ Đăng xuất hoàn tất!');
    } catch (error) {
      console.log('❌ Lỗi đăng xuất:', error);
      // Vẫn đăng xuất Firebase dù có lỗi với Google
      try {
        await auth().signOut();
      } catch (firebaseError) {
        console.log('❌ Lỗi đăng xuất Firebase:', firebaseError);
      }
    }
  };

  // Reset password
  const resetPassword = email => auth().sendPasswordResetEmail(email);

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        loading, 
        signIn, 
        signUp, 
        signInWithGoogle, 
        signOut, 
        resetPassword 
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