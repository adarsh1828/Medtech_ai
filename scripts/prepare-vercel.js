import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Vercel Unified Build Pipeline...');

function run(cmd, cwd) {
  console.log(`\n▶ Running: "${cmd}" in ${cwd || 'root'}`);
  execSync(cmd, {
    cwd: cwd ? path.resolve(cwd) : process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, CI: 'false' },
  });
}

try {
  // 1. Build Frontend
  console.log('📦 Step 1: Building Frontend (Hospital Management System)...');
  const frontendModules = path.resolve('frontend/node_modules');
  if (!fs.existsSync(frontendModules)) {
    run('npm install --prefer-offline', 'frontend');
  }
  run('npm run build', 'frontend');

  // 2. Extract Skills Data
  console.log('⚡ Step 2: Extracting 39 Matt Pocock Skills from .agents/skills...');
  run('node scripts/extract-skills.js');

  // 3. Build Skills Web Explorer
  console.log('🛠️ Step 3: Building Skills Web Explorer (Vite)...');
  const skillsModules = path.resolve('skills-web/node_modules');
  if (!fs.existsSync(skillsModules)) {
    run('npm install --prefer-offline', 'skills-web');
  }
  run('npm run build', 'skills-web');

  // 4. Merge skills-web/dist into frontend/dist/skills
  console.log('🔗 Step 4: Merging skills-web/dist into frontend/dist/skills...');
  const srcDist = path.resolve('skills-web/dist');
  const targetDist = path.resolve('frontend/dist/skills');

  if (!fs.existsSync(targetDist)) {
    fs.mkdirSync(targetDist, { recursive: true });
  }

  fs.cpSync(srcDist, targetDist, { recursive: true });

  // 5. Also copy skills-web/dist/assets into frontend/dist/assets as a fallback
  const srcAssets = path.resolve('skills-web/dist/assets');
  const targetAssets = path.resolve('frontend/dist/assets');
  if (fs.existsSync(srcAssets)) {
    if (!fs.existsSync(targetAssets)) {
      fs.mkdirSync(targetAssets, { recursive: true });
    }
    fs.cpSync(srcAssets, targetAssets, { recursive: true });
    console.log('🛡️ Dual-routed assets copied into frontend/dist/assets for zero-404 safety.');
  }

  console.log('✅ Successfully copied skills-web into frontend/dist/skills!');
  console.log('🎉 Unified Vercel Build Completed Successfully!');
} catch (err) {
  console.error('❌ Build failed:', err);
  process.exit(1);
}
