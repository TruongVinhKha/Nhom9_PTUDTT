import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';

export default function CommentHistory({ studentId, onBack, renderAddComment }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [updatingCommentId, setUpdatingCommentId] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        console.log('Fetching comments for student:', studentId);
        
        // Sử dụng collection comments với query
        // Lưu ý: Cần tạo composite index cho studentId + timestamp trong Firebase Console
        const commentsRef = collection(db, 'comments');
        const q = query(
          commentsRef,
          where('studentId', '==', studentId),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const commentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
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

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhận xét này?')) {
      return;
    }

    setDeletingCommentId(commentId);
    try {
      // Xóa từ collection comments
      const commentRef = doc(db, 'comments', commentId);
      await deleteDoc(commentRef);
      
      // Cập nhật state local
      setComments(comments.filter(comment => comment.id !== commentId));
      console.log('Xóa nhận xét thành công');
    } catch (err) {
      console.error('Lỗi khi xóa nhận xét:', err);
      alert('Lỗi khi xóa nhận xét: ' + err.message);
    } finally {
      setDeletingCommentId(null);
    }
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
        updatedAt: new Date()
      });
      
      // Cập nhật state local
      setComments(comments.map(comment => 
        comment.id === editingComment.id 
          ? { ...comment, content: editText.trim() }
          : comment
      ));
      
      setEditingComment(null);
      setEditText('');
      console.log('Cập nhật nhận xét thành công');
    } catch (err) {
      console.error('Lỗi khi cập nhật nhận xét:', err);
      alert('Lỗi khi cập nhật nhận xét: ' + err.message);
    } finally {
      setUpdatingCommentId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  // Function để thêm comment mới vào danh sách
  const addNewComment = (newComment) => {
    setComments(prevComments => [newComment, ...prevComments]);
  };

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
        <div style={{ color: '#667eea', fontSize: 16, fontWeight: 600 }}>Đang tải lịch sử nhận xét...</div>
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
      maxWidth: 600,
      margin: '40px auto',
      padding: '40px 30px',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: 24,
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      {/* Render AddComment component nếu có */}
      {renderAddComment && renderAddComment(addNewComment)}
      
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
          Lịch sử nhận xét
        </h4>
        <div style={{ 
          color: '#718096',
          fontSize: 16
        }}>
          {comments.length} nhận xét đã được ghi
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {comments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#718096',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 16,
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Chưa có nhận xét nào</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Hãy thêm nhận xét đầu tiên cho học sinh này</div>
          </div>
        ) : comments.map(c => (
          <div key={c.id} className="card" style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                }}>
                  <span style={{ fontSize: 14, color: 'white' }}>👨‍🏫</span>
                </div>
                <span style={{
                  fontSize: 14,
                  color: '#667eea',
                  fontWeight: 600
                }}>
                  Giáo viên
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <span style={{
                  fontSize: 12,
                  color: '#718096',
                  background: '#f7fafc',
                  padding: '4px 8px',
                  borderRadius: 8,
                  fontWeight: 500
                }}>
                  {c.timestamp ? (
                    c.timestamp._seconds ? 
                      new Date(c.timestamp._seconds * 1000).toLocaleString('vi-VN') :
                      new Date(c.timestamp.toDate()).toLocaleString('vi-VN')
                  ) : 'Vừa xong'}
                </span>
                <button
                  onClick={() => handleEditComment(c)}
                  disabled={editingComment?.id === c.id}
                  style={{
                    background: editingComment?.id === c.id ? '#e2e8f0' : '#e6fffa',
                    color: editingComment?.id === c.id ? '#718096' : '#38b2ac',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: editingComment?.id === c.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Chỉnh sửa nhận xét"
                >
                  ✏️ Sửa
                </button>
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  disabled={deletingCommentId === c.id}
                  style={{
                    background: deletingCommentId === c.id ? '#e2e8f0' : '#fed7d7',
                    color: deletingCommentId === c.id ? '#718096' : '#e53e3e',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: deletingCommentId === c.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Xóa nhận xét"
                >
                  {deletingCommentId === c.id ? (
                    <>
                      <div style={{
                        width: 12,
                        height: 12,
                        border: '2px solid rgba(229, 62, 62, 0.3)',
                        borderTop: '2px solid #e53e3e',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      🗑️ Xóa
                    </>
                  )}
                </button>
              </div>
            </div>
            <div style={{
              fontSize: 16,
              color: '#2d3748',
              lineHeight: 1.6,
              background: '#f7fafc',
              padding: '16px',
              borderRadius: 12,
              border: '1px solid #e2e8f0'
            }}>
              {c.content}
            </div>
          </div>
        ))}
      </div>

      {/* Modal chỉnh sửa nhận xét */}
      {editingComment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="fade-in" style={{
            background: 'white',
            borderRadius: 20,
            padding: '30px',
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
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
                Cập nhật nội dung nhận xét cho học sinh
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Nội dung nhận xét</label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                required
                rows={6}
                className="textarea-field"
                placeholder="Nhập nội dung nhận xét mới..."
              />
            </div>

            <div style={{
              display: 'flex',
              gap: 12,
              marginTop: 24
            }}>
              <button
                onClick={handleCancelEdit}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  padding: '12px'
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleUpdateComment}
                disabled={updatingCommentId === editingComment.id}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  padding: '12px'
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
                  'Cập nhật'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
