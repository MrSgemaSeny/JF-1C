const fs = require('fs');
const path = require('path');

function walk(dir, list = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') walk(full, list);
    } else if (/\.(tsx|ts)$/.test(f) && !f.endsWith('.d.ts') && !f.includes('.test.')) {
      list.push(full);
    }
  }
  return list;
}

const files = walk('zhan-finance-frontend/src');
const unusedImports = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // Match single named imports: import { A, B } from '...';
  const importMatches = content.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g);
  for (const im of importMatches) {
    const names = im[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
    for (const name of names) {
      if (!name) continue;
      // Count occurrences of name in file
      const regex = new RegExp('\\b' + name + '\\b', 'g');
      const occurrences = (content.match(regex) || []).length;
      if (occurrences === 1) { // only in import line
        unusedImports.push({ file: path.relative('.', file).replace(/\\/g, '/'), name });
      }
    }
  }
}

console.log('Total potential unused named imports:', unusedImports.length);
unusedImports.forEach(u => console.log(`  ${u.file}: unused import '${u.name}'`));
