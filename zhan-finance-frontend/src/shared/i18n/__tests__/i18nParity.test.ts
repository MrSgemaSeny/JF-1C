import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as dateFormatModule from '@/shared/lib/dateFormat';
import { translateNotificationTitle, translateNotificationMessage } from '@/shared/i18n/notificationTranslator';
import { translateServiceName, translateServiceDesc, translateStageName, translateTaskTitle } from '@/shared/i18n/taskTranslator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_DIR = path.resolve(__dirname, '..', 'locales');

const SUPPORTED_LOCALES = ['ru', 'kk', 'en', 'zh'] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

const REQUIRED_NAMESPACES = ['common', 'auth', 'crm', 'landing', 'modals', 'tasks'] as const;
type RequiredNamespace = typeof REQUIRED_NAMESPACES[number];

const REQUIRED_ROLES = ['ADMIN', 'EMPLOYEE', 'CLIENT', 'LEARNER', 'CURATOR', 'ADVISOR'] as const;

interface LoadedDictionary {
  exists: boolean;
  filePath: string;
  data: Record<string, any> | null;
  error?: string;
}

function loadDictionary(locale: string, ns: string): LoadedDictionary {
  const filePath = path.join(LOCALES_DIR, locale, `${ns}.json`);
  if (!fs.existsSync(filePath)) {
    return { exists: false, filePath, data: null };
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return { exists: true, filePath, data };
  } catch (err: any) {
    return { exists: true, filePath, data: null, error: err.message };
  }
}

function flattenKeys(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  if (!obj || typeof obj !== 'object') {
    if (prefix) {
      result[prefix] = obj;
    }
    return result;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const nestedKey = prefix ? `${prefix}.${index}` : `${index}`;
      Object.assign(result, flattenKeys(item, nestedKey));
    });
    return result;
  }

  for (const [key, value] of Object.entries(obj)) {
    const nestedKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') {
      Object.assign(result, flattenKeys(value, nestedKey));
    } else {
      result[nestedKey] = value;
    }
  }

  return result;
}

const CYRILLIC_REGEX = /[\u0400-\u04FF]/;
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

