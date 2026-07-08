# Zhan Finance (JF-1C) -- Полный анализ проекта

> Дата: 08.07.2026 | Домен: zhanfinance.kz
> Стек: Spring Boot 4.1 + PostgreSQL | React 19 + Vite 8 + TailwindCSS 4
> Деплой: Fly.io (backend) + GitHub Pages (frontend)

---

## 1. Что реально построено

### Backend -- 14 модулей, ~140 Java-файлов

| Модуль | Файлов | Что делает | Статус |
|--------|--------|------------|--------|
| **auth** | 18 | JWT access+refresh, Google OAuth, роли ADMIN/EMPLOYEE/CLIENT/LEARNER, UserPrincipal, password change | Готово |
| **crm** | 26 | Task (с Subtask, TaskComment, TaskActivity), ClientProfile, CalendarEvent, DeadlineAlertJob, row-level доступ через CrmAccessService | Готово |
| **billing** | 11 | Invoice, Subscription -- CRUD-записи со статусами, InvoiceAccessService | Частично (нет реальной оплаты) |
| **chat** | 7 | WebSocket + STOMP, ChatMessage, real-time переписка | Готово (базово) |
| **courses** | 12 | Course, Lesson (без секций -- упрощено), AdminCourseController, LearnerCourseController, AdminMediaController | Готово (базово) |
| **documents** | 11 | Upload/download, DatabaseStorageService + LocalStorageService, DocumentAccessService с проверкой владения | Готово |
| **notifications** | 8 | In-app + email уведомления, DeadlineAlertScheduler, NotificationController | Готово |
| **services** | 11 | ServiceEntity, ServiceRequest (каталог услуг + заявки от клиентов), ServiceDatabaseSeeder | Готово |
| **search** | 2 | GlobalSearchController -- поиск по задачам/клиентам/документам | Готово |
| **reporting** | 2 | ReportingController/ReportingService | Готово (базово) |
| **audit** | 4 | AuditLog entity, AuditEntityListener, AuditService | Готово |
| **admin** | 2 | AdminController + AdminService (управление пользователями) | Готово |
| **landing** | 5 | Контактная форма (rate-limited) | Готово |
| **common** | 1 | RedisConfig | Конфиг |

### Database -- 16 Flyway-миграций (V1-V18, пропуски V13, V16)

```
V1  -- Users, RefreshTokens
V2  -- Invoices, Subscriptions (Accounting)
V3  -- CRM: ClientProfiles, Tasks
V4  -- Subtasks
V5  -- TaskActivity, TaskComments
V6  -- Documents
V7  -- Task + Status fields for Documents
V8  -- Notifications
V9  -- Avatar + Provider for Users
V10 -- ChatMessages
V11 -- is_deleted for ChatMessages
V12 -- CalendarEvents
V14 -- Courses Schema
V15 -- Remove Course Sections (упрощение)
V17 -- Services Schema
V18 -- Audit Log Schema
```

---

### Frontend -- 4 роли, ~115 TSX/TS файлов

