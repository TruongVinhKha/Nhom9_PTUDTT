import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
      boxSizing: 'border-box'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" alt="EduTrack" style={{ width: 64, marginBottom: 8 }} />
        <h2 style={{ color: '#2d6cdf', margin: 0 }}>Đăng nhập hệ thống</h2>
        <div style={{ color: '#888', fontSize: 15 }}>Dành cho giáo viên</div>
      </div>

      <form onSubmit={handleLogin} style={{ width: '100%' }}>
        <div style={{ marginBottom: 16 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 16,
              marginBottom: 8,
              boxSizing: 'border-box'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 16,
              boxSizing: 'border-box'
            }}
            required
          />
        </div>

        {error && (
          <div style={{ 
            color: '#dc3545', 
            marginBottom: 16,
            padding: '8px 12px',
            background: '#fff5f5',
            borderRadius: 6,
            border: '1px solid #ffd7d7',
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#ccc' : '#2d6cdf',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            ':hover': {
              background: loading ? '#ccc' : '#1a5bbf'
            }
          }}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          onClick={onSwitchToRegister}
          style={{
            background: 'none',
            border: 'none',
            color: '#2d6cdf',
            cursor: 'pointer',
            fontSize: 14,
            padding: 0
          }}
        >
          Chưa có tài khoản? Đăng ký ngay
        </button>
      </div>
    </div>
  );
}
