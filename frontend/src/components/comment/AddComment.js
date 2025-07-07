import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AddComment({ student, onCommentAdded, currentUser, userData }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Show loading if userData is not yet loaded
  if (!currentUser || !userData) {
    return (
      <div className="fade-in" style={{
        maxWidth: 600,
        margin: '40px auto',
        padding: '40px 30px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(102, 126, 234, 0.2)',
          borderTop: '3px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <div style={{ color: '#667eea', fontSize: 16, fontWeight: 600 }}>Đang tải thông tin người dùng...</div>
      </div>
    );
  }

  // Check if user has permission to add comments
  if (userData.role !== 'teacher' && userData.role !== 'admin') {
    return (
      <div className="fade-in" style={{
        maxWidth: 600,
        margin: '40px auto',
        padding: '40px 30px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          width: 60,
          height: 60,
          background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 6px 20px rgba(229, 62, 62, 0.3)'
        }}>
          <span style={{ fontSize: 24, color: 'white' }}>🚫</span>
        </div>
        <h4 style={{ color: '#e53e3e', marginBottom: 12 }}>Không có quyền</h4>
        <div style={{ color: '#718096' }}>
          Bạn không có quyền thêm nhận xét. Chỉ giáo viên và admin mới có quyền này.
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung nhận xét');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('Thêm nhận xét cho học sinh:', student.id);
      console.log('Current user:', currentUser);
      console.log('User data:', userData);
      
      const commentData = {
        studentId: student.id,
        content: content.trim(),
        type,
        createdAt: serverTimestamp(),
        studentName: student.fullName,
        teacherId: currentUser.uid,
        teacherName: userData.fullName || "Giáo viên",
        classId: student.classId || null,
        className: student.className || null,
        subject: "Chung", // Thêm trường subject theo yêu cầu của rules
        timestamp: serverTimestamp(), // Thêm timestamp để tương thích với query cũ
      };

      console.log('Comment data to be saved:', commentData);

      const docRef = await addDoc(collection(db, 'comments'), commentData);
      console.log('Thêm nhận xét thành công');
      
      // Hiển thị thông báo thành công
      setSuccess('Nhận xét đã được lưu thành công!');
      
      // Reset form
      setContent('');
      setType('general');
      
      // Gọi callback để cập nhật danh sách nhận xét
      if (onCommentAdded) {
        onCommentAdded({
          id: docRef.id,
          ...commentData,
          createdAt: new Date(),
          timestamp: new Date()
        });
      }
      
      // Ẩn thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Lỗi khi thêm nhận xét:', err);
      setError('Lỗi khi thêm nhận xét: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const formVariants = {
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
        duration: 0.5,
        ease: "easeOut"
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
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 20,
        padding: '32px',
        marginBottom: '32px',
        border: '2px solid #e2e8f0',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        style={{ textAlign: 'center', marginBottom: 24 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div 
          style={{
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
          }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <span style={{ fontSize: 24, color: 'white' }}>✏️</span>
        </motion.div>
        <motion.h3 
          style={{
            color: '#2d3748',
            margin: '0 0 8px 0',
            fontSize: 20,
            fontWeight: 700
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Thêm nhận xét mới
        </motion.h3>
        <motion.div 
          style={{
            color: '#718096',
            fontSize: 14
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Cho học sinh: {student.fullName || 'N/A'}
        </motion.div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <motion.div 
          style={{ marginBottom: 20 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#2d3748'
          }}>
            Loại nhận xét:
          </label>
          <motion.div 
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            {[
              { value: 'positive', label: '👍 Tích cực', color: '#48bb78' },
              { value: 'negative', label: '👎 Cần cải thiện', color: '#f56565' },
              { value: 'general', label: '📝 Chung', color: '#667eea' }
            ].map((option) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: `2px solid ${type === option.value ? option.color : '#e2e8f0'}`,
                  background: type === option.value 
                    ? `${option.color}15` 
                    : 'rgba(255,255,255,0.8)',
                  color: type === option.value ? option.color : '#718096',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div 
          style={{ marginBottom: 24 }}
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
            Nội dung nhận xét:
          </label>
          <motion.textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung nhận xét cho học sinh..."
            style={{
              width: '100%',
              minHeight: 120,
              padding: '16px',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              fontSize: 14,
              lineHeight: 1.5,
              color: '#2d3748',
              background: 'rgba(255,255,255,0.8)',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            variants={inputVariants}
            initial="blur"
            whileFocus="focus"
            whileBlur="blur"
            disabled={isSubmitting}
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
          style={{ textAlign: 'center' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: isSubmitting 
                ? '#e2e8f0' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: isSubmitting ? '#718096' : 'white',
              border: 'none',
              borderRadius: 12,
              padding: '16px 32px',
              fontSize: 16,
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: isSubmitting 
                ? 'none' 
                : '0 8px 25px rgba(102, 126, 234, 0.3)',
              minWidth: 160
            }}
            variants={buttonVariants}
            initial="idle"
            whileHover={isSubmitting ? "idle" : "hover"}
            whileTap={isSubmitting ? "idle" : "tap"}
          >
            {isSubmitting ? (
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
                Đang thêm...
              </motion.div>
            ) : (
              '➕ Thêm nhận xét'
            )}
          </motion.button>
        </motion.div>
      </form>

      {success && (
        <div style={{ 
          color: '#2f855a', 
          marginTop: 20, 
          textAlign: 'center',
          background: '#d3f4e2',
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid #a5f3ba',
          fontSize: 14,
          fontWeight: 500
        }}>
          ✅ {success}
        </div>
      )}
    </motion.div>
  );
}
