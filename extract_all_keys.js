const fs = require('fs');
const path = require('path');

const targetFiles = [
  'zhan-finance-frontend/src/pages/home/HomePage.tsx',
  'zhan-finance-frontend/src/pages/home/sections/HomeAbout.tsx',
  'zhan-finance-frontend/src/pages/home/sections/HomeAdvantages.tsx',
  'zhan-finance-frontend/src/pages/home/sections/HomeServices.tsx',
  'zhan-finance-frontend/src/pages/home/sections/OutsourceIncluded.tsx',
  'zhan-finance-frontend/src/pages/about/AboutPage.tsx',
  'zhan-finance-frontend/src/pages/about/sections/AboutGuarantees.tsx',
  'zhan-finance-frontend/src/pages/about/sections/AboutHero.tsx',
  'zhan-finance-frontend/src/pages/about/sections/AboutIdeology.tsx',
  'zhan-finance-frontend/src/pages/about/sections/AboutProcess.tsx',
  'zhan-finance-frontend/src/pages/about/sections/AboutStats.tsx',
  'zhan-finance-frontend/src/pages/services/ServicesPage.tsx',
  'zhan-finance-frontend/src/pages/services/sections/ServicesCatalog.tsx',
  'zhan-finance-frontend/src/pages/services/sections/ServicesFaqContact.tsx',
  'zhan-finance-frontend/src/pages/services/sections/ServicesHero.tsx',
  'zhan-finance-frontend/src/widgets/header/Header.tsx',
  'zhan-finance-frontend/src/widgets/footer/Footer.tsx',
  'zhan-finance-frontend/src/widgets/hero/Hero.tsx',
  'zhan-finance-frontend/src/widgets/pricing-table/PricingTable.tsx',
  'zhan-finance-frontend/src/widgets/reviews/Reviews.tsx',
  'zhan-finance-frontend/src/widgets/team/Team.tsx',
  'zhan-finance-frontend/src/widgets/offices/Offices.tsx',
  'zhan-finance-frontend/src/widgets/trust/Trust.tsx',
  'zhan-finance-frontend/src/widgets/faq-contact/FaqContact.tsx',
  'zhan-finance-frontend/src/features/contact-form/ContactForm.tsx',
  'zhan-finance-frontend/src/features/service-modal/ServiceModal.tsx',
  'zhan-finance-frontend/src/features/solution-picker/questions.ts',
  'zhan-finance-frontend/src/features/solution-picker/SolutionPicker.tsx',
  'zhan-finance-frontend/src/widgets/cookie-consent/CookieConsent.tsx'
];

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

const allUsedKeys = [];

targetFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const base = path.basename(file);
  const nsMatch = content.match(/useTranslation\(\s*['"]([^'"]+)['"]/);
  const defaultNs = nsMatch ? nsMatch[1] : 'common';

  const tRegex = /t\(\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = tRegex.exec(content)) !== null) {
    let raw = m[1];
    if (raw.includes('${')) continue; // handle separately
    let ns = defaultNs;
    let key = raw;
    if (raw.includes(':')) {
      [ns, key] = raw.split(':');
    }
    allUsedKeys.push({ file: base, ns, key, full: raw });
  }
});

console.log(`Extracted ${allUsedKeys.length} literal keys.`);

// Verify each against all 4 languages
const missingKeys = [];
allUsedKeys.forEach(({ file, ns, key, full }) => {
  langs.forEach(l => {
    const val = getVal(locales[l][ns] || {}, key);
    if (val === undefined) {
      missingKeys.push({ lang: l, file, ns, key });
    }
  });
});

console.log(`Found ${missingKeys.length} missing key occurrences:`);
missingKeys.forEach(m => {
  console.log(`  [${m.lang}] ${m.file} -> ns="${m.ns}" key="${m.key}"`);
});
