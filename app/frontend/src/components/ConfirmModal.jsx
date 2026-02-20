import React from 'react';
import './Modal.css';

/**
 * ConfirmModal - A confirmation dialog modal
 */
export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonStyle = {},
  cancelButtonStyle = {}
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0, fontSize: '14px', color: '#202223', lineHeight: '1.5' }}>
            {message}
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #e1e3e5'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #e1e3e5',
                borderRadius: '4px',
                background: 'white',
                color: '#202223',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background 0.2s',
                ...cancelButtonStyle
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f6f6f7';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                background: '#000000',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background 0.2s',
                ...confirmButtonStyle
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#3a3d40';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#000000';
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

