# Задача: Редизайн брендинга — шрифт, логотип, заголовок

## Статус
Приоритет: высокий. Выполнить до демо команде на следующей неделе.

---

## Контекст проекта

**Стек:** React 19 + Vite 8 + Tailwind CSS v4 + TypeScript + react-router-dom v7 + framer-motion  
**Целевые файлы:**
- `zhan-finance-frontend/src/index.css` — глобальные стили, тема, @font-face
- `zhan-finance-frontend/src/widgets/header/Header.tsx` — хидер с логотипом
- `zhan-finance-frontend/index.html` — `<title>` и мета

---

## Проблема: почему сейчас шрифт логотипа не работает как надо

Текущий хидер рендерит логотип так:

```tsx
// Header.tsx
import LogoImage from '@/shared/assets/icons/logo.png';

<img src={LogoImage} alt="Zhan Finance Logo" className="w-10 h-10 rounded-xl object-contain shadow-lg" />
<span className="font-logo text-xl leading-none uppercase tracking-widest text-brand-green">
  Zhan
</span>
<span className="font-logo text-[10px] leading-tight tracking-[0.2em] uppercase text-brand-green/80">
  Finance
</span>
```

**Проблема 1 — `font-logo` подключён через нестандартный путь:**
```css
/* index.css */
@font-face {
  font-family: 'a_Simpler';
  src: url('./shared/assets/fonts/a_Simpler_Bold.ttf') format('truetype');
  font-weight: 100 900;
  font-display: swap;
}

@theme {
  --font-logo: "a_Simpler", sans-serif;
}
```
В Tailwind CSS v4 `--font-logo` попадает в утилиту `font-logo`. Это работает только если Vite корректно резолвит путь к TTF-файлу из `index.css`. Если шрифт не найден — браузер тихо фолбэчит на `sans-serif` и логотип выглядит иначе, чем задумано.

**Проблема 2 — PNG-логотип рядом с текстом:**  
Сейчас рендерится `img` (PNG) + текст рядом. Если PNG старый/некачественный — он портит весь блок логотипа визуально.

**Итог:** нельзя делать логотип "только шрифтом" не убрав `<img>`. Пока `<img>` рядом — это PNG + текст, а не чистый типографский логотип.

---

## Задача 1 — Логотип только шрифтом (приоритетный вариант)

Убрать PNG. Логотип = чистый текст с кастомным шрифтом.

```tsx
// Header.tsx — заменить блок логотипа на:
<Link to={ROUTES.HOME} className="flex items-center gap-1 group relative z-50">
  <span className="font-logo text-2xl leading-none tracking-widest text-brand-green group-hover:opacity-80 transition-opacity">
    ЖАН
  </span>
  <span className="font-logo text-[11px] leading-tight tracking-[0.25em] uppercase text-brand-green/70 self-end mb-0.5">
    Finance
  </span>
</Link>
```

**Что важно:**
- `font-logo` уже зарегистрирован в теме через `--font-logo` — просто используй его
- `tracking-widest` даёт воздух между буквами — не убирай
- "Zhan" → "ЖАН" (кириллица, uppercase, без `.toUpperCase()` — прямо в тексте)
- Убрать `<img>` полностью — он больше не нужен, убрать и импорт `LogoImage`

**Если шрифт `a_Simpler` не отображается (фолбэк на sans-serif):**  
Проверить что файл физически лежит по пути:
```
zhan-finance-frontend/src/shared/assets/fonts/a_Simpler_Bold.ttf
```
Если файла нет — шрифт нужно добавить в репо. Без него типографский логотип не работает.

---

## Задача 2 — Шрифты тела страницы

Текущий `body` использует `font-sans` (системный стек Tailwind). Нужно подобрать и подключить один читаемый шрифт для всего лендинга.

**Рекомендация:** Google Fonts через `@import` или через `<link>` в `index.html`. Варианты:
- `Inter` — нейтральный, читаемый, популярный в SaaS
- `Manrope` — чуть более характерный, подходит под стиль
- `Plus Jakarta Sans` — современный, хорошо смотрится на финансовых продуктах

