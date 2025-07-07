import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export default function ClassList({ onSelectClass, userData }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra quyền truy cập
    if (!userData || (userData.role !== 'admin' && userData.role !== 'teacher')) {
      setLoading(false);
      return;
    }

    async function fetchClasses() {
      try {
        // Fetch classes
        const querySnapshot = await getDocs(collection(db, 'classes'));
        const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fetch students to calculate actual student count and get academic year
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Calculate student count and get academic year for each class
        const classesWithStats = classesData.map(cls => {
          const classStudents = studentsData.filter(student => student.classId === cls.id);
          const studentCount = classStudents.length;
          
          // Get academic year from students (use the most common one)
          const academicYears = classStudents.map(student => student.academicYear).filter(Boolean);
          const yearCount = new Map();
          academicYears.forEach(year => {
            yearCount.set(year, (yearCount.get(year) || 0) + 1);
          });
          const mostCommonYear = academicYears.length > 0 
            ? Array.from(yearCount.entries()).sort((a, b) => b[1] - a[1])[0][0]
            : null;
          
          return {
            ...cls,
            studentCount,
            academicYear: mostCommonYear || cls.academicYear || 'N/A'
          };
        });
        
        setClasses(classesWithStats);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    }
    fetchClasses();
  }, [userData]);

  // Kiểm tra quyền truy cập
  if (!userData || (userData.role !== 'admin' && userData.role !== 'teacher')) {
    return (
      <div className="access-denied">
        <div className="denied-icon">🚫</div>
        <h2>Không có quyền truy cập</h2>
        <p>Bạn không có quyền xem danh sách lớp học.</p>
        <button className="btn btn-danger" onClick={() => auth.signOut()}>
          🚪 Đăng xuất
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải danh sách lớp học...</p>
      </div>
    );
  }

  return (
    <div className="class-list-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">🏫</div>
          <div className="header-text">
            <h1>Danh sách lớp học</h1>
            <p>Tổng cộng {classes.length} lớp học</p>
          </div>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>Chưa có lớp học nào</h3>
          <p>Hiện tại chưa có lớp học nào được tạo.</p>
          <div className="empty-actions">
            <div className="empty-info">
              <span className="info-icon">💡</span>
              <span>Liên hệ quản trị viên để tạo lớp học mới</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="classes-grid">
          {classes.map((cls) => (
            <div 
              key={cls.id} 
              className="class-card"
              onClick={() => onSelectClass(cls)}
            >
              <div className="card-header">
                <div className="class-icon">🎓</div>
                <div className="class-status">
                  <span className="status-dot"></span>
                  <span className="status-text">Hoạt động</span>
                </div>
              </div>
              <div className="class-info">
                <h3>{cls.name}</h3>
                <p className="class-description">
                  {cls.description || 'Không có mô tả'}
                </p>
                <div className="class-meta">
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <span className="meta-label">Năm học:</span>
                    <span className="meta-value">{cls.academicYear}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">👥</span>
                    <span className="meta-label">Sĩ số:</span>
                    <span className="meta-value">{cls.studentCount} học sinh</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <span className="view-students">Xem học sinh →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .class-list-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 40px;
          margin-bottom: 30px;
          color: white;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .header-icon {
          font-size: 64px;
          width: 100px;
          height: 100px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .header-text h1 {
          margin: 0 0 8px 0;
          font-size: 36px;
          font-weight: 800;
        }

        .header-text p {
          margin: 0;
          font-size: 18px;
          opacity: 0.9;
        }

        .access-denied {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          margin: 20px;
        }

        .denied-icon {
          font-size: 80px;
          margin-bottom: 24px;
        }

        .access-denied h2 {
          color: #e53e3e;
          margin: 0 0 16px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .access-denied p {
          color: #718096;
          margin: 0 0 24px 0;
          font-size: 18px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          margin: 20px;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 6px solid #e2e8f0;
          border-top: 6px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 24px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-container p {
          color: #718096;
          margin: 0;
          font-size: 18px;
          font-weight: 500;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .empty-icon {
          font-size: 80px;
          margin-bottom: 24px;
        }

        .empty-state h3 {
          color: #2d3748;
          margin: 0 0 16px 0;
          font-size: 24px;
          font-weight: 700;
        }

        .empty-state p {
          color: #718096;
          margin: 0 0 24px 0;
          font-size: 18px;
        }

        .empty-actions {
          display: flex;
          justify-content: center;
        }

        .empty-info {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          padding: 16px 24px;
          border-radius: 12px;
          color: #4a5568;
          font-size: 16px;
        }

        .info-icon {
          font-size: 20px;
        }

        .classes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .class-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }

        .class-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .class-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 35px rgba(0,0,0,0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .class-icon {
          font-size: 36px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .class-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          background: #48bb78;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-text {
          color: #48bb78;
          font-size: 12px;
          font-weight: 600;
        }

        .class-info h3 {
          margin: 0 0 10px 0;
          color: #2d3748;
          font-size: 20px;
          font-weight: 700;
        }

        .class-description {
          color: #718096;
          margin: 0 0 16px 0;
          line-height: 1.5;
          font-size: 14px;
        }

        .class-meta {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 10px;
        }

        .meta-icon {
          font-size: 14px;
          width: 20px;
          text-align: center;
        }

        .meta-label {
          color: #4a5568;
          font-size: 13px;
          font-weight: 600;
          min-width: 70px;
        }

        .meta-value {
          color: #2d3748;
          font-size: 13px;
          font-weight: 500;
        }

        .card-footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          text-align: center;
        }

        .view-students {
          color: #667eea;
          font-weight: 600;
          font-size: 14px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-danger {
          background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
          color: white;
        }

        .btn-danger:hover {
          background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
