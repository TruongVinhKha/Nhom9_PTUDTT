import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  updateDoc,
  serverTimestamp,
  doc
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationList({ currentUser, userData }) {
  const [notifications, setNotifications] = useState([]);
  const [multiNotifications, setMultiNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, single, multiple
  const [deletingId, setDeletingId] = useState(null);
  const [editingNotification, setEditingNotification] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: ''
  });
  const [updatingId, setUpdatingId] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = mới nhất, 'asc' = cũ nhất
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Thêm filter UI cho admin
  const isAdmin = userData?.role === 'admin';

  // Load notifications
  useEffect(() => {
    if (!currentUser || !userData) return; // Đợi userData load xong

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError('');

        // Kiểm tra role của user hiện tại
        const isAdmin = userData.role === 'admin';
        const isTeacher = userData.role === 'teacher';
        
        console.log('🔍 Current User Info:', {
          uid: currentUser.uid,
          email: currentUser.email,
          role: userData.role,
          fullName: userData.fullName,
          isAdmin: isAdmin,
          isTeacher: isTeacher
        });

        // Fetch single class notifications
        const notificationsRef = collection(db, 'notifications');
        let notificationsQuery;
        
        if (isAdmin) {
          // Admin: Lấy tất cả thông báo, filter isDeleted ở client side
          notificationsQuery = query(
            notificationsRef,
            orderBy('createdAt', 'desc')
          );
          console.log('🔍 Admin: Fetching all single notifications');
        } else if (isTeacher) {
          // Teacher: Chỉ lấy thông báo của mình, filter isDeleted ở client side
          notificationsQuery = query(
            notificationsRef,
            where('teacherId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          console.log('🔍 Teacher: Fetching notifications for teacherId:', currentUser.uid);
        } else {
          // Parent hoặc role khác: Không lấy thông báo
          console.log('🔍 Non-teacher/admin user: No notifications to fetch');
          setNotifications([]);
          setMultiNotifications([]);
          setLoading(false);
          return;
        }
        
        const notificationsSnapshot = await getDocs(notificationsQuery);
        console.log('📊 Single notifications found:', notificationsSnapshot.docs.length);
        
        // Filter isDeleted ở client side
        const notificationsList = notificationsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'single'
          }))
          .filter(notification => !notification.isDeleted);

        // Fetch multi-class notifications
        const multiNotificationsRef = collection(db, 'notificationsForClass');
        let multiNotificationsQuery;
        
        if (isAdmin) {
          // Admin: Lấy tất cả thông báo nhiều lớp, filter isDeleted ở client side
          multiNotificationsQuery = query(
            multiNotificationsRef,
            orderBy('createdAt', 'desc')
          );
          console.log('🔍 Admin: Fetching all multi-class notifications');
        } else if (isTeacher) {
          // Teacher: Chỉ lấy thông báo nhiều lớp của mình, filter isDeleted ở client side
          multiNotificationsQuery = query(
            multiNotificationsRef,
            where('teacherId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          console.log('🔍 Teacher: Fetching multi-class notifications for teacherId:', currentUser.uid);
        } else {
          // Parent hoặc role khác: Không lấy thông báo
          multiNotificationsQuery = null;
        }
        
        if (multiNotificationsQuery) {
          const multiNotificationsSnapshot = await getDocs(multiNotificationsQuery);
          console.log('📊 Multi notifications found:', multiNotificationsSnapshot.docs.length);
          
          // Filter isDeleted ở client side
          const multiNotificationsList = multiNotificationsSnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              type: 'multiple'
            }))
            .filter(notification => !notification.isDeleted);
          
          setMultiNotifications(multiNotificationsList);
        } else {
          setMultiNotifications([]);
        }

        setNotifications(notificationsList);

      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Lỗi khi tải danh sách thông báo: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser.uid, userData]); // Dependency chỉ cần uid và userData

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const notificationVariants = {
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
        duration: 0.4,
        ease: "easeOut"
      }
    },
    hover: {
      y: -4,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const loadingVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'info': return '#667eea';
      case 'success': return '#48bb78';
      case 'warning': return '#ed8936';
      case 'error': return '#f56565';
      default: return '#667eea';
    }
  };

  // Handle delete notification
  const handleDelete = async (notificationId, type) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      return;
    }

    setDeletingId(notificationId);
    try {
      const collectionName = type === 'multiple' ? 'notificationsForClass' : 'notifications';
      const notificationRef = doc(db, collectionName, notificationId);
      
      // Soft delete
      await updateDoc(notificationRef, {
        isDeleted: true,
        deletedAt: serverTimestamp()
      });

      // Update local state
      if (type === 'multiple') {
        setMultiNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }

      console.log('✅ Notification deleted successfully');
      setSuccess('Thông báo đã được xóa thành công');

    } catch (err) {
      console.error('Error deleting notification:', err);
      alert('Lỗi khi xóa thông báo: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setEditForm({
      title: notification.title,
      content: notification.content
    });
  };

  const handleUpdate = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      alert('Tiêu đề và nội dung không được để trống');
      return;
    }

    setUpdatingId(editingNotification.id);
    try {
      const collectionName = editingNotification.type === 'multiple' ? 'notificationsForClass' : 'notifications';
      const notificationRef = doc(db, collectionName, editingNotification.id);
      
      // Chỉ cập nhật các trường cần thiết, không làm mất các trường khác
      await updateDoc(notificationRef, {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        updatedAt: serverTimestamp()
      });

      // Update local state
      const updatedNotification = {
        ...editingNotification,
        title: editForm.title.trim(),
        content: editForm.content.trim()
      };

      if (editingNotification.type === 'multiple') {
        setMultiNotifications(prev => 
          prev.map(n => n.id === editingNotification.id ? updatedNotification : n)
        );
      } else {
        setNotifications(prev => 
          prev.map(n => n.id === editingNotification.id ? updatedNotification : n)
        );
      }

      setEditingNotification(null);
      setEditForm({ title: '', content: '' });
      setSuccess('Thông báo đã được cập nhật thành công');
    } catch (err) {
      console.error('Error updating notification:', err);
      alert('Lỗi khi cập nhật thông báo: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingNotification(null);
    setEditForm({ title: '', content: '' });
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Vừa xong';
    
    try {
      const date = timestamp._seconds ? 
        new Date(timestamp._seconds * 1000) : 
        timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Vừa xong';
    }
  };

  // Get filtered notifications
  const getFilteredNotifications = () => {
    const allNotifications = [
      ...notifications.map(n => ({ ...n, type: 'single' })),
      ...multiNotifications.map(n => ({ ...n, type: 'multiple' }))
    ];

    switch (filter) {
      case 'single':
        return allNotifications.filter(n => n.type === 'single');
      case 'multiple':
        return allNotifications.filter(n => n.type === 'multiple');
      default:
        return allNotifications;
    }
  };

  const filteredNotifications = getFilteredNotifications().filter(noti =>
    (noti.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (noti.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (noti.className || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (noti.classNames ? noti.classNames.join(', ').toLowerCase() : '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <motion.div 
        className="fade-in" 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          flexDirection: 'column',
          gap: 20
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          style={{
            width: 50,
            height: 50,
            border: '4px solid rgba(102, 126, 234, 0.2)',
            borderTop: '4px solid #667eea',
            borderRadius: '50%'
          }}
          variants={loadingVariants}
          animate="animate"
        />
        <motion.div 
          style={{ color: '#667eea', fontSize: 18, fontWeight: 600 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Đang tải thông báo...
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="fade-in" 
        style={{
          maxWidth: 600,
          margin: '40px auto',
          padding: '40px 30px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center'
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          style={{
            width: 70,
            height: 70,
            background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 25px rgba(229, 62, 62, 0.3)'
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <span style={{ fontSize: 28, color: 'white' }}>⚠️</span>
        </motion.div>
        <motion.h3 
          style={{ color: '#e53e3e', marginBottom: 16 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Có lỗi xảy ra
        </motion.h3>
        <motion.div 
          style={{ color: '#718096' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {error}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="fade-in" 
      style={{
        maxWidth: 800,
        margin: '40px auto',
        padding: '40px 30px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div 
        style={{ textAlign: 'center', marginBottom: 40 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div 
          style={{
            width: 70,
            height: 70,
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
          <span style={{ fontSize: 28, color: 'white' }}>🔔</span>
        </motion.div>
        <motion.h3 
          style={{
            color: '#2d3748',
            margin: '0 0 8px 0',
            fontSize: 24,
            fontWeight: 700
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Thông báo đã tạo
        </motion.h3>
        <motion.div 
          style={{
            color: '#718096',
            fontSize: 16
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Tổng cộng {notifications.length + multiNotifications.length} thông báo
        </motion.div>
        {isAdmin && (
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: filter === 'all' ? '2px solid #667eea' : '2px solid #e2e8f0',
                background: filter === 'all' ? 'rgba(102, 126, 234, 0.08)' : 'white',
                color: filter === 'all' ? '#667eea' : '#2d3748',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('multiple')}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: filter === 'multiple' ? '2px solid #38b2ac' : '2px solid #e2e8f0',
                background: filter === 'multiple' ? 'rgba(56, 178, 172, 0.08)' : 'white',
                color: filter === 'multiple' ? '#319795' : '#2d3748',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Thông báo chung (nhiều lớp)
            </button>
            <button
              onClick={() => setFilter('single')}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: filter === 'single' ? '2px solid #667eea' : '2px solid #e2e8f0',
                background: filter === 'single' ? 'rgba(102, 126, 234, 0.08)' : 'white',
                color: filter === 'single' ? '#667eea' : '#2d3748',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Thông báo riêng (một lớp)
            </button>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 24px 0' }}>
          <div style={{ position: 'relative', width: 400 }}>
            <span style={{
              position: 'absolute',
              left: 18,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667eea',
              fontSize: 24,
              pointerEvents: 'none'
            }}>🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm thông báo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px 14px 54px',
                borderRadius: 28,
                border: '1.5px solid #e2e8f0',
                fontSize: 18,
                boxShadow: '0 2px 8px rgba(102,126,234,0.06)',
                outline: 'none',
                transition: 'border 0.2s',
              }}
            />
          </div>
        </div>
      </motion.div>

      <motion.div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <motion.div 
              style={{
                textAlign: 'center',
                padding: '60px 40px',
                color: '#718096',
                fontSize: 16,
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 16,
                border: '2px dashed #e2e8f0'
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                style={{ fontSize: 48, marginBottom: 16 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                📭
              </motion.div>
              <motion.div 
                style={{ fontSize: 16, fontWeight: 500 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Bạn chưa tạo thông báo nào.
              </motion.div>
            </motion.div>
          ) : filteredNotifications.map((noti, idx) => (
            <motion.div
              key={noti.id}
              style={{
                background: 'white',
                borderRadius: 16,
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.08)',
                border: '1.5px solid #e2e8f0',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                position: 'relative',
                overflow: 'hidden'
              }}
              variants={notificationVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: noti.type === 'multiple' ? 'linear-gradient(135deg, #38b2ac 0%, #319795 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.13)'
                }}>
                  {noti.type === 'multiple' ? '📢' : '📋'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#2d3748', marginBottom: 2 }}>{noti.title}</div>
                  <div style={{ color: '#718096', fontSize: 14, marginBottom: 4 }}>{noti.content}</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                    <div><span style={{ color: '#4a5568', fontWeight: 600 }}>Lớp:</span> {noti.className || (noti.classNames && noti.classNames.join(', ')) || noti.classId || (noti.classIds && noti.classIds.join(', ')) || 'N/A'}</div>
                    <div><span style={{ color: '#4a5568', fontWeight: 600 }}>Loại:</span> {noti.type === 'multiple' ? 'Nhiều lớp' : 'Một lớp'}</div>
                    <div><span style={{ color: '#4a5568', fontWeight: 600 }}>Ngày tạo:</span> {noti.createdAt && (noti.createdAt.toDate ? new Date(noti.createdAt.toDate()).toLocaleString('vi-VN') : (typeof noti.createdAt === 'string' ? new Date(noti.createdAt).toLocaleString('vi-VN') : new Date(noti.createdAt.seconds * 1000).toLocaleString('vi-VN')))}</div>
                    {noti.scheduledDate && <div><span style={{ color: '#4a5568', fontWeight: 600 }}>Ngày gửi:</span> {typeof noti.scheduledDate === 'string' ? new Date(noti.scheduledDate).toLocaleString('vi-VN') : new Date(noti.scheduledDate.seconds * 1000).toLocaleString('vi-VN')}</div>}
                    {noti.type && <div><span style={{ color: '#4a5568', fontWeight: 600 }}>Trạng thái:</span> <span style={{ color: '#3182ce', fontWeight: 700 }}>{noti.isDeleted ? 'Đã xóa' : 'Đã gửi'}</span></div>}
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => handleEdit(noti)}
                    style={{
                      padding: '6px 18px',
                      borderRadius: 8,
                      border: '1.5px solid #667eea',
                      background: 'white',
                      color: '#667eea',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(noti.id, noti.type)}
                    style={{
                      padding: '6px 18px',
                      borderRadius: 8,
                      border: '1.5px solid #e53e3e',
                      background: 'white',
                      color: '#e53e3e',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Xóa
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {editingNotification && (
        <div className="unified-modal">
          <div className="unified-modal-content">
            <h3 style={{ marginBottom: 16 }}>Sửa thông báo</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 600 }}>Tiêu đề</label>
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 6, border: '1px solid #e2e8f0' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 600 }}>Nội dung</label>
              <textarea
                value={editForm.content}
                onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                style={{ width: '100%', padding: 8, minHeight: 80, marginTop: 4, borderRadius: 6, border: '1px solid #e2e8f0' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  border: '1.5px solid #e2e8f0',
                  background: 'white',
                  color: '#2d3748',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  border: '1.5px solid #667eea',
                  background: '#667eea',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
                disabled={updatingId === editingNotification.id}
              >
                {updatingId === editingNotification.id ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 