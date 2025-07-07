import React, { useState } from 'react';
import UserManager from '../user/UserManager';
import ClassManager from '../class/ClassManager';
import StudentManager from '../student/StudentManager';
import CommentManager from '../comment/CommentManager';
import NotificationManager from '../notification/NotificationManager';
import NotificationList from '../notification/NotificationList';
import ChangePassword from '../auth/ChangePassword';
import Modal from '../common/Modal';

const TABS = [
  { key: 'students', label: 'Quản lý học sinh' },
  { key: 'classes', label: 'Quản lý lớp học' },
  { key: 'comments', label: 'Quản lý nhận xét' },
  { key: 'notifications', label: 'Quản lý thông báo' },
  { key: 'users', label: 'Quản lý tài khoản' },
];

export default function AdminDashboard({ onBack, currentUser, userData }) {
  const [tab, setTab] = useState('students');
  const [notificationView, setNotificationView] = useState('list'); // 'list' or 'create'
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleNotificationCreated = (notifications) => {
    // Switch back to list view after creating notification
    setNotificationView('list');
  };

  const renderNotificationContent = () => {
    if (notificationView === 'create') {
      return (
        <NotificationManager 
          currentUser={currentUser}
          userData={userData}
          onNotificationCreated={handleNotificationCreated}
        />
      );
    } else {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ color: '#2d3748', margin: 0 }}>Danh sách thông báo</h3>
            <button
              onClick={() => setNotificationView('create')}
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
              ➕ Tạo thông báo mới
            </button>
          </div>
          <NotificationList 
            currentUser={currentUser}
            userData={userData}
          />
        </div>
      );
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#f7fafd', overflowX: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px 0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#667eea', fontWeight: 800, fontSize: 28, margin: 0 }}>Bảng điều khiển Quản trị</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setShowChangePassword(true)} style={{ background: '#2d6cdf', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>Đổi mật khẩu</button>
            <button onClick={onBack} style={{ background: '#e53e3e', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>Đăng xuất</button>
          </div>
        </div>
        {showChangePassword && (
          <Modal open={showChangePassword} onClose={() => setShowChangePassword(false)}>
            <ChangePassword onClose={() => setShowChangePassword(false)} />
          </Modal>
        )}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                if (t.key === 'notifications') {
                  setNotificationView('list');
                }
              }}
              style={{
                background: tab === t.key ? '#667eea' : 'white',
                color: tab === t.key ? 'white' : '#667eea',
                border: '1.5px solid #667eea',
                borderRadius: 8,
                padding: '10px 18px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: tab === t.key ? '0 2px 8px rgba(102,126,234,0.12)' : 'none',
                transition: 'all 0.2s',
                minWidth: 160,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ minHeight: 400, background: 'white', borderRadius: 18, boxShadow: '0 4px 24px rgba(102,126,234,0.08)', padding: 32, marginBottom: 32 }}>
          {tab === 'students' && <StudentManager />}
          {tab === 'classes' && <ClassManager />}
          {tab === 'comments' && <CommentManager />}
          {tab === 'notifications' && renderNotificationContent()}
          {tab === 'users' && <UserManager />}
        </div>
      </div>
    </div>
  );
} 