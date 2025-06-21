import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function ClassManager() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [editingClass, setEditingClass] = useState(null);
  const [editClassName, setEditClassName] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

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
    if (!newClassName.trim()) return;
    setProcessingId('add');
    try {
      await addDoc(collection(db, 'classes'), { name: newClassName.trim() });
      setNewClassName('');
      fetchClasses();
    } catch (err) {
      setError('Lỗi khi thêm lớp: ' + err.message);
    }
    setProcessingId(null);
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setEditClassName(cls.name);
  };

  const handleUpdate = async () => {
    if (!editClassName.trim()) return;
    setProcessingId(editingClass.id);
    try {
      await updateDoc(doc(db, 'classes', editingClass.id), { name: editClassName.trim() });
      setEditingClass(null);
      setEditClassName('');
      fetchClasses();
    } catch (err) {
      setError('Lỗi khi cập nhật lớp: ' + err.message);
    }
    setProcessingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lớp này?')) return;
    setProcessingId(id);
    try {
      await deleteDoc(doc(db, 'classes', id));
      fetchClasses();
    } catch (err) {
      setError('Lỗi khi xóa lớp: ' + err.message);
    }
    setProcessingId(null);
  };

  if (loading) return <div>Đang tải danh sách lớp...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
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
                <input
                  type="text"
                  value={editClassName}
                  onChange={e => setEditClassName(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button onClick={handleUpdate} disabled={processingId === cls.id} className="btn btn-primary">
                  {processingId === cls.id ? 'Đang lưu...' : 'Lưu'}
                </button>
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
    </div>
  );
} 