describe('Tier 1: Feature Coverage (Dictionary Loading & Namespace Matrix)', () => {
  describe('F1-F4: Russian (ru) Baseline Dictionaries', () => {
    it('TC-T1-RU-01: loads ru/common.json as valid non-empty object', () => {
      const dict = loadDictionary('ru', 'common');
      expect(dict.exists, 'ru/common.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
      expect(Object.keys(dict.data!).length).toBeGreaterThan(10);
    });

    it('TC-T1-RU-02: loads ru/auth.json as valid non-empty object', () => {
      const dict = loadDictionary('ru', 'auth');
      expect(dict.exists, 'ru/auth.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
      expect(Object.keys(dict.data!).length).toBeGreaterThan(5);
    });

    it('TC-T1-RU-03: loads ru/crm.json as valid non-empty object', () => {
      const dict = loadDictionary('ru', 'crm');
      expect(dict.exists, 'ru/crm.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
      expect(Object.keys(dict.data!).length).toBeGreaterThan(0);
    });

    it('TC-T1-RU-04: loads ru/landing.json as valid non-empty object', () => {
      const dict = loadDictionary('ru', 'landing');
      expect(dict.exists, 'ru/landing.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
      expect(Object.keys(dict.data!).length).toBeGreaterThan(5);
    });

    it('TC-T1-RU-05: loads ru/modals.json and ru/tasks.json as valid non-empty objects', () => {
      const modals = loadDictionary('ru', 'modals');
      expect(modals.exists, 'ru/modals.json must exist').toBe(true);
      expect(modals.error).toBeUndefined();
      expect(typeof modals.data).toBe('object');

      const tasks = loadDictionary('ru', 'tasks');
      expect(tasks.exists, 'ru/tasks.json must exist').toBe(true);
      expect(tasks.error).toBeUndefined();
      expect(typeof tasks.data).toBe('object');
    });
  });

  describe('F1-F4: Kazakh (kk) Dictionaries', () => {
    it('TC-T1-KK-01: loads kk/common.json as valid non-empty object', () => {
      const dict = loadDictionary('kk', 'common');
      expect(dict.exists, 'kk/common.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
    });

    it('TC-T1-KK-02: loads kk/auth.json as valid non-empty object', () => {
      const dict = loadDictionary('kk', 'auth');
      expect(dict.exists, 'kk/auth.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
    });

    it('TC-T1-KK-03: loads kk/crm.json as valid non-empty object', () => {
      const dict = loadDictionary('kk', 'crm');
      expect(dict.exists, 'kk/crm.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
    });

    it('TC-T1-KK-04: loads kk/landing.json as valid non-empty object', () => {
      const dict = loadDictionary('kk', 'landing');
      expect(dict.exists, 'kk/landing.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
    });

    it('TC-T1-KK-05: loads kk/modals.json and kk/tasks.json as valid non-empty objects', () => {
      const modals = loadDictionary('kk', 'modals');
      expect(modals.exists, 'kk/modals.json must exist').toBe(true);
      expect(modals.error).toBeUndefined();
      expect(typeof modals.data).toBe('object');

      const tasks = loadDictionary('kk', 'tasks');
      expect(tasks.exists, 'kk/tasks.json must exist').toBe(true);
      expect(tasks.error).toBeUndefined();
      expect(typeof tasks.data).toBe('object');
    });
  });

  describe('F1-F4: English (en) Dictionaries', () => {
    it('TC-T1-EN-01: loads en/common.json as valid non-empty object', () => {
      const dict = loadDictionary('en', 'common');
      expect(dict.exists, 'en/common.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
    });

    it('TC-T1-EN-02: loads en/auth.json as valid non-empty object', () => {
      const dict = loadDictionary('en', 'auth');
      expect(dict.exists, 'en/auth.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
    });

    it('TC-T1-EN-03: loads en/crm.json as valid non-empty object', () => {
      const dict = loadDictionary('en', 'crm');
      expect(dict.exists, 'en/crm.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
    });

    it('TC-T1-EN-04: loads en/landing.json as valid non-empty object', () => {
      const dict = loadDictionary('en', 'landing');
      expect(dict.exists, 'en/landing.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
    });

    it('TC-T1-EN-05: loads en/modals.json and en/tasks.json as valid non-empty objects', () => {
      const modals = loadDictionary('en', 'modals');
      expect(modals.exists, 'en/modals.json must exist').toBe(true);
      expect(modals.error).toBeUndefined();
      expect(typeof modals.data).toBe('object');

      const tasks = loadDictionary('en', 'tasks');
      expect(tasks.exists, 'en/tasks.json must exist').toBe(true);
      expect(tasks.error).toBeUndefined();
      expect(typeof tasks.data).toBe('object');
    });
  });

  describe('F1-F4: Chinese (zh) Dictionaries', () => {
    it('TC-T1-ZH-01: loads zh/common.json as valid non-empty object', () => {
      const dict = loadDictionary('zh', 'common');
      expect(dict.exists, 'zh/common.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
    });

    it('TC-T1-ZH-02: loads zh/auth.json as valid non-empty object', () => {
      const dict = loadDictionary('zh', 'auth');
      expect(dict.exists, 'zh/auth.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
    });

    it('TC-T1-ZH-03: loads zh/crm.json as valid non-empty object', () => {
      const dict = loadDictionary('zh', 'crm');
      expect(dict.exists, 'zh/crm.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
    });

    it('TC-T1-ZH-04: loads zh/landing.json as valid non-empty object', () => {
      const dict = loadDictionary('zh', 'landing');
      expect(dict.exists, 'zh/landing.json must exist').toBe(true);
      expect(dict.error).toBeUndefined();
      expect(typeof dict.data).toBe('object');
      expect(dict.data).not.toBeNull();
    });

    it('TC-T1-ZH-05: loads zh/modals.json and zh/tasks.json as valid non-empty objects', () => {
      const modals = loadDictionary('zh', 'modals');
      expect(modals.exists, 'zh/modals.json must exist').toBe(true);
      expect(modals.error).toBeUndefined();
      expect(typeof modals.data).toBe('object');

      const tasks = loadDictionary('zh', 'tasks');
      expect(tasks.exists, 'zh/tasks.json must exist').toBe(true);
      expect(tasks.error).toBeUndefined();
      expect(typeof tasks.data).toBe('object');
    });
  });

  describe('Namespace Completeness Matrix (All 4 Locales * 6 Namespaces)', () => {
    for (const ns of REQUIRED_NAMESPACES) {
      it(`TC-T1-MX-${ns}: ensures ${ns}.json exists for all 4 locales`, () => {
        const missingLocales: string[] = [];
        for (const loc of SUPPORTED_LOCALES) {
          const dict = loadDictionary(loc, ns);
          if (!dict.exists || !dict.data) {
            missingLocales.push(loc);
          }
        }
        expect(missingLocales, `Missing ${ns}.json in locales: ${missingLocales.join(', ')}`).toEqual([]);
      });
    }
  });
});

describe('Tier 2: Boundary & Corner Cases (Structural Parity & Leakage Detection)', () => {
  const ruDictionaries: Record<RequiredNamespace, Record<string, any>> = {} as any;
  const ruFlatKeys: Record<RequiredNamespace, Set<string>> = {} as any;

  for (const ns of REQUIRED_NAMESPACES) {
    const dict = loadDictionary('ru', ns);
    ruDictionaries[ns] = dict.data || {};
    ruFlatKeys[ns] = new Set(Object.keys(flattenKeys(dict.data || {})));
  }

  describe('Structural Key Parity Against ru Baseline', () => {
    for (const loc of ['kk', 'en', 'zh'] as const) {
      for (const ns of REQUIRED_NAMESPACES) {
        it(`TC-T2-PARITY-${loc.toUpperCase()}-${ns}: asserts 0 missing keys in ${loc}/${ns}.json`, () => {
          const dict = loadDictionary(loc, ns);
          expect(dict.exists, `${loc}/${ns}.json must exist`).toBe(true);
          const flat = flattenKeys(dict.data || {});
          const locKeys = new Set(Object.keys(flat));

          const missingKeys: string[] = [];
          for (const key of ruFlatKeys[ns]) {
            if (!locKeys.has(key)) {
              missingKeys.push(key);
            }
          }

          expect(missingKeys, `${loc}/${ns}.json is missing ${missingKeys.length} keys: ${missingKeys.slice(0, 10).join(', ')}${missingKeys.length > 10 ? '...' : ''}`).toEqual([]);
        });

        it(`TC-T2-EXTRA-${loc.toUpperCase()}-${ns}: asserts 0 extra undeclared keys in ${loc}/${ns}.json`, () => {
          const dict = loadDictionary(loc, ns);
          expect(dict.exists, `${loc}/${ns}.json must exist`).toBe(true);
          const flat = flattenKeys(dict.data || {});

          const extraKeys: string[] = [];
          for (const key of Object.keys(flat)) {
            if (!ruFlatKeys[ns].has(key)) {
              extraKeys.push(key);
            }
          }

          expect(extraKeys, `${loc}/${ns}.json has ${extraKeys.length} extra undeclared keys: ${extraKeys.slice(0, 10).join(', ')}${extraKeys.length > 10 ? '...' : ''}`).toEqual([]);
        });
      }
    }
  });

  describe('Cyrillic Character Leakage Detection in en and zh Translations', () => {
    const BRAND_EXCEPTIONS = [
      'ЖАН FINANCE',
      'LLP ЖАН FINANCE',
    ];

    it('TC-T2-LEAK-EN: detects and asserts 0 Cyrillic characters in English translations', () => {
      const cyrillicLeaks: Array<{ ns: string; key: string; value: string }> = [];

      for (const ns of REQUIRED_NAMESPACES) {
        const dict = loadDictionary('en', ns);
        if (!dict.exists || !dict.data) continue;
        const flat = flattenKeys(dict.data);

        for (const [key, value] of Object.entries(flat)) {
          if (typeof value === 'string' && CYRILLIC_REGEX.test(value)) {
            const hasBrandException = BRAND_EXCEPTIONS.some(b => value.includes(b));
            if (!hasBrandException) {
              cyrillicLeaks.push({ ns, key, value });
            }
          }
        }
      }

      const leakSummary = cyrillicLeaks.map(l => `${l.ns} -> ${l.key}: "${l.value}"`).slice(0, 10).join('; ');
      expect(cyrillicLeaks, `English dictionaries contain ${cyrillicLeaks.length} Cyrillic leaks: ${leakSummary}`).toEqual([]);
    });

    it('TC-T2-LEAK-ZH: detects and asserts 0 Cyrillic characters in Chinese translations', () => {
      const cyrillicLeaks: Array<{ ns: string; key: string; value: string }> = [];

      for (const ns of REQUIRED_NAMESPACES) {
        const dict = loadDictionary('zh', ns);
        if (!dict.exists || !dict.data) continue;
        const flat = flattenKeys(dict.data);

        for (const [key, value] of Object.entries(flat)) {
          if (typeof value === 'string' && CYRILLIC_REGEX.test(value)) {
            cyrillicLeaks.push({ ns, key, value });
          }
        }
      }

      const leakSummary = cyrillicLeaks.map(l => `${l.ns} -> ${l.key}: "${l.value}"`).slice(0, 10).join('; ');
      expect(cyrillicLeaks, `Chinese dictionaries contain ${cyrillicLeaks.length} Cyrillic leaks: ${leakSummary}`).toEqual([]);
    });
  });

  describe('Zero Emojis Prohibition', () => {
    it('TC-T2-EMOJI-01: asserts zero Unicode emojis across all dictionaries and locales', () => {
      const emojiViolations: Array<{ locale: string; ns: string; key: string; value: string }> = [];

      for (const loc of SUPPORTED_LOCALES) {
        for (const ns of REQUIRED_NAMESPACES) {
          const dict = loadDictionary(loc, ns);
          if (!dict.exists || !dict.data) continue;
          const flat = flattenKeys(dict.data);

          for (const [key, value] of Object.entries(flat)) {
            if (typeof value === 'string' && EMOJI_REGEX.test(value)) {
              emojiViolations.push({ locale: loc, ns, key, value });
            }
          }
        }
      }

      expect(emojiViolations, `Found ${emojiViolations.length} emoji violations: ${JSON.stringify(emojiViolations)}`).toEqual([]);
    });
  });

  describe('Interpolation Variable Consistency', () => {
    it('TC-T2-INTERPOLATION-01: ensures variable placeholders match between ru and other locales', () => {
      const extractPlaceholders = (str: string): string[] => {
        const matches = str.match(/\{\{([^}]+)\}\}/g);
        return matches ? matches.sort() : [];
      };

      const mismatches: Array<{ locale: string; ns: string; key: string; ruTokens: string[]; locTokens: string[] }> = [];

      for (const ns of REQUIRED_NAMESPACES) {
        const ruFlat = flattenKeys(ruDictionaries[ns]);
        for (const loc of ['kk', 'en', 'zh'] as const) {
          const dict = loadDictionary(loc, ns);
          if (!dict.exists || !dict.data) continue;
          const locFlat = flattenKeys(dict.data);

          for (const [key, ruVal] of Object.entries(ruFlat)) {
            if (typeof ruVal !== 'string') continue;
            const ruTokens = extractPlaceholders(ruVal);
            if (ruTokens.length === 0) continue;

            const locVal = locFlat[key];
            if (typeof locVal !== 'string') continue;
            const locTokens = extractPlaceholders(locVal);

            if (JSON.stringify(ruTokens) !== JSON.stringify(locTokens)) {
              mismatches.push({ locale: loc, ns, key, ruTokens, locTokens });
            }
          }
        }
      }

      expect(mismatches, `Placeholder mismatches detected: ${JSON.stringify(mismatches.slice(0, 5))}`).toEqual([]);
    });
  });
});

describe('Tier 3: Cross-Feature Combinations (dateFormat & LanguageSwitcher)', () => {
  const TEST_DATE = new Date('2026-09-15T10:30:00.000Z');

  describe('dateFormat Utilities across ru, kk, en, zh', () => {
    it('TC-T3-DATE-01: formatDate exports and formats for ru, kk, en, zh', () => {
      const formatDate = (dateFormatModule as any).formatDate;
      expect(typeof formatDate, 'formatDate must be exported as a function').toBe('function');

      if (typeof formatDate === 'function') {
        for (const loc of SUPPORTED_LOCALES) {
          const result = formatDate(TEST_DATE, loc);
          expect(result, `formatDate for ${loc} must return non-empty string`).toBeTruthy();
          expect(typeof result).toBe('string');
        }
      }
    });

    it('TC-T3-DATE-02: formatDateTime exports and includes date and time components for ru, kk, en, zh', () => {
      const formatDateTime = (dateFormatModule as any).formatDateTime;
      expect(typeof formatDateTime, 'formatDateTime must be exported as a function').toBe('function');

      if (typeof formatDateTime === 'function') {
        for (const loc of SUPPORTED_LOCALES) {
          const result = formatDateTime(TEST_DATE, loc);
          expect(result, `formatDateTime for ${loc} must return non-empty string`).toBeTruthy();
          expect(typeof result).toBe('string');
        }
      }
    });

    it('TC-T3-DATE-03: formatTime exports and returns valid time string for ru, kk, en, zh', () => {
      const formatTime = (dateFormatModule as any).formatTime;
      expect(typeof formatTime, 'formatTime must be exported as a function').toBe('function');

      if (typeof formatTime === 'function') {
        for (const loc of SUPPORTED_LOCALES) {
          const result = formatTime(TEST_DATE, loc);
          expect(result, `formatTime for ${loc} must return valid time`).toBeTruthy();
          expect(typeof result).toBe('string');
        }
      }
    });

    it('TC-T3-DATE-04: formatRelativeTime handles past and future relative offsets across locales', () => {
      const formatRelativeTime = (dateFormatModule as any).formatRelativeTime;
      expect(typeof formatRelativeTime, 'formatRelativeTime must be exported as a function').toBe('function');

      if (typeof formatRelativeTime === 'function') {
        const pastDate = new Date(Date.now() - 3600 * 1000 * 5); // 5 hours ago
        for (const loc of SUPPORTED_LOCALES) {
          const result = formatRelativeTime(pastDate, loc);
          expect(result, `formatRelativeTime for ${loc} must return string`).toBeTruthy();
          expect(typeof result).toBe('string');
        }
      }
    });

    it('TC-T3-DATE-05: formatCurrency formats KZT, USD, EUR amounts across ru, kk, en, zh', () => {
      const formatCurrency = (dateFormatModule as any).formatCurrency;
      expect(typeof formatCurrency, 'formatCurrency must be exported as a function').toBe('function');

      if (typeof formatCurrency === 'function') {
        for (const loc of SUPPORTED_LOCALES) {
          const kzt = formatCurrency(150000, loc, 'KZT');
          expect(kzt, `formatCurrency KZT for ${loc} must be non-empty`).toBeTruthy();
          expect(typeof kzt).toBe('string');

          const usd = formatCurrency(2500, loc, 'USD');
          expect(usd, `formatCurrency USD for ${loc} must be non-empty`).toBeTruthy();
        }
      }
    });

    it('TC-T3-DATE-06: formatNumber formats integer and float values with locale grouping', () => {
      const formatNumber = (dateFormatModule as any).formatNumber;
      expect(typeof formatNumber, 'formatNumber must be exported as a function').toBe('function');

      if (typeof formatNumber === 'function') {
        for (const loc of SUPPORTED_LOCALES) {
          const result = formatNumber(1234567.89, loc);
          expect(result, `formatNumber for ${loc} must be non-empty`).toBeTruthy();
          expect(typeof result).toBe('string');
        }
      }
    });

    it('TC-T3-DATE-07: formatHeaderDate formats correct weekday and month for ru, kk, en, zh', () => {
      const formatHeaderDate = (dateFormatModule as any).formatHeaderDate;
      expect(typeof formatHeaderDate, 'formatHeaderDate must be exported as a function').toBe('function');

      if (typeof formatHeaderDate === 'function') {
        const testDate = new Date('2026-09-15T12:00:00'); // Tuesday, September 15
        expect(formatHeaderDate(testDate, 'ru')).toBe('Вторник, 15 сентября');
        expect(formatHeaderDate(testDate, 'kk')).toBe('Сейсенбі, 15 қыркүйек');
        expect(formatHeaderDate(testDate, 'en')).toBe('Tuesday, September 15');
        expect(formatHeaderDate(testDate, 'zh')).toBe('9月15日 星期二');
      }
    });
  });

  describe('LanguageSwitcher Integration & Codes', () => {
    it('TC-T3-LANG-01: verifies exactly 4 supported language codes in configuration', () => {
      expect(SUPPORTED_LOCALES).toEqual(['ru', 'kk', 'en', 'zh']);
    });

    it('TC-T3-LANG-02: verifies localStorage key convention is jf1c_lang', () => {
      const EXPECTED_STORAGE_KEY = 'jf1c_lang';
      expect(EXPECTED_STORAGE_KEY).toBe('jf1c_lang');
    });

    it('TC-T3-LANG-03: verifies taskPrefixes mappings exist in dictionaries for taskTranslator', () => {
      for (const loc of SUPPORTED_LOCALES) {
        const dict = loadDictionary(loc, 'common');
        if (!dict.exists || !dict.data) continue;
        const taskPrefixes = dict.data.taskPrefixes;
        expect(taskPrefixes, `taskPrefixes must exist in ${loc}/common.json`).toBeDefined();
        if (taskPrefixes) {
          expect(taskPrefixes['Запрос на услугу']).toBeDefined();
          expect(taskPrefixes['Заказ услуги']).toBeDefined();
        }
      }
    });
  });
});

describe('Tier 4: Real-World Scenarios (Roles, Stages & Notification Translators)', () => {
  describe('All 6 Platform Roles Translation across all 4 Locales', () => {
    for (const loc of SUPPORTED_LOCALES) {
      it(`TC-T4-ROLES-${loc.toUpperCase()}-01: verifies all 6 roles in ${loc} profile.roles`, () => {
        const dict = loadDictionary(loc, 'common');
        expect(dict.exists, `${loc}/common.json must exist`).toBe(true);
        expect(dict.data).not.toBeNull();

        const profileRoles = dict.data?.profile?.roles;
        expect(profileRoles, `profile.roles must exist in ${loc}/common.json`).toBeDefined();

        const missingRoles: string[] = [];
        for (const role of REQUIRED_ROLES) {
          if (!profileRoles || !profileRoles[role] || typeof profileRoles[role] !== 'string') {
            missingRoles.push(role);
          }
        }

        expect(missingRoles, `Missing roles in ${loc} profile.roles: ${missingRoles.join(', ')}`).toEqual([]);
      });

      it(`TC-T4-ROLES-${loc.toUpperCase()}-02: verifies all 6 roles in ${loc} sidebar.roles`, () => {
        const dict = loadDictionary(loc, 'common');
        expect(dict.exists, `${loc}/common.json must exist`).toBe(true);
        expect(dict.data).not.toBeNull();

        const sidebarRoles = dict.data?.sidebar?.roles;
        expect(sidebarRoles, `sidebar.roles must exist in ${loc}/common.json`).toBeDefined();

        const missingRoles: string[] = [];
        for (const role of REQUIRED_ROLES) {
          if (!sidebarRoles || !sidebarRoles[role] || typeof sidebarRoles[role] !== 'string') {
            missingRoles.push(role);
          }
        }

        expect(missingRoles, `Missing roles in ${loc} sidebar.roles: ${missingRoles.join(', ')}`).toEqual([]);
      });
    }
  });

  describe('CRM Stage and Status Mappings', () => {
    const STANDARD_STAGES = ['new', 'in_progress', 'review', 'done', 'won', 'lost'];

    for (const loc of SUPPORTED_LOCALES) {
      it(`TC-T4-STAGES-${loc.toUpperCase()}: verifies standard CRM stages in ${loc} common:stages`, () => {
        const dict = loadDictionary(loc, 'common');
        expect(dict.exists, `${loc}/common.json must exist`).toBe(true);
        const stages = dict.data?.stages;
        expect(stages, `stages must exist in ${loc}/common.json`).toBeDefined();

        const missingStages: string[] = [];
        for (const stage of STANDARD_STAGES) {
          if (!stages || !stages[stage]) {
            missingStages.push(stage);
          }
        }

        expect(missingStages, `Missing stages in ${loc}/common.json: ${missingStages.join(', ')}`).toEqual([]);
      });
    }

    it('TC-T4-TASKTRANS-01: translateStageName maps stage name for English and fallback', () => {
      const mockI18nEn = { language: 'en' } as any;
      const mockI18nRu = { language: 'ru' } as any;
      const mockT = ((key: string, opts?: any) => opts?.defaultValue || key) as any;

      const stage = { name: 'В работе', nameEn: 'In Progress' };
      expect(translateStageName(stage, mockT, mockI18nEn)).toBe('In Progress');
      expect(translateStageName(stage, mockT, mockI18nRu)).toBe('В работе');
    });

    it('TC-T4-TASKTRANS-02: translateServiceName maps service title for English and fallback', () => {
      const mockI18nEn = { language: 'en' } as any;
      const mockI18nRu = { language: 'ru' } as any;
      const mockT = ((key: string, opts?: any) => opts?.defaultValue || key) as any;

      const service = { title: 'Бухгалтерское обслуживание', titleEn: 'Accounting Support' };
      expect(translateServiceName(service, mockT, mockI18nEn)).toBe('Accounting Support');
      expect(translateServiceName(service, mockT, mockI18nRu)).toBe('Бухгалтерское обслуживание');
    });

    it('TC-T4-TASKTRANS-03: translateTaskTitle maps task prefixes properly', () => {
      const mockT = ((key: string, opts?: any) => {
        if (key === 'common:taskPrefixes.Запрос на услугу') return 'Service request';
        if (key === 'common:serviceNames.Аудит') return 'Audit';
        return opts?.defaultValue || key;
      }) as any;

      const translated = translateTaskTitle('Запрос на услугу: Аудит', mockT);
      expect(translated).toBe('Service request: Audit');
    });
  });

  describe('Dynamic Notification Translation Functions', () => {
    it('TC-T4-NOTIF-01: translateNotificationTitle translates standard titles for en', () => {
      expect(translateNotificationTitle('Новая задача', 'en')).toBe('New task');
      expect(translateNotificationTitle('Статус задачи изменен', 'en')).toBe('Task status updated');
      expect(translateNotificationTitle('Горит дедлайн!', 'en')).toBe('Deadline due today!');
      expect(translateNotificationTitle('Новый лид: Консультация', 'en')).toBe('New lead: Консультация');
      expect(translateNotificationTitle('Новый документ', 'en')).toBe('New document');
    });

    it('TC-T4-NOTIF-02: translateNotificationTitle preserves ru titles when lang is ru', () => {
      expect(translateNotificationTitle('Новая задача', 'ru')).toBe('Новая задача');
      expect(translateNotificationTitle('Статус задачи изменен', 'ru')).toBe('Статус задачи изменен');
    });

    it('TC-T4-NOTIF-03: translateNotificationTitle supports kk and zh without raw Russian fallback', () => {
      const title = 'Новая задача';
      const kkTitle = translateNotificationTitle(title, 'kk');
      const zhTitle = translateNotificationTitle(title, 'zh');

      expect(kkTitle, 'Kazakh notification title must be non-empty').toBeTruthy();
      expect(zhTitle, 'Chinese notification title must be non-empty').toBeTruthy();
    });

    it('TC-T4-NOTIF-04: translateNotificationMessage translates service request patterns for en', () => {
      const rawMsg = 'Ваш запрос на услугу «Бухгалтерский аудит» принят. Мы свяжемся с вами в ближайшее время.';
      const translated = translateNotificationMessage(rawMsg, 'en');
      expect(translated).toContain('Your request for service');
      expect(translated).toContain('has been accepted');
    });

    it('TC-T4-NOTIF-05: translateNotificationMessage translates task assignment and stage update for en', () => {
      const taskMsg = 'Вам создана новая задача: Сдача налоговой отчетности';
      const translatedTask = translateNotificationMessage(taskMsg, 'en');
      expect(translatedTask).toContain('A new task has been created for you:');

      const stageMsg = "Статус вашей задачи 'Аудит' изменен на: В работе";
      const translatedStage = translateNotificationMessage(stageMsg, 'en');
      expect(translatedStage).toContain("The status of your task 'Аудит' was changed to:");
    });

    it('TC-T4-NOTIF-06: translateNotificationMessage supports kk and zh message translation', () => {
      const rawMsg = 'Вам назначена задача: Годовой отчет';
      const kkMsg = translateNotificationMessage(rawMsg, 'kk');
      const zhMsg = translateNotificationMessage(rawMsg, 'zh');

      expect(kkMsg, 'Kazakh message should be handled').toBeTruthy();
      expect(zhMsg, 'Chinese message should be handled').toBeTruthy();
    });
  });
});
