# 📊 Анализ Frontend CRM-модуля JF-1C

**Дата анализа:** 22 июня 2026 | **Статус:** Большей частью реализовано, но много деталей не хватает

---

## ✅ ЧТО РАБОТАЕТ

### Архитектура
- ✅ FSD структура (entities → features → pages → widgets)
- ✅ API слой с mock/real переключением (USE_MOCK_API флаг)
- ✅ Role-based routing (RoleProtectedRoute)
- ✅ AuthContext сохраняет user + role
- ✅ localStorage для mock данных

### Маршруты (полные)
```
/profile              → DashboardRedirect (role-based)
/admin                → AdminOverviewPage
/admin/employees      → AdminEmployeesPage
/admin/clients        → AdminClientsPage
/admin/tasks          → AdminTasksPage
/employee             → EmployeeOverviewPage
/employee/clients     → EmployeeClientsPage
/employee/tasks       → EmployeeTasksPage
/client               → ClientOverviewPage
/client/tasks         → ClientTasksPage
/client/documents     → ClientDocumentsPage
```

### Компоненты
- ✅ DashboardLayout (сайдбар + main)
- ✅ DashboardSidebar с навигацией по ролям
- ✅ nav-config структура (данные, не JSX)

### Типы
- ✅ TaskDto, ClientDto полные
- ✅ TaskStatus, TaskPriority enum'ы
- ✅ TaskCreateRequest, TaskRequestCreateRequest разделены
- ✅ TaskFilter для фильтрации

### API слой
- ✅ taskApi.ts с переключением mock/real
- ✅ clientApi.ts аналогично
- ✅ employeeApi.ts для списка сотрудников
- ✅ Mock данные с localStorage персистентностью
- ✅ Параметризованные query'ы (toQuery функция)

---

## ❌ КРИТИЧНЫЕ ПРОБЛЕМЫ

### 1. **Страницы — только заглушки**

| Страница | Статус | Проблема |
|----------|--------|----------|
| AdminTasksPage | ⚠️ 50% | Таблица + смена статуса, но **нет фильтров** (по status, employee, client) |
| EmployeeTasksPage | ⚠️ 50% | Таблица + смена статуса, но **нет создания новой задачи** |
| AdminClientsPage | ⚠️ 30% | Только чтение, **нет действий** (edit, assign employee) |
| EmployeeClientsPage | ⚠️ 30% | Только список, **нет деталей по клиенту** |
| AdminOverviewPage | ❌ 20% | Только счётчик задач, **нет других метрик** |
| EmployeeOverviewPage | ❌ 20% | Только счётчик задач |
| ClientOverviewPage | ❌ 20% | Только счётчик задач |
| AdminEmployeesPage | ⚠️ 40% | Список сотрудников, но **нет метрик** (клиентов, активных задач) |
| ClientDocumentsPage | ❌ 10% | Полностью пустая (нет заглушки даже) |

### 2. **Отсутствующий функционал**

#### TasksPage должны иметь:
- ❌ **Фильтры** (по статусу, приоритету, дате, сотруднику/клиенту)
- ❌ **Поиск** по названию/описанию
- ❌ **Сортировка** (по дате, приоритету, статусу)
- ❌ **Статус-батоны** вместо селекта (быстрая смена: NEW → IN_PROGRESS → ...)
- ❌ **Детальный просмотр задачи** (modal/page)
- ❌ **Drag-n-drop** между статусами (кенбан)
- ⚠️ **Создание задачи** (EMPLOYEE) — есть форма, но не интегрирована нормально в таблицу

#### ClientsPage должны иметь:
- ❌ **Детальная карточка клиента** (modal/page с компании, телефоном, заметками)
- ❌ **История задач** клиента
- ❌ **Переназначение сотрудника** (ADMIN-only)
- ❌ **Редактирование профиля** (компания, телефон, заметки)
- ❌ **Удаление** (soft delete)

#### OverviewPage должны иметь:
- ❌ **Карточки-метрики**:
  - Admin: total clients, total employees, tasks by status, overdue tasks
  - Employee: my clients, my tasks, open tasks, due this week
  - Client: open requests, completed, overdue
- ❌ **Последние задачи** (recent activity list)
- ❌ **Графики** (optional, но хотя бы bar chart статусов)

