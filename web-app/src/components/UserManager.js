import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({ email: '', role: '' });
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setError('Lỗi khi tải danh sách tài khoản: ' + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa tài khoản: ' + err.message);
    }
    setDeletingId(null);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditData({ email: user.email || '', role: user.role || '' });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!editData.email.trim() || !editData.role.trim()) return;
    setProcessingId(editingUser.id);
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        email: editData.email.trim(),
        role: editData.role.trim(),
      });
      setEditingUser(null);
      setEditData({ email: '', role: '' });
      fetchUsers();
    } catch (err) {
      alert('Lỗi khi cập nhật tài khoản: ' + err.message);
    }
    setProcessingId(null);
  };

  if (loading) return <div>Đang tải danh sách tài khoản...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h3 style={{ color: '#2d3748', marginBottom: 20 }}>Danh sách tài khoản</h3>
      <div className="grid grid-2">
        {users.length === 0 ? (
          <div>Chưa có tài khoản nào.</div>
        ) : users.map(user => (
          <div key={user.id} className="card" style={{ padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            {editingUser && editingUser.id === user.id ? (
              <>
                <input
                  type="email"
                  name="email"
                  value={editData.email}
                  onChange={handleEditChange}
                  className="input-field"
                  style={{ flex: 2, minWidth: 0 }}
                  placeholder="Email"
                />
                <select
                  name="role"
                  value={editData.role}
                  onChange={handleEditChange}
                  className="input-field"
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <option value="">Chọn quyền</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                </select>
                <button onClick={handleUpdate} disabled={processingId === user.id} className="btn btn-primary">
                  {processingId === user.id ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button onClick={() => setEditingUser(null)} className="btn btn-secondary">Hủy</button>
              </>
            ) : (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#667eea', fontSize: 16, wordBreak: 'break-all' }}>{user.email}</div>
                  <div style={{ color: '#718096', fontSize: 14 }}>Role: {user.role || 'teacher'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEdit(user)} className="btn btn-secondary">Sửa</button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deletingId === user.id}
                    className="btn btn-danger"
                  >
                    {deletingId === user.id ? 'Đang xóa...' : 'Xóa'}
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