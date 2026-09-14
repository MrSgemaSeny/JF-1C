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

const checkKeys = [
  'about.hero.badge', 'about.hero.title', 'about.hero.subtitle', 'about.hero.description',
  'about.stats.title',
  'about.stats.items.0.value', 'about.stats.items.0.label', 'about.stats.items.0.description',
  'about.stats.items.1.value', 'about.stats.items.1.label', 'about.stats.items.1.description',
  'about.stats.items.2.value', 'about.stats.items.2.label', 'about.stats.items.2.description',
  'about.stats.items.3.value', 'about.stats.items.3.label', 'about.stats.items.3.description',
  'about.ideology.badge', 'about.ideology.title', 'about.ideology.p1', 'about.ideology.p2', 'about.ideology.p3', 'about.ideology.p4',
  'about.process.badge', 'about.process.title',
  'about.process.items.0.step', 'about.process.items.0.title', 'about.process.items.0.text',
  'about.process.items.1.step', 'about.process.items.1.title', 'about.process.items.1.text',
  'about.process.items.2.step', 'about.process.items.2.title', 'about.process.items.2.text',
  'about.process.items.3.step', 'about.process.items.3.title', 'about.process.items.3.text',
  'about.guarantees.badge', 'about.guarantees.title', 'about.guarantees.p1',
  'about.guarantees.items.0.title', 'about.guarantees.items.0.text',
  'about.guarantees.items.1.title', 'about.guarantees.items.1.text',
  'about.guarantees.items.2.title', 'about.guarantees.items.2.text',
  'about.guarantees.items.3.title', 'about.guarantees.items.3.text',
  'services.hero.badge', 'services.hero.title', 'services.hero.description', 'services.hero.cta', 'services.hero.ctaSecond',
  'services.howWeWork.title',
  'services.howWeWork.items.0.title', 'services.howWeWork.items.0.text',
  'services.howWeWork.items.1.title', 'services.howWeWork.items.1.text',
  'services.howWeWork.items.2.title', 'services.howWeWork.items.2.text',
  'services.howWeWork.items.3.title', 'services.howWeWork.items.3.text',
  'services.howWeWork.items.4.title', 'services.howWeWork.items.4.text',
  'services.howWeWork.items.5.title', 'services.howWeWork.items.5.text',
  'services.why.title', 'services.why.description',
  'services.why.items.0.title', 'services.why.items.0.text',
  'services.why.items.1.title', 'services.why.items.1.text',
  'services.why.items.2.title', 'services.why.items.2.text',
  'publicNav.home', 'publicNav.services', 'publicNav.about', 'publicNav.login', 'publicNav.profile', 'publicNav.contact', 'publicNav.getStarted',
  'cookie.title', 'cookie.description', 'cookie.policyLink', 'cookie.acceptAll', 'cookie.essentialOnly', 'cookie.close'
];

console.log('=== CHECKING KEYS ACROSS ALL 4 LOCALES IN COMMON.JSON ===');
checkKeys.forEach(k => {
  langs.forEach(l => {
    const val = getVal(locales[l].common, k);
    if (val === undefined) {
      console.log(`[MISSING KEY] lang=${l} key="${k}"`);
    }
  });
});
