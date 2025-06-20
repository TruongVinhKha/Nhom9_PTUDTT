import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export default function ClassList({ onSelectClass, onBack }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClasses() {
      const querySnapshot = await getDocs(collection(db, 'classes'));
      setClasses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchClasses();
  }, []);

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
        <div style={{ color: '#667eea', fontSize: 18, fontWeight: 600 }}>Đang tải danh sách lớp...</div>
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
          ← Đăng xuất
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
          <span style={{ fontSize: 28, color: 'white' }}>🏫</span>
        </div>
        <h2 style={{
          color: '#2d3748',
          margin: '0 0 8px 0',
          fontSize: 28,
          fontWeight: 700
        }}>Danh sách lớp học</h2>
        <div style={{
          color: '#718096',
          fontSize: 16
        }}>Chọn lớp để xem danh sách học sinh</div>
      </div>

      <div className="grid grid-3" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 20
      }}>
        {classes.map(cls => (
          <button 
            key={cls.id} 
            onClick={() => onSelectClass(cls)}
            className="card"
            style={{
              minHeight: 120,
              padding: '24px',
              background: 'rgba(255,255,255,0.9)',
              border: '2px solid #e2e8f0',
              borderRadius: 16,
              fontSize: 18,
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
              width: 50,
              height: 50,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}>
              <span style={{ fontSize: 20, color: 'white' }}>👥</span>
            </div>
            <span>{cls.name || cls.id}</span>
          </button>
        ))}
      </div>

      {classes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#718096',
          fontSize: 16
        }}>
          Chưa có lớp học nào được tạo.
        </div>
      )}
    </div>
  );
}
