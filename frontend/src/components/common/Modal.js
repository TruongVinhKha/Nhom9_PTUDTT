import React from 'react';

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      zIndex: 1000,
      left: 0, top: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: 60,
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: 32,
        minWidth: 350,
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12, right: 16,
            background: 'none',
            border: 'none',
            fontSize: 22,
            color: '#888',
            cursor: 'pointer'
          }}
          aria-label="Đóng"
        >×</button>
        {children}
      </div>
    </div>
  );
} 