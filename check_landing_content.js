const fs = require('fs');

const langs = ['ru', 'kk', 'en', 'zh'];
const locales = {};
langs.forEach(l => {
  locales[l] = {
    landing: JSON.parse(fs.readFileSync(`zhan-finance-frontend/src/shared/i18n/locales/${l}/landing.json`, 'utf8')),
    common: JSON.parse(fs.readFileSync(`zhan-finance-frontend/src/shared/i18n/locales/${l}/common.json`, 'utf8'))
  };
});

function getVal(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

// Check services namespace / keys in common.json
console.log('=== SERVICES SECTION IN COMMON.JSON ===');
langs.forEach(l => {
  const how = getVal(locales[l].common, 'services.howWeWork');
  const why = getVal(locales[l].common, 'services.why');
  console.log(`[${l}] services.howWeWork:`, how ? Object.keys(how) : 'MISSING');
  console.log(`[${l}] services.why:`, why ? Object.keys(why) : 'MISSING');
});

// Check landing.json content for all 4 langs
console.log('\n=== LANDING.JSON KEYS AND VALUES ===');
const landingKeys = Object.keys(locales.ru.landing);
landingKeys.forEach(k => {
  console.log(`\nKey: ${k}`);
  langs.forEach(l => {
    console.log(`  [${l}]: ${locales[l].landing[k]}`);
  });
});
