import React, { useState } from 'react';
import { Terminal, Copy, Check, ChevronRight, CheckSquare, Square, Layers, GitMerge, CheckCircle2, Cpu, Feather } from 'lucide-react';

const categoryIcons = {
  spine: GitMerge,
  architecture: Layers,
  testing: CheckCircle2,
  orchestration: Cpu,
  writing: Feather,
};

export default function SkillCard({
  skill,
  isSelectedInStack,
  onToggleStack,
  onInspect,
  onCopyCommand
}) {
  const [isCopied, setIsCopied] = useState(false);
  const Icon = categoryIcons[skill.category] || Terminal;

  const handleCopy = (e) => {
    e.stopPropagation();
    onCopyCommand(skill.installCommand);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggleStack(skill.id);
  };

  return (
    <div
      onClick={() => onInspect(skill.id)}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: isSelectedInStack ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid var(--border-subtle)',
        borderRadius: '14px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isSelectedInStack ? 'rgba(139, 92, 246, 0.8)' : 'var(--border-card)';
        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isSelectedInStack ? 'rgba(139, 92, 246, 0.5)' : 'var(--border-subtle)';
        e.currentTarget.style.backgroundColor = 'var(--bg-card)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div>
        {/* Top bar with category badge & checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span className={`badge badge-${skill.category}`}>
              <Icon size={12} />
              <span style={{ textTransform: 'capitalize' }}>{skill.category}</span>
            </span>
            {skill.stage && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                {skill.stage}
              </span>
            )}
          </div>

          {/* Select for Stack Builder */}
          <button
            onClick={handleToggle}
            className="btn btn-ghost"
            style={{
              padding: '0.2rem',
              color: isSelectedInStack ? '#a78bfa' : 'var(--text-faint)',
              borderRadius: '6px'
            }}
            title={isSelectedInStack ? 'Remove from Stack' : 'Add to Multi-Install Stack'}
          >
            {isSelectedInStack ? (
              <CheckSquare size={18} color="#8b5cf6" />
            ) : (
              <Square size={18} />
            )}
          </button>
        </div>

        {/* Title and Trigger */}
        <div style={{ marginBottom: '0.65rem' }}>
          <h3 style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#f8fafc',
            letterSpacing: '-0.01em',
            marginBottom: '0.3rem'
          }}>
            {skill.name}
          </h3>
          <span className="mono-code" style={{ fontSize: '0.75rem', color: '#c4b5fd' }}>
            {skill.trigger}
          </span>
        </div>

        {/* Description snippet */}
        <p style={{
          fontSize: '0.825rem',
          color: 'var(--text-muted)',
          lineHeight: '1.45',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          {skill.description}
        </p>
      </div>

      {/* Bottom actions */}
      <div style={{
        paddingTop: '0.85rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem'
      }}>
        <button
          onClick={handleCopy}
          className="btn btn-secondary"
          style={{
            padding: '0.35rem 0.65rem',
            fontSize: '0.75rem',
            gap: '0.35rem'
          }}
          title={skill.installCommand}
        >
          {isCopied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
          <span>{isCopied ? 'Copied' : 'CLI Install'}</span>
        </button>

        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
          fontWeight: 500
        }}>
          Inspect <ChevronRight size={14} />
        </span>
      </div>
    </div>
  );
}
