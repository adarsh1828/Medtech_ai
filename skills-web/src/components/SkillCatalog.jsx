import React, { useState, useMemo } from 'react';
import { categories } from '../data/skillsData';
import SkillCard from './SkillCard';
import { Search, Sparkles, Filter, GitMerge, Layers, CheckCircle2, Cpu, Feather, X } from 'lucide-react';

const categoryIcons = {
  Sparkles: Sparkles,
  GitMerge: GitMerge,
  Layers: Layers,
  CheckCircle2: CheckCircle2,
  Cpu: Cpu,
  Feather: Feather,
};

export default function SkillCatalog({
  skills,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  activeStage,
  onClearStage,
  selectedSkillIds,
  onToggleStack,
  onInspectSkill,
  onCopyCommand
}) {
  // Filtered skills based on active category, active stage, and search query
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      // Category filter
      if (activeCategory !== 'all' && skill.category !== activeCategory) {
        return false;
      }

      // Stage filter (from workflow spine)
      if (activeStage) {
        if (activeStage === 'grill' && !['grill-me', 'grill-with-docs', 'grilling'].includes(skill.id)) return false;
        if (activeStage === 'spec' && skill.id !== 'to-spec') return false;
        if (activeStage === 'tickets' && skill.id !== 'to-tickets') return false;
        if (activeStage === 'tdd' && !['tdd', 'implement', 'implement-spec'].includes(skill.id)) return false;
        if (activeStage === 'review' && skill.id !== 'code-review') return false;
        if (activeStage === 'pr' && skill.id !== 'pr') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = skill.name.toLowerCase().includes(q);
        const matchId = skill.id.toLowerCase().includes(q);
        const matchDesc = skill.description.toLowerCase().includes(q);
        const matchTrigger = skill.trigger.toLowerCase().includes(q);
        return matchName || matchId || matchDesc || matchTrigger;
      }

      return true;
    });
  }, [skills, activeCategory, activeStage, searchQuery]);

  return (
    <section style={{ marginBottom: '5rem' }}>
      {/* Category Pills & Search Bar Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Top Controls: Search Bar & Count */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Explore All Agent Skills
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Select skills to inspect full agent prompts or bundle them for instant installation.
            </p>
          </div>

          {/* Inline Filter Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '0.5rem 0.85rem',
            gap: '0.6rem',
            width: 'min(360px, 100%)'
          }}>
            <Search size={16} color="var(--text-faint)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter by name, trigger..."
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '0.85rem',
                flex: 1
              }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="btn btn-ghost"
                style={{ padding: '0.15rem', color: 'var(--text-faint)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1rem'
        }}>
          {categories.map(cat => {
            const Icon = categoryIcons[cat.icon] || Sparkles;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '9999px',
                  fontSize: '0.825rem',
                  fontWeight: 500,
                  backgroundColor: isActive ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid var(--border-subtle)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} color={isActive ? '#a78bfa' : 'currentColor'} />
                <span>{cat.label}</span>
                <span style={{
                  fontSize: '0.72rem',
                  backgroundColor: isActive ? '#8b5cf6' : 'rgba(255, 255, 255, 0.06)',
                  color: isActive ? '#ffffff' : 'var(--text-faint)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  fontWeight: 600
                }}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Stage Indicator (if filtered via spine) */}
        {activeStage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0.85rem',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            fontSize: '0.825rem',
            color: '#c4b5fd'
          }}>
            <span>Filtered by Lifecycle Stage: <strong>{activeStage.toUpperCase()}</strong></span>
            <button
              onClick={onClearStage}
              className="btn btn-ghost"
              style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem', color: '#ffffff' }}
            >
              <X size={13} /> Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Bento Grid */}
      {filteredSkills.length === 0 ? (
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px'
        }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.5rem' }}>
            No skills match your filters
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Try resetting your search query or switching categories.
          </p>
          <button
            onClick={() => {
              onSearchChange('');
              onSelectCategory('all');
              if (onClearStage) onClearStage();
            }}
            className="btn btn-secondary"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}>
          {filteredSkills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              isSelectedInStack={selectedSkillIds.includes(skill.id)}
              onToggleStack={onToggleStack}
              onInspect={onInspectSkill}
              onCopyCommand={onCopyCommand}
            />
          ))}
        </div>
      )}
    </section>
  );
}
