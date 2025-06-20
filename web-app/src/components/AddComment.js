import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, Timestamp, doc } from 'firebase/firestore';

export default function AddComment({ student, onCommentAdded, onBack }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      console.log('Thêm nhận xét cho học sinh:', student.id);
      
      // Tạo comment trong subcollection của student
      const commentData = {
        content: text,
        teacherId: "teacher1", // TODO: Lấy từ user đang đăng nhập
        timestamp: Timestamp.now()
      };

      const studentRef = doc(db, 'students', student.id);
      const docRef = await addDoc(collection(studentRef, 'comments'), commentData);
      console.log('Thêm nhận xét thành công');
      
      // Hiển thị thông báo thành công
      setSuccess('Nhận xét đã được lưu thành công!');
      
      // Reset form
      setText('');
      
      // Gọi callback để cập nhật danh sách nhận xét
      if (onCommentAdded) {
        onCommentAdded({
          id: docRef.id,
          ...commentData
        });
      }
      
      // Ẩn thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Lỗi khi thêm nhận xét:', err);
      setError('Lỗi khi thêm nhận xét: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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
      position: 'relative'
    }}>
      {onBack && (
        <button 
          type="button" 
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
      
      <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: onBack ? '60px' : 0 }}>
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
          <span style={{ fontSize: 28, color: 'white' }}>✏️</span>
        </div>
        <h4 style={{ 
          color: '#2d3748', 
          margin: '0 0 8px 0',
          fontSize: 24,
          fontWeight: 700
        }}>
          Thêm nhận xét
        </h4>
        <div style={{ 
          color: '#718096',
          fontSize: 16
        }}>
          Học sinh: <span style={{ color: '#667eea', fontWeight: 600 }}>{student.fullName || student.name}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Nội dung nhận xét</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            required
            rows={6}
            className="textarea-field"
            placeholder="Nhập nhận xét của bạn về học sinh này..."
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="btn btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '16px',
            fontSize: 16,
            fontWeight: 600,
            marginTop: 8
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 20,
                height: 20,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Đang lưu...
            </>
          ) : (
            'Lưu nhận xét'
          )}
        </button>
      </form>

      {error && (
        <div style={{ 
          color: '#e53e3e', 
          marginTop: 20, 
          textAlign: 'center',
          background: '#fed7d7',
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid #feb2b2',
          fontSize: 14,
          fontWeight: 500
        }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{ 
          color: '#2f855a', 
          marginTop: 20, 
          textAlign: 'center',
          background: '#d3f4e2',
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid #a5f3ba',
          fontSize: 14,
          fontWeight: 500
        }}>
          ✅ {success}
        </div>
      )}
    </div>
  );
}
