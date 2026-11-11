import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, ArrowRight, CornerDownLeft, X, Copy, Check } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, skills, onSelectSkill, onCopyCommand }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = skills.filter(skill => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      skill.id.toLowerCase().includes(q) ||
      skill.name.toLowerCase().includes(q) ||
      skill.description.toLowerCase().includes(q) ||
      skill.trigger.toLowerCase().includes(q) ||
      skill.category.toLowerCase().includes(q) ||
      (skill.stage && skill.stage.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard events (ArrowUp, ArrowDown, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelectSkill(filtered[selectedIndex].id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose, onSelectSkill]);

  if (!isOpen) return null;

  const handleCopy = (e, skill) => {
    e.stopPropagation();
    onCopyCommand(skill.installCommand);
    setCopiedId(skill.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 92vw)',
          backgroundColor: '#12131a',
          border: '1px solid var(--border-card)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(139, 92, 246, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
          animation: 'fadeIn 0.15s ease-out'
        }}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <Search size={18} color="#94a3b8" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a skill name, trigger (e.g. /grill-me), or problem..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '1rem',
              fontFamily: 'var(--font-sans)'
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="btn btn-ghost"
              style={{ padding: '0.2rem', color: 'var(--text-faint)' }}
            >
              <X size={15} />
            </button>
          )}
          <span className="kbd">ESC</span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            overflowY: 'auto',
            padding: '0.5rem',
            flex: 1
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.9rem' }}>No skills match "{query}"</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '0.35rem' }}>
                Try searching for "tdd", "spec", "bugs", or "refactoring"
              </p>
            </div>
          ) : (
            filtered.map((skill, index) => {
              const isSelected = index === selectedIndex;
              const isCopied = copiedId === skill.id;

              return (
                <div
                  key={skill.id}
                  onClick={() => {
                    onSelectSkill(skill.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    marginBottom: '0.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                    <span className="mono-code" style={{
                      fontSize: '0.75rem',
                      color: isSelected ? '#ffffff' : '#a78bfa',
                      fontWeight: 600
                    }}>
                      {skill.trigger}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                          {skill.name}
                        </span>
                        <span className={`badge badge-${skill.category}`} style={{ fontSize: '0.65rem' }}>
                          {skill.category}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '0.1rem'
                      }}>
                        {skill.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.75rem' }}>
                    <button
                      onClick={(e) => handleCopy(e, skill)}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                      title="Copy npx install command"
                    >
                      {isCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{isCopied ? 'Copied' : 'CLI'}</span>
                    </button>
                    {isSelected && <CornerDownLeft size={14} color="#a78bfa" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '0.65rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-faint)'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span><span className="kbd">↑↓</span> to navigate</span>
            <span><span className="kbd">↵</span> to inspect</span>
            <span><span className="kbd">ESC</span> to close</span>
          </div>
          <span>{filtered.length} skills found</span>
        </div>
      </div>
    </div>
  );
}
