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
    landing: JSON.parse(fs.readFileSync('zhan-finance-frontend/src/shared/i18n/locales/' + l + '/landing.json', 'utf8')),
    common: JSON.parse(fs.readFileSync('zhan-finance-frontend/src/shared/i18n/locales/' + l + '/common.json', 'utf8'))
  };
});

console.log('=== 1. LANDING.JSON ANALYSIS ===');
const landingRuKeys = Object.keys(locales.ru.landing);
console.log('Total keys in ru/landing.json:', landingRuKeys.length);
landingRuKeys.forEach(k => {
  langs.forEach(l => {
    if (!locales[l].landing[k]) {
      console.log(`[landing.json] MISSING key "${k}" in ${l}`);
    }
  });
});

console.log('\n=== 2. SCANNING FILES FOR ALL HARDCODED TEXT & I18N USAGE ===');

function extractHardcodedAndKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const base = path.basename(filePath);
  
  // Check JSX hardcoded Cyrillic text
  // Match text between > and < that contains Cyrillic characters
  const cyrillicInJsx = [];
  const jsxRegex = />([^<>{}]*[\u0400-\u04FF][^<>{}]*)</g;
  let m;
  while ((m = jsxRegex.exec(content)) !== null) {
    const text = m[1].trim();
    if (text && !text.startsWith('//') && !text.startsWith('/*')) {
      cyrillicInJsx.push(text);
    }
  }

  // Also check string literals in arrays / props with Cyrillic
  // e.g. title: 'Срочные отчёты...', placeholder="Ваше имя"
  const stringPropRegex = /['"]([^'"]*[\u0400-\u04FF][^'"]*)['"]/g;
  const cyrillicStrings = [];
  while ((m = stringPropRegex.exec(content)) !== null) {
    const s = m[1].trim();
    // Ignore defaultValue
    const matchPos = m.index;
    const beforeStr = content.substring(Math.max(0, matchPos - 30), matchPos);
    if (!beforeStr.includes('defaultValue') && !beforeStr.includes('//') && !beforeStr.includes('/*')) {
      cyrillicStrings.push(s);
    }
  }

  console.log(`\n--- File: ${base} ---`);
  if (cyrillicInJsx.length > 0) {
    console.log(`  [JSX Hardcoded Cyrillic] (${cyrillicInJsx.length}):`, cyrillicInJsx);
  }
  if (cyrillicStrings.length > 0) {
    console.log(`  [String Literals with Cyrillic] (${cyrillicStrings.length}):`, cyrillicStrings.slice(0, 10));
  }
}

targetFiles.forEach(f => {
  if (fs.existsSync(f)) extractHardcodedAndKeys(f);
});
