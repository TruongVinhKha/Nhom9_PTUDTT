import React, { useEffect, useState, useRef } from 'react';
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
      <div className="fade-in" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '40vh',
        flexDirection: 'column',
        gap: 20
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(102, 126, 234, 0.2)',
          borderTop: '3px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ color: '#667eea', fontSize: 16, fontWeight: 600 }}>Đang tải danh sách nhận xét...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in" style={{
        maxWidth: 600,
        margin: '40px auto',
        padding: '30px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 20,
        boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          width: 60,
          height: 60,
          background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 6px 20px rgba(229, 62, 62, 0.3)'
        }}>
          <span style={{ fontSize: 24, color: 'white' }}>⚠️</span>
        </div>
        <h4 style={{ color: '#e53e3e', marginBottom: 12 }}>Có lỗi xảy ra</h4>
        <div style={{ color: '#718096' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{
      maxWidth: 1200,
      margin: '40px auto',
      padding: '40px 30px',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: 24,
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      {/* Thông báo thành công/thất bại */}
      {success && (
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #c6f6d5 0%, #38a169 100%)',
          borderRadius: 14,
          marginBottom: 24,
          border: '1.5px solid #38a169',
          color: '#22543d',
          fontWeight: 700,
          fontSize: 17,
          boxShadow: '0 4px 18px rgba(56, 161, 105, 0.13)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span style={{ fontSize: 22 }}>✅</span> {success}
        </div>
      )}
      {error && (
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #fed7d7 0%, #e53e3e 100%)',
          borderRadius: 14,
          marginBottom: 24,
          border: '1.5px solid #e53e3e',
          color: '#c53030',
          fontWeight: 700,
          fontSize: 17,
          boxShadow: '0 4px 18px rgba(229, 62, 62, 0.13)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span style={{ fontSize: 22 }}>⚠️</span> {error}
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
          <span style={{ fontSize: 28, color: 'white' }}>📝</span>
        </div>
        <h4 style={{ 
          color: '#2d3748', 
          margin: '0 0 8px 0',
          fontSize: 24,
          fontWeight: 700
        }}>
          Quản lý nhận xét
        </h4>
        <div style={{ 
          color: '#718096',
          fontSize: 16
        }}>
          {comments.length} nhận xét trong hệ thống
        </div>
      </div>

      {/* Search */}
      <div style={{
        background: 'rgba(255,255,255,0.8)',
        padding: '24px',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        marginBottom: 32
      }}>
        <h5 style={{ 
          color: '#2d3748', 
          margin: '0 0 16px 0',
          fontSize: 18,
          fontWeight: 600
        }}>
          🔍 Tìm kiếm nhận xét
        </h5>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo nội dung, học sinh, giáo viên..."
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: 12,
            fontSize: 16,
            transition: 'all 0.3s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      {/* Comments List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 20,
        marginBottom: 40
      }}>
        {comments.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 40px',
            color: '#718096',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 16,
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Chưa có nhận xét nào</div>
          </div>
        ) : comments.map((comment) => {
          const studentName = comment.studentName || nameMap[comment.id + '_student'] || 'Không rõ học sinh';
          const teacherName = comment.teacherName || nameMap[comment.id + '_teacher'] || 'Không rõ giáo viên';
          return (
            <div key={comment.id} style={{
              background: 'white',
              borderRadius: 16,
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.08)',
              border: '1.5px solid #e2e8f0',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 180,
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Tên học sinh */}
              <div style={{
                fontWeight: 700,
                fontSize: 18,
                color: '#2d3748',
                marginBottom: 6
              }}>
                {studentName}
              </div>
              {/* Nội dung nhận xét */}
              <div style={{ color: '#4a5568', fontSize: 15, marginBottom: 8 }}>
                {comment.content}
              </div>
              {/* Thông tin phụ */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, marginTop: 'auto' }}>
                <div><span style={{ color: '#4a5568', fontWeight: 600 }}>Giáo viên:</span> {teacherName}</div>
                <div><span style={{ color: '#4a5568', fontWeight: 600 }}>Loại:</span> {comment.type === 'positive' ? 'Tích cực' : comment.type === 'negative' ? 'Cần cải thiện' : 'Chung'}</div>
                {/* Thời gian tạo */}
                <div><span style={{ color: '#4a5568', fontWeight: 600 }}>Thời gian:</span> {(() => {
                  const v = comment.createdAt;
                  if (!v) return 'N/A';
                  if (typeof v === 'string' || typeof v === 'number') return new Date(v).toLocaleString('vi-VN');
                  if (v.seconds) return new Date(v.seconds * 1000).toLocaleString('vi-VN');
                  if (typeof v.toDate === 'function') return v.toDate().toLocaleString('vi-VN');
                  return 'N/A';
                })()}</div>
              </div>
              {/* Action buttons giữ nguyên */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => handleEditComment(comment)} 
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #38b2ac 0%, #319795 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    flex: 1
                  }}
                >
                  ✏️ Sửa
                </button>
                <button 
                  onClick={() => handleDelete(comment.id)} 
                  disabled={deletingId === comment.id} 
                  style={{
                    padding: '8px 16px',
                    background: deletingId === comment.id 
                      ? 'rgba(203, 213, 224, 0.8)' 
                      : 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: deletingId === comment.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    flex: 1
                  }}
                >
                  {deletingId === comment.id ? 'Đang xóa...' : '🗑️ Xóa'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingComment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          paddingTop: '40px'
        }}>
          <div className="fade-in" style={{
            background: 'white',
            borderRadius: 20,
            padding: '30px',
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 60,
                height: 60,
                background: 'linear-gradient(135deg, #38b2ac 0%, #319795 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 25px rgba(56, 178, 172, 0.3)'
              }}>
                <span style={{ fontSize: 24, color: 'white' }}>✏️</span>
              </div>
              <h4 style={{
                color: '#2d3748',
                margin: '0 0 8px 0',
                fontSize: 20,
                fontWeight: 700
              }}>
                Chỉnh sửa nhận xét
              </h4>
              <div style={{
                color: '#718096',
                fontSize: 14
              }}>
                Cập nhật nội dung nhận xét cho học sinh: <strong>{editingComment.studentName}</strong>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontWeight: 600,
                color: '#2d3748',
                marginBottom: 8,
                fontSize: 14
              }}>
                📝 Nội dung nhận xét *
              </label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                required
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: 12,
                  fontSize: 16,
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                placeholder="Nhập nội dung nhận xét mới..."
              />
            </div>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center'
            }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(226, 232, 240, 0.8)',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: 120
                }}
              >
                ❌ Hủy bỏ
              </button>
              <button
                onClick={handleUpdateComment}
                disabled={updatingCommentId === editingComment.id}
                style={{
                  padding: '12px 24px',
                  background: updatingCommentId === editingComment.id 
                    ? 'rgba(203, 213, 224, 0.8)' 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: updatingCommentId === editingComment.id ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {updatingCommentId === editingComment.id ? (
                  <>
                    <div style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Đang cập nhật...
                  </>
                ) : (
                  '💾 Cập nhật'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
} 