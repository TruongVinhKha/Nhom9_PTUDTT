import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query,  
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function NotificationManager({ currentUser, onNotificationCreated }) {
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

  // Load classes
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

      const targetClasses = notificationType === 'single' 
        ? [selectedSingleClass] 
        : selectedClasses;

      // Create notifications for each selected class
      const notifications = [];
      
      for (const classId of targetClasses) {
        const notificationData = {
          title: title.trim(),
          content: content.trim(),
          teacherId: currentUser.uid,
          teacherName: currentUser.displayName || currentUser.email,
          classId: classId,
          className: classes.find(c => c.id === classId)?.name || classId,
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

        // Add to notifications collection
        const docRef = await addDoc(collection(db, 'notifications'), notificationData);
        notifications.push({ id: docRef.id, ...notificationData });
      }

      // If multiple classes, also create a notification in notificationsForClass
      if (notificationType === 'multiple' && selectedClasses.length > 1) {
        const multiNotificationData = {
          title: title.trim(),
          content: content.trim(),
          teacherId: currentUser.uid,
          teacherName: currentUser.displayName || currentUser.email,
          classIds: selectedClasses,
          classNames: selectedClasses.map(classId => 
            classes.find(c => c.id === classId)?.name || classId
          ),
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
      }

      // Reset form
      setTitle('');
      setContent('');
      setSelectedClasses([]);
      setSelectedSingleClass('');
      setNotificationType('single');

      setSuccess(`Đã tạo ${notifications.length} thông báo thành công!`);
      
      // Callback to parent component
      if (onNotificationCreated) {
        onNotificationCreated(notifications);
      }

    } catch (err) {
      console.error('Error creating notification:', err);
      setError('Lỗi khi tạo thông báo: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

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
          Đang tải danh sách lớp học...
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{
      maxWidth: 800,
      margin: '40px auto',
      padding: '40px 30px',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: 24,
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 70,
          height: 70,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
        }}>
          <span style={{ fontSize: 28, color: 'white' }}>📢</span>
        </div>
        <h4 style={{ 
          color: '#2d3748', 
          margin: '0 0 8px 0',
          fontSize: 24,
          fontWeight: 700
        }}>
          Tạo thông báo mới
        </h4>
        <div style={{ 
          color: '#718096',
          fontSize: 16
        }}>
          Gửi thông báo đến một hoặc nhiều lớp học
        </div>
      </div>

      {/* Error/Success Messages */}
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

      {success && (
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%)',
          borderRadius: 12,
          marginBottom: 24,
          border: '1px solid #68d391',
          color: '#22543d'
        }}>
          ✅ {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Notification Type Selection */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            color: '#2d3748'
          }}>
            Loại thông báo:
          </label>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}>
              <input
                type="radio"
                name="notificationType"
                value="single"
                checked={notificationType === 'single'}
                onChange={(e) => setNotificationType(e.target.value)}
                style={{ transform: 'scale(1.2)' }}
              />
              <span>Một lớp học</span>
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}>
              <input
                type="radio"
                name="notificationType"
                value="multiple"
                checked={notificationType === 'multiple'}
                onChange={(e) => setNotificationType(e.target.value)}
                style={{ transform: 'scale(1.2)' }}
              />
              <span>Nhiều lớp học</span>
            </label>
          </div>
        </div>

        {/* Class Selection */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            color: '#2d3748'
          }}>
            {notificationType === 'single' ? 'Chọn lớp học:' : 'Chọn các lớp học:'}
          </label>
          
          {notificationType === 'single' ? (
            <select
              value={selectedSingleClass}
              onChange={(e) => setSelectedSingleClass(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: 16,
                background: 'white',
                transition: 'all 0.3s ease'
              }}
            >
              <option value="">-- Chọn lớp học --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
              maxHeight: 200,
              overflowY: 'auto',
              padding: 16,
              border: '2px solid #e2e8f0',
              borderRadius: 12,
              background: 'white'
            }}>
              {classes.map(cls => (
                <label key={cls.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: selectedClasses.includes(cls.id) 
                    ? 'rgba(102, 126, 234, 0.1)' 
                    : 'transparent'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(cls.id)}
                    onChange={() => handleClassToggle(cls.id)}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  <span>{cls.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            color: '#2d3748'
          }}>
            Tiêu đề thông báo: *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề thông báo..."
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              fontSize: 16,
              transition: 'all 0.3s ease'
            }}
            required
          />
        </div>

        {/* Content */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            color: '#2d3748'
          }}>
            Nội dung thông báo: *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung chi tiết..."
            rows={6}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              fontSize: 16,
              resize: 'vertical',
              transition: 'all 0.3s ease',
              fontFamily: 'inherit'
            }}
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '16px 32px',
            background: submitting 
              ? 'linear-gradient(135deg, #a0aec0 0%, #718096 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
          }}
        >
          {submitting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 16,
                height: 16,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Đang tạo thông báo...
            </span>
          ) : (
            'Tạo thông báo'
          )}
        </button>
      </form>

      {/* Summary */}
      {notificationType === 'multiple' && selectedClasses.length > 0 && (
        <div style={{
          marginTop: 24,
          padding: '16px',
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: 12,
          border: '1px solid rgba(102, 126, 234, 0.2)'
        }}>
          <div style={{ fontWeight: 600, color: '#667eea', marginBottom: 8 }}>
            📋 Tóm tắt:
          </div>
          <div style={{ color: '#4a5568' }}>
            Thông báo sẽ được gửi đến {selectedClasses.length} lớp học: 
            <span style={{ fontWeight: 500 }}>
              {selectedClasses.map(classId => 
                classes.find(c => c.id === classId)?.name || classId
              ).join(', ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 