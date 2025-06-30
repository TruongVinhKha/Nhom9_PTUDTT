import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
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
  const [userData, setUserData] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

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

  const handleNotificationCreated = (notifications) => {
    // Switch back to notification list after creating notification
    setView('notificationList');
    setSuccess('Tạo thông báo thành công!');
    setError('');
  };

  const renderMainView = () => (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-background"></div>
        <div className="user-info">
          <div className="avatar">
            <span className="avatar-icon">👨‍🏫</span>
            <div className="avatar-status"></div>
          </div>
          <div className="user-details">
            <h1>Bảng điều khiển Giáo viên</h1>
            <p>Chào mừng, {userData?.fullName || currentUser.displayName || currentUser.email}</p>
            <div className="user-badge">
              <span className="badge-icon">🎓</span>
              <span>Giáo viên</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          {error}
        </div>
      )}

      {/* Menu Grid */}
      <div className="menu-grid">
        {/* Manage Students */}
        <div className="menu-card card-primary" onClick={() => setView('classList')}>
          <div className="card-header">
            <div className="card-icon">👥</div>
            <div className="card-badge">Quản lý</div>
          </div>
          <div className="card-content">
            <h3>Quản lý học sinh</h3>
            <p>Xem danh sách lớp học và quản lý nhận xét học sinh</p>
          </div>
          <div className="card-footer">
            <span className="card-action">Xem chi tiết →</span>
          </div>
        </div>

        {/* Create Notifications */}
        <div className="menu-card card-success" onClick={() => setView('notifications')}>
          <div className="card-header">
            <div className="card-icon">📢</div>
            <div className="card-badge">Thông báo</div>
          </div>
          <div className="card-content">
            <h3>Tạo thông báo</h3>
            <p>Gửi thông báo đến một hoặc nhiều lớp học</p>
          </div>
          <div className="card-footer">
            <span className="card-action">Tạo mới →</span>
          </div>
        </div>

        {/* View Notifications */}
        <div className="menu-card card-warning" onClick={() => setView('notificationList')}>
          <div className="card-header">
            <div className="card-icon">📋</div>
            <div className="card-badge">Danh sách</div>
          </div>
          <div className="card-content">
            <h3>Xem thông báo</h3>
            <p>Xem và quản lý các thông báo đã tạo</p>
          </div>
          <div className="card-footer">
            <span className="card-action">Xem tất cả →</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn btn-primary" onClick={() => setShowChangePassword(true)}>
          <span className="btn-icon">🔐</span>
          Đổi mật khẩu
        </button>
        <button className="btn btn-danger" onClick={onBack}>
          <span className="btn-icon">🚪</span>
          Đăng xuất
        </button>
      </div>

      <style>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .dashboard-header {
          background: white;
          border-radius: 20px;
          padding: 40px;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }

        .header-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #667eea, #764ba2, #48bb78, #ed8936);
          background-size: 400% 100%;
          animation: gradientShift 8s ease infinite;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .avatar {
          position: relative;
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .avatar-icon {
          font-size: 48px;
          color: white;
        }

        .avatar-status {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          background: #48bb78;
          border: 3px solid white;
          border-radius: 50%;
        }

        .user-details h1 {
          margin: 0 0 8px 0;
          color: #2d3748;
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .user-details p {
          margin: 0 0 12px 0;
          color: #718096;
          font-size: 18px;
        }

        .user-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .badge-icon {
          font-size: 16px;
        }

        .alert {
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .alert-success {
          background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
          color: #22543d;
          border-left: 4px solid #48bb78;
        }

        .alert-error {
          background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
          color: #742a2a;
          border-left: 4px solid #f56565;
        }

        .alert-icon {
          font-size: 18px;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .menu-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          position: relative;
          overflow: hidden;
        }

        .menu-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .menu-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .card-primary::before {
          background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .card-success::before {
          background: linear-gradient(90deg, #48bb78, #38a169);
        }

        .card-warning::before {
          background: linear-gradient(90deg, #ed8936, #dd6b20);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-icon {
          font-size: 48px;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .card-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .card-content h3 {
          margin: 0 0 12px 0;
          color: #2d3748;
          font-size: 24px;
          font-weight: 700;
        }

        .card-content p {
          margin: 0 0 20px 0;
          color: #718096;
          line-height: 1.6;
          font-size: 16px;
        }

        .card-footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
        }

        .card-action {
          color: #667eea;
          font-weight: 600;
          font-size: 14px;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 20px;
        }

        .btn {
          padding: 16px 32px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .btn-primary {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(66, 153, 225, 0.3);
        }

        .btn-danger {
          background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
          color: white;
        }

        .btn-danger:hover {
          background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(245, 101, 101, 0.3);
        }

        .btn-icon {
          font-size: 18px;
        }
      `}</style>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'notifications':
        return (
          <div className="content-container">
            <div className="content-header">
              <button className="btn btn-secondary" onClick={() => setView('main')}>
                <span className="btn-icon">←</span>
                Quay lại
              </button>
              <h2>📢 Tạo thông báo</h2>
            </div>
            <NotificationManager 
              currentUser={currentUser}
              userData={userData}
              onNotificationCreated={handleNotificationCreated}
              setSuccess={setSuccess}
              setError={setError}
            />
          </div>
        );
      
      case 'notificationList':
        return (
          <div className="content-container">
            <div className="content-header">
              <button className="btn btn-secondary" onClick={() => setView('main')}>
                <span className="btn-icon">←</span>
                Quay lại
              </button>
              <h2>📋 Danh sách thông báo</h2>
            </div>
            <NotificationList 
              currentUser={currentUser}
              userData={userData}
              setSuccess={setSuccess}
              setError={setError}
            />
          </div>
        );
      
      case 'classList':
        return (
          <div className="content-container">
            <div className="content-header">
              <button className="btn btn-secondary" onClick={() => setView('main')}>
                <span className="btn-icon">←</span>
                Quay lại
              </button>
            </div>
            <ClassList 
              onSelectClass={(cls) => {
                console.log('Class selected:', cls);
                setSelectedClass(cls);
                setView('studentList');
              }} 
              userData={userData}
              setSuccess={setSuccess}
              setError={setError}
            />
          </div>
        );
      
      case 'studentList':
        console.log('Rendering StudentList with selectedClass:', selectedClass);
        console.log('selectedClass.id:', selectedClass?.id);
        return (
          <div className="content-container">
            <div className="content-header">
              <button className="btn btn-secondary" onClick={() => setView('classList')}>
                <span className="btn-icon">←</span>
                Quay lại
              </button>
            </div>
            <StudentList 
              classId={selectedClass?.id} 
              onSelectStudent={(student) => {
                setSelectedStudent(student);
                setView('commentHistory');
              }} 
              setSuccess={setSuccess}
              setError={setError}
            />
          </div>
        );
      
      case 'commentHistory':
        return (
          <div className="content-container">
            <div className="content-header">
              <button className="btn btn-secondary" onClick={() => setView('studentList')}>
                <span className="btn-icon">←</span>
                Quay lại
              </button>
              <h2>📝 Lịch sử nhận xét - {selectedStudent?.fullName}</h2>
            </div>
            <CommentHistory 
              studentId={selectedStudent?.id}
              renderAddComment={(addNewComment) => (
                <AddComment
                  student={selectedStudent}
                  onCommentAdded={addNewComment}
                  currentUser={currentUser}
                  userData={userData}
                />
              )}
              setSuccess={setSuccess}
              setError={setError}
            />
          </div>
        );
      
      default:
        return renderMainView();
    }
  };

  return (
    <div className="teacher-dashboard">
      {renderContent()}
      
      {showChangePassword && (
        <Modal onClose={() => setShowChangePassword(false)}>
          <ChangePassword 
            currentUser={currentUser}
            onClose={() => setShowChangePassword(false)}
            setSuccess={setSuccess}
            setError={setError}
          />
        </Modal>
      )}

      <style>{`
        .teacher-dashboard {
          min-height: 100vh;
          background: #f7fafc;
        }

        .content-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .content-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .content-header h2 {
          margin: 0;
          color: #2d3748;
          font-size: 28px;
          font-weight: 700;
        }

        .btn-secondary {
          background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
          color: white;
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-secondary:hover {
          background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
} 