#### EmployeesPage (Admin):
- ❌ **Метрики в таблице** (clients count, active tasks)
- ❌ **Детальный профиль сотрудника** (modal)

#### ClientDocumentsPage (Client):
- ❌ Полностью не реализована (должна показывать invoices/receipts из billing API)

---

## ⚠️ СЕРЬЁЗНЫЕ НЕДОСТАТКИ

### 1. **Нет error handling в компонентах**
```tsx
// Текущий код:
useEffect(() => {
  getTasks().then(setTasks);  // Что если ошибка? 404, 500, сеть упала?
}, []);

// Нужно:
useEffect(() => {
  setLoading(true);
  getTasks()
    .then(setTasks)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, []);
```

### 2. **Нет loading-индикаторов**
- RoleProtectedRoute показывает `<div>Loading...</div>` — нужен реальный spinner
- Все таблицы грузятся без feedback пользователю

### 3. **Нет пагинации**
- Если клиентов 1000, фронт загружает и рендерит все 1000 рядов
- Backend должен возвращать `Page<ClientDto>` с `totalElements, pageNumber, size`

### 4. **Нет validации на клиенте**
- `TaskCreateRequest` имеет обязательные поля, но нет клиентской валидации
- `clientId` в некоторых формах может быть empty

### 5. **Нет feedback при успехе/ошибке**
- После `submitRequest()` нет toast/alert о результате
- Пользователь не знает, удалась ли операция

### 6. **Mock данные не реалистичны**
```tsx
// Сейчас:
client: { id: 3, fullName: 'Client One', ... }

// Нужно более объёмное моковое хранилище:
const MOCK_CLIENTS = [...]
const MOCK_EMPLOYEES = [...]
const MOCK_TASKS = [...]
// И использовать их везде
```

### 7. **Нет интеграции между страницами**
- Нет link'ов между ClientsPage и TasksPage (по id)
- Нельзя перейти от клиента к его задачам
- Нет breadcrumb'ов

---

## 🔧 МЕЛКИЕ ПРОБЛЕМЫ

| Проблема | Где | Решение |
|----------|-----|---------|
| Hardcoded цвета для статусов | `AdminTasksPage` | `bg-blue-100 text-blue-800` везде одинаково | Извлечь в константу/функцию |
| Нет полей `dueDate` в таблицах | Task таблицы | Нужны для приоритизации |
| Нет phone в ClientDto на фронте | ClientsList | Непоследовательность с backend |
| `User.userId` вместо `User.id` в контексте | AuthContext | Неконсистентно с backend `User.id` |
| Избыточный ре-фетч при каждом navigate | Все страницы | Можно использовать React Query или аналог |
| Нет оптимистических обновлений | updateTaskStatus | После PATCH нужен instant UI update |

---

## 📋 TODO в приоритете

### 🔴 КРИТИЧНЫЙ (должно быть)
1. **Modal/Drawer для деталей задачи** (`TaskDetailModal`)
   - Показывать title, description, client, assignedTo, status, priority, dueDate, history
   - Кнопки для смены статуса, переназначения
   
2. **Фильтры на TasksPage**
   - DropDown по статусу (NEW, IN_PROGRESS, ...)
   - DropDown по приоритету (если admin/employee)
   - DropDown по client/employee (если admin)
   - Search input по названию
   
3. **Client detail page** (`ClientDetailPage`)
   - Профиль (компания, телефон, заметки)
   - История задач клиента
   - Кнопка переназначить (ADMIN)
   
4. **Overview метрики** (admin/employee/client)
   - 4+ карточки (total, active, overdue, etc.)
   - Можно mock данными для стиля

5. **Error handling** во всех компонентах
   - try-catch или `.catch()` блоки
   - Error message пользователю

6. **Loading states**
   - Skeleton или spinner при загрузке
   - Disabled buttons во время операции

### 🟡 ВАЖНЫЙ (было бы хорошо)
7. **Pagination** в таблицах
8. **Soft toast уведомления** (при создании, обновлении)
9. **Avatar/иконки** для улучшения визуала
10. **Responsive дизайн** для мобилок (сейчас width-fixed)
11. **Канбан view** как альтернатива таблице
12. **Inline редактирование** (double-click на ячейку)

