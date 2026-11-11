# Matt Pocock Skills Explorer 🚀

An interactive, high-performance catalog and visual workflow explorer for **Matt Pocock's 39 Agent Skills** (`.agents/skills/`).

Built for developers and AI engineers building with **Claude Code**, **Cursor**, and **Antigravity**.

---

## 🌟 Key Features

1. **The Canonical Spine (Idea-to-Ship Lifecycle):**
   - Interactive visual progression pipeline: `grill-me` ➔ `to-spec` ➔ `to-tickets` ➔ `implement (tdd)` ➔ `code-review` ➔ `pr`.
   - Dynamic 2-way handshake: clicking any lifecycle node filters the catalog and displays the input/output artifact contract (`SPEC.md`, `TICKETS.md`, verified code, PR body).

2. **Raycast / Spotlight Global Command Palette (`CMD + K` / `Ctrl + K`):**
   - High-speed fuzzy search across skill names, triggers (e.g., `/grill-me`), categories, and problem keywords.
   - Keyboard-first navigation (Arrow Up/Down, Enter to inspect, ESC to close).

3. **Slide-Over Right Drawer (Skill Inspector):**
   - Animated sheet keeping catalog context intact.
   - Rich Markdown rendering with GitHub-style alert callouts (`[!NOTE]`, `[!WARNING]`, `[!TIP]`).
   - One-click copy for `npx skills add mattpocock/skills <name>` and raw prompt markdown.

4. **"Ask Matt" Situational Recommender:**
   - Quick one-click pills for real-world scenarios: "Hard Bug or Regression", "Stress-Test a Design", "Strict TDD", "Deep Modules", etc.

5. **Multi-Select Stack Builder Tray:**
   - Check multiple skills to generate a single composite installation one-liner:
     ```bash
     npx skills add mattpocock/skills grill-me to-spec tdd code-review
     ```

6. **Automatic Markdown Synchronization:**
   - `scripts/extract-skills.js` scans `.agents/skills/*/SKILL.md` directly, ensuring zero manual data drift.

---

## 🚀 Quick Start

From the root project directory:

```bash
# 1. Run local development server (Port 5180)
npm run dev:skills

# 2. Re-extract markdown data & build production bundle
npm run build:skills
```

Or within the `skills-web/` directory:

```bash
cd skills-web
node node_modules/vite/bin/vite.js --port 5180
```
