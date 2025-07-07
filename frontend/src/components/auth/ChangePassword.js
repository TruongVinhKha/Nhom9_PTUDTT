import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../../firebaseConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function ChangePassword({ onClose }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSuccess('');

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại');
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, formData.newPassword);

      setSuccess('Đổi mật khẩu thành công!');
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      if (error.code === 'auth/wrong-password') {
        setError('Mật khẩu hiện tại không đúng');
      } else if (error.code === 'auth/weak-password') {
        setError('Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn');
      } else {
        setError('Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại');
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
          <span style={{ fontSize: 32, color: 'white' }}>🔐</span>
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
          Đổi mật khẩu
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
          Cập nhật mật khẩu mới cho tài khoản của bạn
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
            🔑 Mật khẩu hiện tại
          </label>
          <motion.input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
            placeholder="Nhập mật khẩu hiện tại..."
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
            🔒 Mật khẩu mới
          </label>
          <motion.input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)..."
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
          transition={{ delay: 0.9 }}
        >
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#2d3748'
          }}>
            🔐 Xác nhận mật khẩu mới
          </label>
          <motion.input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Nhập lại mật khẩu mới..."
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

        <AnimatePresence>
          {success && (
            <motion.div 
              style={{
                padding: '12px 16px',
                background: 'rgba(72, 187, 120, 0.1)',
                border: '1px solid rgba(72, 187, 120, 0.2)',
                borderRadius: 8,
                color: '#48bb78',
                fontSize: 14,
                marginBottom: 20
              }}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              ✅ {success}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          style={{ 
            display: 'flex', 
            gap: 12,
            marginBottom: 24
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <motion.button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
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
                Đang cập nhật...
              </motion.div>
            ) : (
              '💾 Cập nhật mật khẩu'
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={onClose}
            style={{
              padding: '16px 24px',
              background: 'rgba(226, 232, 240, 0.8)',
              color: '#4a5568',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
          >
            ❌ Hủy
          </motion.button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
} 