import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import UpdateForm from '../common/UpdateForm';
import Modal from '../common/Modal';

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
      const studentData = {
        fullName: newStudent.name.trim(),
        classId: newStudent.classId.trim(),
        studentCode: newStudent.studentCode.trim() || '',
        dateOfBirth: newStudent.dateOfBirth || '',
        gender: newStudent.gender || '',
        academicYear: newStudent.academicYear || '',
        createdAt: new Date()
      };
      
      await addDoc(collection(db, 'students'), studentData);
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
        <div style={{ color: '#667eea', fontSize: 16, fontWeight: 600 }}>Đang tải danh sách học sinh...</div>
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
          <span style={{ fontSize: 28, color: 'white' }}>👨‍🎓</span>
        </div>
        <h4 style={{ 
          color: '#2d3748', 
          margin: '0 0 8px 0',
          fontSize: 24,
          fontWeight: 700
        }}>
          Quản lý học sinh
        </h4>
        <div style={{ 
          color: '#718096',
          fontSize: 16
        }}>
          {students.length} học sinh trong hệ thống
        </div>
      </div>

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

      {/* Add Student Form */}
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
          📝 Thêm học sinh mới
        </h5>
        
        <form onSubmit={handleAdd} style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontWeight: 600,
              color: '#2d3748',
              marginBottom: 8,
              fontSize: 14
            }}>
              👤 Tên học sinh *
            </label>
            <input
              type="text"
              value={newStudent.name}
              onChange={e => setNewStudent(s => ({ ...s, name: e.target.value }))}
              placeholder="Nhập tên học sinh"
              required
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

          <div>
            <label style={{
              display: 'block',
              fontWeight: 600,
              color: '#2d3748',
              marginBottom: 8,
              fontSize: 14
            }}>
              🆔 Mã học sinh
            </label>
            <input
              type="text"
              value={newStudent.studentCode}
              onChange={e => setNewStudent(s => ({ ...s, studentCode: e.target.value }))}
              placeholder="Nhập mã học sinh"
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

          <div>
            <label style={{
              display: 'block',
              fontWeight: 600,
              color: '#2d3748',
              marginBottom: 8,
              fontSize: 14
            }}>
              🏫 Mã lớp *
            </label>
            <input
              type="text"
              value={newStudent.classId}
              onChange={e => setNewStudent(s => ({ ...s, classId: e.target.value }))}
              placeholder="Nhập mã lớp"
              required
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

          <div>
            <label style={{
              display: 'block',
              fontWeight: 600,
              color: '#2d3748',
              marginBottom: 8,
              fontSize: 14
            }}>
              📅 Ngày sinh
            </label>
            <input
              type="date"
              value={newStudent.dateOfBirth}
              onChange={e => setNewStudent(s => ({ ...s, dateOfBirth: e.target.value }))}
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

          <div>
            <label style={{
              display: 'block',
              fontWeight: 600,
              color: '#2d3748',
              marginBottom: 8,
              fontSize: 14
            }}>
              👥 Giới tính
            </label>
            <select
              value={newStudent.gender}
              onChange={e => setNewStudent(s => ({ ...s, gender: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 16,
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                background: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontWeight: 600,
              color: '#2d3748',
              marginBottom: 8,
              fontSize: 14
            }}>
              🎓 Niên khóa
            </label>
            <input
              type="text"
              value={newStudent.academicYear}
              onChange={e => setNewStudent(s => ({ ...s, academicYear: e.target.value }))}
              placeholder="VD: 2023-2024"
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

          <button 
            type="submit" 
            disabled={processingId === 'add'} 
            style={{
              padding: '12px 24px',
              background: processingId === 'add' 
                ? 'rgba(203, 213, 224, 0.8)' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: processingId === 'add' ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: '48px'
            }}
          >
            {processingId === 'add' ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Đang thêm...
              </>
            ) : (
              '➕ Thêm học sinh'
            )}
          </button>
        </form>
      </div>

      {/* Students List */}
      <div style={{ marginBottom: 24 }}>
        <h5 style={{ 
          color: '#2d3748', 
          margin: '0 0 16px 0',
          fontSize: 18,
          fontWeight: 600
        }}>
          📋 Danh sách học sinh
        </h5>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16
      }}>
        {students.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px 20px',
            color: '#718096',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 16,
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Chưa có học sinh nào</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Hãy thêm học sinh đầu tiên</div>
          </div>
        ) : students.map(stu => (
          <div key={stu.id} style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            transition: 'all 0.3s ease'
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                fontWeight: 700, 
                color: '#667eea', 
                fontSize: 18,
                marginBottom: 8
              }}>
                {stu.fullName || stu.name || stu.id}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                fontSize: 14,
                color: '#4a5568'
              }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#2d3748' }}>🆔 Mã HS:</span> {stu.studentCode || 'Chưa có'}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#2d3748' }}>🏫 Lớp:</span> {stu.classId}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#2d3748' }}>📅 Ngày sinh:</span> {stu.dateOfBirth ? new Date(stu.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa có'}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#2d3748' }}>👥 Giới tính:</span> {stu.gender || 'Chưa có'}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontWeight: 600, color: '#2d3748' }}>🎓 Niên khóa:</span> {stu.academicYear || 'Chưa có'}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => handleEdit(stu)} 
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
                onClick={() => handleDelete(stu.id)} 
                disabled={processingId === stu.id} 
                style={{
                  padding: '8px 16px',
                  background: processingId === stu.id 
                    ? 'rgba(203, 213, 224, 0.8)' 
                    : 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: processingId === stu.id ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
              >
                {processingId === stu.id ? 'Đang xóa...' : '🗑️ Xóa'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <Modal open={!!editingStudent} onClose={() => setEditingStudent(null)}>
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
        </Modal>
      )}
    </div>
  );
} 