### 🟢 NICE TO HAVE
13. **GraphQL вместо REST** (если масштаб растёт)
14. **Infinite scroll** вместо pagination
15. **Real-time updates** (WebSocket для новых задач)

---

## 📁 Файлы для создания/расширения

```
pages/dashboard/
├── admin/
│   ├── AdminOverviewPage.tsx        ← ❌ Расширить (карточки метрик)
│   ├── AdminEmployeesPage.tsx       ← ❌ Добавить детали сотрудника
│   ├── AdminClientsPage.tsx         ← ❌ Добавить модал клиента
│   └── AdminTasksPage.tsx           ← ❌ Фильтры, модал задачи
├── employee/
│   ├── EmployeeOverviewPage.tsx     ← ❌ Расширить
│   ├── EmployeeClientsPage.tsx      ← ❌ Детали
│   └── EmployeeTasksPage.tsx        ← ❌ Создание, фильтры
└── client/
    ├── ClientOverviewPage.tsx       ← ❌ Расширить
    ├── ClientTasksPage.tsx          ← ✅ Почти готово (улучшить стиль)
    └── ClientDocumentsPage.tsx      ← ❌ С нуля (billing integration)

widgets/
├── task-detail-modal/              ← 🆕 НОВЫЙ
│   ├── TaskDetailModal.tsx
│   └── index.tsx
├── client-detail-modal/            ← 🆕 НОВЫЙ
│   ├── ClientDetailModal.tsx
│   └── index.tsx
└── task-filters/                   ← 🆕 НОВЫЙ
    ├── TaskFilters.tsx
    └── index.tsx

shared/ui/
├── Badge.tsx                        ← ❌ Нужен компонент для статусов
├── Spinner.tsx                      ← ❌ Loading indicator
├── Empty.tsx                        ← ❌ "No data" состояние
└── StatCard.tsx                     ← ❌ Метрики карточка
```

---

## 🎨 UI/UX замечания

### Цвета статусов (сейчас везде синий):
```tsx
const statusColors: Record<TaskStatus, string> = {
  'NEW': 'bg-gray-100 text-gray-800',
  'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
  'ON_REVIEW': 'bg-blue-100 text-blue-800',
  'DONE': 'bg-green-100 text-green-800',
  'CANCELLED': 'bg-red-100 text-red-800',
};
```

### Приоритеты (сейчас не отображаются вообще):
```tsx
const priorityIcons: Record<TaskPriority, string> = {
  'LOW': '◌',
  'MEDIUM': '●',
  'HIGH': '●●',
  'URGENT': '●●●',
};
```

---

## 📊 Оценка покрытия

| Компонент | Реализовано | Примечание |
|-----------|------------|-----------|
| Роутинг | 95% | Есть всё, кроме ClientDocumentsPage |
| API слой | 90% | Есть, но нет pagination |
| Mock данные | 70% | Работают, но маловато |
| Таблицы | 40% | Базовые только |
| Модалы | 0% | Вообще нет |
| Фильтры | 0% | Вообще нет |
| Error handling | 10% | Почти нет |
| Loading states | 20% | Минимум |
| Responsive | 50% | Не оптимально для мобилок |

**ИТОГО: ~40% функциональности реально работает. 60% — заглушки.**

---

## 🚀 Следующие шаги

### Если бюджет ограничен:
1. Сделать фильтры на TasksPage
2. Сделать Task Detail Modal
3. Добавить error handling везде
4. Добавить loading indicators

### Если всё в порядке с временем:
1. Все пункты выше
2. Client Detail Modal + edit
3. Overview метрики полные
4. Toast notifications
5. Pagination
6. Responsive дизайн

---

## ✅ ВЫВОД

**Фронтенд структурно хорош, но контент очень скромный.** 

Каркас (маршруты, типы, API слой, auth) — 95% готов. Но страницы — 40% готовых заглушек.

Подключить реальный backend сразу можно (USE_MOCK_API=false), но пользователи столкнутся с минималистичным UI без фильтров, модалов, обработки ошибок.

**Рекомендация:** Сначала расширить текущие страницы функционалом, потом подключить backend. Или параллельно: backend готов, фронт догоняет функционалом.
