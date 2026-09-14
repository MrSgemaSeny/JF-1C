const fs = require('fs');

const locales = {
  kkLanding: JSON.parse(fs.readFileSync(`zhan-finance-frontend/src/shared/i18n/locales/kk/landing.json`, 'utf8')),
  kkCommon: JSON.parse(fs.readFileSync(`zhan-finance-frontend/src/shared/i18n/locales/kk/common.json`, 'utf8')),
  ruCommon: JSON.parse(fs.readFileSync(`zhan-finance-frontend/src/shared/i18n/locales/ru/common.json`, 'utf8'))
};

function scanIdenticalToRussian(kkObj, ruObj, prefix = '') {
  let issues = [];
  for (let k in kkObj) {
    const kkVal = kkObj[k];
    const ruVal = ruObj ? ruObj[k] : undefined;
    const currentPath = prefix ? prefix + '.' + k : k;
    if (typeof kkVal === 'string' && typeof ruVal === 'string') {
      if (kkVal === ruVal && /[\u0400-\u04FF]/.test(kkVal) && kkVal.length > 5) {
        issues.push({ path: currentPath, val: kkVal });
      }
    } else if (typeof kkVal === 'object' && kkVal !== null && typeof ruVal === 'object' && ruVal !== null) {
      issues = issues.concat(scanIdenticalToRussian(kkVal, ruVal, currentPath));
    }
  }
  return issues;
}

console.log('=== KK STRINGS IDENTICAL TO RU (POSSIBLE UNTRANSLATED) IN LANDING / COMMON ===');
const commonLandingKeys = ['header', 'footer', 'nav', 'quiz', 'services', 'about', 'contact', 'home', 'cookie', 'landing'];
commonLandingKeys.forEach(k => {
  if (locales.kkCommon[k] && locales.ruCommon[k]) {
    const issues = scanIdenticalToRussian(locales.kkCommon[k], locales.ruCommon[k], k);
    issues.forEach(i => console.log(`  [common] ${i.path}: "${i.val}"`));
  }
});
