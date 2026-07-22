import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { zodI18nMap } from 'zod-i18n-map';
import { z } from 'zod';

import translationRU from 'zod-i18n-map/locales/ru/zod.json';
import translationEN from 'zod-i18n-map/locales/en/zod.json';

import commonRU from './locales/ru/common.json';
import authRU from './locales/ru/auth.json';
import crmRU from './locales/ru/crm.json';
import landingRU from './locales/ru/landing.json';

import commonEN from './locales/en/common.json';
import authEN from './locales/en/auth.json';
import crmEN from './locales/en/crm.json';
import landingEN from './locales/en/landing.json';
import tasksRU from './locales/ru/tasks.json';
import tasksEN from './locales/en/tasks.json';
import modalsRU from './locales/ru/modals.json';
import modalsEN from './locales/en/modals.json';

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'ru',
    defaultNS: 'common',
    ns: ['common', 'auth', 'crm', 'zod', 'landing', 'tasks', 'modals'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'jf1c_lang',
    },
    resources: {
      ru: {
        common: commonRU,
        auth: authRU,
        crm: crmRU,
        landing: landingRU,
        tasks: tasksRU,
        modals: modalsRU,
        zod: translationRU
      },
      en: {
        common: commonEN,
        auth: authEN,
        crm: crmEN,
        landing: landingEN,
        tasks: tasksEN,
        modals: modalsEN,
        zod: translationEN
      },
    },
  });

z.setErrorMap(zodI18nMap);

export default i18n;
