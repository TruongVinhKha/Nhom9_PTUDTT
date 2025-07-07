import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where, serverTimestamp, getDoc } from 'firebase/firestore';

export default function CommentManager() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [updatingCommentId, setUpdatingCommentId] = useState(null);
  const studentNameCache = useRef({});
  const teacherNameCache = useRef({});
  const [nameMap, setNameMap] = useState({});

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const commentsRef = collection(db, "comments");
        const q = query(commentsRef);
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

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleDelete = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhận xét này?')) return;
    setDeletingId(commentId);
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      setComments(comments.filter(c => c.id !== commentId));
      setSuccess('Xóa nhận xét thành công!');
      setError('');
    } catch (err) {
      setError('Lỗi khi xóa nhận xét: ' + err.message);
      setSuccess('');
    }
    setDeletingId(null);
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditText(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) {
      alert('Nội dung nhận xét không được để trống');
      return;
    }

    setUpdatingCommentId(editingComment.id);
    try {
      // Cập nhật trong collection comments
      const commentRef = doc(db, 'comments', editingComment.id);
      await updateDoc(commentRef, {
        content: editText.trim(),
        updatedAt: serverTimestamp()
      });
      
      // Cập nhật state local
      setComments(comments.map(comment => 
        comment.id === editingComment.id 
          ? { ...comment, content: editText.trim() }
          : comment
      ));
      
      setEditingComment(null);
      setEditText('');
      setSuccess('Cập nhật nhận xét thành công!');
      setError('');
    } catch (err) {
      console.error('Lỗi khi cập nhật nhận xét:', err);
      setError('Lỗi khi cập nhật nhận xét: ' + err.message);
      setSuccess('');
    } finally {
      setUpdatingCommentId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText('');
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

  // Hàm lấy tên học sinh từ Firestore nếu chưa có
  const getStudentName = async (studentId) => {
    if (studentNameCache.current[studentId]) return studentNameCache.current[studentId];
    try {
      const docRef = doc(db, 'students', studentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const name = docSnap.data().fullName || 'Không rõ học sinh';
        studentNameCache.current[studentId] = name;
        return name;
      }
    } catch {}
    return 'Không rõ học sinh';
  };

  // Hàm lấy tên giáo viên từ Firestore nếu chưa có
  const getTeacherName = async (teacherId) => {
    if (teacherNameCache.current[teacherId]) return teacherNameCache.current[teacherId];
    try {
      const docRef = doc(db, 'teachers', teacherId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const name = docSnap.data().fullName || 'Không rõ giáo viên';
        teacherNameCache.current[teacherId] = name;
        return name;
      }
    } catch {}
    return 'Không rõ giáo viên';
  };

  // Khi comments thay đổi, lấy tên cho các comment thiếu
  useEffect(() => {
    const fetchNames = async () => {
      const newMap = {};
      for (const comment of comments) {
        if (!comment.studentName && comment.studentId) {
          newMap[comment.id + '_student'] = await getStudentName(comment.studentId);
        }
        if (!comment.teacherName && comment.teacherId) {
          newMap[comment.id + '_teacher'] = await getTeacherName(comment.teacherId);
        }
      }
      setNameMap(newMap);
    };
    if (comments.length > 0) fetchNames();
    // eslint-disable-next-line
  }, [comments]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Đang tải danh sách nhận xét...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h4 className="error-title">Có lỗi xảy ra</h4>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <motion.div 
      className="main-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Thông báo thành công/thất bại */}
      <AnimatePresence>
        {success && (
          <motion.div 
            className="success-notification"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <span className="notification-icon">✅</span> {success}
          </motion.div>
        )}
        {error && (
          <motion.div 
            className="error-notification"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <span className="notification-icon">⚠️</span> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        className="page-header"
        variants={itemVariants}
      >
        <div className="header-icon">📝</div>
        <h4 className="header-title">Quản lý nhận xét</h4>
        <div className="header-subtitle">{comments.length} nhận xét trong hệ thống</div>
      </motion.div>

      {/* Search */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 24px 0' }}>
        <div style={{ position: 'relative', width: 400 }}>
          <span style={{
            position: 'absolute',
            left: 18,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#667eea',
            fontSize: 24,
            pointerEvents: 'none'
          }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm nhận xét..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 20px 14px 54px',
              borderRadius: 28,
              border: '1.5px solid #e2e8f0',
              fontSize: 18,
              boxShadow: '0 2px 8px rgba(102,126,234,0.06)',
              outline: 'none',
              transition: 'border 0.2s',
            }}
          />
        </div>
      </div>

      {/* Comments List */}
      <motion.div 
        className="comments-grid"
        variants={itemVariants}
      >
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-text">Chưa có nhận xét nào</div>
          </div>
        ) : filtered.map((comment) => {
          const studentName = comment.studentName || nameMap[comment.id + '_student'] || 'Không rõ học sinh';
          const teacherName = comment.teacherName || nameMap[comment.id + '_teacher'] || 'Không rõ giáo viên';
          return (
            <motion.div 
              key={comment.id} 
              className="comment-card"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {/* Tên học sinh */}
              <div className="student-name">
                {studentName}
              </div>
              {/* Nội dung nhận xét */}
              <div className="comment-content">
                {comment.content}
              </div>
              {/* Thông tin phụ */}
              <div className="comment-info">
                <div><span className="info-label">Giáo viên:</span> {teacherName}</div>
                <div><span className="info-label">Loại:</span> {comment.type === 'positive' ? 'Tích cực' : comment.type === 'negative' ? 'Cần cải thiện' : 'Chung'}</div>
                {/* Thời gian tạo */}
                <div><span className="info-label">Thời gian:</span> {(() => {
                  const v = comment.createdAt;
                  if (!v) return 'N/A';
                  if (typeof v === 'string' || typeof v === 'number') return new Date(v).toLocaleString('vi-VN');
                  if (v.seconds) return new Date(v.seconds * 1000).toLocaleString('vi-VN');
                  if (typeof v.toDate === 'function') return v.toDate().toLocaleString('vi-VN');
                  return 'N/A';
                })()}</div>
              </div>
              {/* Action buttons */}
              <div className="action-buttons">
                <button 
                  onClick={() => handleEditComment(comment)} 
                  className="btn-edit"
                >
                  ✏️ Sửa
                </button>
                <button 
                  onClick={() => handleDelete(comment.id)} 
                  disabled={deletingId === comment.id} 
                  className={`btn-delete ${deletingId === comment.id ? 'btn-loading' : ''}`}
                >
                  {deletingId === comment.id ? 'Đang xóa...' : '🗑️ Xóa'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingComment && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="modal-content"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="modal-header">
                <div className="modal-icon">✏️</div>
                <h4 className="modal-title">Chỉnh sửa nhận xét</h4>
                <div className="modal-subtitle">
                  Cập nhật nội dung nhận xét cho học sinh: <strong>{editingComment.studentName}</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  📝 Nội dung nhận xét *
                </label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  required
                  rows={6}
                  className="form-textarea"
                  placeholder="Nhập nội dung nhận xét mới..."
                />
              </div>

              <div className="modal-actions">
                <button
                  onClick={handleCancelEdit}
                  className="btn-cancel"
                >
                  ❌ Hủy bỏ
                </button>
                <button
                  onClick={handleUpdateComment}
                  disabled={updatingCommentId === editingComment.id}
                  className={`btn-update ${updatingCommentId === editingComment.id ? 'btn-loading' : ''}`}
                >
                  {updatingCommentId === editingComment.id ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Đang cập nhật...
                    </>
                  ) : (
                    '💾 Cập nhật'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

  );
} 