import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import UpdateForm from '../common/UpdateForm';
import Modal from '../common/Modal';
import { 
  unifiedEntranceVariants, 
  containerVariants, 
  itemVariants, 
  buttonVariants,
  cardVariants,
  notificationVariants,
  modalVariants,
  spinnerVariants
} from '../../utils/animations';

export default function ClassManager() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('');
  const [editingClass, setEditingClass] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClasses();
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

  const fetchClasses = async () => {
    setLoading(true);
    setError('');
    try {
      const querySnapshot = await getDocs(collection(db, 'classes'));
      setClasses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setError('Lỗi khi tải danh sách lớp: ' + err.message);
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newClassName.trim() || !newTeacherId.trim()) return;
    setProcessingId('add');
    try {
      const docRef = await addDoc(collection(db, 'classes'), {
        name: newClassName.trim(),
        teacherId: newTeacherId.trim(),
        createdAt: serverTimestamp()
      });
      await updateDoc(docRef, { id: docRef.id });
      setNewClassName('');
      setNewTeacherId('');
      fetchClasses();
      setSuccess('Thêm lớp thành công!');
      setError('');
    } catch (err) {
      setError('Lỗi khi thêm lớp: ' + err.message);
      setSuccess('');
    }
    setProcessingId(null);
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
  };

  const handleUpdate = async () => {
    if (!editingClass) return;
    const { id, ...dataToUpdate } = editingClass;
    setProcessingId(editingClass.id);
    try {
      await updateDoc(doc(db, 'classes', editingClass.id), dataToUpdate);
      setEditingClass(null);
      fetchClasses();
      setSuccess('Cập nhật lớp thành công!');
      setError('');
    } catch (err) {
      setError('Lỗi khi cập nhật lớp: ' + err.message);
      setSuccess('');
    }
    setProcessingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lớp này?')) return;
    setProcessingId(id);
    try {
      await deleteDoc(doc(db, 'classes', id));
      fetchClasses();
      setSuccess('Xóa lớp thành công!');
      setError('');
    } catch (err) {
      setError('Lỗi khi xóa lớp: ' + err.message);
      setSuccess('');
    }
    setProcessingId(null);
  };

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <motion.div 
        className="App flex items-center justify-center"
        style={{ minHeight: '40vh', flexDirection: 'column', gap: 24 }}
        variants={unifiedEntranceVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="unified-loading"
          variants={spinnerVariants}
          animate="animate"
        />
        <motion.div 
          className="unified-gradient-text"
          style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }}
          variants={unifiedEntranceVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          Đang tải danh sách lớp học...
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="unified-card"
      style={{ maxWidth: 1000, margin: '40px auto', padding: '40px 30px' }}
      variants={unifiedEntranceVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div style={{ textAlign: 'center', margin: '32px 0 8px 0' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          <span style={{
            fontSize: 38,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            padding: 8,
            color: 'white',
            boxShadow: '0 2px 8px rgba(102,126,234,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            🏫
          </span>
          <span
            style={{
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 8px rgba(102,126,234,0.10)',
            }}
          >
            Quản Lý Lớp Học
          </span>
        </span>
        <div style={{ color: '#666', fontSize: 18, marginTop: 8 }}>
          Thêm, sửa, xóa và quản lý các lớp học trong hệ thống
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {success && (
          <motion.div
            className="unified-notification success"
            variants={notificationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.span variants={itemVariants}>
              ✅ {success}
            </motion.span>
          </motion.div>
        )}
        
        {error && (
          <motion.div
            className="unified-notification error"
            variants={notificationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.span variants={itemVariants}>
              ❌ {error}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Class Form */}
      <motion.div
        className="unified-card mb-24"
        style={{ padding: '24px' }}
        variants={cardVariants}
        whileHover="hover"
      >
        <motion.h3 
          className="unified-gradient-text mb-16 text-center"
          variants={itemVariants}
        >
          ➕ Thêm Lớp Học Mới
        </motion.h3>
        
        <motion.form 
          onSubmit={handleAdd} 
          className="unified-form"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="unified-form-item" variants={itemVariants}>
            <motion.label
              className="unified-input-label"
              style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}
              variants={itemVariants}
            >
              Tên lớp học:
            </motion.label>
            <motion.input
              type="text"
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              placeholder="Nhập tên lớp học..."
              className="unified-input"
              variants={itemVariants}
            />
          </motion.div>

          <motion.div className="unified-form-item" variants={itemVariants}>
            <motion.label
              className="unified-input-label"
              style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}
              variants={itemVariants}
            >
              Giáo viên phụ trách:
            </motion.label>
            <motion.input
              type="text"
              value={newTeacherId}
              onChange={e => setNewTeacherId(e.target.value)}
              placeholder="Nhập ID hoặc tên giáo viên..."
              className="unified-input"
              variants={itemVariants}
            />
          </motion.div>

          <motion.div
            className="flex justify-center mt-24"
            variants={itemVariants}
          >
            <motion.button
              type="submit"
              className="unified-button"
              disabled={processingId === 'add'}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              style={{ minWidth: 200 }}
            >
              {processingId === 'add' ? (
                <motion.div
                  className="flex items-center gap-8"
                  variants={itemVariants}
                >
                  <motion.div 
                    className="unified-loading"
                    style={{ width: 20, height: 20, borderWidth: 2 }}
                    variants={spinnerVariants}
                    animate="animate"
                  />
                  <motion.span variants={itemVariants}>
                    Đang thêm...
                  </motion.span>
                </motion.div>
              ) : (
                <motion.span variants={itemVariants}>
                  Thêm Lớp Học
                </motion.span>
              )}
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>

      {/* Thanh tìm kiếm đẹp mắt */}
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
            placeholder="Tìm kiếm lớp học..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
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

      {/* Classes List */}
      <motion.div
        className="unified-card"
        style={{ padding: '24px' }}
        variants={cardVariants}
        whileHover="hover"
      >
        <motion.h3 
          className="unified-gradient-text mb-16 text-center"
          variants={itemVariants}
        >
          📚 Danh Sách Lớp Học ({filteredClasses.length})
        </motion.h3>

        {filteredClasses.length === 0 ? (
          <motion.div
            className="text-center"
            style={{ color: '#666', fontSize: 16, padding: '40px 20px' }}
            variants={itemVariants}
          >
            <div className="unified-avatar" style={{ width: 64, height: 64, margin: '0 auto 16px', fontSize: 32 }}>
              📖
            </div>
            Chưa có lớp học nào được tạo.
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-2 gap-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredClasses.map((cls, index) => (
              <motion.div
                key={cls.id}
                className="unified-list-item"
                variants={itemVariants}
                whileHover="hover"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '20px'
                }}
              >
                <motion.div 
                  className="flex items-center gap-12"
                  variants={itemVariants}
                >
                  <motion.div 
                    className="unified-avatar"
                    style={{ width: 40, height: 40, fontSize: 18 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    🏫
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <div style={{ fontWeight: 600, color: '#667eea', fontSize: 16, marginBottom: 4 }}>
                      {cls.name}
                    </div>
                    <div style={{ color: '#666', fontSize: 14 }}>
                      GV: {cls.teacherId}
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div 
                  className="flex gap-8"
                  variants={itemVariants}
                >
                  <motion.button
                    onClick={() => handleEdit(cls)}
                    className="unified-button"
                    style={{ 
                      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                      padding: '8px 16px',
                      fontSize: 13
                    }}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    ✏️ Sửa
                  </motion.button>
                  
                  <motion.button
                    onClick={() => handleDelete(cls.id)}
                    disabled={processingId === cls.id}
                    className="unified-button"
                    style={{ 
                      background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
                      padding: '8px 16px',
                      fontSize: 13
                    }}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {processingId === cls.id ? (
                      <motion.div
                        className="unified-loading"
                        style={{ width: 16, height: 16, borderWidth: 2 }}
                        variants={spinnerVariants}
                        animate="animate"
                      />
                    ) : (
                      '🗑️ Xóa'
                    )}
                  </motion.button>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingClass && (
          <motion.div
            className="unified-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setEditingClass(null)}
          >
            <motion.div
              className="unified-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="unified-gradient-text mb-16">✏️ Chỉnh Sửa Lớp Học</h3>
              <UpdateForm
                data={editingClass}
                onChange={setEditingClass}
                onSubmit={handleUpdate}
                onCancel={() => setEditingClass(null)}
                loading={processingId === editingClass.id}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 