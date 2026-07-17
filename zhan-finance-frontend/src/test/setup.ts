import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: any) => options?.defaultValue || key,
      i18n: { language: 'ru', changeLanguage: vi.fn() }
    }),
  };
});
