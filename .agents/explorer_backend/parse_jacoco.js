const fs = require('fs');
const path = require('path');

const xmlPath = path.resolve(__dirname, '../../zhan-finance-backend/build/reports/jacoco/test/jacocoTestReport.xml');
if (!fs.existsSync(xmlPath)) {
  console.log('XML not found: ' + xmlPath);
  process.exit(1);
}

const content = fs.readFileSync(xmlPath, 'utf8');
const regex = /<counter type="([^"]+)" missed="(\d+)" covered="(\d+)"\/>/g;
let match;
const counters = [];
while ((match = regex.exec(content)) !== null) {
  counters.push({ type: match[1], missed: parseInt(match[2]), covered: parseInt(match[3]) });
}

// The last 6 counters in the XML are the summary counters for the root report tag
const summary = counters.slice(-6);
console.log('=== OVERALL JACOCO COVERAGE ===');
for (const c of summary) {
  const total = c.missed + c.covered;
  const pct = total > 0 ? ((c.covered / total) * 100).toFixed(2) : '0.00';
  console.log(c.type.padEnd(14) + ': ' + c.covered + ' / ' + total + ' (' + pct + '%)');
}

// Also check test summary
const testReportPath = path.resolve(__dirname, '../../zhan-finance-backend/build/reports/tests/test/index.html');
if (fs.existsSync(testReportPath)) {
  const html = fs.readFileSync(testReportPath, 'utf8');
  console.log('\n=== TEST SUITE RESULTS ===');
  const testsMatch = html.match(/<div class="counter">(\d+)<\/div>\s*<p>tests<\/p>/);
  const failuresMatch = html.match(/<div class="counter">(\d+)<\/div>\s*<p>failures<\/p>/);
  const ignoredMatch = html.match(/<div class="counter">(\d+)<\/div>\s*<p>ignored<\/p>/);
  const durationMatch = html.match(/<div class="counter">([\d.]+)s<\/div>\s*<p>duration<\/p>/);
  const successMatch = html.match(/<div class="percent">(\d+)%<\/div>\s*<p>successful<\/p>/);

  if (testsMatch) console.log('Tests:      ' + testsMatch[1]);
  if (failuresMatch) console.log('Failures:   ' + failuresMatch[1]);
  if (ignoredMatch) console.log('Ignored:    ' + ignoredMatch[1]);
  if (durationMatch) console.log('Duration:   ' + durationMatch[1] + 's');
  if (successMatch) console.log('Success:    ' + successMatch[1] + '%');
}
