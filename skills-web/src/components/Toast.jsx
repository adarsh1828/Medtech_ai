import React from 'react';
import { Check, Copy } from 'lucide-react';

export default function Toast({ message, visible }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '5.5rem',
        right: '2rem',
        zIndex: 100,
        backgroundColor: '#18181b',
        border: '1px solid #3f3f46',
        color: '#f4f4f5',
        padding: '0.75rem 1.25rem',
        borderRadius: '10px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(139, 92, 246, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        color: '#34d399',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Check size={13} strokeWidth={3} />
      </div>
      <span>{message}</span>
    </div>
  );
}
