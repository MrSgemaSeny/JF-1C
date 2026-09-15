export type SupportedLocale = 'ru' | 'kk' | 'en' | 'zh';

const LOCALE_MAP: Record<string, string> = {
  ru: 'ru-RU',
  kk: 'kk-KZ',
  en: 'en-US',
  zh: 'zh-CN',
};

export function getIntlLocale(locale: string = 'ru'): string {
  return LOCALE_MAP[locale] || locale || 'ru-RU';
}

export function formatDate(
  date: Date | string | number,
  locale: string = 'ru',
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
  const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(getIntlLocale(locale), options).format(d);
}

export function formatDateTime(
  date: Date | string | number,
  locale: string = 'ru',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(getIntlLocale(locale), options).format(d);
}

export function formatTime(
  date: Date | string | number,
  locale: string = 'ru',
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
): string {
  const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(getIntlLocale(locale), options).format(d);
}

export function formatRelativeTime(
  date: Date | string | number,
  locale: string = 'ru'
): string {
  const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const now = Date.now();
  const diffInSeconds = Math.round((d.getTime() - now) / 1000);
  const diffInMinutes = Math.round(diffInSeconds / 60);
  const diffInHours = Math.round(diffInMinutes / 60);
  const diffInDays = Math.round(diffInHours / 24);

  const rtf = new Intl.RelativeTimeFormat(getIntlLocale(locale), { numeric: 'auto' });

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(diffInSeconds, 'second');
  }
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minute');
  }
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hour');
  }
  return rtf.format(diffInDays, 'day');
}

export function formatCurrency(
  amount: number,
  locale: string = 'ru',
  currency: string = 'KZT'
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(
  value: number,
  locale: string = 'ru',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), options).format(value);
}
