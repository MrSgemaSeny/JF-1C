# JF-1C — План внедрения UI/UX (Канбан CRM)

> Цель: приблизить визуальный уровень к Bitrix24, сохраняя стек React 19 + Tailwind v4 + FSD.

---

## Дизайн-токены (Tailwind v4)

Добавить в `src/app/styles/tokens.css`:

```css
@layer base {
  :root {
    /* Акцентный цвет */
    --color-accent: #2563EB;
    --color-accent-hover: #1D4ED8;

    /* Статусы колонок канбана */
    --color-stage-new:      #0EA5E9;   /* Новая */
    --color-stage-docs:     #8B5CF6;   /* Подготовка документов */
    --color-stage-prepay:   #F59E0B;   /* Счёт на предоплату */
    --color-stage-active:   #10B981;   /* В работе */
    --color-stage-invoice:  #F97316;   /* Финальный счёт */
    --color-stage-lost:     #EF4444;   /* Сделка провалена */

    /* Нейтралы */
    --color-bg:       #F8FAFC;
    --color-surface:  #FFFFFF;
    --color-border:   #E2E8F0;
    --color-muted:    #64748B;
  }
}
```

---

## Фаза 1 — Структура канбана (неделя 1–2)

### 1.1 Новые сущности в FSD

```
src/
├── entities/
│   └── deal/
│       ├── model/          # DealStage enum, Deal interface
│       ├── ui/
│       │   ├── DealCard.tsx         # Карточка 96px
│       │   └── DealCardSkeleton.tsx # Скелетон загрузки
│       └── index.ts
├── features/
│   └── deals-kanban/
│       ├── ui/
│       │   ├── KanbanBoard.tsx      # Обёртка DnD
│       │   ├── KanbanColumn.tsx     # Колонка + сумма
│       │   └── KanbanFilters.tsx    # Шапка с фильтрами
│       ├── model/
│       │   └── useDealsDrag.ts      # Логика перетаскивания
│       └── index.ts
└── pages/
    └── deals/
        └── ui/
            ├── DealsPage.tsx
            └── DealsPage.module.css
```

### 1.2 Структура DealCard

```tsx
interface DealCardProps {
  id: string;
  title: string;
  amount: number;        // в тенге
  contact?: string;      // имя клиента
  responsible: string;   // аватар + имя
  dueDate?: string;      // дата дела
  overdueCount?: number; // красный бейдж
}
```

Карточка отображает:
- Заголовок сделки (14px/500)
- Сумма (13px, muted)
- Контакт (синяя ссылка, 13px)
- Дата дела + иконка телефона/письма
- Аватар ответственного (правый нижний угол)

### 1.3 Структура KanbanColumn

```tsx
interface KanbanColumnProps {
  stage: DealStage;
  color: string;           // CSS переменная --color-stage-*
  title: string;
  count: number;
  totalAmount: number;     // сумма тенге в колонке
  deals: Deal[];
  onAddDeal: () => void;
}
```

Шапка колонки: цветная полоска 4px сверху + название + count badge + сумма.

---

## Фаза 2 — Drag-and-Drop (неделя 2)

### Библиотека

