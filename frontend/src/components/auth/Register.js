import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Register({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // Create guest document in Firestore (no role assigned)
      await setDoc(doc(db, 'guests', userCredential.user.uid), {
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        createdAt: new Date(),
        isActive: true,
        role: null
      });

      console.log('Đăng ký thành công - Tài khoản đã được tạo với quyền khách');
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng. Vui lòng chọn email khác.');
      } else if (error.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
      } else {
        setError('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.2
      }
    }
  };

  const inputVariants = {
    focus: {
      scale: 1.02,
      boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
      transition: {
        duration: 0.2
      }
    },
    blur: {
      scale: 1,
      boxShadow: "0 0 0 0 rgba(102, 126, 234, 0)",
      transition: {
        duration: 0.2
      }
    }
  };

  const buttonVariants = {
    idle: {
      scale: 1,
      transition: {
        duration: 0.2
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  };

  return (
    <motion.div 
      style={{
        maxWidth: 500,
        margin: '40px auto',
        padding: '40px 30px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        style={{ textAlign: 'center', marginBottom: 32 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div 
          style={{
            width: 80,
            height: 80,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
          }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
        >
          <span style={{ fontSize: 32, color: 'white' }}>📝</span>
        </motion.div>
        <motion.h2 
          style={{
            color: '#2d3748',
            margin: '0 0 8px 0',
            fontSize: 28,
            fontWeight: 700
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Đăng ký tài khoản
        </motion.h2>
        <motion.div 
          style={{
            color: '#718096',
            fontSize: 16
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Tạo tài khoản mới để sử dụng EduTrack
        </motion.div>
      </motion.div>

      <motion.form 
        onSubmit={handleSubmit}
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          style={{ marginBottom: 20 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#2d3748'
          }}>
            👤 Họ và tên
          </label>
          <motion.input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            placeholder="Nhập họ và tên của bạn..."
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              fontSize: 16,
              color: '#2d3748',
              background: 'rgba(255,255,255,0.8)',
              boxSizing: 'border-box'
            }}
            variants={inputVariants}
            initial="blur"
            whileFocus="focus"
            whileBlur="blur"
            disabled={loading}
          />
        </motion.div>

        <motion.div 
          style={{ marginBottom: 20 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.75 }}
        >
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#2d3748'
          }}>
            📱 Số điện thoại
          </label>
          <motion.input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="Nhập số điện thoại..."
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              fontSize: 16,
              color: '#2d3748',
              background: 'rgba(255,255,255,0.8)',
              boxSizing: 'border-box'
            }}
            variants={inputVariants}
            initial="blur"
            whileFocus="focus"
            whileBlur="blur"
            disabled={loading}
          />
        </motion.div>

        <motion.div 
          style={{ marginBottom: 20 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#2d3748'
          }}>
            📧 Email
          </label>
          <motion.input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Nhập email của bạn..."
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              fontSize: 16,
              color: '#2d3748',
              background: 'rgba(255,255,255,0.8)',
              boxSizing: 'border-box'
            }}
            variants={inputVariants}
            initial="blur"
            whileFocus="focus"
            whileBlur="blur"
            disabled={loading}
          />
        </motion.div>

        <motion.div 
          style={{ marginBottom: 20 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
        >
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#2d3748'
          }}>
            🔒 Mật khẩu
          </label>
          <div style={{ position: 'relative' }}>
            <motion.input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)..."
              style={{
                width: '100%',
                padding: '16px',
                paddingRight: '40px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: 16,
                color: '#2d3748',
                background: 'rgba(255,255,255,0.8)',
                boxSizing: 'border-box'
              }}
              variants={inputVariants}
              initial="blur"
              whileFocus="focus"
              whileBlur="blur"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 10,
                top: 0,
                height: '100%',
                width: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                color: '#667eea',
                fontSize: 20,
                cursor: 'pointer',
                padding: 0
              }}
              tabIndex={-1}
              disabled={loading}
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
          </div>
        </motion.div>

        <motion.div 
          style={{ marginBottom: 24 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
        >
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#2d3748'
          }}>
            🔐 Xác nhận mật khẩu
          </label>
          <div style={{ position: 'relative' }}>
            <motion.input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Nhập lại mật khẩu..."
              style={{
                width: '100%',
                padding: '16px',
                paddingRight: '40px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: 16,
                color: '#2d3748',
                background: 'rgba(255,255,255,0.8)',
                boxSizing: 'border-box'
              }}
              variants={inputVariants}
              initial="blur"
              whileFocus="focus"
              whileBlur="blur"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: 10,
                top: 0,
                height: '100%',
                width: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                color: '#667eea',
                fontSize: 20,
                cursor: 'pointer',
                padding: 0
              }}
              tabIndex={-1}
              disabled={loading}
            >
              {showConfirmPassword ? '👁️' : '🙈'}
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div 
              style={{
                padding: '12px 16px',
                background: 'rgba(245, 101, 101, 0.1)',
                border: '1px solid rgba(245, 101, 101, 0.2)',
                borderRadius: 8,
                color: '#f56565',
                fontSize: 14,
                marginBottom: 20
              }}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          style={{ marginBottom: 24 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <motion.button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading 
                ? '#e2e8f0' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: loading ? '#718096' : 'white',
              border: 'none',
              borderRadius: 12,
              padding: '16px',
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading 
                ? 'none' 
                : '0 8px 25px rgba(102, 126, 234, 0.3)'
            }}
            variants={buttonVariants}
            initial="idle"
            whileHover={loading ? "idle" : "hover"}
            whileTap={loading ? "idle" : "tap"}
          >
            {loading ? (
              <motion.div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <motion.div 
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%'
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Đang đăng ký...
              </motion.div>
            ) : (
              '🚀 Tạo tài khoản'
            )}
          </motion.button>
        </motion.div>

        <motion.div 
          style={{ textAlign: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔙 Đã có tài khoản? Đăng nhập ngay
          </motion.button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
}
