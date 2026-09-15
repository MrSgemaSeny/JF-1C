const fs = require('fs');
const path = require('path');

const xmlPath = path.resolve(__dirname, '../../zhan-finance-backend/build/reports/jacoco/test/jacocoTestReport.xml');
const content = fs.readFileSync(xmlPath, 'utf8');

const classBlocks = content.split('<class name="');

function evaluate(predicate, label) {
  let total = 0, covered = 0;
  for (let i = 1; i < classBlocks.length; i++) {
    const block = classBlocks[i];
    const nameEnd = block.indexOf('"');
    const clsName = block.substring(0, nameEnd);
    
    const lastMethodIdx = block.lastIndexOf('</method>');
    const counterSection = lastMethodIdx >= 0 ? block.substring(lastMethodIdx) : block;
    const m = counterSection.match(/<counter type="INSTRUCTION" missed="(\d+)" covered="(\d+)"\/>/);
    if (!m) continue;
    
    const missed = parseInt(m[1]);
    const cov = parseInt(m[2]);
    const tot = missed + cov;
    
    if (!predicate(clsName)) {
      total += tot;
      covered += cov;
    }
  }
  const pct = total > 0 ? ((covered / total) * 100).toFixed(2) : '0.00';
  console.log(`${label}: ${covered} / ${total} (${pct}%)`);
}

evaluate(() => false, 'All classes (no exclusions)');

evaluate(name => 
  name.includes('/dto/') || name.endsWith('Dto') ||
  name.includes('/entity/') ||
  name.endsWith('Application'),
  'Exclude DTO + Entity + Application');

evaluate(name => 
  name.includes('/dto/') || name.endsWith('Dto') ||
  name.includes('/entity/') ||
  name.includes('/config/') || name.endsWith('Config') ||
  name.includes('Seeder') ||
  name.endsWith('Application'),
  'Exclude DTO + Entity + Config + Seeder + Application');
