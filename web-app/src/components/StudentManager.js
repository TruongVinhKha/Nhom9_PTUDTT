import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function StudentManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newStudent, setNewStudent] = useState({ name: '', classId: '' });
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudent, setEditStudent] = useState({ name: '', classId: '' });
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

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
    if (!newStudent.name.trim() || !newStudent.classId.trim()) return;
    setProcessingId('add');
    try {
      await addDoc(collection(db, 'students'), { name: newStudent.name.trim(), classId: newStudent.classId.trim() });
      setNewStudent({ name: '', classId: '' });
      fetchStudents();
    } catch (err) {
      setError('Lỗi khi thêm học sinh: ' + err.message);
    }
    setProcessingId(null);
  };

  const handleEdit = (stu) => {
    setEditingStudent(stu);
    setEditStudent({ name: stu.name, classId: stu.classId });
  };

  const handleUpdate = async () => {
    if (!editStudent.name.trim() || !editStudent.classId.trim()) return;
    setProcessingId(editingStudent.id);
    try {
      await updateDoc(doc(db, 'students', editingStudent.id), { name: editStudent.name.trim(), classId: editStudent.classId.trim() });
      setEditingStudent(null);
      setEditStudent({ name: '', classId: '' });
      fetchStudents();
    } catch (err) {
      setError('Lỗi khi cập nhật học sinh: ' + err.message);
    }
    setProcessingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa học sinh này?')) return;
    setProcessingId(id);
    try {
      await deleteDoc(doc(db, 'students', id));
      fetchStudents();
    } catch (err) {
      setError('Lỗi khi xóa học sinh: ' + err.message);
    }
    setProcessingId(null);
  };

  if (loading) return <div>Đang tải danh sách học sinh...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h3 style={{ color: '#2d3748', marginBottom: 20 }}>Danh sách học sinh</h3>
      <form onSubmit={handleAdd} style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={newStudent.name}
          onChange={e => setNewStudent(s => ({ ...s, name: e.target.value }))}
          placeholder="Tên học sinh mới"
          className="input-field"
          style={{ flex: 2, minWidth: 0 }}
        />
        <input
          type="text"
          value={newStudent.classId}
          onChange={e => setNewStudent(s => ({ ...s, classId: e.target.value }))}
          placeholder="Mã lớp"
          className="input-field"
          style={{ flex: 1, minWidth: 0 }}
        />
        <button type="submit" disabled={processingId === 'add'} className="btn btn-primary">
          {processingId === 'add' ? 'Đang thêm...' : 'Thêm học sinh'}
        </button>
      </form>
      <div className="grid grid-2">
        {students.length === 0 ? (
          <div>Chưa có học sinh nào.</div>
        ) : students.map(stu => (
          <div key={stu.id} className="card" style={{ padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            {editingStudent && editingStudent.id === stu.id ? (
              <>
                <input
                  type="text"
                  value={editStudent.name}
                  onChange={e => setEditStudent(s => ({ ...s, name: e.target.value }))}
                  className="input-field"
                  style={{ flex: 2, minWidth: 0 }}
                />
                <input
                  type="text"
                  value={editStudent.classId}
                  onChange={e => setEditStudent(s => ({ ...s, classId: e.target.value }))}
                  className="input-field"
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button onClick={handleUpdate} disabled={processingId === stu.id} className="btn btn-primary">
                  {processingId === stu.id ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button onClick={() => setEditingStudent(null)} className="btn btn-secondary">Hủy</button>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, color: '#667eea', fontSize: 16 }}>{stu.fullName || stu.name || stu.id}</div>
                <div style={{ color: '#718096', fontSize: 14 }}>Mã lớp: {stu.classId}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEdit(stu)} className="btn btn-secondary">Sửa</button>
                  <button onClick={() => handleDelete(stu.id)} disabled={processingId === stu.id} className="btn btn-danger">
                    {processingId === stu.id ? 'Đang xóa...' : 'Xóa'}
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