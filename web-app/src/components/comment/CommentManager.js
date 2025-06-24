import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';

export default function CommentManager() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const commentsRef = collection(db, "comments");
        const q = query(commentsRef, where("isDeleted", "==", false));
        const querySnapshot = await getDocs(q);
        
        const commentsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          };
        });
        
        setComments(commentsData);
      } catch (error) {
        console.error("Error fetching comments:", error);
        setError("Không thể tải danh sách bình luận");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, []);

  const handleDelete = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhận xét này?')) return;
    setDeletingId(commentId);
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      alert('Lỗi khi xóa nhận xét: ' + err.message);
    }
    setDeletingId(null);
  };

  const filtered = comments.filter(c =>
    c.content?.toLowerCase().includes(search.toLowerCase()) ||
    c.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    c.teacherName?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTimestamp = (timestamp) => {
    if (!timestamp) {
      return 'Vừa xong';
    }
    
    try {
      let date;
      
      // Kiểm tra nếu là Firestore Timestamp (Firebase v9)
      if (timestamp && typeof timestamp === 'object' && timestamp._seconds !== undefined) {
        date = new Date(timestamp._seconds * 1000);
      }
      // Kiểm tra nếu là Firestore Timestamp (Firebase v8)
      else if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
        date = timestamp.toDate();
      }
      // Kiểm tra nếu là string timestamp
      else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      }
      // Kiểm tra nếu là Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Kiểm tra nếu là number (milliseconds)
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      else {
        return 'Vừa xong';
      }
      
      // Kiểm tra nếu date hợp lệ
      if (isNaN(date.getTime())) {
        return 'Vừa xong';
      }
      
      return date.toLocaleString('vi-VN');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Vừa xong';
    }
  };

  if (loading) return <div>Đang tải nhận xét...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h3 style={{ color: '#2d3748', marginBottom: 20 }}>Danh sách nhận xét</h3>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Tìm kiếm theo nội dung, học sinh, giáo viên..."
        className="input-field"
        style={{ marginBottom: 20, width: '100%' }}
      />
      <div className="grid grid-2">
        {filtered.length === 0 ? (
          <div>Không có nhận xét nào phù hợp.</div>
        ) : filtered.map(c => (
          <div key={c.id} className="card" style={{ padding: 20, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 600, color: '#667eea', fontSize: 16 }}>{c.studentName}</div>
            <div style={{ color: '#2d3748', fontSize: 15, margin: '8px 0' }}>{c.content}</div>
            <div style={{ color: '#718096', fontSize: 13 }}>
              Giáo viên: <b>{c.teacherName || c.teacherId}</b> | {formatTimestamp(c.timestamp)}
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              disabled={deletingId === c.id}
              className="btn btn-danger"
              style={{ alignSelf: 'flex-end', marginTop: 8 }}
            >
              {deletingId === c.id ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 