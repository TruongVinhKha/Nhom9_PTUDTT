import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function AddComment({ student, onCommentAdded, onBack }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      console.log('Thêm nhận xét cho học sinh:', student.id);
      
      // Tạo document với cấu trúc phù hợp
      const commentData = {
        data: {
          content: text,
          studentId: student.id,
          teacherId: "teacher1", // TODO: Lấy từ user đang đăng nhập
          timestamp: Timestamp.now()
        }
      };

      await addDoc(collection(db, 'comments'), commentData);
      console.log('Thêm nhận xét thành công');
      
      setText('');
      onCommentAdded && onCommentAdded();
    } catch (err) {
      console.error('Lỗi khi thêm nhận xét:', err);
      setError('Lỗi khi thêm nhận xét: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      marginTop: 24, 
      background: '#fff', 
      borderRadius: 12, 
      padding: 24, 
      boxShadow: '0 2px 8px #e3eefd', 
      maxWidth: 500, 
      marginLeft: 'auto', 
      marginRight: 'auto', 
      position: 'relative' 
    }}>
      {onBack && (
        <button 
          type="button" 
          onClick={onBack} 
          style={{
            position: 'absolute',
            left: 16,
            top: 16,
            background: '#eaf2fb',
            border: 'none',
            borderRadius: 8,
            padding: '6px 14px',
            color: '#2d6cdf',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 4px #e3eefd',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          ← Quay lại
        </button>
      )}
      <h4 style={{ 
        color: '#2d6cdf', 
        marginBottom: 16,
        paddingTop: onBack ? '40px' : 0
      }}>
        Nhập nhận xét cho <span style={{ color: '#1a3e72' }}>{student.name}</span>
      </h4>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        required
        rows={4}
        style={{ 
          width: '100%', 
          borderRadius: 8, 
          border: '1px solid #bcd0ee', 
          padding: 12, 
          fontSize: 16, 
          marginBottom: 12,
          resize: 'vertical',
          minHeight: '100px',
          transition: 'border-color 0.2s ease',
          ':focus': {
            outline: 'none',
            borderColor: '#2d6cdf',
            boxShadow: '0 0 0 2px rgba(45, 108, 223, 0.1)'
          }
        }}
        placeholder="Nhập nhận xét của bạn..."
      />
      <button 
        type="submit" 
        disabled={loading} 
        style={{ 
          width: '100%', 
          background: loading ? '#bcd0ee' : '#2d6cdf', 
          color: '#fff', 
          fontWeight: 600, 
          border: 'none', 
          borderRadius: 8, 
          padding: 12, 
          fontSize: 17, 
          cursor: loading ? 'not-allowed' : 'pointer', 
          boxShadow: '0 2px 8px #e3eefd',
          transition: 'all 0.2s ease',
          ':hover': {
            background: loading ? '#bcd0ee' : '#1a5bbf',
            transform: 'translateY(-1px)'
          }
        }}
      >
        {loading ? 'Đang lưu...' : 'Lưu nhận xét'}
      </button>
      {error && (
        <div style={{ 
          color: '#dc3545', 
          marginTop: 12, 
          textAlign: 'center',
          background: '#fff5f5',
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #ffd7d7'
        }}>
          {error}
        </div>
      )}
    </form>
  );
}
