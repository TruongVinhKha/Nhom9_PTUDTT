import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
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

export default function StudentManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newStudent, setNewStudent] = useState({ 
    name: '', 
    classId: '',
    studentCode: '',
    dateOfBirth: '',
    gender: '',
    academicYear: ''
  });
  const [editingStudent, setEditingStudent] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
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

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      setStudents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setError('Lỗi khi tải danh sách học sinh: ' + err.message);
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.classId.trim()) {
      alert('Tên học sinh và mã lớp là bắt buộc!');
      return;
    }
    setProcessingId('add');
    try {
      // Sinh mã studentId tự động
      const studentsRef = collection(db, 'students');
      const snapshot = await getDocs(studentsRef);
      let maxNumber = 0;
      snapshot.forEach(docSnap => {
        const id = docSnap.id;
        if (id && id.startsWith('student')) {
          const num = parseInt(id.replace('student', ''));
          if (!isNaN(num) && num > maxNumber) maxNumber = num;
        }
      });
      const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
      const studentId = 'student' + nextNumber;

      const studentData = {
        fullName: newStudent.name.trim(),
        classId: newStudent.classId.trim(),
        studentCode: newStudent.studentCode.trim() || '',
        dateOfBirth: newStudent.dateOfBirth || '',
        gender: newStudent.gender || '',
        academicYear: newStudent.academicYear || '',
        createdAt: new Date()
      };
      
      await setDoc(doc(db, 'students', studentId), studentData);
      setNewStudent({ 
        name: '', 
        classId: '',
        studentCode: '',
        dateOfBirth: '',
        gender: '',
        academicYear: ''
      });
      fetchStudents();
      setSuccess('Thêm học sinh thành công!');
      setError('');
    } catch (err) {
      setError('Lỗi khi thêm học sinh: ' + err.message);
      setSuccess('');
    }
    setProcessingId(null);
  };

  const handleEdit = (stu) => {
    setEditingStudent(stu);
  };

  const handleUpdate = async () => {
    if (!editingStudent) return;
    const { id, name, ...dataToUpdate } = editingStudent;
    
    if (!dataToUpdate.fullName) {
      setError('Tên học sinh không được để trống');
      return;
    }
    
    setProcessingId(editingStudent.id);
    try {
      console.log('📝 Updating student with data:', dataToUpdate);
      await updateDoc(doc(db, 'students', editingStudent.id), dataToUpdate);
      setEditingStudent(null);
      fetchStudents();
      setSuccess('Cập nhật học sinh thành công!');
      setError('');
    } catch (err) {
      console.error('❌ Error updating student:', err);
      setError('Lỗi khi cập nhật học sinh: ' + err.message);
      setSuccess('');
    }
    setProcessingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa học sinh này?')) return;
    setProcessingId(id);
    try {
      await deleteDoc(doc(db, 'students', id));
      fetchStudents();
      setSuccess('Xóa học sinh thành công!');
      setError('');
    } catch (err) {
      setError('Lỗi khi xóa học sinh: ' + err.message);
      setSuccess('');
    }
    setProcessingId(null);
  };

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
          Đang tải danh sách học sinh...
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="unified-card text-center"
        style={{
          maxWidth: 600,
          margin: '40px auto',
          padding: '30px'
        }}
        variants={unifiedEntranceVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="unified-avatar"
          style={{ 
            width: 60, 
            height: 60, 
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
            fontSize: 24
          }}
          variants={itemVariants}
        >
          ⚠️
        </motion.div>
        <motion.h4 
          className="unified-gradient-text"
          style={{ marginBottom: 12, fontSize: 20 }}
          variants={itemVariants}
        >
          Có lỗi xảy ra
        </motion.h4>
        <motion.div 
          style={{ color: '#666' }}
          variants={itemVariants}
        >
          {error}
        </motion.div>
      </motion.div>
    );
  }

  const filteredStudents = students.filter(stu =>
    (stu.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (stu.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Header luôn trên cùng */}
      <motion.div 
        className="text-center mb-24"
        variants={itemVariants}
      >
        <motion.div
          className="unified-avatar"
          style={{ 
            width: 70, 
            height: 70, 
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontSize: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%'
          }}
          variants={itemVariants}
        >
          👨‍🎓
        </motion.div>
        <motion.h4 
          className="unified-gradient-text"
          style={{ 
            margin: '0 0 8px 0',
            fontSize: 24,
            fontWeight: 700
          }}
          variants={itemVariants}
        >
          Quản lý học sinh
        </motion.h4>
        <motion.div 
          style={{ 
            color: '#666',
            fontSize: 16
          }}
          variants={itemVariants}
        >
          {students.length} học sinh trong hệ thống
        </motion.div>
      </motion.div>
      <motion.div
        className="unified-card"
        style={{
          maxWidth: 1200,
          margin: '40px auto',
          padding: '40px 30px'
        }}
        variants={unifiedEntranceVariants}
        initial="hidden"
        animate="visible"
      >
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

        {/* Add Student Form */}
        <motion.div
          className="unified-card mb-24"
          style={{ padding: '24px' }}
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.h5 
            className="unified-gradient-text mb-16"
            style={{ fontSize: 18, fontWeight: 600 }}
            variants={itemVariants}
          >
            📝 Thêm học sinh mới
          </motion.h5>
          
          <motion.form 
            onSubmit={handleAdd} 
            className="grid grid-2 gap-16"
            style={{ alignItems: 'end' }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <motion.label
                className="unified-input-label"
                style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333', fontSize: 14 }}
                variants={itemVariants}
              >
                👤 Tên học sinh *
              </motion.label>
              <motion.input
                type="text"
                value={newStudent.name}
                onChange={e => setNewStudent(s => ({ ...s, name: e.target.value }))}
                placeholder="Nhập tên học sinh"
                required
                className="unified-input"
                variants={itemVariants}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.label
                className="unified-input-label"
                style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333', fontSize: 14 }}
                variants={itemVariants}
              >
                📅 Ngày sinh
              </motion.label>
              <motion.input
                type="date"
                value={newStudent.dateOfBirth}
                onChange={e => setNewStudent(s => ({ ...s, dateOfBirth: e.target.value }))}
                className="unified-input"
                variants={itemVariants}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.label
                className="unified-input-label"
                style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333', fontSize: 14 }}
                variants={itemVariants}
              >
                👥 Giới tính
              </motion.label>
              <motion.select
                value={newStudent.gender}
                onChange={e => setNewStudent(s => ({ ...s, gender: e.target.value }))}
                className="unified-input"
                style={{ background: 'white' }}
                variants={itemVariants}
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </motion.select>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.label
                className="unified-input-label"
                style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333', fontSize: 14 }}
                variants={itemVariants}
              >
                🎓 Niên khóa
              </motion.label>
              <motion.input
                type="text"
                value={newStudent.academicYear}
                onChange={e => setNewStudent(s => ({ ...s, academicYear: e.target.value }))}
                placeholder="VD: 2023-2024"
                className="unified-input"
                variants={itemVariants}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.label
                className="unified-input-label"
                style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333', fontSize: 14 }}
                variants={itemVariants}
              >
                🏫 Mã lớp *
              </motion.label>
              <motion.input
                type="text"
                value={newStudent.classId}
                onChange={e => setNewStudent(s => ({ ...s, classId: e.target.value }))}
                placeholder="Nhập mã lớp"
                required
                className="unified-input"
                variants={itemVariants}
              />
            </motion.div>

            <motion.button 
              type="submit" 
              disabled={processingId === 'add'} 
              className="unified-button"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              style={{ minHeight: '48px' }}
            >
              {processingId === 'add' ? (
                <motion.div
                  className="flex items-center gap-8"
                  variants={itemVariants}
                >
                  <motion.div 
                    className="unified-loading"
                    style={{ width: 16, height: 16, borderWidth: 2 }}
                    variants={spinnerVariants}
                    animate="animate"
                  />
                  <motion.span variants={itemVariants}>
                    Đang thêm...
                  </motion.span>
                </motion.div>
              ) : (
                <motion.span variants={itemVariants}>
                  ➕ Thêm học sinh
                </motion.span>
              )}
            </motion.button>
          </motion.form>
        </motion.div>

        {/* Students List */}
        <motion.div 
          className="mb-24"
          variants={itemVariants}
        >
          <motion.h5 
            className="unified-gradient-text"
            style={{ 
              margin: '0 0 16px 0',
              fontSize: 18,
              fontWeight: 600
            }}
            variants={itemVariants}
          >
            📋 Danh sách học sinh
          </motion.h5>
        </motion.div>

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
              placeholder="Tìm kiếm học sinh..."
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

        <motion.div
          className="grid grid-2 gap-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredStudents.length === 0 ? (
            <motion.div
              className="text-center"
              style={{
                gridColumn: '1 / -1',
                padding: '40px 20px',
                color: '#666',
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 16,
                border: '2px dashed #e2e8f0'
              }}
              variants={itemVariants}
            >
              <motion.div 
                className="unified-avatar"
                style={{ width: 64, height: 64, margin: '0 auto 16px', fontSize: 48 }}
                variants={itemVariants}
              >
                📭
              </motion.div>
              <motion.div 
                style={{ fontSize: 16, fontWeight: 500 }}
                variants={itemVariants}
              >
                Chưa có học sinh nào
              </motion.div>
              <motion.div 
                style={{ fontSize: 14, marginTop: 8 }}
                variants={itemVariants}
              >
                Hãy thêm học sinh đầu tiên
              </motion.div>
            </motion.div>
          ) : filteredStudents.map(stu => (
            <motion.div
              key={stu.id}
              className="unified-list-item"
              variants={itemVariants}
              whileHover="hover"
              style={{ padding: '20px' }}
            >
              <motion.div 
                className="mb-16"
                variants={itemVariants}
              >
                <motion.div 
                  style={{ 
                    fontWeight: 700, 
                    color: '#667eea', 
                    fontSize: 18,
                    marginBottom: 8
                  }}
                  variants={itemVariants}
                >
                  {stu.fullName || stu.name || stu.id}
                </motion.div>
                
                <motion.div
                  className="grid grid-2 gap-8"
                  style={{ fontSize: 14, color: '#4a5568' }}
                  variants={itemVariants}
                >
                  <motion.div variants={itemVariants}>
                    <span style={{ fontWeight: 600, color: '#2d3748' }}>🆔 Mã HS:</span> {stu.id}
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <span style={{ fontWeight: 600, color: '#2d3748' }}>🏫 Lớp:</span> {stu.classId}
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <span style={{ fontWeight: 600, color: '#2d3748' }}>📅 Ngày sinh:</span> {stu.dateOfBirth ? new Date(stu.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa có'}
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <span style={{ fontWeight: 600, color: '#2d3748' }}>👥 Giới tính:</span> {stu.gender || 'Chưa có'}
                  </motion.div>
                  <motion.div 
                    style={{ gridColumn: '1 / -1' }}
                    variants={itemVariants}
                  >
                    <span style={{ fontWeight: 600, color: '#2d3748' }}>🎓 Niên khóa:</span> {stu.academicYear || 'Chưa có'}
                  </motion.div>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="flex gap-8"
                variants={itemVariants}
              >
                <motion.button 
                  onClick={() => handleEdit(stu)} 
                  className="unified-button"
                  style={{
                    background: 'linear-gradient(135deg, #38b2ac 0%, #319795 100%)',
                    padding: '8px 16px',
                    fontSize: 12,
                    flex: 1
                  }}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  ✏️ Sửa
                </motion.button>
                <motion.button 
                  onClick={() => handleDelete(stu.id)} 
                  disabled={processingId === stu.id} 
                  className="unified-button"
                  style={{
                    background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                    padding: '8px 16px',
                    fontSize: 12,
                    flex: 1
                  }}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {processingId === stu.id ? (
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

        {/* Edit Modal */}
        <AnimatePresence>
          {editingStudent && (
            <motion.div
              className="unified-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setEditingStudent(null)}
            >
              <motion.div
                className="unified-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="unified-gradient-text mb-16">✏️ Chỉnh Sửa Học Sinh</h3>
                <UpdateForm
                  data={editingStudent}
                  onChange={setEditingStudent}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingStudent(null)}
                  loading={processingId === editingStudent.id}
                  fields={[
                    { key: 'fullName', label: 'Tên học sinh', type: 'text', required: true },
                    { key: 'studentCode', label: 'Mã học sinh', type: 'text' },
                    { key: 'classId', label: 'Mã lớp', type: 'text', required: true },
                    { key: 'dateOfBirth', label: 'Ngày sinh', type: 'date' },
                    { key: 'gender', label: 'Giới tính', type: 'select', options: [
                      { value: '', label: 'Chọn giới tính' },
                      { value: 'Nam', label: 'Nam' },
                      { value: 'Nữ', label: 'Nữ' },
                      { value: 'Khác', label: 'Khác' }
                    ]},
                    { key: 'academicYear', label: 'Niên khóa', type: 'text' }
                  ]}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
} 