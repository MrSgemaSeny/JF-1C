const fs = require('fs');
const path = require('path');

const xmlPath = path.resolve(__dirname, '../../zhan-finance-backend/build/reports/jacoco/test/jacocoTestReport.xml');
const content = fs.readFileSync(xmlPath, 'utf8');

// Parse packages
const packageRegex = /<package name="([^"]+)">([\s\S]*?)<\/package>/g;
let pkgMatch;
const packages = [];

while ((pkgMatch = packageRegex.exec(content)) !== null) {
  const pkgName = pkgMatch[1];
  const pkgContent = pkgMatch[2];
  
  // Find package-level counters (at the end of package block)
  // We can look for counter tags outside of class tags or just extract class info
  const classRegex = /<class name="([^"]+)" sourcefilename="([^"]+)">([\s\S]*?)<\/class>/g;
  let clsMatch;
  const classes = [];
  
  while ((clsMatch = classRegex.exec(pkgContent)) !== null) {
    const clsName = clsMatch[1];
    const clsBody = clsMatch[3];
    const counters = {};
    const cRegex = /<counter type="([^"]+)" missed="(\d+)" covered="(\d+)"\/>/g;
    let cm;
    while ((cm = cRegex.exec(clsBody)) !== null) {
      counters[cm[1]] = { missed: parseInt(cm[2]), covered: parseInt(cm[3]) };
    }
    const inst = counters['INSTRUCTION'] || { missed: 0, covered: 0 };
    const instTot = inst.missed + inst.covered;
    const instPct = instTot > 0 ? ((inst.covered / instTot) * 100).toFixed(1) : '100.0';
    classes.push({ name: clsName, missed: inst.missed, covered: inst.covered, total: instTot, pct: parseFloat(instPct) });
  }

  const pkgInstMissed = classes.reduce((sum, c) => sum + c.missed, 0);
  const pkgInstCovered = classes.reduce((sum, c) => sum + c.covered, 0);
  const pkgTot = pkgInstMissed + pkgInstCovered;
  const pkgPct = pkgTot > 0 ? ((pkgInstCovered / pkgTot) * 100).toFixed(1) : '100.0';

  packages.push({ name: pkgName, total: pkgTot, covered: pkgInstCovered, missed: pkgInstMissed, pct: parseFloat(pkgPct), classes });
}

console.log('=== PACKAGE-LEVEL INSTRUCTION COVERAGE ===');
packages.sort((a, b) => a.pct - b.pct);
for (const p of packages) {
  console.log(`${p.name.padEnd(55)}: ${p.covered.toString().padStart(5)} / ${p.total.toString().padStart(5)} (${p.pct.toFixed(1).padStart(5)}%)`);
}

console.log('\n=== UNCOVERED / LOWEST COVERAGE CLASSES (pct < 30%) ===');
const allCls = packages.flatMap(p => p.classes).filter(c => c.total > 0 && c.pct < 30);
allCls.sort((a, b) => b.missed - a.missed);
for (const c of allCls.slice(0, 35)) {
  console.log(`${c.name.padEnd(65)}: ${c.covered.toString().padStart(4)} / ${c.total.toString().padStart(4)} (${c.pct.toFixed(1).padStart(5)}%) [missed: ${c.missed}]`);
}
