export type SupportedLocale = 'ru' | 'kk' | 'en' | 'zh';

const LOCALE_MAP: Record<string, string> = {
  ru: 'ru-RU',
  kk: 'kk-KZ',
  en: 'en-US',
  zh: 'zh-CN',
};

const MONTH_NAMES_GENITIVE: Record<string, string[]> = {
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  kk: ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

const WEEKDAY_NAMES_MAP: Record<string, string[]> = {
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  kk: ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
};

export function getIntlLocale(locale: string = 'ru'): string {
  const code = (locale || 'ru').slice(0, 2).toLowerCase();
  return LOCALE_MAP[code] || LOCALE_MAP[locale] || locale || 'ru-RU';
}

export function formatHeaderDate(date: Date | string | number, locale: string = 'ru'): string {
  const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const lang = (locale || 'ru').slice(0, 2).toLowerCase();
  const dayOfWeek = d.getDay();
  const dayOfMonth = d.getDate();
  const month = d.getMonth();

  const weekdays = WEEKDAY_NAMES_MAP[lang] || WEEKDAY_NAMES_MAP.ru;
  const months = MONTH_NAMES_GENITIVE[lang] || MONTH_NAMES_GENITIVE.ru;

  if (lang === 'zh') {
    return `${months[month]}${dayOfMonth}日 ${weekdays[dayOfWeek]}`;
  }
  if (lang === 'en') {
    return `${weekdays[dayOfWeek]}, ${months[month]} ${dayOfMonth}`;
  }
  if (lang === 'kk') {
    return `${weekdays[dayOfWeek]}, ${dayOfMonth} ${months[month]}`;
  }
  return `${weekdays[dayOfWeek]}, ${dayOfMonth} ${months[month]}`;
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
