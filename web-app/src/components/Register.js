import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function Register({ onSwitchToLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: 400,
      margin: '60px auto',
      padding: '32px 24px',
      background: 'rgba(255,255,255,0.95)',
      borderRadius: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      border: '1px solid #e3e3e3',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            left: 16,
            top: 16,
            background: '#eaf2fb',
            border: 'none',
            borderRadius: 8,
            padding: '6px 14px',
            color: '#2d6cdf',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 4px #e3eefd',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          ← Quay lại
        </button>
      )}
      <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: onBack ? '40px' : 0 }}>
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" alt="EduTrack" style={{ width: 64, marginBottom: 8 }} />
        <h2 style={{ color: '#2d6cdf', margin: 0 }}>Đăng ký tài khoản</h2>
        <div style={{ color: '#888', fontSize: 15 }}>Dành cho giáo viên</div>
      </div>

      <form onSubmit={handleRegister} style={{ width: '100%' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ 
            display: 'block',
            fontWeight: 500, 
            color: '#2d6cdf',
            marginBottom: 8
          }}>
            Email
          </label>
          <input
            type="email"
            placeholder="Nhập email giáo viên"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: 8, 
              border: '1px solid #bcd0ee', 
              fontSize: 16,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block',
            fontWeight: 500, 
            color: '#2d6cdf',
            marginBottom: 8
          }}>
            Mật khẩu
          </label>
          <input
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: 8, 
              border: '1px solid #bcd0ee', 
              fontSize: 16,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
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
            ':hover': {
              background: loading ? '#bcd0ee' : '#1a5bbf'
            }
          }}
        >
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>

      {error && (
        <div style={{ 
          color: '#dc3545', 
          marginTop: 16, 
          textAlign: 'center',
          background: '#fff5f5',
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #ffd7d7',
          fontSize: 14
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          color: '#28a745', 
          marginTop: 16, 
          textAlign: 'center',
          background: '#f0fff4',
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #c3e6cb',
          fontSize: 14
        }}>
          {success}
        </div>
      )}

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <span style={{ color: '#888' }}>Đã có tài khoản?</span>{' '}
        <button 
          onClick={onSwitchToLogin} 
          style={{ 
            color: '#2d6cdf', 
            background: 'none', 
            border: 'none', 
            fontWeight: 600, 
            cursor: 'pointer', 
            fontSize: 15,
            padding: 0
          }}
        >
          Đăng nhập
        </button>
      </div>
    </div>
  );
}
