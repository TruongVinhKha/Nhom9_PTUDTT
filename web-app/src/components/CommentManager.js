import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';

export default function CommentManager() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchAllComments();
  }, []);

  // Lấy tất cả nhận xét từ collection comments
  const fetchAllComments = async () => {
    setLoading(true);
    setError('');
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(commentsRef, orderBy('timestamp', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const commentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setComments(commentsList);
    } catch (err) {
      setError('Lỗi khi tải nhận xét: ' + err.message);
    }
    setLoading(false);
  };

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
              Giáo viên: <b>{c.teacherName || c.teacherId}</b> | {c.timestamp?._seconds ? new Date(c.timestamp._seconds * 1000).toLocaleString('vi-VN') : 'Vừa xong'}
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