import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateUserForm({ onUserCreated, onCancel }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'teacher',
    phone: '',
    linkedStudentIds: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Monitor session admin
  useEffect(() => {
    const checkSession = () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('🔍 Session admin vẫn active:', currentUser.uid);
      } else {
        console.warn('⚠️ Session admin bị mất!');
      }
    };

    // Kiểm tra session mỗi 5 giây
    const interval = setInterval(checkSession, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const checkAdminSession = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Không tìm thấy thông tin admin hiện tại');
    }
    
    // Kiểm tra thêm thông tin user từ Firestore
    return currentUser;
  };

  const createUserWithRestAPI = async (userData) => {
    // Sử dụng Firebase Auth REST API để tạo user mà không tự động login
    const apiKey = 'AIzaSyBRwr2f1AdOWfj5vqaKjWGAct_ncrwngIo';
    
    try {
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          returnSecureToken: false, // Không trả về token để tránh login
          returnIdpCredential: false // Không trả về credential
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Xử lý lỗi chi tiết hơn
        const errorMessage = result.error?.message || 'Lỗi khi tạo tài khoản';
        console.error('Firebase Auth REST API Error:', result.error);
        throw new Error(errorMessage);
      }

      // Kiểm tra kết quả
      if (!result.localId) {
        throw new Error('Không nhận được UID từ Firebase');
      }

      console.log('✅ Tạo user thành công qua REST API:', result.localId);
      return result;
      
    } catch (error) {
      console.error('❌ Lỗi khi gọi REST API:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Kiểm tra quyền admin và lưu thông tin
      const currentUser = checkAdminSession();
      
      console.log('🔍 Kiểm tra session admin:', {
        uid: currentUser.uid,
        email: currentUser.email,
        isAnonymous: currentUser.isAnonymous
      });

      // Tạo user thông qua REST API (không tự động login)
      console.log('🚀 Bắt đầu tạo user:', formData.email);
      const result = await createUserWithRestAPI({
        email: formData.email,
        password: formData.password
      });

      const uid = result.localId;
      console.log('✅ Nhận được UID:', uid);

      // Kiểm tra lại session admin sau khi tạo user
      const adminAfterCreate = auth.currentUser;
      if (!adminAfterCreate || adminAfterCreate.uid !== currentUser.uid) {
        console.error('❌ Session admin bị mất sau khi tạo user!');
        throw new Error('Session admin bị mất. Vui lòng đăng nhập lại.');
      }

      // Tạo document trong Firestore với quyền admin hiện tại
      const userData = {
        uid: uid,
        fullName: formData.fullName,
        role: formData.role,
        email: formData.email,
        phone: formData.phone || null,
        linkedStudentIds: formData.role === 'parent' ? formData.linkedStudentIds : [],
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid
      };

      console.log('📝 Tạo document Firestore:', userData);
      await setDoc(doc(db, 'users', uid), userData);
      console.log('✅ Tạo document Firestore thành công');

      setSuccess('Tạo tài khoản thành công! Tài khoản này có thể đăng nhập vào hệ thống.');
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        fullName: '',
        role: 'teacher',
        phone: '',
        linkedStudentIds: []
      });

      // Callback để refresh danh sách users
      if (onUserCreated) {
        console.log('🔄 Gọi callback refresh danh sách users');
        onUserCreated();
      }

      // Auto close sau 2 giây
      setTimeout(() => {
        if (onCancel) onCancel();
      }, 2000);

    } catch (err) {
      console.error('❌ Error creating user:', err);
      
      // Xử lý lỗi cụ thể
      if (err.message.includes('EMAIL_EXISTS')) {
        setError('Email này đã được sử dụng. Vui lòng chọn email khác.');
      } else if (err.message.includes('WEAK_PASSWORD')) {
        setError('Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn.');
      } else if (err.message.includes('INVALID_EMAIL')) {
        setError('Email không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (err.message.includes('MISSING_PASSWORD')) {
        setError('Mật khẩu không được để trống.');
      } else if (err.message.includes('INVALID_PASSWORD')) {
        setError('Mật khẩu không hợp lệ.');
      } else if (err.message.includes('permissions')) {
        setError('Lỗi quyền truy cập. Vui lòng thử lại.');
      } else if (err.message.includes('Session admin bị mất')) {
        setError('Phiên đăng nhập bị mất. Vui lòng đăng nhập lại.');
      } else {
        setError('Lỗi khi tạo tài khoản: ' + err.message);
      }
    }

    setLoading(false);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'teacher': return '👨‍🏫';
      case 'parent': return '👨‍👩‍👧‍👦';
      case 'student': return '👤';
      default: return '👤';
    }
  };

  return (
    <div className="fade-in" style={{
      maxWidth: 600,
      margin: '20px auto',
      padding: '40px',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: 24,
      boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.05)',
      border: '1px solid rgba(255,255,255,0.2)',
      backdropFilter: 'blur(10px)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 80,
          height: 80,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 12px 32px rgba(102, 126, 234, 0.3)',
          animation: 'pulse 2s infinite'
        }}>
          <span style={{ fontSize: 36, color: 'white' }}>👤</span>
        </div>
        <h2 style={{ 
          color: '#1a202c', 
          margin: '0 0 8px 0',
          fontSize: 32,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Tạo tài khoản mới
        </h2>
        <p style={{ 
          color: '#718096', 
          fontSize: 16,
          fontWeight: 500,
          margin: 0
        }}>
          Thêm người dùng mới vào hệ thống EduTrack
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Email */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ 
              display: 'block',
              fontWeight: 600, 
              color: '#2d3748',
              marginBottom: 8,
              fontSize: 14
            }}>
              📧 Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="example@email.com"
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 16,
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ 
              display: 'block',
              fontWeight: 600, 
              color: '#2d3748',
              marginBottom: 8,
              fontSize: 14
            }}>
              🔒 Mật khẩu *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Tối thiểu 6 ký tự"
              minLength={6}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 16,
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Full Name */}
          <div>
            <label style={{ 
              display: 'block',
              fontWeight: 600, 
              color: '#2d3748',
              marginBottom: 8,
              fontSize: 14
            }}>
              👤 Họ và tên *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              placeholder="Nguyễn Văn A"
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 16,
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{ 
              display: 'block',
              fontWeight: 600, 
              color: '#2d3748',
              marginBottom: 8,
              fontSize: 14
            }}>
              📱 Số điện thoại
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="0123456789"
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 16,
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Role */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ 
              display: 'block',
              fontWeight: 600, 
              color: '#2d3748',
              marginBottom: 8,
              fontSize: 14
            }}>
              🎭 Vai trò *
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 12
            }}>
              {[
                { value: 'admin', label: 'Admin', icon: '👑' },
                { value: 'teacher', label: 'Giáo viên', icon: '👨‍🏫' },
                { value: 'parent', label: 'Phụ huynh', icon: '👨‍👩‍👧‍👦' },
                { value: 'student', label: 'Học sinh', icon: '👤' }
              ].map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                  style={{
                    padding: '16px 12px',
                    border: `2px solid ${formData.role === role.value ? '#667eea' : '#e2e8f0'}`,
                    borderRadius: 12,
                    background: formData.role === role.value 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'rgba(255,255,255,0.8)',
                    color: formData.role === role.value ? 'white' : '#4a5568',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <span style={{ fontSize: 20 }}>{role.icon}</span>
                  <span>{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Linked Student IDs for Parent */}
          {formData.role === 'parent' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ 
                display: 'block',
                fontWeight: 600, 
                color: '#2d3748',
                marginBottom: 8,
                fontSize: 14
              }}>
                🎓 ID học sinh liên kết
              </label>
              <input
                type="text"
                name="linkedStudentIds"
                value={formData.linkedStudentIds.join(', ')}
                onChange={(e) => {
                  const ids = e.target.value.split(',').map(id => id.trim()).filter(id => id);
                  setFormData(prev => ({ ...prev, linkedStudentIds: ids }));
                }}
                placeholder="student001, student002, student003"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: 12,
                  fontSize: 16,
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div style={{ 
                color: '#718096', 
                fontSize: 12, 
                marginTop: 8,
                fontStyle: 'italic'
              }}>
                Nhập ID học sinh mà phụ huynh này sẽ quản lý, phân cách bằng dấu phẩy
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            color: '#e53e3e', 
            marginBottom: 24, 
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
            borderRadius: 12,
            border: '1px solid #fc8181',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{ 
            color: '#38a169', 
            marginBottom: 24, 
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%)',
            borderRadius: 12,
            border: '1px solid #68d391',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 18 }}>✅</span>
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: 16, 
          marginTop: 32,
          justifyContent: 'center'
        }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '16px 32px',
              background: 'rgba(226, 232, 240, 0.8)',
              color: '#4a5568',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              minWidth: 140
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = 'rgba(203, 213, 224, 0.8)')}
            onMouseLeave={(e) => !loading && (e.target.style.background = 'rgba(226, 232, 240, 0.8)')}
          >
            Hủy bỏ
          </button>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '16px 32px',
              background: loading 
                ? 'rgba(203, 213, 224, 0.8)' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 8px 25px rgba(102, 126, 234, 0.3)',
              minWidth: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
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
                Đang tạo...
              </>
            ) : (
              <>
                <span>✨</span>
                Tạo tài khoản
              </>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
} 