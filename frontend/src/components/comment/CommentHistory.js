import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

export default function CommentHistory({ studentId, renderAddComment, onCommentAdded }) {
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
        
        // Kiểm tra studentId trước khi fetch
        if (!studentId) {
          console.log('No studentId provided');
          setComments([]);
          setLoading(false);
          return;
        }
        
        // Sử dụng collection comments với query
        // Lưu ý: Cần tạo composite index cho studentId + createdAt trong Firebase Console
        const commentsRef = collection(db, 'comments');
        const q = query(
          commentsRef,
          where('studentId', '==', studentId),
          orderBy('createdAt', 'desc')
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

  // Function để thêm comment mới vào danh sách
  const addNewComment = (newComment) => {
    // Đảm bảo comment có đầy đủ thông tin cần thiết
    const commentWithDefaults = {
      ...newComment,
      teacherName: newComment.teacherName || 'Giáo viên',
      content: newComment.content || '',
      type: newComment.type || 'general',
      createdAt: newComment.createdAt || new Date(),
      timestamp: newComment.timestamp || newComment.createdAt || new Date()
    };
    setComments(prevComments => [commentWithDefaults, ...prevComments]);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const commentVariants = {
    hidden: { 
      opacity: 0, 
      x: -20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      x: 20,
      scale: 0.95,
      transition: {
        duration: 0.3
      }
    }
  };

  const loadingVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="fade-in" 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          flexDirection: 'column',
          gap: 20
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          style={{
            width: 50,
            height: 50,
            border: '4px solid rgba(102, 126, 234, 0.2)',
            borderTop: '4px solid #667eea',
            borderRadius: '50%'
          }}
          variants={loadingVariants}
          animate="animate"
        />
        <motion.div 
          style={{ color: '#667eea', fontSize: 18, fontWeight: 600 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Đang tải lịch sử nhận xét...
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="fade-in" 
        style={{
          maxWidth: 600,
          margin: '40px auto',
          padding: '40px 30px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center'
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          style={{
            width: 70,
            height: 70,
            background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 25px rgba(229, 62, 62, 0.3)'
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <span style={{ fontSize: 28, color: 'white' }}>⚠️</span>
        </motion.div>
        <motion.h3 
          style={{ color: '#e53e3e', marginBottom: 16 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Có lỗi xảy ra
        </motion.h3>
        <motion.div 
          style={{ color: '#718096' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {error}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="fade-in" 
      style={{
        maxWidth: 800,
        margin: '40px auto',
        padding: '40px 30px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Render AddComment component nếu có */}
      {renderAddComment && renderAddComment(addNewComment)}
      
      <motion.div 
        style={{ textAlign: 'center', marginBottom: 40 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div 
          style={{
            width: 70,
            height: 70,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
          }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <span style={{ fontSize: 28, color: 'white' }}>📝</span>
        </motion.div>
        <motion.h3 
          style={{
            color: '#2d3748',
            margin: '0 0 8px 0',
            fontSize: 24,
            fontWeight: 700
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Lịch sử nhận xét
        </motion.h3>
        <motion.div 
          style={{
            color: '#718096',
            fontSize: 16
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {comments.length} nhận xét đã được ghi
        </motion.div>
      </motion.div>

      <motion.div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {comments.length === 0 ? (
            <motion.div 
              style={{
                textAlign: 'center',
                padding: '60px 40px',
                color: '#718096',
                fontSize: 16,
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 16,
                border: '2px dashed #e2e8f0'
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                style={{ fontSize: 48, marginBottom: 16 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                📭
              </motion.div>
              <motion.div 
                style={{ fontSize: 16, fontWeight: 500 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Chưa có nhận xét nào cho học sinh này.
              </motion.div>
            </motion.div>
          ) : comments.map((comment, index) => (
            <motion.div 
              key={comment.id}
              style={{
                padding: '24px',
                background: 'rgba(255,255,255,0.9)',
                border: '2px solid #e2e8f0',
                borderRadius: 16,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}
              variants={commentVariants}
              whileHover={{ 
                y: -4,
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
                borderColor: '#667eea'
              }}
              layout
            >
              {/* Background decoration */}
              <motion.div 
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 100,
                  height: 100,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                  borderRadius: '0 16px 0 100px',
                  zIndex: 0
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  marginBottom: 16
                }}>
                  <motion.div 
                    style={{
                      width: 50,
                      height: 50,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                      flexShrink: 0
                    }}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <span style={{ fontSize: 20, color: 'white' }}>👨‍🏫</span>
                  </motion.div>
                  
                  <div style={{ flex: 1 }}>
                    <motion.div 
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: '#2d3748',
                        marginBottom: 4
                      }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      {comment.teacherName || 'Giáo viên'}
                    </motion.div>
                    
                    <motion.div 
                      style={{
                        fontSize: 12,
                        color: '#667eea',
                        fontWeight: 600,
                        background: 'rgba(102, 126, 234, 0.1)',
                        padding: '4px 8px',
                        borderRadius: 6,
                        display: 'inline-block'
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      📅 {(() => {
                        const v = comment.createdAt;
                        if (!v) return 'Chưa có ngày';
                        if (typeof v === 'string' || typeof v === 'number') return new Date(v).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        if (v.seconds) return new Date(v.seconds * 1000).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        if (typeof v.toDate === 'function') return v.toDate().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        return 'Chưa có ngày';
                      })()}
                    </motion.div>
                  </div>
                </div>

                <motion.div 
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: '#4a5568',
                    background: 'rgba(255,255,255,0.7)',
                    padding: '16px',
                    borderRadius: 12,
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    marginBottom: 12
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  {comment.content}
                </motion.div>

                {comment.type && (
                  <motion.div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <span style={{ fontSize: 12, color: '#718096' }}>Loại nhận xét:</span>
                    <motion.span 
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: comment.type === 'positive' 
                          ? 'rgba(72, 187, 120, 0.1)' 
                          : comment.type === 'negative'
                          ? 'rgba(245, 101, 101, 0.1)'
                          : 'rgba(102, 126, 234, 0.1)',
                        color: comment.type === 'positive' 
                          ? '#48bb78' 
                          : comment.type === 'negative'
                          ? '#f56565'
                          : '#667eea'
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {comment.type === 'positive' ? '👍 Tích cực' : 
                       comment.type === 'negative' ? '👎 Cần cải thiện' : 
                       '📝 Chung'}
                    </motion.span>
                  </motion.div>
                )}

                {/* Action buttons */}
                <motion.div 
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 12,
                    justifyContent: 'flex-end'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <motion.button
                    onClick={() => handleEditComment(comment)}
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #38b2ac 0%, #319795 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✏️ Sửa
                  </motion.button>
                  <motion.button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingCommentId === comment.id}
                    style={{
                      padding: '6px 12px',
                      background: deletingCommentId === comment.id 
                        ? 'rgba(203, 213, 224, 0.8)' 
                        : 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: deletingCommentId === comment.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    whileHover={deletingCommentId === comment.id ? {} : { scale: 1.05 }}
                    whileTap={deletingCommentId === comment.id ? {} : { scale: 0.95 }}
                  >
                    {deletingCommentId === comment.id ? (
                      <>
                        <div style={{
                          width: 12,
                          height: 12,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Đang xóa...
                      </>
                    ) : (
                      '🗑️ Xóa'
                    )}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Modal chỉnh sửa nhận xét */}
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
                Cập nhật nội dung nhận xét cho học sinh
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
    </motion.div>
  );
}
