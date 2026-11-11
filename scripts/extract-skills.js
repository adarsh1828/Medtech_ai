import fs from 'fs';
import path from 'path';

const skillsDir = path.resolve('.agents/skills');
const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

const skills = [];

// Category mappings based on Matt Pocock's skill taxonomy
const categoryMapping = {
  // Spine (Idea to Ship)
  'grill-me': { category: 'spine', stage: '1. Discovery & Stress-Testing', order: 1 },
  'grill-with-docs': { category: 'spine', stage: '1. Discovery & Stress-Testing', order: 2 },
  'grilling': { category: 'spine', stage: '1. Discovery & Stress-Testing', order: 3 },
  'to-spec': { category: 'spine', stage: '2. Specification', order: 4 },
  'to-tickets': { category: 'spine', stage: '3. Task Breakdown', order: 5 },
  'implement': { category: 'spine', stage: '4. Implementation', order: 6 },
  'implement-spec': { category: 'spine', stage: '4. Implementation', order: 7 },
  'code-review': { category: 'spine', stage: '5. Verification & Review', order: 8 },
  'pr': { category: 'spine', stage: '6. Delivery & Shipping', order: 9 },

  // Architecture & Codebase
  'codebase-design': { category: 'architecture', stage: 'Deep Modules & Interfaces', order: 10 },
  'setup-ts-deep-modules': { category: 'architecture', stage: 'TypeScript Modularization', order: 11 },
  'improve-codebase-architecture': { category: 'architecture', stage: 'Structural Drift Refactoring', order: 12 },
  'domain-modeling': { category: 'architecture', stage: 'Glossary & Domain Models', order: 13 },
  'migrate-to-shoehorn': { category: 'architecture', stage: 'Type Migration', order: 14 },
  'scaffold-exercises': { category: 'architecture', stage: 'Workshop & Curriculum Scaffolding', order: 15 },

  // Testing & Diagnostics
  'tdd': { category: 'testing', stage: 'Test-Driven Development', order: 20 },
  'diagnosing-bugs': { category: 'testing', stage: 'Bug Investigation Loop', order: 21 },
  'git-guardrails-claude-code': { category: 'testing', stage: 'Safety & Destructive Command Blocking', order: 22 },
  'setup-pre-commit': { category: 'testing', stage: 'Git Hook Enforcement', order: 23 },

  // Agent Orchestration & Meta
  'ask-matt': { category: 'orchestration', stage: 'Meta Skill Discovery', order: 30 },
  'chief-of-staff': { category: 'orchestration', stage: 'Executive Priority & Goal Alignment', order: 31 },
  'software-factory': { category: 'orchestration', stage: 'Autonomous Multi-Agent Factory', order: 32 },
  'handoff': { category: 'orchestration', stage: 'Context Preservation & Session Switch', order: 33 },
  'claude-handoff': { category: 'orchestration', stage: 'Claude Code Context Switch', order: 34 },
  'wayfinder': { category: 'orchestration', stage: 'Codebase Pathfinding & Navigation', order: 35 },
  'triage': { category: 'orchestration', stage: 'Issue & Bug Triage', order: 36 },
  'retro': { category: 'orchestration', stage: 'Sprint & Agent Retrospective', order: 37 },
  'loop-me': { category: 'orchestration', stage: 'Iterative Autonomous Loops', order: 38 },
  'setup-matt-pocock-skills': { category: 'orchestration', stage: 'Workspace Initialization', order: 39 },

  // Writing & Strategy
  'writing-for-agents': { category: 'writing', stage: 'Instruction & Agent Prompt Design', order: 40 },
  'writing-beats': { category: 'writing', stage: 'Narrative & Pacing Flow', order: 41 },
  'writing-shape': { category: 'writing', stage: 'Structural Formatting & Cadence', order: 42 },
  'writing-fragments': { category: 'writing', stage: 'Atomic Idea Distillation', order: 43 },
  'teach': { category: 'writing', stage: 'Educational Conceptual Walkthroughs', order: 44 },
  'prototype': { category: 'writing', stage: 'Throwaway Feasibility Prototyping', order: 45 },
  'research': { category: 'writing', stage: 'High-Trust Primary Source Investigation', order: 46 },
  'wizard': { category: 'writing', stage: 'Interactive Human-in-the-Loop Scripts', order: 47 },
  'wait-what': { category: 'writing', stage: 'Confusion & Sanity Check Clarification', order: 48 },
  'to-questionnaire': { category: 'writing', stage: 'Requirements Gathering Matrix', order: 49 },
};

function parseYamlFrontmatter(content) {
  const match = content.match(/^---\s*([\s\S]*?)\s*---/);
  if (!match) return { meta: {}, body: content.trim() };

  const rawMeta = match[1];
  const body = content.slice(match[0].length).trim();
  const meta = {};

  rawMeta.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      meta[key] = value;
    }
  });

  return { meta, body };
}