#### Публичные страницы (MainLayout)
| Страница | Файл | Содержимое |
|----------|------|------------|
| Главная | [HomePage.tsx](file:///c:/Users/murat/IdeaProjects/JF-1C/zhan-finance-frontend/src/pages/home/HomePage.tsx) | Hero, About, Advantages, Services |
| О компании | [AboutPage.tsx](file:///c:/Users/murat/IdeaProjects/JF-1C/zhan-finance-frontend/src/pages/about/AboutPage.tsx) | Hero, Stats, Ideology, Process, Guarantees |
| Услуги | [ServicesPage.tsx](file:///c:/Users/murat/IdeaProjects/JF-1C/zhan-finance-frontend/src/pages/services/ServicesPage.tsx) | Каталог, FAQ, форма связи |
| Логин | [LoginPage.tsx](file:///c:/Users/murat/IdeaProjects/JF-1C/zhan-finance-frontend/src/pages/auth/login/LoginPage.tsx) | Email + Google OAuth |
| Регистрация | [RegisterPage.tsx](file:///c:/Users/murat/IdeaProjects/JF-1C/zhan-finance-frontend/src/pages/auth/register/RegisterPage.tsx) | FullName, email, password |
| Профиль | [CompleteProfilePage.tsx](file:///c:/Users/murat/IdeaProjects/JF-1C/zhan-finance-frontend/src/pages/auth/complete-profile/CompleteProfilePage.tsx) | Дозаполнение профиля после Google OAuth |

#### ADMIN Dashboard (10 страниц)
| Страница | Маршрут |
|----------|---------|
| Overview (статистика) | `/admin` |
| Сотрудники | `/admin/employees` |
| Клиенты | `/admin/clients` |
| Задачи (Kanban) | `/admin/tasks` |
| Архив (Done) | `/admin/archive/done` |
| Архив (Cancelled) | `/admin/archive/cancelled` |
| Детали задачи | `/admin/tasks/:id` |
| Курсы | `/admin/courses` |
| Редактор курса/урока | `/admin/courses/new`, `/:id/edit`, `/lessons/:id` |
| Ученики | `/admin/learners` |

#### EMPLOYEE Dashboard (7 страниц)
| Страница | Маршрут |
|----------|---------|
| Overview | `/employee` |
| Клиенты | `/employee/clients` |
| Задачи | `/employee/tasks` |
| Детали задачи | `/employee/tasks/:id` |
| Документы | `/employee/documents` |
| Чат | `/employee/chat` |
| Календарь | `/employee/calendar` |

#### CLIENT Dashboard (5 страниц)
| Страница | Маршрут |
|----------|---------|
| Overview | `/client` |
| Чат | `/client/chat` |
| Документы | `/client/documents` |
| Календарь | `/client/calendar` |
| Услуги | `/client/services` |

#### LEARNER Dashboard (3 страницы)
| Страница | Маршрут |
|----------|---------|
| Список курсов | `/learner/courses` |
| Детали курса | `/learner/courses/:id` |
| Просмотр урока | `/learner/courses/:courseId/lessons/:lessonId` |

#### Shared / Widgets
- NotificationsPage, SettingsPage, CalendarPage
- DashboardLayout + DashboardSidebar + NotificationBell
- GlobalSearch, ChatDrawer, TaskGridBoard
- Header, Footer, Hero, PricingTable, Reviews, Team, Trust, Offices
- UI-библиотека: Button, Input, Textarea, Badge, Card, Alert, Modal, Spinner, StatCard, Toast, CanvasWaves

---

## 2. Чего не хватает (без системы оплаты)

### P0 -- Безопасность (сделать первым)

| Проблема | Влияние | Решение |
|----------|---------|---------|
| `/uploads/**` в `SecurityConfig` стоит `permitAll()` | Любой может скачать файлы клиента зная URL | Убрать permitAll, отдавать файлы только через `FileDownloadController` с проверкой прав |
| Swagger/OpenAPI публичен в проде | Раскрытие всех API-эндпоинтов | Включать только для профиля `dev` |
| Нет rate limiting на `/api/auth/**` | Брутфорс паролей, enumeration | Добавить Bucket4j фильтр (уже есть зависимость) |
| `ddl-auto=update` + Flyway одновременно | Конфликт источников истины схемы | `validate` в проде |
| Дефолтный JWT secret как fallback | Предсказуемый секрет при пустом env | Fail-fast при отсутствии `JWT_SECRET` |
| WebSocket чат -- нет проверки прав на комнату | Можно подписаться на чужие сообщения | Добавить авторизацию в `ChannelInterceptor` |

### P1 -- Бизнес-логика и качество

| Проблема | Комментарий |
|----------|-------------|
| **Audit log неполный** | Entity listener есть, но не покрывает все критичные операции (изменение статуса счета, смена роли) |
| **Хранилище файлов не production-ready** | `DatabaseStorageService` + `LocalStorageService` -- при рестарте Fly.io контейнера локальные файлы теряются. Нужен S3/MinIO/Fly Volume |
| **Нет email-верификации при регистрации** | Любой email может быть использован для регистрации |
| **Нет пагинации** в большинстве list-эндпоинтов | `findAll()` загружает все записи -- при росте данных будет медленно |
| **Пропущены миграции V13, V16** | Возможно незакоммиченные изменения или пропуски в нумерации |

### P2 -- Тестирование

| Что | Текущее состояние |
|-----|-------------------|
| Backend unit/integration тесты | Есть smoke-тесты для auth + CRM, нет тестов для billing, documents, chat, courses, services, notifications |
| Frontend тесты | vitest в зависимостях, но фактических тестов почти нет (только App.test.tsx) |
| E2E тесты | Отсутствуют полностью |

### P3 -- Качество кода и технический долг

| Проблема | Где |
|----------|-----|
| Мусорные файлы в репозитории | `src_b.zip`, `src_f.zip`, `logs.txt`, `fly_logs.txt`, `prod_logs.txt`, `test-login.json`, `test-register.json`, `fly_error.log`, `out.log` (7MB!) |
| Redis в зависимостях (`build.gradle`) + `RedisConfig.java` | Но `spring.autoconfigure.exclude` исключает Redis в `application.properties` -- мертвая зависимость |
| Google Client ID захардкожен в `App.tsx` | Должен быть в env-переменной (через `VITE_GOOGLE_CLIENT_ID`) |

### P4 -- Функции на будущее (не срочно)

| Функция | Комментарий |
|---------|-------------|
| 2FA для ADMIN | Дополнительный уровень защиты |
| Экспорт в формат 1С (XML/JSON) | Интеграция с бухгалтерией |
| i18n (RU/KZ/EN) | Весь UI сейчас на русском |
| Soft-delete | Вместо физического удаления записей |
| Прогресс прохождения курсов | Для LEARNER -- сейчас только просмотр |
| Полноценный биллинг | Kaspi Pay / банковский эквайринг (ты указал что не сейчас) |

---

## 3. Карта модулей: Backend vs Frontend

| Модуль | Backend | Frontend | Интеграция |
|--------|---------|----------|------------|
| Auth (JWT + Google) | 18 файлов | AuthContext, Login, Register, CompleteProfile | Полная |
| CRM (Tasks + Clients) | 26 файлов | TaskGridBoard, TaskDetailsPage, Clients pages | Полная |
| Chat (WebSocket) | 7 файлов | ChatDrawer | Полная |
| Documents | 11 файлов | ClientDocumentsPage, EmployeeDocumentsPage | Полная |
| Notifications | 8 файлов | NotificationBell, NotificationsPage, NotificationContext | Полная |
| Calendar | 4 файла (entity+repo+service+controller) | CalendarPage + MiniCalendarWidget | Полная |
| Courses | 12 файлов | Admin: CourseEdit, LessonEdit; Learner: 3 pages | Полная |
| Services | 11 файлов | ClientServicesPage, ServiceModal | Полная |
| Search | 2 файла | GlobalSearch widget | Полная |
| Billing | 11 файлов | **Нет страниц** (InvoicesPage, SubscriptionsPage из ранней версии удалены) | Частичная |
| Reporting | 2 файла | **Нет страниц** -- вероятно данные отображаются в DashboardOverview | Частичная |
| Audit | 4 файла | **Нет UI** | Нет frontend |
| Admin (users mgmt) | 2 файла | AdminEmployeesPage, AdminLearnersPage | Частичная |
| Landing (contacts) | 5 файлов | ContactForm + useContactForm | Полная |

---

## 4. Рекомендованный порядок работы

### Шаг 1 -- Безопасность (P0, ~1-2 дня)
1. Убрать `permitAll()` для `/uploads/**`
2. Swagger только для `dev` профиля
3. Rate limiting на auth endpoints
4. `ddl-auto=validate` в production properties
5. Fail-fast для JWT_SECRET
6. Авторизация WebSocket-комнат

### Шаг 2 -- Технический долг (P3, ~0.5 дня)
1. Удалить мусорные файлы из репозитория
2. Вынести Google Client ID в env
3. Определиться с Redis -- либо подключить, либо убрать

### Шаг 3 -- Пагинация (P1, ~1-2 дня)
1. Добавить `Pageable` в repository/service/controller для Tasks, Clients, Documents, Notifications
2. Обновить frontend API-клиенты для поддержки пагинации

### Шаг 4 -- Billing frontend (если нужно, ~1-2 дня)
1. Создать/восстановить страницы InvoicesPage и SubscriptionsPage
2. Пока без реальной оплаты -- просто управление записями

### Шаг 5 -- Тесты (P2, ~2-3 дня)
1. Backend: тесты для billing, documents, services, courses
2. Frontend: покрыть критичные формы (login, task creation)

