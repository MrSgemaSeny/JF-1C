const fs = require('fs');

const langs = ['ru', 'kk', 'en', 'zh'];
const locales = {};
langs.forEach(l => {
  locales[l] = {
    landing: JSON.parse(fs.readFileSync(`zhan-finance-frontend/src/shared/i18n/locales/${l}/landing.json`, 'utf8')),
    common: JSON.parse(fs.readFileSync(`zhan-finance-frontend/src/shared/i18n/locales/${l}/common.json`, 'utf8'))
  };
});

// Check if any landing.json object values or common.json landing keys have identical Russian text in kk/en/zh
function scanRussianInOtherLangs(obj, l, prefix = '') {
  let issues = [];
  for (let k in obj) {
    const val = obj[k];
    const currentPath = prefix ? prefix + '.' + k : k;
    if (typeof val === 'string') {
      // Check if it has cyrillic when lang is en or zh
      if (l === 'en' || l === 'zh') {
        if (/[\u0400-\u04FF]/.test(val)) {
          // Allow Russian names or acronyms only if unavoidable, else flag
          issues.push({ path: currentPath, val });
        }
      }
    } else if (typeof val === 'object' && val !== null) {
      issues = issues.concat(scanRussianInOtherLangs(val, l, currentPath));
    }
  }
  return issues;
}

console.log('=== UNTRANSLATED (CYRILLIC) STRINGS IN EN / ZH ===');
['en', 'zh'].forEach(l => {
  console.log(`\n--- ${l} landing.json ---`);
  const landingIssues = scanRussianInOtherLangs(locales[l].landing, l);
  landingIssues.forEach(i => console.log(`  [landing] ${i.path}: "${i.val}"`));

  console.log(`\n--- ${l} common.json (landing/header/footer/nav/quiz/services/about/contact) ---`);
  const commonLandingKeys = ['header', 'footer', 'nav', 'quiz', 'services', 'about', 'contact', 'home', 'cookie'];
  commonLandingKeys.forEach(k => {
    if (locales[l].common[k]) {
      const issues = scanRussianInOtherLangs(locales[l].common[k], l, k);
      issues.forEach(i => console.log(`  [common] ${i.path}: "${i.val}"`));
    }
  });
});