for (const entry of entries) {
  if (entry.isDirectory()) {
    const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      const rawContent = fs.readFileSync(skillPath, 'utf-8');
      const { meta, body } = parseYamlFrontmatter(rawContent);

      const mapping = categoryMapping[entry.name] || {
        category: 'other',
        stage: 'General Skill',
        order: 99
      };

      // Extract trigger slash commands mentioned in markdown (e.g. /grill-me)
      const slashMatches = body.match(new RegExp(`/${entry.name}\\b`, 'g')) || [];
      const trigger = `/${entry.name}`;

      // Extract brief summary from description or first lines
      const description = meta.description || body.slice(0, 150).replace(/[#*`\n]/g, ' ') + '...';

      skills.push({
        id: entry.name,
        name: meta.name || entry.name,
        description: description.trim(),
        trigger: trigger,
        category: mapping.category,
        stage: mapping.stage,
        order: mapping.order,
        installCommand: `npx skills add mattpocock/skills ${entry.name}`,
        rawMarkdown: rawContent,
        body: body,
      });
    }
  }
}

skills.sort((a, b) => a.order - b.order);

console.log(`Successfully parsed ${skills.length} skills!`);
const categoriesCount = skills.reduce((acc, s) => {
  acc[s.category] = (acc[s.category] || 0) + 1;
  return acc;
}, {});
console.log('Categories count:', categoriesCount);

const targetDir = path.resolve('skills-web/src/data');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const outputPath = path.join(targetDir, 'skillsData.js');
const fileContent = `// Auto-generated by scripts/extract-skills.js from .agents/skills
export const skillsData = ${JSON.stringify(skills, null, 2)};

export const categories = [
  { id: 'all', label: 'All Skills', icon: 'Sparkles', count: ${skills.length} },
  { id: 'spine', label: 'Idea-to-Ship Spine', icon: 'GitMerge', count: ${categoriesCount.spine || 0}, description: 'The canonical core lifecycle from initial idea to merged pull request' },
  { id: 'architecture', label: 'Codebase & Architecture', icon: 'Layers', count: ${categoriesCount.architecture || 0}, description: 'Deep modules, interfaces, domain modeling, and refactoring' },
  { id: 'testing', label: 'Testing & Diagnostics', icon: 'CheckCircle2', count: ${categoriesCount.testing || 0}, description: 'TDD loops, bug diagnosis, and destructive command guardrails' },
  { id: 'orchestration', label: 'Agent Orchestration', icon: 'Cpu', count: ${categoriesCount.orchestration || 0}, description: 'Multi-agent workflows, handoffs, chief of staff, and triage' },
  { id: 'writing', label: 'Writing & Strategy', icon: 'Feather', count: ${categoriesCount.writing || 0}, description: 'Beats, shapes, teaching walkthroughs, and prompt engineering' }
];

export const pipelineStages = [
  { id: 'grill', title: '1. Stress-Test', skillId: 'grill-me', command: '/grill-me', desc: 'Relentless design-tree interview to reveal hidden assumptions', artifact: 'Decision Tree' },
  { id: 'spec', title: '2. Specification', skillId: 'to-spec', command: '/to-spec', desc: 'Formalizes agreed decisions into architectural spec', artifact: 'SPEC.md' },
  { id: 'tickets', title: '3. Task Breakdown', skillId: 'to-tickets', command: '/to-tickets', desc: 'Slices spec into bite-sized atomic agent tickets', artifact: 'TICKETS.md' },
  { id: 'tdd', title: '4. Implement (TDD)', skillId: 'tdd', command: '/tdd', desc: 'Executes tickets strictly test-first (Red ➔ Green ➔ Refactor)', artifact: 'Verified Code' },
  { id: 'review', title: '5. Dual Review', skillId: 'code-review', command: '/code-review', desc: 'Audits changes against repo standards and spec intent', artifact: 'Review Report' },
  { id: 'pr', title: '6. Deliver PR', skillId: 'pr', command: '/pr', desc: 'Drafts clean, descriptive GitHub pull request body', artifact: 'GitHub PR' }
];

export const askMattSituations = [
  { label: '🔥 Hard Bug or Regression', skillId: 'diagnosing-bugs', note: 'Systematic diagnosis loop for mysterious bugs and perf drops' },
  { label: '💡 Stress-Test a Design', skillId: 'grill-me', note: 'Relentless Socratic interview to map your design tree' },
  { label: '🧪 Strict Test-Driven Dev', skillId: 'tdd', note: 'Enforce Red-Green-Refactor test-first development' },
  { label: '📐 Design Deep Modules', skillId: 'codebase-design', note: 'Vocabulary and interface boundaries for deep modules' },
  { label: '📋 Convert Ideas to Tickets', skillId: 'to-tickets', note: 'Break down an approved spec into agent-executable steps' },
  { label: '🛡️ Git Safety Guardrails', skillId: 'git-guardrails-claude-code', note: 'Block dangerous git commands before they execute' }
];
`;

fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`Generated ${outputPath} successfully!`);

