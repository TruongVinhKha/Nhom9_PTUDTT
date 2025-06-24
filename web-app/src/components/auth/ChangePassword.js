import React, { useState } from 'react';
import { auth } from '../../firebaseConfig';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';

export default function ChangePassword({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleChangePassword}
      style={{
        minWidth: 340,
        maxWidth: 400,
        margin: '0 auto',
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        padding: '32px 28px 24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        alignItems: 'stretch',
        fontFamily: 'Segoe UI, Arial, sans-serif',
      }}
    >
      <h2 style={{
        color: '#2d6cdf',
        margin: 0,
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: 700,
        fontSize: 24
      }}>Đổi mật khẩu</h2>
      <div style={{ color: '#888', fontSize: 15, textAlign: 'center', marginBottom: 8 }}>
        Vui lòng nhập đầy đủ thông tin bên dưới
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontWeight: 500, color: '#2d6cdf', marginBottom: 2 }}>Mật khẩu hiện tại</label>
        <input
          type="password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
          placeholder="Nhập mật khẩu hiện tại"
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1.5px solid #bcd0ee',
            fontSize: 16,
            boxSizing: 'border-box',
            background: '#f7fafd',
            outline: 'none',
            transition: 'border 0.2s',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontWeight: 500, color: '#2d6cdf', marginBottom: 2 }}>Mật khẩu mới</label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          placeholder="Nhập mật khẩu mới"
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1.5px solid #bcd0ee',
            fontSize: 16,
            boxSizing: 'border-box',
            background: '#f7fafd',
            outline: 'none',
            transition: 'border 0.2s',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontWeight: 500, color: '#2d6cdf', marginBottom: 2 }}>Xác nhận mật khẩu mới</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          placeholder="Xác nhận mật khẩu mới"
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1.5px solid #bcd0ee',
            fontSize: 16,
            boxSizing: 'border-box',
            background: '#f7fafd',
            outline: 'none',
            transition: 'border 0.2s',
          }}
        />
      </div>
      {error && (
        <div style={{
          color: '#dc3545',
          marginTop: 4,
          textAlign: 'center',
          background: '#fff5f5',
          padding: '10px 14px',
          borderRadius: 8,
          border: '1.5px solid #ffd7d7',
          fontSize: 15,
          fontWeight: 500
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          color: '#28a745',
          marginTop: 4,
          textAlign: 'center',
          background: '#f0fff4',
          padding: '10px 14px',
          borderRadius: 8,
          border: '1.5px solid #c3e6cb',
          fontSize: 15,
          fontWeight: 500
        }}>
          {success}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 1,
            background: loading ? '#bcd0ee' : '#2d6cdf',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            padding: 12,
            fontSize: 17,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px #e3eefd',
            transition: 'all 0.2s ease',
            letterSpacing: 0.5
          }}
        >
          {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            background: '#e3e3e3',
            color: '#2d6cdf',
            border: 'none',
            borderRadius: 8,
            padding: 12,
            fontWeight: 600,
            fontSize: 17,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #e3eefd',
            transition: 'all 0.2s ease',
            letterSpacing: 0.5
          }}
        >
          Hủy
        </button>
      </div>
    </form>
  );
} 