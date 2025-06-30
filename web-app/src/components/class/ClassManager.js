import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import UpdateForm from '../common/UpdateForm';
import Modal from '../common/Modal';

export default function ClassManager() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('');
  const [editingClass, setEditingClass] = useState(null);
  const [processingId, setProcessingId] = useState(null);

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

  if (loading) return <div>Đang tải danh sách lớp...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
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
      <h3 style={{ color: '#2d3748', marginBottom: 20 }}>Danh sách lớp học</h3>
      <form onSubmit={handleAdd} style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={newClassName}
          onChange={e => setNewClassName(e.target.value)}
          placeholder="Tên lớp mới"
          className="input-field"
          style={{ flex: 1, minWidth: 0 }}
        />
        <input
          type="text"
          value={newTeacherId}
          onChange={e => setNewTeacherId(e.target.value)}
          placeholder="Giáo viên dạy lớp (ID hoặc tên)"
          className="input-field"
          style={{ flex: 1, minWidth: 0 }}
        />
        <button type="submit" disabled={processingId === 'add'} className="btn btn-primary">
          {processingId === 'add' ? 'Đang thêm...' : 'Thêm lớp'}
        </button>
      </form>
      <div className="grid grid-2">
        {classes.length === 0 ? (
          <div>Chưa có lớp nào.</div>
        ) : classes.map(cls => (
          <div key={cls.id} className="card" style={{ padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            {editingClass && editingClass.id === cls.id ? (
              <>
                <button onClick={() => setEditingClass(null)} className="btn btn-secondary">Hủy</button>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, color: '#667eea', fontSize: 16 }}>{cls.name}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEdit(cls)} className="btn btn-secondary">Sửa</button>
                  <button onClick={() => handleDelete(cls.id)} disabled={processingId === cls.id} className="btn btn-danger">
                    {processingId === cls.id ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {editingClass && (
        <Modal open={!!editingClass} onClose={() => setEditingClass(null)}>
          <UpdateForm
            data={editingClass}
            onChange={setEditingClass}
            onSubmit={handleUpdate}
            onCancel={() => setEditingClass(null)}
            loading={processingId === editingClass.id}
          />
        </Modal>
      )}
    </div>
  );
} 