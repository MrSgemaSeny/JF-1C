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

vi.mock('@stomp/stompjs', () => {
  return {
    Client: vi.fn().mockImplementation(() => ({
      activate: vi.fn(),
      deactivate: vi.fn(),
      subscribe: vi.fn(),
      publish: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      onStompError: vi.fn(),
      onWebSocketError: vi.fn(),
    }))
  };
});

vi.mock('@/shared/ui/Toast/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  })
}));
