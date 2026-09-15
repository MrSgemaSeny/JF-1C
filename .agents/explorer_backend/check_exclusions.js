const fs = require('fs');
const path = require('path');

const xmlPath = path.resolve(__dirname, '../../zhan-finance-backend/build/reports/jacoco/test/jacocoTestReport.xml');
const content = fs.readFileSync(xmlPath, 'utf8');

// Match class with its own counters
// In jacoco XML: <class ...> ... </method> <counter type="INSTRUCTION" missed="X" covered="Y"/> ... </class>
const classBlocks = content.split('<class name="');
let totalInst = 0, coveredInst = 0;
let exclTotalInst = 0, exclCoveredInst = 0;

for (let i = 1; i < classBlocks.length; i++) {
  const block = classBlocks[i];
  const nameEnd = block.indexOf('"');
  const clsName = block.substring(0, nameEnd);
  
  // The class counters appear after the last </method>
  const lastMethodIdx = block.lastIndexOf('</method>');
  const counterSection = lastMethodIdx >= 0 ? block.substring(lastMethodIdx) : block;
  
  const m = counterSection.match(/<counter type="INSTRUCTION" missed="(\d+)" covered="(\d+)"\/>/);
  if (!m) continue;
  
  const missed = parseInt(m[1]);
  const covered = parseInt(m[2]);
  const tot = missed + covered;
  
  totalInst += tot;
  coveredInst += covered;
  
  // Patterns to test
  const isDto = clsName.includes('/dto/') || clsName.includes('/dto$') || clsName.endsWith('Dto');
  const isEntity = clsName.includes('/entity/') || clsName.includes('/entity$');
  const isConfig = clsName.includes('/config/') || clsName.endsWith('Config');
  const isApp = clsName.endsWith('Application');
  
  if (!isDto && !isEntity && !isApp) {
    exclTotalInst += tot;
    exclCoveredInst += covered;
  }
}

console.log('Total without exclusions:');
console.log(`Instructions: ${coveredInst} / ${totalInst} (${((coveredInst / totalInst) * 100).toFixed(2)}%)`);

console.log('\nWith exclusions (dto, entity, Application):');
console.log(`Instructions: ${exclCoveredInst} / ${exclTotalInst} (${((exclCoveredInst / exclTotalInst) * 100).toFixed(2)}%)`);
