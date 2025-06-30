import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query,  
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function NotificationManager({ currentUser, userData, onNotificationCreated }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [notificationType, setNotificationType] = useState('single'); // 'single' or 'multiple'
  const [selectedSingleClass, setSelectedSingleClass] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  // Khi notificationType hoặc classes thay đổi, cập nhật selectAll nếu cần
  useEffect(() => {
    if (notificationType === 'multiple') {
      setSelectAll(selectedClasses.length === classes.length && classes.length > 0);
    } else {
      setSelectAll(false);
    }
  }, [notificationType, selectedClasses, classes]);

  // Load classes - MUST be called before any early returns
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const classesRef = collection(db, 'classes');
        const q = query(classesRef, orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        const classesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setClasses(classesList);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Lỗi khi tải danh sách lớp học');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Ẩn thông báo sau 4 giây
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Enhanced animation variants inspired by ReactBits.dev
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.15,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
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

  const formItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      y: -3,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  };

  // Show loading if userData is not yet loaded
  if (!currentUser || !userData) {
    return (
      <motion.div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '40vh',
          flexDirection: 'column',
          gap: 24
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="enhanced-spinner"
          style={{
            width: 50,
            height: 50,
            border: '4px solid rgba(102, 126, 234, 0.2)',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          style={{ 
            color: '#667eea', 
            fontSize: 18, 
            fontWeight: 600,
            textAlign: 'center'
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Đang tải thông tin người dùng...
          </motion.span>
        </motion.div>
      </motion.div>
    );
  }

  // Check if user has permission to create notifications
  if (userData.role !== 'teacher' && userData.role !== 'admin') {
    return (
      <motion.div 
        className="fade-in enhanced-card"
        style={{
          maxWidth: 800,
          margin: '40px auto',
          padding: '40px 30px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 28,
          boxShadow: '0 25px 80px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255,255,255,0.3)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="rotate-in enhanced-avatar"
          style={{
            width: 80,
            height: 80,
            background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 12px 35px rgba(229, 62, 62, 0.4)',
            position: 'relative'
          }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.3 }}
        >
          <motion.span 
            style={{ fontSize: 32, color: 'white' }}
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            🚫
          </motion.span>
          <motion.div
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              background: '#e53e3e',
              borderRadius: '50%',
              border: '3px solid white'
            }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <motion.h4 
          style={{ 
            color: '#e53e3e', 
            marginBottom: 12, 
            fontSize: 24,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Không có quyền
        </motion.h4>
        <motion.div 
          style={{ 
            color: '#718096',
            fontSize: 16,
            fontWeight: 500
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Bạn không có quyền tạo thông báo. Chỉ giáo viên và admin mới có quyền này.
        </motion.div>
      </motion.div>
    );
  }

  // Handle class selection
  const handleClassToggle = (classId) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng điền đầy đủ tiêu đề và nội dung');
      return;
    }

    if (notificationType === 'single' && !selectedSingleClass) {
      setError('Vui lòng chọn lớp học');
      return;
    }

    if (notificationType === 'multiple' && selectedClasses.length === 0) {
      setError('Vui lòng chọn ít nhất một lớp học');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      if (notificationType === 'single') {
        // Tạo thông báo cho 1 lớp (notifications)
        const notificationData = {
          title: title.trim(),
          content: content.trim(),
          teacherId: currentUser.uid,
          teacherName: userData.fullName || userData.email || "Giáo viên",
          classId: selectedSingleClass,
          className: classes.find(c => c.id === selectedSingleClass)?.name || selectedSingleClass,
          createdAt: serverTimestamp(),
          updatedAt: null,
          isDeleted: false,
          deletedAt: null,
          viewCount: 0,
          priority: 'normal', // normal, high, urgent
          category: 'general', // general, academic, event, reminder
          expiresAt: null,
          attachments: [],
          tags: []
        };
        await addDoc(collection(db, 'notifications'), notificationData);
        setSuccess('Đã tạo thông báo thành công!');
        if (onNotificationCreated) onNotificationCreated([notificationData]);
      } else {
        // Tạo 1 document duy nhất trong notificationsForClass
        const multiNotificationData = {
          title: title.trim(),
          content: content.trim(),
          teacherId: currentUser.uid,
          teacherName: userData.fullName || userData.email || "Giáo viên",
          classIds: selectedClasses,
          classNames: selectedClasses.map(classId => classes.find(c => c.id === classId)?.name || classId),
          createdAt: serverTimestamp(),
          updatedAt: null,
          isDeleted: false,
          deletedAt: null,
          viewCount: 0,
          priority: 'normal',
          category: 'general',
          expiresAt: null,
          attachments: [],
          tags: []
        };
        await addDoc(collection(db, 'notificationsForClass'), multiNotificationData);
        setSuccess('Đã tạo thông báo thành công!');
        if (onNotificationCreated) onNotificationCreated([multiNotificationData]);
      }

      // Reset form
      setTitle('');
      setContent('');
      setSelectedClasses([]);
      setSelectedSingleClass('');
      setNotificationType('single');
    } catch (err) {
      console.error('Error creating notification:', err);
      setError('Lỗi khi tạo thông báo: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(classes.map(c => c.id));
    }
  };

  if (loading) {
    return (
      <motion.div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '40vh',
          flexDirection: 'column',
          gap: 24
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="enhanced-spinner"
          style={{
            width: 50,
            height: 50,
            border: '4px solid rgba(102, 126, 234, 0.2)',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          style={{ 
            color: '#667eea', 
            fontSize: 18, 
            fontWeight: 600,
            textAlign: 'center'
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Đang tải danh sách lớp học...
          </motion.span>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="fade-in enhanced-card"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        maxWidth: 800,
        margin: '40px auto',
        padding: '40px 30px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: 28,
        boxShadow: '0 25px 80px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated background gradient */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #667eea, #764ba2, #48bb78, #ed8936)',
          backgroundSize: '400% 100%'
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Header */}
      <motion.div 
        className="stagger-item" 
        variants={itemVariants}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        <motion.div 
          className="float enhanced-avatar"
          style={{
            width: 90,
            height: 90,
            background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 15px 40px rgba(72, 187, 120, 0.4)',
            position: 'relative'
          }}
          whileHover={{ 
            scale: 1.1, 
            rotate: 5,
            boxShadow: '0 20px 50px rgba(72, 187, 120, 0.6)'
          }}
          transition={{ duration: 0.4 }}
        >
          <motion.span 
            style={{ fontSize: 36, color: 'white' }}
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            📢
          </motion.span>
          <motion.div
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              width: 20,
              height: 20,
              background: '#48bb78',
              borderRadius: '50%',
              border: '3px solid white'
            }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <motion.h2 
          className="gradient-text enhanced-title"
          variants={itemVariants}
          style={{
            color: '#2d3748',
            margin: '0 0 12px 0',
            fontSize: 32,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Tạo thông báo
        </motion.h2>
        <motion.div 
          className="enhanced-subtitle"
          variants={itemVariants}
          style={{
            color: '#718096',
            fontSize: 18,
            fontWeight: 500
          }}
        >
          Gửi thông báo đến một hoặc nhiều lớp học
        </motion.div>
      </motion.div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="error-animation enhanced-notification"
            style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
              borderRadius: 16,
              marginBottom: 24,
              border: '2px solid #fc8181',
              color: '#c53030',
              fontWeight: 600,
              position: 'relative',
              overflow: 'hidden'
            }}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <motion.span
              style={{ marginRight: 8 }}
              animate={{ 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 0.8, 
                repeat: 2,
                ease: "easeInOut"
              }}
            >
              ⚠️
            </motion.span>
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            className="success-animation enhanced-notification"
            style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%)',
              borderRadius: 16,
              marginBottom: 24,
              border: '2px solid #68d391',
              color: '#22543d',
              fontWeight: 600,
              position: 'relative',
              overflow: 'hidden'
            }}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <motion.span
              style={{ marginRight: 8 }}
              animate={{ 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 0.8, 
                repeat: 2,
                ease: "easeInOut"
              }}
            >
              ✅
            </motion.span>
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <motion.form 
        onSubmit={handleSubmit} 
        style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
        variants={containerVariants}
      >
        
        {/* Notification Type Selection */}
        <motion.div 
          className="stagger-item enhanced-form-item"
          variants={formItemVariants}
        >
          <motion.label 
            className="input-label enhanced-label"
            style={{
              display: 'block',
              fontWeight: 700,
              color: '#2d3748',
              marginBottom: 12,
              fontSize: 16,
              transition: 'color 0.3s ease'
            }}
          >
            Loại thông báo:
          </motion.label>
          <motion.div 
            style={{ 
              display: 'flex', 
              gap: 20,
              flexWrap: 'wrap'
            }}
          >
            <motion.label 
              className="radio-option enhanced-radio"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                padding: '12px 20px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                background: notificationType === 'single' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                color: notificationType === 'single' ? 'white' : '#2d3748',
                transition: 'all 0.3s ease',
                boxShadow: notificationType === 'single' ? '0 4px 15px rgba(102, 126, 234, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
              }}
              whileHover={{ 
                scale: 1.05, 
                y: -2,
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.2)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.input
                type="radio"
                name="notificationType"
                value="single"
                checked={notificationType === 'single'}
                onChange={(e) => setNotificationType(e.target.value)}
                style={{ 
                  transform: 'scale(1.3)',
                  accentColor: '#667eea'
                }}
              />
              <span style={{ fontWeight: 600 }}>Một lớp học</span>
            </motion.label>
            <motion.label 
              className="radio-option enhanced-radio"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                padding: '12px 20px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                background: notificationType === 'multiple' ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 'white',
                color: notificationType === 'multiple' ? 'white' : '#2d3748',
                transition: 'all 0.3s ease',
                boxShadow: notificationType === 'multiple' ? '0 4px 15px rgba(72, 187, 120, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
              }}
              whileHover={{ 
                scale: 1.05, 
                y: -2,
                boxShadow: '0 6px 20px rgba(72, 187, 120, 0.2)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.input
                type="radio"
                name="notificationType"
                value="multiple"
                checked={notificationType === 'multiple'}
                onChange={(e) => setNotificationType(e.target.value)}
                style={{ 
                  transform: 'scale(1.3)',
                  accentColor: '#48bb78'
                }}
              />
              <span style={{ fontWeight: 600 }}>Nhiều lớp học</span>
            </motion.label>
          </motion.div>
        </motion.div>

        {/* Class Selection */}
        <motion.div 
          className="stagger-item enhanced-form-item"
          variants={formItemVariants}
        >
          <motion.label 
            className="input-label enhanced-label"
            style={{
              display: 'block',
              fontWeight: 700,
              color: '#2d3748',
              marginBottom: 12,
              fontSize: 16,
              transition: 'color 0.3s ease'
            }}
          >
            {notificationType === 'single' ? 'Chọn lớp học:' : 'Chọn các lớp học:'}
          </motion.label>
          
          {notificationType === 'single' ? (
            <motion.select
              value={selectedSingleClass}
              onChange={(e) => setSelectedSingleClass(e.target.value)}
              className="input-field enhanced-select"
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: 16,
                border: '2px solid #e2e8f0',
                fontSize: 16,
                background: 'white',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              whileFocus={{ 
                scale: 1.02,
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)'
              }}
            >
              <option value="">-- Chọn lớp học --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </motion.select>
          ) : (
            <motion.div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 16 
              }}
            >
              {/* Select All Option */}
              <motion.label 
                className="checkbox-option enhanced-checkbox"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '2px solid #e2e8f0',
                  background: selectAll ? 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)' : 'white',
                  color: selectAll ? 'white' : '#2d3748',
                  transition: 'all 0.3s ease',
                  boxShadow: selectAll ? '0 4px 15px rgba(237, 137, 54, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
                }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -1,
                  boxShadow: '0 4px 15px rgba(237, 137, 54, 0.2)'
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSelectAll}
              >
                <motion.input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  style={{ 
                    transform: 'scale(1.3)',
                    accentColor: '#ed8936'
                  }}
                />
                <span style={{ fontWeight: 600 }}>Chọn tất cả lớp học</span>
              </motion.label>

              {/* Individual Class Options */}
              <motion.div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 12 
                }}
              >
                {classes.map(cls => (
                  <motion.label 
                    key={cls.id}
                    className="checkbox-option enhanced-checkbox"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '2px solid #e2e8f0',
                      background: selectedClasses.includes(cls.id) ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 'white',
                      color: selectedClasses.includes(cls.id) ? 'white' : '#2d3748',
                      transition: 'all 0.3s ease',
                      boxShadow: selectedClasses.includes(cls.id) ? '0 4px 15px rgba(72, 187, 120, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -1,
                      boxShadow: '0 4px 15px rgba(72, 187, 120, 0.2)'
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleClassToggle(cls.id)}
                  >
                    <motion.input
                      type="checkbox"
                      checked={selectedClasses.includes(cls.id)}
                      onChange={() => handleClassToggle(cls.id)}
                      style={{ 
                        transform: 'scale(1.3)',
                        accentColor: '#48bb78'
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{cls.name}</span>
                  </motion.label>
                ))}
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* Title Input */}
        <motion.div 
          className="stagger-item enhanced-form-item"
          variants={formItemVariants}
        >
          <motion.label 
            className="input-label enhanced-label"
            style={{
              display: 'block',
              fontWeight: 700,
              color: '#2d3748',
              marginBottom: 12,
              fontSize: 16,
              transition: 'color 0.3s ease'
            }}
          >
            Tiêu đề thông báo:
          </motion.label>
          <motion.input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field enhanced-input"
            placeholder="Nhập tiêu đề thông báo..."
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: 16,
              border: '2px solid #e2e8f0',
              fontSize: 16,
              background: 'white',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            whileFocus={{ 
              scale: 1.02,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)'
            }}
          />
        </motion.div>

        {/* Content Input */}
        <motion.div 
          className="stagger-item enhanced-form-item"
          variants={formItemVariants}
        >
          <motion.label 
            className="input-label enhanced-label"
            style={{
              display: 'block',
              fontWeight: 700,
              color: '#2d3748',
              marginBottom: 12,
              fontSize: 16,
              transition: 'color 0.3s ease'
            }}
          >
            Nội dung thông báo:
          </motion.label>
          <motion.textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="textarea-field enhanced-textarea"
            placeholder="Nhập nội dung thông báo..."
            rows={6}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: 16,
              border: '2px solid #e2e8f0',
              fontSize: 16,
              background: 'white',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              resize: 'vertical',
              minHeight: '120px'
            }}
            whileFocus={{ 
              scale: 1.02,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)'
            }}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div 
          className="stagger-item enhanced-button-container"
          variants={formItemVariants}
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: 20 
          }}
        >
          <motion.button
            type="submit"
            disabled={submitting}
            className="btn btn-primary ripple enhanced-button"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            style={{
              padding: '16px 40px',
              background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              fontSize: 18,
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 25px rgba(72, 187, 120, 0.3)',
              opacity: submitting ? 0.7 : 1,
              position: 'relative',
              overflow: 'hidden',
              minWidth: '200px'
            }}
          >
            {submitting ? (
              <motion.div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <motion.div
                  style={{
                    width: 20,
                    height: 20,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%'
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Đang tạo...
              </motion.div>
            ) : (
              <motion.span
                style={{ position: 'relative', zIndex: 1 }}
                whileHover={{ scale: 1.05 }}
              >
                📢 Tạo thông báo
              </motion.span>
            )}
          </motion.button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
} 