import React from 'react';
import { pipelineStages } from '../data/skillsData';
import { ArrowRight, ChevronRight, CheckCircle2, FileText, Code2, GitPullRequest, HelpCircle, X } from 'lucide-react';

const stageIcons = {
  grill: HelpCircle,
  spec: FileText,
  tickets: CheckCircle2,
  tdd: Code2,
  review: CheckCircle2,
  pr: GitPullRequest,
};

export default function WorkflowSpine({ activeStage, onSelectStage, onSelectSkill }) {
  const currentStageInfo = pipelineStages.find(s => s.id === activeStage);

  return (
    <section style={{
      marginTop: '2rem',
      marginBottom: '2rem',
      backgroundColor: 'rgba(16, 17, 22, 0.75)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '16px',
      padding: '1.75rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow behind spine */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        left: '20%',
        width: '350px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header of Spine */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4b5fd' }}>
              The Canonical Spine
            </span>
            <span style={{ color: 'var(--text-faint)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Idea-to-Ship Agent Workflow
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            How Matt Pocock Skills Chain Together
          </h2>
        </div>

        {activeStage && (
          <button
            onClick={() => onSelectStage(null)}
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
          >
            <X size={14} /> Clear Stage Filter
          </button>
        )}
      </div>

      {/* Interactive Horizontal Pipeline */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
        alignItems: 'stretch'
      }}>
        {pipelineStages.map((stage, idx) => {
          const Icon = stageIcons[stage.id] || Code2;
          const isSelected = activeStage === stage.id;

          return (
            <div
              key={stage.id}
              onClick={() => onSelectStage(isSelected ? null : stage.id)}
              style={{
                backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(25, 27, 36, 0.5)',
                border: isSelected ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: isSelected ? '0 0 20px rgba(139, 92, 246, 0.25)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#ffffff' : '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    <Icon size={16} />
                  </div>
                  <span className="mono-code" style={{ fontSize: '0.72rem', color: isSelected ? '#c4b5fd' : 'var(--text-muted)' }}>
                    {stage.command}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: isSelected ? '#ffffff' : 'var(--text-main)', marginBottom: '0.25rem' }}>
                  {stage.title}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {stage.desc}
                </p>
              </div>

              {/* Output Artifact Pill */}
              <div style={{
                marginTop: '0.85rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Yields:
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  color: isSelected ? '#a78bfa' : '#94a3b8'
                }}>
                  {stage.artifact}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Stage Detail Guide & Input/Output Handshake */}
      {currentStageInfo && (
        <div style={{
          marginTop: '1.25rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px'
            }}>
              Active Filter: {currentStageInfo.title}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
              Showing skills relevant to <strong>{currentStageInfo.command}</strong> yielding <code>{currentStageInfo.artifact}</code>
            </span>
          </div>

          <button
            onClick={() => onSelectSkill(currentStageInfo.skillId)}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            Inspect {currentStageInfo.command} Details <ArrowRight size={14} />
          </button>
        </div>
      )}
    </section>
  );
}
