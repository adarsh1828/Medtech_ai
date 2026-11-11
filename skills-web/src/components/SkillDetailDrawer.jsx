import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Terminal, FileText, Sparkles, Layers, BookOpen, ExternalLink, Plus, CheckSquare } from 'lucide-react';

export default function SkillDetailDrawer({
  skill,
  onClose,
  onCopyCommand,
  onCopyPrompt,
  isInStack,
  onToggleStack
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'raw' | 'cli'
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!skill) return null;

  const handleCopyCli = () => {
    onCopyCommand(skill.installCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 1500);
  };

  const handleCopyPrompt = () => {
    onCopyPrompt(skill.rawMarkdown);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 1500);
  };

  // Helper to render markdown content with callouts, code blocks, and formatted lists
  const renderFormattedMarkdown = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code fences
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} style={{
              backgroundColor: '#090a0f',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '1rem',
              overflowX: 'auto',
              fontSize: '0.825rem',
              color: '#e2e8f0',
              margin: '1rem 0'
            }}>
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          );
          inCodeBlock = false;
          codeBlockContent = [];
        } else {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // GitHub Style Alerts: > [!NOTE], > [!WARNING], > [!TIP]
      if (line.startsWith('> [!NOTE]') || line.startsWith('> [!TIP]') || line.startsWith('> [!WARNING]') || line.startsWith('> [!IMPORTANT]')) {
        const alertType = line.includes('WARNING') ? 'warning' : line.includes('TIP') ? 'tip' : 'note';
        const alertLines = [];
        let j = i + 1;
        while (j < lines.length && lines[j].startsWith('>')) {
          alertLines.push(lines[j].replace(/^>\s?/, ''));
          j++;
        }
        i = j - 1;

        elements.push(
          <div key={`alert-${i}`} className={`alert-box alert-${alertType}`}>
            <div>
              <strong style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                {alertType}
              </strong>
              <div style={{ marginTop: '0.25rem' }}>{alertLines.join(' ')}</div>
            </div>
          </div>
        );
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} style={{ fontSize: '1.4rem', fontWeight: 700, margin: '1.25rem 0 0.5rem', color: '#ffffff' }}>{line.slice(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.25rem 0 0.5rem', color: '#f1f5f9', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} style={{ fontSize: '1.05rem', fontWeight: 600, margin: '1rem 0 0.4rem', color: '#e2e8f0' }}>{line.slice(4)}</h3>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={i} style={{ fontSize: '0.875rem', color: '#cbd5e1', marginLeft: '1.5rem', marginBottom: '0.35rem' }}>
            {line.slice(2)}
          </li>
        );
      } else if (line.match(/^\d+\.\s/)) {
        elements.push(
          <li key={i} style={{ fontSize: '0.875rem', color: '#cbd5e1', marginLeft: '1.5rem', marginBottom: '0.35rem' }}>
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={i} style={{ height: '0.5rem' }} />);
      } else {
        elements.push(
          <p key={i} style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '0.65rem' }}>
            {line}
          </p>
        );
      }
    }

    return elements;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Slide-over Right Panel */}
      <div className="drawer-panel">
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span className={`badge badge-${skill.category}`}>
                {skill.category}
              </span>
              <span className="mono-code" style={{ fontSize: '0.75rem', color: '#c4b5fd' }}>
                {skill.trigger}
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {skill.name}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="kbd">ESC</span>
            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{ padding: '0.5rem', borderRadius: '8px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sticky Action Toolbar */}
        <div style={{
          padding: '0.85rem 1.75rem',
          backgroundColor: '#12141c',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleCopyCli}
              className="btn btn-primary"
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.9rem' }}
            >
              {copiedCli ? <Check size={14} /> : <Terminal size={14} />}
              <span>{copiedCli ? 'Copied CLI Command!' : 'Copy npx Install Command'}</span>
            </button>

            <button
              onClick={handleCopyPrompt}
              className="btn btn-secondary"
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.9rem' }}
            >
              {copiedPrompt ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedPrompt ? 'Copied Markdown!' : 'Copy Raw Prompt'}</span>
            </button>
          </div>

          <button
            onClick={() => onToggleStack(skill.id)}
            className="btn btn-ghost"
            style={{
              fontSize: '0.825rem',
              padding: '0.45rem 0.75rem',
              color: isInStack ? '#c4b5fd' : 'var(--text-muted)'
            }}
          >
            {isInStack ? <CheckSquare size={16} color="#8b5cf6" /> : <Plus size={16} />}
            <span>{isInStack ? 'In My Stack' : 'Add to Stack'}</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 1.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.01)'
        }}>
          {[
            { id: 'overview', label: 'Rules & Overview', icon: BookOpen },
            { id: 'raw', label: 'Raw SKILL.md', icon: FileText },
            { id: 'cli', label: 'CLI & Setup Guide', icon: Terminal }
          ].map(tab => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: isTabActive ? '2px solid #8b5cf6' : '2px solid transparent',
                  color: isTabActive ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.75rem',
          color: 'var(--text-main)'
        }}>
          {activeTab === 'overview' && (
            <div>
              {/* Description callout */}
              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                color: '#e2e8f0',
                lineHeight: '1.5'
              }}>
                <strong style={{ color: '#ffffff' }}>Trigger: </strong>
                <code>{skill.trigger}</code>
                <div style={{ marginTop: '0.5rem' }}>{skill.description}</div>
              </div>

              {/* Parsed Body */}
              <div>{renderFormattedMarkdown(skill.body)}</div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                  File: <code>.agents/skills/{skill.id}/SKILL.md</code>
                </span>
                <button onClick={handleCopyPrompt} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                  <Copy size={12} /> Copy Raw Content
                </button>
              </div>
              <pre style={{
                backgroundColor: '#07080b',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '1.25rem',
                overflowX: 'auto',
                fontSize: '0.8rem',
                color: '#93c5fd',
                fontFamily: 'var(--font-mono)',
                lineHeight: '1.6'
              }}>
                <code>{skill.rawMarkdown}</code>
              </pre>
            </div>
          )}

          {activeTab === 'cli' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
                  1. Standalone / NPX Installation (Any AI Coding Agent)
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Installs this individual skill into your current repository's <code>.agents/skills/</code> directory:
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#090a0f',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem'
                }}>
                  <code style={{ fontSize: '0.85rem', color: '#c4b5fd' }}>{skill.installCommand}</code>
                  <button onClick={handleCopyCli} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
                  2. Claude Code Plugin Installation
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  If using Claude Code, install the full official Matt Pocock bundle as a managed plugin:
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#090a0f',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem'
                }}>
                  <code style={{ fontSize: '0.85rem', color: '#93c5fd' }}>claude plugins install mattpocock-skills</code>
                  <button onClick={() => onCopyCommand('claude plugins install mattpocock-skills')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: '8px'
              }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c4b5fd', marginBottom: '0.3rem' }}>
                  💡 Agent Invocation Tip
                </h5>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Once installed, simply type <code>{skill.trigger}</code> in your chat or prompt window with your coding agent (Claude Code, Cursor, or Antigravity) to activate this workflow!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
