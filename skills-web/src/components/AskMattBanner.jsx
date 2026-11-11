import React, { useState } from 'react';
import { askMattSituations } from '../data/skillsData';
import { Compass, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';

export default function AskMattBanner({ onSelectSkill }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div style={{
      marginBottom: '2rem',
      padding: '1.25rem 1.5rem',
      backgroundColor: 'rgba(20, 22, 29, 0.6)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Lightbulb size={16} />
          </div>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f1f5f9' }}>
            Ask Matt: What are you trying to accomplish right now?
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
          Click any scenario to jump to the exact skill
        </span>
      </div>

      {/* Situations Pills */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        {askMattSituations.map((item, idx) => (
          <button
            key={item.skillId}
            onClick={() => onSelectSkill(item.skillId)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: hoveredIdx === idx ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: hoveredIdx === idx ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-subtle)',
              padding: '0.4rem 0.8rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              color: hoveredIdx === idx ? '#ffffff' : '#cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={item.note}
          >
            <span>{item.label}</span>
            <ArrowRight size={12} style={{ opacity: hoveredIdx === idx ? 1 : 0.4 }} />
          </button>
        ))}
      </div>
    </div>
  );
}
