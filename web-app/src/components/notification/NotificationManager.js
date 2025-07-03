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
import { 
  unifiedEntranceVariants, 
  containerVariants, 
  itemVariants, 
  buttonVariants,
  formItemVariants,
  notificationVariants,
  spinnerVariants
} from '../../utils/animations';

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

  // Show loading if userData is not yet loaded
  if (!currentUser || !userData) {
    return (
      <motion.div 
        className="App flex items-center justify-center"
        style={{ minHeight: '40vh', flexDirection: 'column', gap: 24 }}
        variants={unifiedEntranceVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="unified-loading"
          variants={spinnerVariants}
          animate="animate"
        />
        <motion.div 
          className="unified-gradient-text"
          style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }}
          variants={unifiedEntranceVariants}
          initial="hidden"
          animate="visible"
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
        className="unified-card text-center"
        style={{
          maxWidth: 800,
          margin: '40px auto',
          padding: '40px 30px'
        }}
        variants={unifiedEntranceVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="unified-gradient-text"
          style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}
          variants={itemVariants}
        >
          Không có quyền truy cập
        </motion.div>
        <motion.div
          style={{ color: '#666', fontSize: 16 }}
          variants={itemVariants}
        >
          Bạn không có quyền tạo thông báo. Chỉ giáo viên và quản trị viên mới có thể thực hiện chức năng này.
        </motion.div>
      </motion.div>
    );
  }

  const handleClassToggle = (classId) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng điền đầy đủ thông tin');
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

      const notificationData = {
        title: title.trim(),
        content: content.trim(),
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
        createdAt: serverTimestamp(),
        type: notificationType,
        status: 'active',
        teacherId: currentUser.uid
      };

      if (notificationType === 'single') {
        notificationData.classId = selectedSingleClass;
        notificationData.className = classes.find(c => c.id === selectedSingleClass)?.name || '';
      } else {
        notificationData.classIds = selectedClasses;
        notificationData.classNames = classes
          .filter(c => selectedClasses.includes(c.id))
          .map(c => c.name);
      }
      console.log('notificationData:', JSON.stringify(notificationData, null, 2));
      const collectionName = notificationType === 'multiple' ? 'notificationsForClass' : 'notifications';
      await addDoc(collection(db, collectionName), notificationData);

      setSuccess('Thông báo đã được tạo thành công!');
      setTitle('');
      setContent('');
      setSelectedClasses([]);
      setSelectedSingleClass('');
      setNotificationType('single');

      if (onNotificationCreated) {
        onNotificationCreated();
      }
    } catch (err) {
      console.error('Error creating notification:', err);
      setError('Lỗi khi tạo thông báo. Vui lòng thử lại.');
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
        className="App flex items-center justify-center"
        style={{ minHeight: '40vh', flexDirection: 'column', gap: 24 }}
        variants={unifiedEntranceVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="unified-loading"
          variants={spinnerVariants}
          animate="animate"
        />
        <motion.div 
          className="unified-gradient-text"
          style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }}
          variants={unifiedEntranceVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          Đang tải danh sách lớp học...
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="unified-card"
      style={{ maxWidth: 800, margin: '40px auto', padding: '40px 30px' }}
      variants={unifiedEntranceVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="unified-gradient-text"
        style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}
        variants={itemVariants}
      >
        Tạo Thông Báo Mới
      </motion.div>
      
      <motion.div
        style={{ color: '#666', fontSize: 16, textAlign: 'center', marginBottom: 32 }}
        variants={itemVariants}
      >
        Tạo thông báo cho học sinh và phụ huynh
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="unified-notification error"
            variants={notificationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.span variants={itemVariants}>
              ❌ {error}
            </motion.span>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            className="unified-notification success"
            variants={notificationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.span variants={itemVariants}>
              ✅ {success}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        onSubmit={handleSubmit}
        className="unified-form"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="unified-form-item" variants={formItemVariants}>
          <motion.label
            className="unified-input-label"
            style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}
            variants={itemVariants}
          >
            Loại thông báo:
          </motion.label>
          <motion.div
            className="flex gap-16"
            variants={itemVariants}
          >
            <motion.label
              className="unified-radio-option"
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              variants={itemVariants}
            >
              <motion.input
                type="radio"
                name="notificationType"
                value="single"
                checked={notificationType === 'single'}
                onChange={(e) => setNotificationType(e.target.value)}
                style={{ margin: 0 }}
              />
              Thông báo cho một lớp
            </motion.label>
            <motion.label
              className="unified-radio-option"
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              variants={itemVariants}
            >
              <motion.input
                type="radio"
                name="notificationType"
                value="multiple"
                checked={notificationType === 'multiple'}
                onChange={(e) => setNotificationType(e.target.value)}
                style={{ margin: 0 }}
              />
              Thông báo cho nhiều lớp
            </motion.label>
          </motion.div>
        </motion.div>

        {notificationType === 'single' && (
          <motion.div className="unified-form-item" variants={formItemVariants}>
            <motion.label
              className="unified-input-label"
              style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}
              variants={itemVariants}
            >
              Chọn lớp học:
            </motion.label>
            <motion.select
              value={selectedSingleClass}
              onChange={(e) => setSelectedSingleClass(e.target.value)}
              className="unified-input"
              variants={itemVariants}
            >
              <option value="">-- Chọn lớp học --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </motion.select>
          </motion.div>
        )}

        {notificationType === 'multiple' && (
          <motion.div className="unified-form-item" variants={formItemVariants}>
            <motion.label
              className="unified-input-label"
              style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}
              variants={itemVariants}
            >
              Chọn lớp học:
            </motion.label>
            <motion.div
              className="flex gap-8 mb-16"
              variants={itemVariants}
            >
              <motion.label
                className="unified-checkbox-option"
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                variants={itemVariants}
              >
                <motion.input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  style={{ margin: 0 }}
                />
                Chọn tất cả ({classes.length} lớp)
              </motion.label>
            </motion.div>
            <motion.div
              className="flex flex-wrap gap-8"
              variants={itemVariants}
            >
              {classes.map((cls) => (
                <motion.label
                  key={cls.id}
                  className="unified-checkbox-option"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  variants={itemVariants}
                >
                  <motion.input
                    type="checkbox"
                    checked={selectedClasses.includes(cls.id)}
                    onChange={() => handleClassToggle(cls.id)}
                    style={{ margin: 0 }}
                  />
                  {cls.name}
                </motion.label>
              ))}
            </motion.div>
          </motion.div>
        )}

        <motion.div className="unified-form-item" variants={formItemVariants}>
          <motion.label
            className="unified-input-label"
            style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}
            variants={itemVariants}
          >
            Tiêu đề thông báo:
          </motion.label>
          <motion.input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="unified-input"
            placeholder="Nhập tiêu đề thông báo..."
            variants={itemVariants}
          />
        </motion.div>

        <motion.div className="unified-form-item" variants={formItemVariants}>
          <motion.label
            className="unified-input-label"
            style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}
            variants={itemVariants}
          >
            Nội dung thông báo:
          </motion.label>
          <motion.textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="unified-input"
            placeholder="Nhập nội dung thông báo..."
            rows={6}
            style={{ resize: 'vertical', minHeight: 120, fontFamily: 'inherit' }}
            variants={itemVariants}
          />
        </motion.div>

        <motion.div
          className="flex justify-center mt-24"
          variants={itemVariants}
        >
          <motion.button
            type="submit"
            className="unified-button"
            disabled={submitting}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            style={{ minWidth: 200 }}
          >
            {submitting ? (
              <motion.div
                className="flex items-center gap-8"
                variants={itemVariants}
              >
                <motion.div 
                  className="unified-loading"
                  style={{ width: 20, height: 20, borderWidth: 2 }}
                  variants={spinnerVariants}
                  animate="animate"
                />
                <motion.span variants={itemVariants}>
                  Đang tạo...
                </motion.span>
              </motion.div>
            ) : (
              <motion.span variants={itemVariants}>
                Tạo Thông Báo
              </motion.span>
            )}
          </motion.button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
} 