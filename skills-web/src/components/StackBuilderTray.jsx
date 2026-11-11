import React, { useState } from 'react';
import { Terminal, Copy, Check, X, Layers, Trash2 } from 'lucide-react';

export default function StackBuilderTray({
  selectedSkillIds,
  onRemoveSkill,
  onClearStack,
  onCopyCommand
}) {
  const [copied, setCopied] = useState(false);

  if (selectedSkillIds.length === 0) return null;

  const batchCommand = `npx skills add mattpocock/skills ${selectedSkillIds.join(' ')}`;

  const handleCopy = () => {
    onCopyCommand(batchCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 45,
      width: 'min(900px, 94vw)',
      backgroundColor: 'rgba(18, 19, 26, 0.95)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(139, 92, 246, 0.4)',
      borderRadius: '16px',
      padding: '0.85rem 1.25rem',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(139, 92, 246, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
      animation: 'slideInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Left count & selected pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '260px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: '#8b5cf6',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            {selectedSkillIds.length}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
            Custom Stack:
          </span>
        </div>

        {/* Selected skill pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', maxHeight: '60px', overflowY: 'auto' }}>
          {selectedSkillIds.map(id => (
            <span
              key={id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#c4b5fd',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <span>{id}</span>
              <button
                onClick={() => onRemoveSkill(id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <button
          onClick={onClearStack}
          className="btn btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem', color: 'var(--text-faint)' }}
          title="Clear all selected skills"
        >
          <Trash2 size={13} />
          <span>Clear</span>
        </button>

        <button
          onClick={handleCopy}
          className="btn btn-primary"
          style={{ fontSize: '0.825rem', padding: '0.45rem 1rem', gap: '0.45rem' }}
        >
          {copied ? <Check size={14} /> : <Terminal size={14} />}
          <span>{copied ? 'Copied Batch CLI!' : 'Copy Batch Install Command'}</span>
        </button>
      </div>
    </div>
  );
}
