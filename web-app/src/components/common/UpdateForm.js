import React from 'react';

export default function UpdateForm({ data, exclude = ['id', 'createdAt'], onChange, onSubmit, onCancel, loading }) {
  if (!data) return null;

  const handleFieldChange = (key, value) => {
    onChange({ ...data, [key]: value });
  };

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
            <label style={{ fontWeight: 500, marginBottom: 2 }}>{key}</label>
            <input
              type="text"
              value={data[key] ?? ''}
              onChange={e => handleFieldChange(key, e.target.value)}
              placeholder={key}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #667eea',
                borderRadius: 8,
                fontSize: 14
              }}
              readOnly={key === 'uid'}
              disabled={key === 'uid'}
            />
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