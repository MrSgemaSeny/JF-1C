const fs = require('fs');
const path = require('path');

const routesFile = fs.readFileSync('zhan-finance-frontend/src/shared/config/routes.ts', 'utf8');
const appFile = fs.readFileSync('zhan-finance-frontend/src/app/App.tsx', 'utf8');

// Extract all ROUTES keys
const routeKeys = [];
const matchRegex = /([A-Z_0-9]+):\s*['"`]([^'"`]+)['"`]/g;
let m;
while ((m = matchRegex.exec(routesFile)) !== null) {
  routeKeys.push({ key: m[1], path: m[2] });
}

console.log('Total routes defined in routes.ts:', routeKeys.length);

const unreferencedInApp = [];
for (const r of routeKeys) {
  if (!appFile.includes(`ROUTES.${r.key}`)) {
    unreferencedInApp.push(r);
  }
}

console.log('Defined in routes.ts but not referenced in App.tsx:');
unreferencedInApp.forEach(r => console.log(`  ROUTES.${r.key}: '${r.path}'`));

// Find all Page files in src/pages
function walkPages(dir, list = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walkPages(full, list);
    } else if (f.endsWith('Page.tsx')) {
      list.push(full);
    }
  }
  return list;
}

const pageFiles = walkPages('zhan-finance-frontend/src/pages');
console.log('\nTotal Page files found:', pageFiles.length);

const orphanedPages = [];
for (const pf of pageFiles) {
  const baseName = path.basename(pf, '.tsx');
  if (!appFile.includes(baseName)) {
    orphanedPages.push(pf);
  }
}

console.log('\nPage files not imported in App.tsx:');
orphanedPages.forEach(p => console.log('  ' + p.replace(/\\/g, '/')));
