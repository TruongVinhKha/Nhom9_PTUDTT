import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function NotificationList({ currentUser, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [multiNotifications, setMultiNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, single, multiple
  const [deletingId, setDeletingId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Lấy role của user từ Firestore
  useEffect(() => {
    const getUserRole = async () => {
      try {
        if (currentUser.role) {
          setUserRole(currentUser.role);
          return;
        }

        // Nếu không có role trong currentUser, lấy từ Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
        } else {
          setUserRole('teacher'); // Default role
        }
      } catch (err) {
        console.error('Error getting user role:', err);
        setUserRole('teacher'); // Default role
      }
    };

    getUserRole();
  }, [currentUser]);

  // Load notifications
  useEffect(() => {
    if (!userRole) return; // Đợi lấy role trước

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError('');

        // Kiểm tra role của user hiện tại
        const isAdmin = userRole === 'admin';
        
        console.log('🔍 Current User Info:', {
          uid: currentUser.uid,
          email: currentUser.email,
          role: userRole,
          isAdmin: isAdmin
        });

        // Fetch single class notifications
        const notificationsRef = collection(db, 'notifications');
        let notificationsQuery;
        
        if (isAdmin) {
          // Admin: Lấy tất cả thông báo
          notificationsQuery = query(
            notificationsRef,
            orderBy('createdAt', 'desc')
          );
        } else {
          // Teacher: Chỉ lấy thông báo của mình
          notificationsQuery = query(
            notificationsRef,
            where('teacherId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
        }
        
        const notificationsSnapshot = await getDocs(notificationsQuery);
        console.log('📊 Single notifications found:', notificationsSnapshot.docs.length);
        
        const notificationsList = notificationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'single'
        }));

        // Fetch multi-class notifications
        const multiNotificationsRef = collection(db, 'notificationsForClass');
        let multiNotificationsQuery;
        
        if (isAdmin) {
          // Admin: Lấy tất cả thông báo nhiều lớp
          multiNotificationsQuery = query(
            multiNotificationsRef,
            orderBy('createdAt', 'desc')
          );
        } else {
          // Teacher: Chỉ lấy thông báo nhiều lớp của mình
          multiNotificationsQuery = query(
            multiNotificationsRef,
            where('teacherId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
        }
        
        const multiNotificationsSnapshot = await getDocs(multiNotificationsQuery);
        console.log('📊 Multi notifications found:', multiNotificationsSnapshot.docs.length);
        
        const multiNotificationsList = multiNotificationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'multiple'
        }));

        setNotifications(notificationsList);
        setMultiNotifications(multiNotificationsList);

      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Lỗi khi tải danh sách thông báo');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser.uid, userRole]); // Thêm dependency cho userRole

  // Handle delete notification
  const handleDelete = async (notificationId, type) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      return;
    }

    try {
      setDeletingId(notificationId);
      
      const collectionName = type === 'multiple' ? 'notificationsForClass' : 'notifications';
      const notificationRef = doc(db, collectionName, notificationId);
      
      // Kiểm tra quyền xóa
      const notificationDoc = await getDoc(notificationRef);
      if (notificationDoc.exists()) {
        const notificationData = notificationDoc.data();
        
        // Admin có thể xóa tất cả, Teacher chỉ xóa thông báo của mình
        if (userRole !== 'admin' && notificationData.teacherId !== currentUser.uid) {
          alert('Bạn không có quyền xóa thông báo này!');
          setDeletingId(null);
          return;
        }
      }
      
      await deleteDoc(notificationRef);

      // Update local state
      if (type === 'multiple') {
        setMultiNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }

    } catch (err) {
      console.error('Error deleting notification:', err);
      alert('Lỗi khi xóa thông báo: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('vi-VN');
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

  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '40vh',
        flexDirection: 'column',
        gap: 20
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(102, 126, 234, 0.2)',
          borderTop: '3px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ color: '#667eea', fontSize: 16, fontWeight: 600 }}>
          Đang tải danh sách thông báo...
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{
      maxWidth: 1000,
      margin: '40px auto',
      padding: '40px 30px',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: 24,
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h4 style={{ 
            color: '#2d3748', 
            margin: '0 0 8px 0',
            fontSize: 24,
            fontWeight: 700
          }}>
            Quản lý thông báo
            {userRole === 'admin' && (
              <span style={{
                marginLeft: 12,
                padding: '4px 8px',
                background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                color: 'white',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600
              }}>
                ADMIN
              </span>
            )}
          </h4>
          <div style={{ 
            color: '#718096',
            fontSize: 16
          }}>
            {filteredNotifications.length} thông báo
            {userRole === 'admin' && (
              <span style={{ marginLeft: 8, color: '#e53e3e', fontWeight: 600 }}>
                (Xem tất cả thông báo trong hệ thống)
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          ← Quay lại
        </button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px',
              background: filter === 'all' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(102, 126, 234, 0.1)',
              color: filter === 'all' ? 'white' : '#667eea',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Tất cả ({notifications.length + multiNotifications.length})
          </button>
          <button
            onClick={() => setFilter('single')}
            style={{
              padding: '8px 16px',
              background: filter === 'single' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(102, 126, 234, 0.1)',
              color: filter === 'single' ? 'white' : '#667eea',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Một lớp ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('multiple')}
            style={{
              padding: '8px 16px',
              background: filter === 'multiple' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(102, 126, 234, 0.1)',
              color: filter === 'multiple' ? 'white' : '#667eea',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Nhiều lớp ({multiNotifications.length})
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
          borderRadius: 12,
          marginBottom: 24,
          border: '1px solid #fc8181',
          color: '#c53030'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredNotifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#718096',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 16,
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
              Chưa có thông báo nào
            </div>
            <div style={{ fontSize: 14 }}>
              Hãy tạo thông báo đầu tiên để gửi đến học sinh
            </div>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div key={notification.id} style={{
              padding: '24px',
              background: 'white',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{
                    margin: '0 0 8px 0',
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#2d3748'
                  }}>
                    {notification.title}
                  </h5>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 14,
                    color: '#718096'
                  }}>
                    <span>📅 {formatDate(notification.createdAt)}</span>
                    <span>👤 {notification.teacherName}</span>
                    {userRole === 'admin' && notification.teacherId && (
                      <span style={{
                        padding: '2px 6px',
                        background: 'rgba(229, 62, 62, 0.1)',
                        color: '#e53e3e',
                        borderRadius: 4,
                        fontSize: 11,
                        fontFamily: 'monospace'
                      }}>
                        ID: {notification.teacherId}
                      </span>
                    )}
                    <span style={{
                      padding: '4px 8px',
                      background: notification.type === 'multiple' 
                        ? 'rgba(102, 126, 234, 0.1)' 
                        : 'rgba(34, 197, 94, 0.1)',
                      color: notification.type === 'multiple' 
                        ? '#667eea' 
                        : '#22c55e',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {notification.type === 'multiple' ? 'Nhiều lớp' : 'Một lớp'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDelete(notification.id, notification.type)}
                  disabled={deletingId === notification.id}
                  style={{
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: deletingId === notification.id ? 'not-allowed' : 'pointer',
                    opacity: deletingId === notification.id ? 0.6 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {deletingId === notification.id ? 'Đang xóa...' : '🗑️ Xóa'}
                </button>
              </div>

              {/* Content */}
              <div style={{
                marginBottom: 16,
                color: '#4a5568',
                lineHeight: 1.6
              }}>
                {notification.content}
              </div>

              {/* Target Classes */}
              <div style={{
                padding: '12px 16px',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: 8,
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#667eea', marginBottom: 4 }}>
                  📍 Lớp học nhận thông báo:
                </div>
                <div style={{ fontSize: 14, color: '#4a5568' }}>
                  {notification.type === 'multiple' 
                    ? notification.classNames?.join(', ') || notification.classIds?.join(', ')
                    : notification.className || notification.classId
                  }
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 