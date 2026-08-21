const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'locales' && file !== 'dist') {
        walk(fullPath, fileList);
      }
    } else if (/\.(tsx|ts)$/.test(file) && !/\.test\.(tsx|ts)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = walk('zhan-finance-frontend/src');
const results = [];

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    if (/[\u0400-\u04FF]/.test(line)) {
      const isComment = /^\s*\/\//.test(line) || /^\s*\/\*/.test(line) || /^\s*\*/.test(line);
      // check if it's inside t('...', '...') or t('...', { defaultValue: '...' })
      const isTFunction = /t\([^\)]+\)/.test(line);
      if (!isComment) {
        results.push({
          file: path.relative('.', file).replace(/\\/g, '/'),
          line: idx + 1,
          isTFunction,
          text: line.trim()
        });
      }
    }
  });
}

const hardcoded = results.filter(r => !r.isTFunction);
console.log('Total non-t() Cyrillic occurrences:', hardcoded.length);
console.log('Sample non-t() hardcoded strings:');
hardcoded.slice(0, 50).forEach(r => console.log(`${r.file}:${r.line} [hardcoded] ${r.text}`));
