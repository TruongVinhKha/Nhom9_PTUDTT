import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function CommentHistory({ studentId, onBack }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        console.log('Fetching comments for student:', studentId);
        const q = query(collection(db, 'comments'), where('data.studentId', '==', studentId));
        const querySnapshot = await getDocs(q);
        const commentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data().data
        }));
        console.log('Found comments:', commentsList.length);
        setComments(commentsList);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Lỗi khi tải lịch sử nhận xét');
      }
      setLoading(false);
    };

    fetchComments();
  }, [studentId]);

  if (loading) {
    return (
      <div style={{ marginTop: 32, textAlign: 'center', color: '#2d6cdf' }}>
        Đang tải lịch sử nhận xét...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginTop: 32, textAlign: 'center', color: '#dc3545', background: '#fff5f5', padding: '16px', borderRadius: '8px', border: '1px solid #ffd7d7' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ 
      marginTop: 32, 
      background: '#fff', 
      borderRadius: 12, 
      boxShadow: '0 2px 8px #e3eefd', 
      maxWidth: 500, 
      marginLeft: 'auto', 
      marginRight: 'auto', 
      padding: 24, 
      position: 'relative' 
    }}>
      {onBack && (
        <button 
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
      <h4 style={{ color: '#2d6cdf', marginBottom: 16, paddingTop: onBack ? '40px' : 0 }}>
        Lịch sử nhận xét
      </h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {comments.length === 0 ? (
          <li style={{ 
            textAlign: 'center', 
            color: '#888', 
            padding: 20,
            background: '#f7fafd',
            borderRadius: 8,
            border: '1px solid #e3eefd'
          }}>
            Chưa có nhận xét nào
          </li>
        ) : comments.map(c => (
          <li key={c.id} style={{ 
            marginBottom: 18, 
            background: '#f7fafd', 
            borderRadius: 8, 
            padding: 16,
            border: '1px solid #e3eefd',
            transition: 'transform 0.2s ease',
            ':hover': {
              transform: 'translateY(-2px)'
            }
          }}>
            <div style={{ 
              fontSize: 14, 
              color: '#888', 
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ 
                background: '#eaf2fb',
                padding: '4px 8px',
                borderRadius: 4,
                color: '#2d6cdf'
              }}>
                {new Date(c.timestamp?._seconds * 1000).toLocaleString()}
              </span>
            </div>
            <div style={{ 
              fontSize: 16, 
              color: '#1a3e72',
              lineHeight: 1.5
            }}>
              {c.content}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
