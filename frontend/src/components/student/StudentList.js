import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function StudentList({ classId, onSelectStudent }) {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching data for classId:', classId);
        
        // Fetch classes first
        const classesSnapshot = await getDocs(collection(db, 'classes'));
        const classesData = {};
        classesSnapshot.docs.forEach(doc => {
          classesData[doc.id] = doc.data();
        });
        setClasses(classesData);
        console.log('Classes data:', classesData);

        // Fetch students for the specific class
        const studentsQuery = query(
          collection(db, 'students'),
          where('classId', '==', classId)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentsData);
        console.log('Students data:', studentsData);
        console.log('Number of students found:', studentsData.length);
        
        if (studentsData.length === 0) {
          console.log('No students found for classId:', classId);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Lỗi khi tải dữ liệu: ' + error.message);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (classId) {
      fetchData();
    } else {
      console.log('No classId provided');
      setLoading(false);
    }
  }, [classId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải danh sách học sinh...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Lỗi</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="student-list-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">👥</div>
          <div className="header-text">
            <h1>Danh sách học sinh</h1>
            <p>Lớp: {classes[classId]?.name || 'Không xác định'} • Tổng cộng {students.length} học sinh</p>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <h3>Chưa có học sinh nào</h3>
          <p>Lớp học này chưa có học sinh nào được thêm vào.</p>
          <div className="empty-actions">
            <div className="empty-info">
              <span className="info-icon">💡</span>
              <span>Liên hệ quản trị viên để thêm học sinh vào lớp</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="students-grid">
          {students.map((student) => (
            <div 
              key={student.id} 
              className="student-card"
              onClick={() => onSelectStudent(student)}
            >
              <div className="card-header">
                <div className="student-avatar">
                  {student.avatar || '👤'}
                </div>
                <div className="student-status">
                  <span className="status-dot"></span>
                  <span className="status-text">Đang học</span>
                </div>
              </div>
              <div className="student-info">
                <h3>{student.fullName || student.name || 'Không có tên'}</h3>
                <div className="student-id">
                  <span className="id-icon">🆔</span>
                  <span>Mã học sinh: {student.studentCode || 'N/A'}</span>
                </div>
                <div className="student-meta">
                  <div className="meta-item">
                    <span className="meta-icon">🎂</span>
                    <span className="meta-label">Ngày sinh:</span>
                    <span className="meta-value">{student.dateOfBirth || 'N/A'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">👤</span>
                    <span className="meta-label">Giới tính:</span>
                    <span className="meta-value">{student.gender || 'N/A'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">🎓</span>
                    <span className="meta-label">Niên khóa:</span>
                    <span className="meta-value">{student.academicYear || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <span className="view-comments">Xem nhận xét →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .student-list-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-header {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          border-radius: 20px;
          padding: 40px;
          margin-bottom: 30px;
          color: white;
          box-shadow: 0 10px 30px rgba(72, 187, 120, 0.3);
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
          border-top: 6px solid #48bb78;
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

        .error-container {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          margin: 20px;
        }

        .error-icon {
          font-size: 80px;
          margin-bottom: 24px;
        }

        .error-container h3 {
          color: #e53e3e;
          margin: 0 0 16px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .error-container p {
          color: #718096;
          margin: 0;
          font-size: 18px;
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

        .students-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .student-card {
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

        .student-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #48bb78, #38a169);
        }

        .student-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 35px rgba(0,0,0,0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .student-avatar {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
        }

        .student-status {
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

        .student-info h3 {
          margin: 0 0 12px 0;
          color: #2d3748;
          font-size: 20px;
          font-weight: 700;
        }

        .student-id {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding: 10px 12px;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 10px;
          font-size: 13px;
          color: #4299e1;
          font-weight: 600;
        }

        .id-icon {
          font-size: 14px;
          width: 18px;
          text-align: center;
        }

        .student-meta {
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

        .view-comments {
          color: #48bb78;
          font-weight: 600;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
