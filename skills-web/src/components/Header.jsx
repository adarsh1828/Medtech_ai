import React from 'react';
import { Search, Terminal, Sparkles, ExternalLink, Command, ShieldCheck, Code2, Building2 } from 'lucide-react';

function GitHubIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Header({ onOpenCommandPalette, totalSkills, onCopyAll }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'rgba(9, 9, 11, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
        gap: '1.5rem'
      }}>
        {/* Logo & Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #3178c6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
            color: '#ffffff'
          }}>
            <Terminal size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{
                fontSize: '1.15rem',
                fontWeight: '700',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline'
              }}>
                Matt Pocock Skills
              </h1>
              <span className="badge badge-spine" style={{ fontSize: '0.7rem' }}>
                <Sparkles size={11} /> v1.0 • 39 Skills
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Engineering-grade agent workflows for Claude Code & Cursor
            </p>
          </div>
        </div>

        {/* Global Search Trigger (CMD+K) */}
        <button
          onClick={onOpenCommandPalette}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '0.55rem 1rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            minWidth: '280px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-highlight)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
          }}
        >
          <Search size={16} />
          <span style={{ fontSize: '0.85rem', flex: 1, textAlign: 'left' }}>Search 39 skills, rules & triggers...</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span className="kbd">⌘K</span>
          </div>
        </button>

        {/* Action Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a
            href="/"
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', gap: '0.4rem', color: '#93c5fd' }}
            title="Switch back to Hospital Command Center"
          >
            <Building2 size={15} />
            <span className="hide-on-mobile">Hospital Portal</span>
          </a>

          <button
            onClick={onCopyAll}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
            title="Copy CLI command to install all 39 skills"
          >
            <Terminal size={14} />
            <span>Install All</span>
          </button>

          <a
            href="https://github.com/mattpocock/skills"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ padding: '0.5rem', borderRadius: '8px' }}
            title="View Official GitHub Repository"
          >
            <GitHubIcon size={19} />
          </a>
        </div>
      </div>
    </header>
  );
}
