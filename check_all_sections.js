const fs = require('fs');

const langs = ['ru', 'kk', 'en', 'zh'];
const locales = {};
langs.forEach(l => {
  locales[l] = {
    landing: JSON.parse(fs.readFileSync(`zhan-finance-frontend/src/shared/i18n/locales/${l}/landing.json`, 'utf8')),
    common: JSON.parse(fs.readFileSync(`zhan-finance-frontend/src/shared/i18n/locales/${l}/common.json`, 'utf8'))
  };
});

function checkRussianInLang(lang, jsonType, keyPrefix) {
  const root = locales[lang][jsonType];
  const ruRoot = locales.ru[jsonType];
  
  function recurse(obj, ruObj, path) {
    if (!obj) return;
    for (let k in obj) {
      const curPath = path ? `${path}.${k}` : k;
      const val = obj[k];
      const ruVal = ruObj ? ruObj[k] : undefined;
      
      if (typeof val === 'string') {
        if (lang !== 'ru' && /[\u0400-\u04FF]/.test(val)) {
          // If cyrillic exists in EN or ZH, or if KK equals RU
          if (lang === 'en' || lang === 'zh' || (lang === 'kk' && val === ruVal && val.length > 5)) {
            console.log(`[${lang} ${jsonType}] ${curPath}: "${val}"`);
          }
        }
      } else if (typeof val === 'object' && val !== null) {
        recurse(val, ruVal, curPath);
      }
    }
  }

  const startObj = keyPrefix ? keyPrefix.split('.').reduce((o, k) => (o ? o[k] : undefined), root) : root;
  const startRuObj = keyPrefix ? keyPrefix.split('.').reduce((o, k) => (o ? o[k] : undefined), ruRoot) : ruRoot;
  recurse(startObj, startRuObj, keyPrefix);
}

console.log('=== CHECKING ALL LANDING-RELATED SECTIONS FOR UNTRANSLATED CONTENT ===');
const sections = ['about', 'services', 'quiz', 'header', 'footer', 'cookie', 'landing', 'home', 'contact', 'pricing', 'reviews', 'team', 'offices', 'trust'];

langs.filter(l => l !== 'ru').forEach(l => {
  console.log(`\n================== LANG: ${l.toUpperCase()} ==================`);
  sections.forEach(s => {
    checkRussianInLang(l, 'common', s);
    checkRussianInLang(l, 'landing', s);
  });
});
