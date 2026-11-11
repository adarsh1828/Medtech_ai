import React, { useState, useEffect } from 'react';
import { skillsData } from './data/skillsData';
import Header from './components/Header';
import WorkflowSpine from './components/WorkflowSpine';
import AskMattBanner from './components/AskMattBanner';
import SkillCatalog from './components/SkillCatalog';
import SkillDetailDrawer from './components/SkillDetailDrawer';
import CommandPalette from './components/CommandPalette';
import StackBuilderTray from './components/StackBuilderTray';
import Toast from './components/Toast';
import { Sparkles, Terminal, Copy, Check, GitPullRequest, ShieldCheck, Flame } from 'lucide-react';

export default function App() {
  const [skills] = useState(skillsData);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStage, setActiveStage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Drawers
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [inspectedSkillId, setInspectedSkillId] = useState(null);
  
  // Custom Stack (Multi-Select)
  const [selectedStackIds, setSelectedStackIds] = useState([]);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [copiedHeroCli, setCopiedHeroCli] = useState(false);

  // Global CMD+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Copy helper with feedback
  const showToast = (message) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 2500);
  };

  const copyToClipboard = (text, customMsg) => {
    navigator.clipboard.writeText(text);
    showToast(customMsg || `Copied to clipboard: ${text.slice(0, 45)}...`);
  };

  const inspectedSkill = skills.find(s => s.id === inspectedSkillId);

  // Toggle skill in multi-install stack
  const toggleStack = (id) => {
    setSelectedStackIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const removeStackItem = (id) => {
    setSelectedStackIds(prev => prev.filter(x => x !== id));
  };

  const clearStack = () => {
    setSelectedStackIds([]);
  };

  // Quick Action for Hero CLI
  const handleHeroCliCopy = () => {
    const cmd = 'npx skills add mattpocock/skills';
    copyToClipboard(cmd, 'Copied: npx skills add mattpocock/skills');
    setCopiedHeroCli(true);
    setTimeout(() => setCopiedHeroCli(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Header
        totalSkills={skills.length}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onCopyAll={() => copyToClipboard('npx skills add mattpocock/skills', 'Copied: npx skills add mattpocock/skills')}
      />

      {/* Main Container */}
      <main className="container" style={{ flex: 1, paddingTop: '2.5rem' }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          maxWidth: '840px',
          margin: '0 auto 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem'
        }}>
          {/* Top Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#c4b5fd'
          }}>
            <Sparkles size={13} color="#a78bfa" />
            <span>Interactive Catalog for Matt Pocock's Agent Skills</span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: '1.15',
            background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Supercharge Your AI Coding Agent With Rigorous Engineering Workflows
          </h1>

          {/* Subtext */}
          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            lineHeight: '1.6',
            maxWidth: '680px'
          }}>
            Explore 39 battle-tested skills for <strong>Claude Code, Cursor, and Antigravity</strong>. 
            From Socratic grilling to strict TDD, deep module architecture, and automated PR reviews.
          </p>

          {/* Hero Quick Install Terminal Bar */}
          <div style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#0c0d12',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '0.5rem 0.65rem 0.5rem 1rem',
            gap: '1rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.15)',
            maxWidth: '540px',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
              <Terminal size={16} color="#8b5cf6" />
              <code style={{ fontSize: '0.85rem', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                npx skills add mattpocock/skills
              </code>
            </div>

            <button
              onClick={handleHeroCliCopy}
              className="btn btn-primary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', whiteSpace: 'nowrap' }}
            >
              {copiedHeroCli ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedHeroCli ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* The Idea-to-Ship Workflow Spine */}
        <WorkflowSpine
          activeStage={activeStage}
          onSelectStage={(stageId) => setActiveStage(stageId)}
          onSelectSkill={(skillId) => setInspectedSkillId(skillId)}
        />

        {/* Ask Matt: Situation Selector */}
        <AskMattBanner
          onSelectSkill={(skillId) => setInspectedSkillId(skillId)}
        />

        {/* Skills Catalog & Bento Grid */}
        <SkillCatalog
          skills={skills}
          activeCategory={activeCategory}
          onSelectCategory={(catId) => {
            setActiveCategory(catId);
            setActiveStage(null); // clear stage filter if category manually changed
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          activeStage={activeStage}
          onClearStage={() => setActiveStage(null)}
          selectedSkillIds={selectedStackIds}
          onToggleStack={toggleStack}
          onInspectSkill={(skillId) => setInspectedSkillId(skillId)}
          onCopyCommand={(cmd) => copyToClipboard(cmd)}
        />
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '2.5rem 0',
        backgroundColor: 'rgba(9, 9, 11, 0.95)',
        marginTop: 'auto'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.825rem',
          color: 'var(--text-faint)'
        }}>
          <div>
            Built with ❤️ for developers building with <strong>Claude Code</strong>, <strong>Cursor</strong>, and <strong>Antigravity</strong>.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="https://github.com/mattpocock/skills" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Matt Pocock Skills GitHub
            </a>
            <a href="https://www.totaltypescript.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Total TypeScript
            </a>
            <a href="https://www.aihero.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              AI Hero
            </a>
          </div>
        </div>
      </footer>

      {/* Slide-over Right Drawer (Skill Inspector) */}
      <SkillDetailDrawer
        skill={inspectedSkill}
        onClose={() => setInspectedSkillId(null)}
        onCopyCommand={(cmd) => copyToClipboard(cmd)}
        onCopyPrompt={(markdown) => copyToClipboard(markdown, `Copied full prompt for ${inspectedSkill?.name}`)}
        isInStack={inspectedSkill ? selectedStackIds.includes(inspectedSkill.id) : false}
        onToggleStack={toggleStack}
      />

      {/* Floating Multi-Select Stack Builder Tray */}
      <StackBuilderTray
        selectedSkillIds={selectedStackIds}
        onRemoveSkill={removeStackItem}
        onClearStack={clearStack}
        onCopyCommand={(cmd) => copyToClipboard(cmd, `Copied batch install command for ${selectedStackIds.length} skills!`)}
      />

      {/* Global Spotlight Palette (CMD+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        skills={skills}
        onSelectSkill={(skillId) => setInspectedSkillId(skillId)}
        onCopyCommand={(cmd) => copyToClipboard(cmd)}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} visible={isToastVisible} />
    </div>
  );
}
