import React from 'react';

export default function UpdateForm({ data, exclude = ['id', 'createdAt'], onChange, onSubmit, onCancel, loading, fields }) {
  if (!data) return null;

  const handleFieldChange = (key, value) => {
    onChange({ ...data, [key]: value });
  };

  const renderField = (key, value, fieldConfig) => {
    // Nếu có cấu hình field cụ thể
    if (fieldConfig) {
      switch (fieldConfig.type) {
        case 'date':
          return (
            <input
              type="date"
              value={value || ''}
              onChange={e => handleFieldChange(key, e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 16,
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          );
        
        case 'select':
          return (
            <select
              value={value || ''}
              onChange={e => handleFieldChange(key, e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 16,
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                background: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              {fieldConfig.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        
        case 'textarea':
          return (
            <textarea
              value={value || ''}
              onChange={e => handleFieldChange(key, e.target.value)}
              rows={fieldConfig.rows || 4}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 16,
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          );
        
        default:
          return (
            <input
              type={fieldConfig.type || 'text'}
              value={value || ''}
              onChange={e => handleFieldChange(key, e.target.value)}
              placeholder={fieldConfig.placeholder || `Nhập ${fieldConfig.label?.toLowerCase()}`}
              required={fieldConfig.required}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 16,
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          );
      }
    }

    // Xử lý các trường đặc biệt cũ
    if (key === 'role') {
      return (
        <select
          value={value || ''}
          onChange={e => handleFieldChange(key, e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: 12,
            fontSize: 16,
            transition: 'all 0.3s ease',
            boxSizing: 'border-box',
            background: 'white'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        >
          <option value="admin">👑 Admin</option>
          <option value="teacher">👨‍🏫 Giáo viên</option>
          <option value="parent">👨‍👩‍👧‍👦 Phụ huynh</option>
          <option value="student">👤 Học sinh</option>
        </select>
      );
    }

    if (key === 'linkedStudentIds') {
      return (
        <input
          type="text"
          value={Array.isArray(value) ? value.join(', ') : value || ''}
          onChange={e => {
            const ids = e.target.value.split(',').map(id => id.trim()).filter(id => id);
            handleFieldChange(key, ids);
          }}
          placeholder="Nhập ID học sinh, phân cách bằng dấu phẩy"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: 12,
            fontSize: 16,
            transition: 'all 0.3s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
      );
    }

    if (key === 'phone') {
      return (
        <input
          type="tel"
          value={value || ''}
          onChange={e => handleFieldChange(key, e.target.value)}
          placeholder="Nhập số điện thoại"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: 12,
            fontSize: 16,
            transition: 'all 0.3s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
      );
    }

    if (key === 'email') {
      return (
        <input
          type="email"
          value={value || ''}
          onChange={e => handleFieldChange(key, e.target.value)}
          placeholder="Nhập email"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: 12,
            fontSize: 16,
            transition: 'all 0.3s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
      );
    }

    // Trường mặc định
    return (
      <input
        type="text"
        value={value || ''}
        onChange={e => handleFieldChange(key, e.target.value)}
        placeholder={key}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: '2px solid #e2e8f0',
          borderRadius: 12,
          fontSize: 16,
          transition: 'all 0.3s ease',
          boxSizing: 'border-box'
        }}
        readOnly={key === 'uid'}
        disabled={key === 'uid'}
        onFocus={(e) => e.target.style.borderColor = '#667eea'}
        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
      />
    );
  };

  const getFieldLabel = (key) => {
    const labels = {
      fullName: 'Họ và tên',
      name: 'Tên',
      email: 'Email',
      role: 'Vai trò',
      phone: 'Số điện thoại',
      linkedStudentIds: 'ID học sinh liên kết',
      uid: 'ID người dùng',
      studentCode: 'Mã học sinh',
      classId: 'Mã lớp',
      dateOfBirth: 'Ngày sinh',
      gender: 'Giới tính',
      academicYear: 'Niên khóa'
    };
    return labels[key] || key;
  };

  // Nếu có cấu hình fields cụ thể, sử dụng nó
  if (fields) {
    return (
      <form
        onSubmit={e => { e.preventDefault(); onSubmit(); }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          alignItems: 'stretch',
          minWidth: 400
        }}
      >
        {fields.map(field => (
          <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ 
              fontWeight: 600, 
              color: '#2d3748',
              fontSize: 14
            }}>
              {field.label} {field.required && <span style={{ color: '#e53e3e' }}>*</span>}
            </label>
            {renderField(field.key, data[field.key], field)}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: loading 
                ? 'rgba(203, 213, 224, 0.8)' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Đang lưu...
              </>
            ) : (
              '💾 Lưu thay đổi'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'rgba(226, 232, 240, 0.8)',
              color: '#4a5568',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ❌ Hủy bỏ
          </button>
        </div>
      </form>
    );
  }

  // Fallback cho cách cũ
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(); }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignItems: 'stretch',
        minWidth: 300
      }}
    >
      {Object.keys(data).map(key => (
        !exclude.includes(key) && (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontWeight: 500, marginBottom: 2, color: '#2d3748' }}>
              {getFieldLabel(key)}
            </label>
            {renderField(key, data[key])}
          </div>
        )
      ))}
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 20px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '10px 20px',
            background: '#718096',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Hủy
        </button>
      </div>
    </form>
  );
} 