```bash
npm install @hello-pangea/dnd
# или
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Рекомендация: **@dnd-kit** — лучше работает с React 19 и Tailwind v4.

### useDealsDrag.ts

```ts
// При сбросе карточки:
// 1. Оптимистичное обновление локального состояния
// 2. PATCH /api/deals/{id} { stage: newStage }
// 3. Откат при ошибке + toast "Не удалось переместить"
// 4. Инвалидация TanStack Query: queryClient.invalidateQueries(['deals'])
```

---

## Фаза 3 — Фильтры и виды (неделя 3)

### 3.1 KanbanFilters (шапка страницы)

```
[ + Создать ▾ ]  [ 📋 Общая воронка ▾ ]  [ Ответственный: все ▾ ]  [ 🔍 Поиск ]
[ Канбан | Список | Дела | Календарь ]
```

Компоненты:
- `ViewToggle.tsx` — переключатель вида (Kanban / List / Calendar)
- `StageFilter.tsx` — дропдаун воронок
- `ResponsibleFilter.tsx` — мультиселект пользователей
- `DealSearch.tsx` — поиск с debounce 300ms

### 3.2 URL-state для фильтров

```ts
// useDealsFilters.ts — sync с URL params
// /deals?view=kanban&responsible=user-1&stage=new
import { useSearchParams } from 'react-router-dom';
```

---

## Фаза 4 — Список и детальная карточка (неделя 4)

### 4.1 DealsListView

Таблица с колонками:
| Название | Сумма (тенге) | Этап | Клиент | Ответственный | Дата |
|---|---|---|---|---|---|

- Сортировка по клику на заголовок
- Пагинация (20 строк, cursor-based)
- Inline редактирование суммы

### 4.2 DealDetailModal / DealDetailPage

Боковая панель (drawer 480px) или отдельная страница:
- Редактирование полей сделки
- История изменений (audit log)
- Привязка задач (`TaskList`)
- Привязка документов (счёт, акт)
- Создание Invoice прямо из сделки

---

## Фаза 5 — Полировка (неделя 5)

### 5.1 Анимации

```css
/* Минимальные, функциональные */
.deal-card {
  transition: box-shadow 150ms ease, transform 150ms ease;
}
.deal-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

/* DnD — карточка при перетаскивании */
.deal-card[data-dragging="true"] {
  opacity: 0.5;
  transform: rotate(2deg) scale(1.02);
}
```

### 5.2 Skeleton-loading

Все колонки показывают 3 skeleton-карточки во время загрузки (TanStack Query `isLoading`).

### 5.3 Empty state

Каждая пустая колонка показывает:
```
[  + Быстрая сделка  ]
```
Кнопка открывает inline-форму: название + сумма + Enter для создания.

### 5.4 Адаптивность

- Мобильный (< 768px): только вид Список, канбан скрыт
- Планшет (768–1200px): горизонтальный скролл канбана
- Десктоп (> 1200px): полный канбан, 6 колонок видны

---

## Backend (Spring Boot) — дополнения

### Новые endpoint'ы

```
PATCH /api/deals/{id}/stage          # смена этапа (DnD)
GET   /api/deals?stage=&responsible= # фильтрация с пагинацией
GET   /api/deals/summary             # суммы по этапам для шапок
```

### DealSummaryResponse

```java
public record DealSummaryResponse(
    DealStage stage,
    long count,
    BigDecimal totalAmount
) {}
```

---

## Приоритеты

| # | Задача | Срок | Сложность |
|---|--------|------|-----------|
| 1 | Дизайн-токены в Tailwind v4 | День 1 | Низкая |
| 2 | DealCard + KanbanColumn (статика) | День 2–3 | Средняя |
| 3 | KanbanBoard + данные с бэкенда | День 4–5 | Средняя |
| 4 | DnD (@dnd-kit) + PATCH API | Неделя 2 | Высокая |
| 5 | Фильтры + ViewToggle | Неделя 3 | Средняя |
| 6 | DealDetailModal | Неделя 3–4 | Средняя |
| 7 | ListView + сортировка | Неделя 4 | Средняя |
| 8 | Skeleton + анимации | Неделя 5 | Низкая |

---

## Что НЕ копировать из Bitrix24

- Фиолетово-синий "космический" фон — не подходит бухгалтерии
- Анимированный фон с нейросетью — отвлекает
- Перегруженная шапка с 10+ кнопками
- Синтетические "Роботы" и "Расширения" — лишние для MVP

---

## Рекомендованный стек для канбана

```
@dnd-kit/core              — drag-and-drop ядро
@dnd-kit/sortable          — сортировка в колонках
@tanstack/react-query      — уже используется, кеш + invalidate
lucide-react               — иконки (телефон, письмо, плюс)
date-fns                   — форматирование дат (7 июля → 07.07)
```
