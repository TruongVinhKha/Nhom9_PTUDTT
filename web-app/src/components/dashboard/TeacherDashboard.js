import React, { useState } from 'react';
import NotificationManager from '../notification/NotificationManager';
import NotificationList from '../notification/NotificationList';
import ClassList from '../class/ClassList';
import StudentList from '../student/StudentList';
import AddComment from '../comment/AddComment';
import CommentHistory from '../comment/CommentHistory';
import ChangePassword from '../auth/ChangePassword';
import Modal from '../common/Modal';

export default function TeacherDashboard({ currentUser, onBack }) {
  const [view, setView] = useState('main'); // main, notifications, notificationList, classList, studentList, commentHistory
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleNotificationCreated = (notifications) => {
    // Switch back to notification list after creating notification
    setView('notificationList');
  };

  const renderMainView = () => (
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
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 80,
          height: 80,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
        }}>
          <span style={{ fontSize: 32, color: 'white' }}>👨‍🏫</span>
        </div>
        <h2 style={{ 
          color: '#2d3748', 
          margin: '0 0 8px 0',
          fontSize: 28,
          fontWeight: 700
        }}>
          Bảng điều khiển Giáo viên
        </h2>
        <div style={{ 
          color: '#718096',
          fontSize: 16
        }}>
          Chào mừng, {currentUser.displayName || currentUser.email}
        </div>
      </div>

      {/* Menu Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {/* Manage Students */}
        <div style={{
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 16,
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
        }} onClick={() => setView('classList')}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>👥</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 600 }}>
            Quản lý học sinh
          </h3>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>
            Xem danh sách lớp học và quản lý nhận xét học sinh
          </p>
        </div>

        {/* Create Notifications */}
        <div style={{
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
          borderRadius: 16,
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 8px 25px rgba(72, 187, 120, 0.3)'
        }} onClick={() => setView('notifications')}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📢</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 600 }}>
            Tạo thông báo
          </h3>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>
            Gửi thông báo đến một hoặc nhiều lớp học
          </p>
        </div>

        {/* View Notifications */}
        <div style={{
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
          borderRadius: 16,
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 8px 25px rgba(237, 137, 54, 0.3)'
        }} onClick={() => setView('notificationList')}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📋</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 600 }}>
            Xem thông báo
          </h3>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>
            Xem và quản lý các thông báo đã tạo
          </p>
        </div>
      </div>

      {/* Logout Button */}
      <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 16 }}>
        <button
          onClick={() => setShowChangePassword(true)}
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #2d6cdf 0%, #1a5bbf 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(45, 108, 223, 0.2)'
          }}
        >
          Đổi mật khẩu
        </button>
        <button
          onClick={onBack}
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(229, 62, 62, 0.3)'
          }}
        >
         Đăng xuất
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'notifications':
        return (
          <NotificationManager 
            currentUser={currentUser} 
            onNotificationCreated={handleNotificationCreated}
          />
        );
      
      case 'notificationList':
        return (
          <NotificationList 
            currentUser={currentUser} 
            onBack={() => setView('main')}
          />
        );
      
      case 'classList':
        return (
          <ClassList 
            onSelectClass={(cls) => {
              setSelectedClass(cls);
              setView('studentList');
            }} 
            onBack={() => setView('main')} 
          />
        );
      
      case 'studentList':
        return (
          <StudentList 
            classId={selectedClass.id} 
            onSelectStudent={(student) => {
              setSelectedStudent(student);
              setView('commentHistory');
            }} 
            onBack={() => setView('classList')} 
          />
        );
      
      case 'commentHistory':
        return (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <CommentHistory 
              studentId={selectedStudent.id} 
              onBack={() => setView('studentList')}
              renderAddComment={(addNewComment) => (
                <AddComment 
                  student={selectedStudent} 
                  onCommentAdded={addNewComment} 
                  onBack={() => setView('studentList')} 
                />
              )}
            />
          </div>
        );
      
      default:
        return renderMainView();
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#f7fafd', overflowX: 'hidden' }}>
      {view !== 'main' && (
        <div style={{ 
          padding: '16px 24px', 
          background: 'white', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={() => {
              if (view === 'studentList') setView('classList');
              else if (view === 'commentHistory') setView('studentList');
              else setView('main');
            }}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ← Quay lại
          </button>
          
          <button
            onClick={() => setView('main')}
            style={{
              padding: '8px 16px',
              background: 'rgba(102, 126, 234, 0.1)',
              color: '#667eea',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🏠 Trang chủ
          </button>
        </div>
      )}
      
      {renderContent()}
      {showChangePassword && (
        <Modal open={showChangePassword} onClose={() => setShowChangePassword(false)}>
          <ChangePassword onClose={() => setShowChangePassword(false)} />
        </Modal>
      )}
    </div>
  );
} 