**Подключение через index.html (предпочтительно — не блокирует CSS бандл):**
```html
<!-- index.html, внутри <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
```

**Подключение в теме:**
```css
/* index.css */
@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-logo: "a_Simpler", sans-serif; /* оставить */
}
```

---

## Задача 3 — Хидер: sticky или статичный

Текущий хидер — `fixed` (всегда поверх контента), с динамичным стилем при скролле:
```tsx
// Header.tsx — логика уже есть:
const [isScrolled, setIsScrolled] = useState(false);
// при isScrolled → фон bg-brand-beige/90 + backdrop-blur + border + shadow
// при !isScrolled на главной → bg-transparent
```

**Это и есть "sticky поведение" — хидер уже фиксированный.** Вопрос только в визуале:
- Если хочешь чтобы он не "плавал" над контентом а двигался со страницей → заменить `fixed` на `relative`/`static`, убрать `useEffect` со скроллом
- Если оставить фиксированным → добавить `pt-[72px]` или `pt-[80px]` к `<main>` чтобы контент не уходил под хидер

**Решение (зафиксировать с боссом):** оставить `fixed` — это стандарт для лендинга.

---

## Задача 4 — Замена "Zhan" на "ЖАН" везде

Места в коде где встречается строка "Zhan" (не в именах переменных/файлов):

```
index.html           → <title>Zhan Finance</title>  → "ЖАН Finance"
Header.tsx           → текст логотипа               → уже в Задаче 1
i18n файлы           → ключи publicNav.*, meta.title → проверить и заменить
```

Поиск по репо:
```bash
grep -r '"Zhan' src/ --include="*.ts" --include="*.tsx" --include="*.json"
grep -r '>Zhan' src/ --include="*.tsx"
```

**Важно:** менять только отображаемый текст. Имена переменных, импортов, CSS-классов, id — не трогать.

---

## SVG-логотип (резервный вариант)

Если шрифт `a_Simpler` недоступен или типографский вариант не устраивает визуально — делаем SVG.

Минимальный SVG-логотип:
```tsx
// shared/ui/Logo.tsx
export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ЖАН Finance"
    >
      <text
        x="0" y="30"
        fontFamily="a_Simpler, sans-serif"
        fontSize="28"
        fontWeight="700"
        letterSpacing="4"
        fill="currentColor"
      >
        ЖАН
      </text>
      <text
        x="2" y="40"
        fontFamily="a_Simpler, sans-serif"
        fontSize="9"
        fontWeight="400"
        letterSpacing="3"
        fill="currentColor"
        opacity="0.7"
      >
        FINANCE
      </text>
    </svg>
  );
}
```

Использование в Header:
```tsx
import { Logo } from '@/shared/ui/Logo';

<Link to={ROUTES.HOME} className="group relative z-50">
  <Logo className="h-10 w-auto text-brand-green group-hover:opacity-80 transition-opacity" />
</Link>
```

[WARNING] SVG с `<text>` тоже требует доступности шрифта на клиенте. Если шрифт не загружен — браузер фолбэчит. Разница с вариантом 1 только в том, что SVG даёт больше контроля над позиционированием букв.

---

## Порядок выполнения

1. Проверить наличие файла `a_Simpler_Bold.ttf` в `src/shared/assets/fonts/`
2. Если есть → реализовать Задачу 1 (шрифт без PNG)
3. Если нет → либо добавить файл в репо, либо перейти к SVG-варианту
4. Подключить новый шрифт тела (Inter или аналог) — Задача 2
5. Заменить "Zhan" → "ЖАН" везде по тексту — Задача 4
6. Убедиться что хидер `fixed` + `<main>` имеет нужный `padding-top`

---

## Что не трогать

- CSS-переменные `--color-brand-*` и `--font-logo` в `@theme` — только расширять, не удалять
- Логику скролла в Header.tsx — она нужна для анимации хидера
- Имена файлов, папок, переменных — только отображаемый текст
- `LanguageSwitcher` — не трогать
