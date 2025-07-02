import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import UpdateForm from '../common/UpdateForm';
import Modal from '../common/Modal';
import CreateUserForm from './CreateUserForm';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Search và Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('email'); // email, role, createdAt
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [roleFilter, setRoleFilter] = useState('all'); // all, admin, teacher, parent

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter và sort users khi có thay đổi
  useEffect(() => {
    let filtered = [...users];

    // Search theo email
    if (searchTerm.trim()) {
      filtered = filtered.filter(user => 
        user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter theo role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => 
        (user.role || 'teacher') === roleFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
          bValue = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
          break;
        default:
          aValue = a.email || '';
          bValue = b.email || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, sortBy, sortOrder, roleFilter]);

  // Ẩn thông báo sau 4 giây
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔄 Bắt đầu fetch users...');
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`✅ Fetch thành công ${usersData.length} users`);
      setUsers(usersData);
    } catch (err) {
      console.error('❌ Lỗi khi fetch users:', err);
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
      setSuccess('Xóa tài khoản thành công!');
      setError('');
    } catch (err) {
      setError('Lỗi khi xóa tài khoản: ' + err.message);
      setSuccess('');
    }
    setDeletingId(null);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    const { id, createdAt, ...dataToUpdate } = editingUser;
    setProcessingId(editingUser.id);
    try {
      await updateDoc(doc(db, 'users', editingUser.id), dataToUpdate);
      setEditingUser(null);
      fetchUsers();
      setSuccess('Cập nhật tài khoản thành công!');
      setError('');
    } catch (err) {
      setError('Lỗi khi cập nhật tài khoản: ' + err.message);
      setSuccess('');
    }
    setProcessingId(null);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#e53e3e';
      case 'teacher':
        return '#3182ce';
      case 'parent':
        return '#38a169';
      default:
        return '#718096';
    }
  };

  // Hàm cập nhật deviceToken cho tất cả phụ huynh
  const setDeviceTokenForAllParents = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn thêm trường deviceToken cho tất cả phụ huynh?')) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      let count = 0;
      for (const docSnap of querySnapshot.docs) {
        const user = docSnap.data();
        if (user.role === 'parent' && !user.deviceToken) {
          await updateDoc(doc(db, 'users', docSnap.id), { deviceToken: "" });
          count++;
        }
      }
      alert(`Đã thêm trường deviceToken cho ${count} phụ huynh!`);
    } catch (err) {
      alert('Lỗi khi cập nhật deviceToken: ' + err.message);
    }
  };

  if (loading) return (
    <div style={{
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
      <div style={{ color: '#667eea', fontSize: 16, fontWeight: 600 }}>
        Đang tải danh sách tài khoản...
      </div>
    </div>
  );
  
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

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
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ 
            color: '#2d3748', 
            margin: 0,
            fontSize: 28,
            fontWeight: 700
          }}>
            Quản lý tài khoản
          </h3>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ➕ Tạo tài khoản mới
          </button>
        </div>
        <div style={{ 
          color: '#718096',
          fontSize: 16
        }}>
          {filteredUsers.length} tài khoản 
          {(searchTerm || roleFilter !== 'all') && (
            <span style={{ color: '#667eea', fontWeight: 600 }}>
              {searchTerm && `(tìm: "${searchTerm}")`}
              {roleFilter !== 'all' && ` (lọc: ${roleFilter})`}
            </span>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
        <Modal open={showCreateForm} onClose={() => setShowCreateForm(false)}>
          <CreateUserForm 
            onUserCreated={fetchUsers}
            onCancel={() => setShowCreateForm(false)}
          />
        </Modal>
      )}

      {/* Search và Sort Controls */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 24,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm theo email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 14,
              transition: 'all 0.3s ease',
              background: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Filter Dropdown */}
        <div style={{ minWidth: 150 }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 14,
              transition: 'all 0.3s ease',
              background: 'white',
              cursor: 'pointer'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="all">👥 Tất cả vai trò</option>
            <option value="admin">👑 Admin</option>
            <option value="teacher">👨‍🏫 Teacher</option>
            <option value="parent">👨‍👩‍👧‍👦 Parent</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleSort('email')}
            style={{
              padding: '10px 16px',
              background: sortBy === 'email' ? '#667eea' : 'rgba(102, 126, 234, 0.1)',
              color: sortBy === 'email' ? 'white' : '#667eea',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            Email {getSortIcon('email')}
          </button>
          
          <button
            onClick={() => handleSort('role')}
            style={{
              padding: '10px 16px',
              background: sortBy === 'role' ? '#667eea' : 'rgba(102, 126, 234, 0.1)',
              color: sortBy === 'role' ? 'white' : '#667eea',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            Vai trò {getSortIcon('role')}
          </button>
        </div>
      </div>

      {/* Users List */}
      <div style={{ display: 'grid', gap: 16 }}>
        {filteredUsers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#718096',
            fontSize: 16
          }}>
            {searchTerm || roleFilter !== 'all' 
              ? `Không tìm thấy tài khoản nào phù hợp với bộ lọc hiện tại.`
              : 'Chưa có tài khoản nào.'
            }
          </div>
        ) : filteredUsers.map(user => (
          <div key={user.id} style={{
            padding: 20,
            background: 'white',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            {editingUser && editingUser.id === user.id ? (
              <Modal open={!!editingUser} onClose={() => setEditingUser(null)}>
                <UpdateForm
                  data={editingUser}
                  exclude={['id', 'createdAt', 'uid']}
                  onChange={setEditingUser}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingUser(null)}
                  loading={processingId === editingUser.id}
                />
              </Modal>
            ) : (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 600, 
                    color: '#2d3748', 
                    fontSize: 16, 
                    wordBreak: 'break-all',
                    marginBottom: 4
                  }}>
                    {user.fullName || user.email}
                  </div>
                  <div style={{ 
                    color: '#718096', 
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4
                  }}>
                    <span>Email:</span>
                    <span style={{ color: '#2d3748' }}>{user.email}</span>
                  </div>
                  <div style={{ 
                    color: '#718096', 
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4
                  }}>
                    <span>Vai trò:</span>
                    <span style={{
                      padding: '4px 8px',
                      background: getRoleColor(user.role || 'teacher'),
                      color: 'white',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      {user.role || 'teacher'}
                    </span>
                  </div>
                  {user.phone && (
                    <div style={{ 
                      color: '#718096', 
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span>SĐT:</span>
                      <span style={{ color: '#2d3748' }}>{user.phone}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => handleEdit(user)}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(102, 126, 234, 0.1)',
                      color: '#667eea',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(102, 126, 234, 0.2)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(102, 126, 234, 0.1)'}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deletingId === user.id}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(229, 62, 62, 0.1)',
                      color: '#e53e3e',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: deletingId === user.id ? 0.6 : 1
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(229, 62, 62, 0.2)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(229, 62, 62, 0.1)'}
                  >
                    {deletingId === user.id ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <button onClick={setDeviceTokenForAllParents} style={{marginBottom: 20, background: '#38a169', color: 'white', padding: 10, borderRadius: 5}}>
        Thêm trường deviceToken cho tất cả phụ huynh
      </button>
    </div>
  );
} 