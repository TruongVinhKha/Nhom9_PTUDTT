import React, { useState } from 'react';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";
import { db } from '../../firebaseConfig';

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Lấy thông tin user từ Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || (userDoc.data().role !== "teacher" && userDoc.data().role !== "admin")) {
        await auth.signOut();
        setError("Chỉ giáo viên hoặc admin mới được phép đăng nhập.");
        setLoading(false);
        return;
      }
      // Nếu là teacher thì cho đăng nhập bình thường
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fade-in" style={{
      maxWidth: 450,
      margin: '40px auto',
      padding: '40px 30px',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: 24,
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      fontFamily: 'Segoe UI, Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 80,
          height: 80,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
        }}>
          <span style={{ fontSize: 32, color: 'white' }}>📚</span>
        </div>
        <h2 style={{ 
          color: '#2d3748', 
          margin: '0 0 8px 0',
          fontSize: 28,
          fontWeight: 700
        }}>EduTrack</h2>
        <div style={{ 
          color: '#718096', 
          fontSize: 16,
          fontWeight: 500
        }}>Hệ thống quản lý giáo dục</div>
      </div>

      <form onSubmit={handleLogin} style={{ width: '100%' }}>
        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Mật khẩu</label>
          <input
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {error && (
          <div style={{ 
            color: '#e53e3e', 
            marginBottom: 20,
            padding: '12px 16px',
            background: '#fed7d7',
            borderRadius: 12,
            border: '1px solid #feb2b2',
            fontSize: 14,
            fontWeight: 500
          }}>
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '16px',
            fontSize: 16,
            fontWeight: 600
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 20,
                height: 20,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          onClick={onSwitchToRegister}
          className="btn btn-secondary"
          style={{
            background: 'none',
            border: 'none',
            color: '#667eea',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
            padding: 0
          }}
        >
          Chưa có tài khoản? Đăng ký ngay
        </button>
      </div>
    </div>
  );
}
