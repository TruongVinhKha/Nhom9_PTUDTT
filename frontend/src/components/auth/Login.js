import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";
import { db } from '../../firebaseConfig';
import ForgotPassword from './ForgotPassword';

export default function Login({ onSwitchToRegister, onSwitchToForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Lấy thông tin user từ Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || (userDoc.data().role !== "teacher" && userDoc.data().role !== "admin")) {
        await auth.signOut();
        setError("Chỉ giáo viên hoặc admin mới được phép đăng nhập.");
        setLoading(false);
        return;
      }
      
      // Nếu là admin, lưu password để sử dụng sau này
      if (userDoc.data().role === "admin") {
        localStorage.setItem('adminPassword', password);
      }
      
      // Nếu là teacher thì cho đăng nhập bình thường
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
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

  // Nếu đang hiển thị modal quên mật khẩu
  if (showForgotPassword) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ForgotPassword onSwitchToLogin={handleCloseForgotPassword} />
      </motion.div>
    );
  }

  return (
    <motion.div 
      style={{
        maxWidth: 400,
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
          <span style={{ fontSize: 32, color: 'white' }}>🎓</span>
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
          Đăng nhập
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
          Chào mừng bạn trở lại với EduTrack
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
            📧 Email
          </label>
          <motion.input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          style={{ marginBottom: 24 }}
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
            🔒 Mật khẩu
          </label>
          <motion.input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Nhập mật khẩu của bạn..."
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
          transition={{ delay: 0.9 }}
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
                Đang đăng nhập...
              </motion.div>
            ) : (
              '🚀 Đăng nhập'
            )}
          </motion.button>
        </motion.div>

        <motion.div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <motion.button
            type="button"
            onClick={handleForgotPassword}
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
            🔑 Quên mật khẩu?
          </motion.button>
          
          <motion.button
            type="button"
            onClick={onSwitchToRegister}
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
            📝 Tạo tài khoản mới
          </motion.button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
}
