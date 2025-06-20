import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query } from 'firebase/firestore';

export default function StudentList({ classId, onSelectStudent, onBack }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStudents() {
      try {
        console.log('Bắt đầu lấy dữ liệu học sinh với classId:', classId);
        setError(null);
        if (!classId) {
          setStudents([]);
          setLoading(false);
          return;
        }
        // Lấy tất cả học sinh rồi filter ở phía client
        const allStudentsQuery = query(collection(db, 'students'));
        const allStudentsSnapshot = await getDocs(allStudentsQuery);
        const allStudents = allStudentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Lọc theo classId
        const studentList = classId === 'all'
          ? allStudents
          : allStudents.filter(stu => stu.classId === classId);
        setStudents(studentList);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu học sinh:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [classId]);

  if (loading) {
    return (
      <div className="fade-in" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        flexDirection: 'column',
        gap: 20
      }}>
        <div style={{
          width: 50,
          height: 50,
          border: '4px solid rgba(102, 126, 234, 0.2)',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ color: '#667eea', fontSize: 18, fontWeight: 600 }}>Đang tải danh sách học sinh...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in" style={{
        maxWidth: 600,
        margin: '40px auto',
        padding: '40px 30px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          width: 70,
          height: 70,
          background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 25px rgba(229, 62, 62, 0.3)'
        }}>
          <span style={{ fontSize: 28, color: 'white' }}>⚠️</span>
        </div>
        <h3 style={{ color: '#e53e3e', marginBottom: 16 }}>Có lỗi xảy ra</h3>
        <div style={{ color: '#718096' }}>{error}</div>
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
      border: '1px solid rgba(255,255,255,0.2)',
      position: 'relative'
    }}>
      {onBack && (
        <button 
          onClick={onBack} 
          className="btn btn-back"
          style={{
            position: 'absolute',
            left: 24,
            top: 24,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ← Quay lại
        </button>
      )}
      
      <div style={{ textAlign: 'center', marginBottom: 40, paddingTop: onBack ? '60px' : 0 }}>
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
          <span style={{ fontSize: 28, color: 'white' }}>👨‍🎓</span>
        </div>
        <h3 style={{
          color: '#2d3748',
          margin: '0 0 8px 0',
          fontSize: 24,
          fontWeight: 700
        }}>Danh sách học sinh</h3>
        <div style={{
          color: '#718096',
          fontSize: 16
        }}>Lớp {classId} - Chọn học sinh để xem nhận xét</div>
      </div>

      <div className="grid grid-3" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16
      }}>
        {students.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px',
            color: '#718096',
            fontSize: 16,
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 16,
            border: '2px dashed #e2e8f0'
          }}>
            Không có học sinh nào trong lớp này.
          </div>
        ) : students.map(stu => (
          <button 
            key={stu.id} 
            onClick={() => onSelectStudent(stu)}
            className="card"
            style={{
              minHeight: 100,
              padding: '20px',
              background: 'rgba(255,255,255,0.9)',
              border: '2px solid #e2e8f0',
              borderRadius: 16,
              fontSize: 16,
              fontWeight: 600,
              color: '#2d3748',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12
            }}
          >
            <div style={{
              width: 45,
              height: 45,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}>
              <span style={{ fontSize: 18, color: 'white' }}>👤</span>
            </div>
            <span>{stu.fullName || stu.name || stu.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
