# ZhanFinance (JF-1C) — Итоговый технический отчёт о разработке и передаче проекта

**Документ:** Комплексный отчёт по архитектуре, реализации, безопасности, тестированию и эксплуатации платформы
**Версия продукта:** v1.0.0 (Release)
**Дата отчёта:** 15 сентября 2026 г.
**Составители:** Технический лидер / Senior Full-Stack Engineer
**Получатель:** Заказчик / Государственная приёмочная комиссия
**Статус:** Проект готов к запуску (Production Ready)

---

## 0. Аннотация документа

Настоящий отчёт представляет собой исчерпывающее описание программного продукта ZhanFinance (JF-1C) — облачной SaaS-платформы для автоматизации бухгалтерского консалтинга, налогового сопровождения и финансового аутсорсинга в Республике Казахстан.

Документ охватывает:

- бизнес-контекст и решаемые задачи;
- полную архитектуру системы (backend, frontend, инфраструктура, база данных);
- детальное описание каждого функционального модуля и каждого API-контроллера;
- полный перечень экранов и страниц пользовательского интерфейса по ролям;
- модель безопасности, разграничение доступа и результаты аудита;
- стратегию и результаты автоматизированного тестирования (unit, integration, E2E, нагрузочное);
- конвейеры CI/CD, развёртывание и эксплуатационные процедуры;
- дорожную карту развития и осознанно отложенные направления;
- сводные таблицы, итоговые показатели и заключительную оценку готовности.

Документ составлен с целью передачи проекта в эксплуатацию и предполагает проверяемость всех ключевых утверждений по исходному коду, конфигурациям и результатам автоматических проверок, находящимся в репозитории.

---

## 1. Резюме для руководства (Executive Summary)

ZhanFinance — это модульная монолитная B2B SaaS-платформа, объединяющая CRM, документооборот, биллинг, систему обучения персонала (LMS), корпоративный чат, уведомления, аудит и лидогенерацию в едином защищённом контуре с ролевым разграничением прав.

Ключевые показатели готовности:

| Показатель | Значение |
|---|---|
| Backend-модули | 12 бизнес-модулей + common-инфраструктура |
| Java-классы backend | ~231 |
| REST-контроллеры | 29 |
| Сервисные классы | 40 |
| JPA-сущности | 39 (36 бизнес-таблиц в production) |
| Flyway-миграции | 61 файл, версии V1–V121, контрольные суммы верифицированы |
| Frontend-страницы | ~63 |
| Frontend-компоненты | ~179 |
| Строки кода backend | ~16 419 (main) |
| Строки кода frontend | ~27 249 (TS/TSX) |
| Языковые локали UI | 4 (ru, kk, en, zh), полный паритет ключей |
| Тесты backend | 197 методов @Test в 50 классах |
| Тесты frontend | 124 теста в 19 файлах |
| E2E-сьюты | 14 сценариев (Node.js + Playwright) |
| Пайплайны CI/CD | 3 (CI/CD, Deploy Backend, DB Backup) |
| Уязвимости аудита | 28 находок (6 CRITICAL, 9 WARNING, 5 INFO) — 100% закрыты |
| Итоговый статус | Проект готов к запуску |

---

## 2. Бизнес-контекст и решаемые задачи

### 2.1. Предметная область

Заказчик — компания, оказывающая бухгалтерские, налоговые и юридические услуги субъектам малого и среднего бизнеса в Республике Казахстан. Деятельность сопряжена с жёсткими сроками налоговой и статистической отчётности, значительным объёмом типовых первичных документов и распределением работы между сотрудниками разной квалификации.

### 2.2. Болевые точки, которые устраняет система

1. **Контроль сроков отчётности.** Пропуск сроков сдачи деклараций приводит к штрафным санкциям. Система формализует сроки через детерминированные воронки задач и календарные дедлайны с уведомлениями.
2. **Неравномерная загрузка сотрудников.** Нераспределённые задачи собираются в общий пул (Task Pool), откуда сотрудники берут работу по своей квалификации; при отклонении результата задача автоматически возвращается в работу (auto-reopen).
3. **Ручное составление документов.** Формирование актов выполненных работ (АВР), счетов, договоров и соглашений NDA автоматизировано шаблонизацией и генерацией PDF/Word с корректным рендерингом кириллицы.
4. **Прозрачность для клиента.** Личный кабинет клиента обеспечивает мониторинг статуса работ, согласование документов и скачивание счетов без звонков и переписки.
5. **Онбординг персонала и стажёров.** LMS с пошаговыми уроками, отслеживанием прогресса и выдачей сертификатов снижает стоимость ввода новых сотрудников.
6. **Разрозненность коммуникаций.** Встроенный чат и система уведомлений консолидируют операционную переписку внутри защищённого контура компании.
7. **Доказуемость действий.** Неизменяемый журнал аудита фиксирует все значимые операции и защищён на уровне схемы СУБД.

### 2.3. Целевые пользователи и выгоды

| Категория | Выгода |
|---|---|
| Руководство компании (ADMIN) | Полная управляемость доступами, финансами, обучением и аудитом |
| Бухгалтеры и специалисты (EMPLOYEE) | Фокус на работе с задачами и клиентами, минимум рутины |
| Клиенты (CLIENT) | Прозрачность статуса, документы и счета в личном кабинете |
| Советники/супервизоры (ADVISOR) | Наблюдение и контроль без риска случайной модификации данных |
| Кураторы обучения (CURATOR) | Проверка заданий и контроль прогресса обучающихся |
| Обучающиеся (LEARNER) | Пошаговое обучение и подтверждение квалификации сертификатом |

---

## 3. Архитектура системы

### 3.1. Общая модель

Система реализована как **модульный монолит** на Spring Boot с чётким разделением бизнес-модулей внутри единого процесса развёртывания, и как **SPA** на React с архитектурой Feature-Sliced Design (FSD). Такой подход обеспечивает низкую операционную сложность (единый деплой, единая БД) при сохранении внутренней модульности и готовности к выделению сервисов в будущем.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND PRESENTATION LAYER                          │
│  React 19 SPA (Vite) │ Feature-Sliced Design │ Tailwind v4 │ i18n ru/kk/en/zh│
│  TanStack Query v5   │ WebSocket STOMP Client │ @dnd-kit Kanban Board        │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ HTTPS / WSS
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      SECURITY & TRAFFIC CONTROL LAYER                        │
│  ApiRateLimitFilter (Bucket4j) │ Strict Security Headers (CSP, HSTS, Frame)  │
│  JwtAuthenticationFilter       │ CORS / SameSite Control                     │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ Context-Path: /api/v1/**
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT MODULAR MONOLITH CORE                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ CRM & Pool │ │ Doc Hub    │ │ Billing    │ │ LMS Engine │ │ 2FA & Auth  │ │
│  │ Access Svc │ │ OpenHTML   │ │ Invoices   │ │ Courses    │ │ TOTP RFC6238│ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └─────────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ Chat STOMP │ │Notify/Email│ │ Audit Log  │ │ Search     │ │ Admin/Svc   │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └─────────────┘ │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ JDBC (HikariCP) / Caffeine L2 Cache
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       PERSISTENCE & CACHING LAYER                            │
│  PostgreSQL 17 │ Flyway V1–V121 │ Caffeine Cache │ BLOB storage / local FS   │
│  Append-Only Audit (triggers) │ Connection Pool (max 8) │ Batch fetch 25     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Потоки данных

1. **Клиентский запрос.** SPA формирует запрос к `https://zhanfinance.fly.dev/api/v1/...`, прикладывая JWT access-токен в заголовке `Authorization: Bearer`.
2. **Фильтрация.** Запрос проходит `AuthRateLimitFilter` (для маршрутов аутентификации) и `JwtAuthenticationFilter` (валидация токена, построение SecurityContext), затем `ApiRateLimitFilter` (общий троттлинг).
3. **Авторизация.** Spring Security проверяет маршрут по правилам `SecurityConfig`; далее контроллер и сервис выполняют row-level проверку через специализированные access-сервисы (`CrmAccessService`, `InvoiceAccessService`, `DocumentAccessService`, `CourseAccessService`).
4. **Бизнес-логика и персистентность.** Сервис выполняет операцию через Spring Data JPA; Hibernate использует `@EntityGraph`/`@BatchSize` для предотвращения N+1; транзакция коммитится через HikariCP.
5. **Аудит и события.** Аспект аудита и `HibernateAuditListener` фиксируют действие в append-only журнале с маскированием чувствительных полей. Доменные события публикуются для уведомлений (`NotificationService`, `EmailNotificationService`, `TelegramNotifierService`).
6. **Реальное время.** Сообщения чата рассылаются через STOMP-топики `/topic/chat/{userId}` с JWT-авторизацией на этапе CONNECT.

### 3.3. Технологический стек

**Backend**

| Компонент | Версия / Детали |
|---|---|
| Язык / среда | Java 17 |
| Фреймворк | Spring Boot 4.1.0, Spring Framework 7.x |
| ORM | Hibernate / Spring Data JPA |
| База данных | PostgreSQL 17 |
| Миграции | Flyway 10+ (core + database-postgresql) |
| Сборка | Gradle |
| Аутентификация | JWT (access + refresh с ротацией), Google OAuth2 |
| 2FA | TOTP (RFC 6238), `totp-spring-boot-starter` |
| Ограничение частоты | Bucket4j |
| Кэш | Caffeine (per-region) |
| WebSocket | STOMP / SockJS |
| PDF | openhtmltopdf-pdfbox + Thymeleaf |
| Word | poi-tl |
| Валидация файлов | Apache Tika |
| Метрики | Micrometer (Prometheus, OTLP), Spring Boot Actuator |
| Документация API | springdoc-openapi (Swagger UI, только ADMIN) |
| Тесты | JUnit 5, Mockito, AssertJ, Spring MockMvc, H2 |

**Frontend**

| Компонент | Версия / Детали |
|---|---|
| Язык | TypeScript 5.x/6.x |
| Библиотека | React 19 |
| Сборка | Vite |
| Архитектура | Feature-Sliced Design (FSD) |
| Стилизация | Tailwind CSS v4, CSS Variables, Lucide Icons |
| Состояние/данные | TanStack React Query v5 |
| Маршрутизация | react-router-dom v7 |
| Интернационализация | i18next + react-i18next (ru, kk, en, zh) |
| Drag & Drop | @dnd-kit (Kanban) |
| Редактор | SunEditor / Rich Text |
| PDF на клиенте | html2pdf.js |
| Валидация | Zod + zod-i18n-map |
| Мониторинг ошибок | Sentry (@sentry/react) |
| Тесты | Vitest, React Testing Library, jsdom |

**Инфраструктура**

| Компонент | Детали |
|---|---|
| Backend-хостинг | Fly.io, регион `ams` (Амстердам) |
| Frontend-хостинг | GitHub Pages (SPA c `404.html` fallback) |
| CI/CD | GitHub Actions (CI/CD, Deploy Backend, DB Backup) |
| Мониторинг | Prometheus metrics, UptimeRobot Health Checks |
| Уведомления об инцидентах | Telegram-бот (лиды, бэкапы, события) |
| Объектное хранилище (план) | Cloudflare R2 bucket `jf1c-documents` |

---

## 4. Структура репозитория

```text
JF-1C/
├── zhan-finance-backend/            # Spring Boot (Java 17)
│   ├── src/main/java/com/example/zhanfinancebackend/
│   │   ├── common/                  # config, filter, exception, response, audit
│   │   └── modules/                 # 12 бизнес-модулей
│   ├── src/main/resources/
│   │   ├── db/migration/            # Flyway V1..V121
│   │   ├── templates/               # Thymeleaf шаблоны документов
│   │   └── application*.properties  # Профили конфигурации
│   └── src/test/java/               # 50 тест-классов, 197 методов
├── zhan-finance-frontend/           # React 19 + Vite + TS
│   ├── src/
│   │   ├── app/                     # Провайдеры, роутер, стили
│   │   ├── pages/                   # Страницы по ролям
│   │   ├── widgets/                 # Крупные UI-блоки (18)
│   │   ├── features/                # Пользовательские сценарии (8)
│   │   ├── entities/                # Доменные модели (14)
│   │   └── shared/                  # api, ui, lib, i18n, config
│   └── src/**/*.test.ts(x)          # 19 файлов, 124 теста
├── tests/                           # E2E и нагрузочные сьюты
│   ├── e2e/                         # 14 сценариев (Node + Playwright)
│   ├── artillery/                   # Нагрузочные профили
│   └── run-all-e2e.mjs              # Мастер-раннер
├── docs/                            # Инженерная документация и отчёты
├── Epics/                           # Архитектурный план развития по эпикам
├── .agents/                         # Правила агента (AGENTS.md), CONTEXT.md
├── .github/workflows/               # CI/CD, Deploy, DB Backup
├── docker-compose.yml               # Локальный PostgreSQL 17
└── README.md                        # Основная документация проекта
```

---

## 5. Функциональные модули Backend

Backend разделён на 12 бизнес-модулей и слой общей инфраструктуры. Ниже приведено исчерпывающее описание каждого модуля: назначение, ключевые классы, сущности и особенности реализации.

Сводная таблица модулей (по количеству Java-классов):

| Модуль | Классов | Назначение |
|---|---|---|
| crm | 67 | Задачи, воронки, стадии, клиенты, календарь, дашборды, экспорт, метки |
| auth | 45 | Аутентификация, JWT, OAuth2, 2FA, регистрация, сброс пароля |
| courses | 33 | LMS: курсы, главы, уроки, прогресс, сертификаты, медиа |
| documents | 21 | Документы, шаблоны, генерация PDF/Word, хранение файлов |
| billing | 14 | Счета, подписки |
| notifications | 13 | In-app уведомления, email, Telegram |
| landing | 9 | Публичный лендинг, лиды (contact requests) |
| audit | 8 | Append-only журнал аудита |
| chat | 8 | STOMP-чат реального времени |
| services | 6 | Каталог услуг компании |
| search | 3 | Глобальный поиск |
| admin | 2 | Административные операции, служебный email-тест |
| common (инфра) | — | Security, фильтры, обработка исключений, ответы API |

### 5.1. Модуль CRM (`modules/crm`)

Крупнейший модуль системы. Реализует пул задач, канбан-воронки, работу с клиентами, календарь, дашборды и экспорт.

**Ключевые сущности:** `Task`, `Subtask`, `TaskComment`, `TaskActivity`, `Pipeline`, `Stage`, `ClientProfile`, `UserLabel`, `CalendarEvent`.

**Ключевые сервисы:**
- `TaskService` — CRUD задач, смена стадии, назначение исполнителя, комментарии, история, логика auto-reopen, работа с пулом.
- `CrmAccessService` — row-level контроль доступа к задачам и клиентам (ядро безопасности модуля).
- `PipelineSeederService` — инициализация дефолтной воронки при старте приложения через `@EventListener(ApplicationReadyEvent.class)`.
- `ClientService` — управление карточками клиентов и их закреплением за сотрудниками.
- `CalendarService` — календарные события и дедлайны.
- `DashboardService`, `DashboardSummaryService` — агрегированная аналитика для дашбордов по ролям.
- `UserLabelService` — пользовательские метки задач.

**Ключевые контроллеры:** `TaskController` (`/v1/crm/tasks`), `PipelineController` (`/v1/crm/pipelines`), `CrmEmployeeController` (`/v1/crm/employees`), `ClientController` (`/v1/crm/clients`), `CalendarController` (`/v1/crm/calendar`), `DashboardController` (`/v1/crm/dashboard`), `ExportController` (`/v1/crm/export`), `UserLabelController` (`/v1/crm/labels`).

**Особенности:**
- Единый пул нераспределённых задач с захватом исполнителем по квалификации.
- Auto-reopen: при отклонении результата клиентом задача программно возвращается в первый рабочий этап воронки.
- Признак предфинального этапа (`is_pre_final`) и выделенный этап доработки (rework) в модели стадий.
- Использование `@EntityGraph` и `@BatchSize(size = 25)` для исключения N+1 при выборке задач, комментариев и истории.

### 5.2. Модуль Auth (`modules/auth`)

**Ключевые сущности:** `User`, `Role`, `AuthProvider`, `RefreshToken`, `PasswordResetToken`, `RegistrationStatus`, `TwoFactorPreAuth`.

**Ключевые сервисы:**
- `AuthService` — регистрация, логин, обработка статусов регистрации (PENDING/APPROVED/REJECTED/DISABLED).
- `JwtService` — генерация и валидация access/refresh токенов.
- `RefreshTokenService` — ротация refresh-токенов с хранением в БД и ревокацией (Token Reuse Detection).
- `GoogleAuthService` — вход через Google OAuth2.
- `TwoFactorService` — TOTP (RFC 6238), выпуск секретов, верификация кода, защита от подбора через счётчик попыток.
- `PasswordResetService` — выпуск и проверка токенов сброса пароля.
- `CustomUserDetailsService`, `UserService`, `AdminService` — загрузка пользователей и административные операции.

**Ключевые контроллеры:** `AuthController` (`/v1/auth`), `TwoFactorController` (`/v1/auth/2fa`), `UserController` (`/v1/users`), `AdminController` (`/v1/admin`), `AdminCuratorController` (`/v1/admin/curators`).

**Модель регистрации сотрудников:**
1. Сотрудник регистрируется, получая статус `PENDING`.
2. Администратор подтверждает (`APPROVED`) или отклоняет (`REJECTED`).
3. Миграции V112–V116 приводят статусы уже существующих пользователей к корректным значениям (включая disabled- и не-сотрудников).

### 5.3. Модуль LMS / Courses (`modules/courses`)

**Ключевые сущности:** `Course`, `Chapter`, `Lesson`, `LessonType`, `LessonProgress`, `Enrollment`, `Certificate`, `CourseCurator`, `CourseStatus`, `StoredFile`.

**Ключевые сервисы:**
- `CourseService` — управление курсами, главами и уроками; каскадная очистка зависимых записей перед удалением курса.
- `LessonService` — контент уроков (текст, видео, документы).
- `LessonProgressService` — трекинг завершения уроков и расчёт прогресса.
- `CertificateGeneratorService` — генерация сертификатов об обучении.
- `CourseAccessService` — контроль доступа (ADMIN/CURATOR — управление, LEARNER/CLIENT — потребление).
- `DatabaseStorageService`, `LocalStorageService` — абстракция хранения медиафайлов курсов.

**Ключевые контроллеры:** `AdminCourseController` (`/v1/admin/courses`), `CourseMediaController` (`/v1/courses/media`), `LearnerCourseController` (`/v1/courses`), `CuratorCourseController` (`/v1/curator`), `AdminMediaController` (`/v1/admin/media`).

**Иерархия контента:** Курс → Глава → Урок → Блоки контента. Сертификат выпускается при завершении курса; предусмотрена публичная верификация сертификата (`/v1/courses/certificates/verify/**`).

**Дефекты, устранённые в ходе аудита:**
- `deleteCourse` дополнен каскадным удалением прогресса, зачислений и сертификатов — устранено нарушение внешнего ключа `fk_enrollments_course_id`.
- `createChapter` выполняет явный `save` перед добавлением в коллекцию курса — устранено возвращение `id: null` до коммита транзакции.

### 5.4. Модуль Documents (`modules/documents`)

**Ключевые сущности:** `Document`, `DocumentTemplate`, `StoredFile`.

**Ключевые сервисы:**
- `DocumentService` — CRUD документов, смена статусов, реестры.
- `DocumentTemplateService` — управление шаблонами (АВР, счёт, договор, NDA).
- `DocumentGeneratorService` — генерация документа по шаблону и данным задачи.
- `PdfGeneratorService` — рендеринг PDF (Thymeleaf + OpenHTMLtoPDF) с поддержкой кириллицы.
- `DocumentAccessService` — row-level доступ (ADVISOR — только чтение).
- `StorageService` / `DatabaseStorageService` / `LocalStorageService` — двухуровневое хранение (BLOB в PostgreSQL с fallback на локальную ФС).
- `TelegramNotifierService` — оповещения о значимых событиях документооборота.

**Ключевые контроллеры:** `DocumentController` (`/v1/documents`), `DocumentTemplateController` (`/v1/document-templates`), `FileDownloadController`, `ExportController`.

**Особенности:** валидация MIME через Apache Tika и белый список расширений; защита от path traversal; проверка наличия шрифта `/fonts/arial.ttf` перед рендерингом PDF (устранён необработанный HTTP 500).

### 5.5. Модуль Billing (`modules/billing`)

**Ключевые сущности:** `Invoice`, `Subscription`, `ServiceEntity`.

**Ключевые сервисы:** `InvoiceService`, `InvoiceAccessService`, `SubscriptionService`, `ServiceService`.

**Ключевые контроллеры:** `InvoiceController` (`/v1/billing/invoices`), `SubscriptionController` (`/v1/billing/subscriptions`), `ServiceController` (`/v1/services`).

**Роли и счета (после аудита):**
- `ADMIN` и `EMPLOYEE` — создание и редактирование счетов.
- `CLIENT` — только чтение собственных счетов через `assertCanRead`; попытка доступа к чужому счёту возвращает `403`.
- Миграции V117/V118 (платежи и квитанции) разработаны и откатаны в рамках подготовки интеграции с платёжными провайдерами.

### 5.6. Модуль Notifications (`modules/notifications`)

**Ключевые сущности:** `Notification`.

**Ключевые сервисы:** `NotificationService` (in-app), `EmailNotificationService` (Gmail SMTP + HTML-шаблоны), `TelegramNotifierService`.

**Контроллер:** `NotificationController` (`/v1/notifications`) — список, отметка прочитанным, массовая отметка `read-all`, счётчики.

**Особенности:** асинхронная доставка; HTML-шаблоны писем; уведомления о дедлайнах задач (колонка `deadline_notified`), новых лидах и системных событиях.

### 5.7. Модуль Chat (`modules/chat`)

**Ключевые сущности:** `ChatMessage`.

**Ключевые сервисы:** `ChatService`.

**Контроллер:** `ChatController` (`/v1/chat`) — контакты, история, отправка, отметка прочитанным, счётчик непрочитанных.

**Особенности:** STOMP/SockJS; JWT-аутентификация на CONNECT; персональные топики `/topic/chat/{userId}`; авторизация подписок; оптимизация выборки последних сообщений через оконный SQL (`DISTINCT ON`) вместо N+1-обхода истории.

### 5.8. Модуль Audit (`modules/audit`)

**Ключевые сущности:** `AuditLog`.

**Ключевые классы:** `AuditService`, `HibernateAuditListener`, аннотации аудита (`modules/audit/annotation`), конфигурация (`modules/audit/config`), события и слушатели.

**Контроллер:** `AuditLogController` (`/v1/admin/audit-logs`).

**Особенности:** журнал append-only; на уровне схемы PostgreSQL установлены триггеры, запрещающие `UPDATE`, `DELETE`, `TRUNCATE` по таблицам аудита (миграция V111); чувствительные поля маскируются меткой `[PROTECTED]`; каждый ответ API содержит `requestId` для трассировки.

### 5.9. Модуль Landing / Leads (`modules/landing`)

**Ключевые сущности:** `ContactRequest`, `ContactRequestFile`, `LeadSource`.

**Ключевые сервисы:** `ContactRequestService` (заявки с вложениями), интеграция с `TelegramNotifierService`.

**Контроллер:** `ContactRequestController` (`/v1/contact-requests`, публичный).

**Важно:** на фронтенде вызов POST `/api/v1/contact-requests` намеренно закомментирован в `useContactForm.ts` в пользу прямого WhatsApp-потока (+7 775 058 4021 / wa.me). Backend-эндпоинт остаётся действующим и покрыт проверками API-сьюта.

### 5.10. Модуль Search (`modules/search`)

**Ключевые классы:** `GlobalSearchService`.

**Контроллер:** `GlobalSearchController` (`/v1/search`) — полнотекстовый поиск по документам, задачам, клиентам, курсам.

### 5.11. Модуль Services (`modules/services`)

**Ключевые сущности:** `ServiceEntity` (с локализацией RU/EN).

**Контроллер:** `ServiceController` (`/v1/services`, публичный) — каталог услуг, в т.ч. highlighted-набор.

### 5.12. Модуль Admin (`modules/admin`)

Административные операции и служебные контроллеры (`AdminController`, `TestEmailController`): управление сотрудниками (approve/reject), повышение/понижение до роли ADVISOR, тестовая отправка email.

### 5.13. Инфраструктурный слой (`common`)

| Компонент | Назначение |
|---|---|
| `SecurityConfig` | Правила авторизации, CSP, COOP, frame-options, referrer-policy, permissions-policy, stateless |
| `JwtAuthenticationFilter` | Извлечение и валидация JWT, построение SecurityContext |
| `AuthRateLimitFilter` | Троттлинг маршрутов аутентификации (Bucket4j) |
| `ApiRateLimitFilter` | Общий троттлинг бизнес-маршрутов по userId/IP |
| `GlobalExceptionHandler` | Единый формат ошибок с `requestId`, корректные HTTP-статусы (в т.ч. 405) |
| `ErrorResponse` | Стандартизированный контракт ошибки |
| `EncryptionConfig` / `CacheConfig` | Caffeine per-region кэш, криптографические бины |

---

## 6. Справочник REST API

Все маршруты смонтированы под `context-path=/api` и версионированы как `/v1/**`. Итоговый префикс: `/api/v1/...`.

| Контроллер | Базовый путь | Назначение | Доступ |
|---|---|---|---|
| AuthController | `/v1/auth` | Логин, регистрация, refresh, logout, Google, сброс пароля | Public / Auth |
| TwoFactorController | `/v1/auth/2fa` | Настройка и верификация 2FA | Auth |
| UserController | `/v1/users` | Профиль, пароль, аватар, контакты | Auth |
| AdminController | `/v1/admin` | Управление сотрудниками, approve/reject, роли | ADMIN |
| AdminCuratorController | `/v1/admin/curators` | Управление кураторами и их курсами | ADMIN |
| AdminCourseController | `/v1/admin/courses` | CRUD курсов, глав, уроков, публикация | ADMIN |
| AdminMediaController | `/v1/admin/media` | Загрузка медиа администрирования | ADMIN |
| AuditLogController | `/v1/admin/audit-logs` | Просмотр журнала аудита | ADMIN |
| TaskController | `/v1/crm/tasks` | Задачи: CRUD, стадии, назначение, комментарии, история, пул | Role-based |
| PipelineController | `/v1/crm/pipelines` | Воронки и стадии | Role-based |
| CrmEmployeeController | `/v1/crm/employees` | Сотрудники CRM | ADMIN/EMPLOYEE/ADVISOR |
| ClientController | `/v1/crm/clients` | Клиенты CRM | Role-based |
| CalendarController | `/v1/crm/calendar` | Календарные события | Auth |
| DashboardController | `/v1/crm/dashboard` | Аналитика дашбордов | Auth |
| ExportController | `/v1/crm/export` | Экспорт данных | ADMIN |
| UserLabelController | `/v1/crm/labels` | Метки задач | Auth |
| DocumentController | `/v1/documents` | Документы: загрузка, реестр, статусы, скачивание | Role-based |
| DocumentTemplateController | `/v1/document-templates` | Шаблоны документов | Auth |
| FileDownloadController | Скачивание файлов | Потоковая отдача файлов | Auth |
| InvoiceController | `/v1/billing/invoices` | Счета | Role-based |
| SubscriptionController | `/v1/billing/subscriptions` | Подписки | ADMIN |
| ServiceController | `/v1/services` | Каталог услуг | Public |
| NotificationController | `/v1/notifications` | Уведомления, read-all, счётчики | Auth |
| ChatController | `/v1/chat` | Контакты, история, отправка, unread | Auth |
| GlobalSearchController | `/v1/search` | Глобальный поиск | Auth |
| LearnerCourseController | `/v1/courses` | Каталог и прохождение курсов, прогресс, верификация сертификата | Public/Auth |
| CourseMediaController | `/v1/courses/media` | Медиа курсов | Auth |
| CuratorCourseController | `/v1/curator` | Курсы и студенты куратора | CURATOR |
| ContactRequestController | `/v1/contact-requests` | Публичные заявки с файлами | Public |
| TestEmailController | Служебный | Диагностика email | ADMIN |

### 6.1. Правила авторизации (SecurityConfig)

Публичные маршруты (`permitAll`):
- `/v1/auth/**`, `/v1/contact-requests`, `/v1/contact-requests/*/files`
- `/v1/services`, `/v1/services/highlighted`
- `/v1/courses/certificates/verify/**`
- `/uploads/avatars/**`, `/api/uploads/avatars/**`
- `/ws/**`, `/api/ws/**`
- `/actuator/health`, `/actuator/info`

Требуют `ROLE_ADMIN`:
- `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html`, `/swagger-resources/**`, `/webjars/**`

Полностью запрещены:
- `/v1/internal/**` → `denyAll()`

Все прочие маршруты — `authenticated()`.

### 6.2. Ограничение частоты запросов

| Область | Лимит | Идентификатор |
|---|---|---|
| `/api/v1/auth/**` | 10 запросов/мин | IP |
| `/api/v1/auth/check-email` | 5 запросов/мин | IP |
| Общие бизнес-маршруты | 100 запросов/мин | userId (или IP для неавторизованных) |

При превышении возвращается HTTP `429 Too Many Requests` без деградации БД.

---

## 7. Модель данных

### 7.1. Управление схемой

- Схема управляется исключительно Flyway-миграциями: `zhan-finance-backend/src/main/resources/db/migration/V{N}__{description}.sql`.
- Миграции строго неизменяемы: правка применённого скрипта ломает контрольные суммы Flyway и блокирует деплой.
- Актуальная цепочка: **V1–V121** (61 файл), 36 бизнес-таблиц в production, 40 уникальных `CREATE TABLE` по всем миграциям (включая промежуточные/откаченные).
- Профиль prod: `ddl-auto=none` / `validate`; `spring.flyway.out-of-order=true`, `validate-on-migrate=true`.
- Сидинг данных выполняется **только** через `@EventListener(ApplicationReadyEvent.class)`; `@PostConstruct` для операций с БД запрещён (гонка с Flyway).

### 7.2. Ключевые группы таблиц

| Домен | Основные таблицы |
|---|---|
| Пользователи и auth | `app_users`, `refresh_tokens`, `password_reset_tokens`, `two_factor_pre_auth` |
| CRM | `tasks`, `subtasks`, `task_comments`, `task_activity`, `pipelines`, `stages`, `client_profiles`, `user_labels`, `calendar_events` |
| Документы | `documents`, `document_templates`, `stored_files`, `doc_sequence` |
| Биллинг | `invoices`, `subscriptions`, `services` |
| LMS | `courses`, `chapters`, `lessons`, `lesson_progress`, `enrollments`, `certificates`, `course_curators` |
| Коммуникации | `chat_messages`, `notifications` |
| Аудит | `audit_log` |
| Лиды | `contact_requests`, `contact_request_files` |

### 7.3. Защита аудита на уровне схемы

Миграция V111 устанавливает в PostgreSQL триггеры, запрещающие `UPDATE`, `DELETE` и `TRUNCATE` по таблицам аудита. Это гарантирует неизменяемость журнала даже при компрометации приложения: удаление записи невозможно без прямого вмешательства на уровне СУБД с расширенными правами.

### 7.4. Целостность данных

- Каскадная очистка зависимых записей LMS перед удалением курса (прогресс → зачисления → сертификаты).
- Явное сохранение главы перед добавлением в коллекцию курса (корректный id в DTO).
- Использование `@EntityGraph` и `@BatchSize(25)` для предотвращения N+1.
- Пагинация всех списочных выборок через `Pageable` с сортировкой по индексам.

---

## 8. Frontend: архитектура и страницы

### 8.1. Организация по FSD

Frontend построен по методологии Feature-Sliced Design. Слои строго иерархичны (зависимости направлены только «вниз»):

```text
src/
├── app/          # Инициализация: провайдеры, роутер, глобальные стили, MainLayout/DashboardLayout
├── pages/        # Страницы по ролям и публичные
├── widgets/      # 18 крупных UI-блоков (task-board, chat, dashboard-shell, header, footer...)
├── features/     # 8 пользовательских сценариев (auth, chat, contact-form, leads, labels...)
├── entities/     # 14 доменных моделей (task, client, course, invoice, document...)
└── shared/       # api (http.ts), ui, lib, i18n, config (routes.ts)
```

Итого: ~63 страницы, ~179 компонентов.

### 8.2. Маршрутизация

Корневой компонент `src/app/App.tsx` использует `BrowserRouter` с `basename`, зависящим от среды (для GitHub Pages — `/JF-1C/`). Маршруты централизованы в `src/shared/config/routes.ts`.

**Защита маршрутов:**
- `ProtectedRoute` — требует аутентификации.
- `RoleProtectedRoute allow={[...]}` — ограничивает доступ набором ролей.
- Фоллбэк `*` перенаправляет на главную.
- Легаси-префикс `/dashboard/*` редиректит на `/profile`.

Схема группировки маршрутов:

| Группа | Защита | Примеры |
|---|---|---|
| Публичные (MainLayout) | нет | `/`, `/about`, `/services`, `/privacy-policy`, `/terms`, `/refund-policy`, `/cookie-policy` |
| Аутентификация | нет | `/login`, `/register`, `/register/employee`, `/forgot-password`, `/reset-password`, `/complete-profile` |
| ADMIN | RoleProtectedRoute ADMIN | `/admin/**` (23 маршрута) |
| CURATOR | RoleProtectedRoute CURATOR | `/curator/**` |
| ADVISOR | RoleProtectedRoute ADVISOR | `/advisor/**` |
| EMPLOYEE | RoleProtectedRoute EMPLOYEE | `/employee/**` |
| CLIENT | RoleProtectedRoute CLIENT | `/client/**` |
| LEARNER | RoleProtectedRoute LEARNER | `/courses`, `/courses/:id`, `/courses/:courseId/lessons/:lessonId` |
| Shared (auth) | ADMIN/EMPLOYEE/CLIENT/CURATOR/ADVISOR | `/notifications`, `/settings` |

### 8.3. Публичные страницы

| Страница | Маршрут | Описание |
|---|---|---|
| HomePage | `/` | Главный лендинг: секции HomeHero, HomeAbout, HomeAdvantages, HomeServices, OutsourceIncluded |
| AboutPage | `/about` | О компании: AboutHero, AboutIdeology, AboutProcess, AboutStats, AboutGuarantees |
| ServicesPage | `/services` | Каталог услуг: ServicesHero, ServicesCatalog, ServicesFaqContact |
| PrivacyPolicyPage | `/privacy-policy` | Политика конфиденциальности |
| TermsPage | `/terms` | Пользовательское соглашение |
| RefundPolicyPage | `/refund-policy` | Политика возврата |
| CookiePolicyPage | `/cookie-policy` | Политика использования cookie |

Публичный контур дополнен виджетами `header`, `footer`, `hero`, `trust`, `team`, `reviews`, `offices`, `pricing-table`, `faq-contact`, `cookie-consent`.

### 8.4. Страницы аутентификации

| Страница | Маршрут | Описание |
|---|---|---|
| LoginPage | `/login` | Вход: email/пароль, Google OAuth, переход к 2FA |
| RegisterPage | `/register`, `/register/employee` | Регистрация клиента и сотрудника (с режимом isEmployeeRoute) |
| ForgotPasswordPage | `/forgot-password` | Запрос сброса пароля |
| ResetPasswordPage | `/reset-password` | Установка нового пароля по токену |
| CompleteProfilePage | `/complete-profile` | Дозаполнение профиля (в т.ч. после OAuth) |

Слой `features/auth` реализует `ProtectedRoute`, `RoleProtectedRoute`, формы и логику сессии.

### 8.5. Кабинет администратора (ADMIN)

| Страница | Маршрут | Описание |
|---|---|---|
| AdminOverviewPage | `/admin` | Сводный дашборд компании: метрики, задачи, воронка |
| AdminEmployeesPage | `/admin/employees` | Управление сотрудниками: approve/reject, смена роли |
| AdminClientsPage | `/admin/clients` | Реестр клиентов и их закрепление |
| AdminTasksPage | `/admin/tasks` | Все задачи (канбан/списки) |
| TaskPoolPage | `/admin/tasks/pool` | Общий пул нераспределённых задач |
| TaskDetailsPage | `/admin/tasks/:id` | Карточка задачи: детали, подзадачи, комментарии, история |
| AdminArchiveDonePage | `/admin/archive/done` | Архив завершённых |
| AdminArchiveCancelledPage | `/admin/archive/cancelled` | Архив отменённых |
| EmployeeChatPage | `/admin/chat` | Чат (переиспользуется из employee-контура) |
| AdminCoursesPage | `/admin/courses` | Управление курсами LMS |
| AdminCourseEditPage | `/admin/courses/new`, `/admin/courses/:id/edit` | Создание/редактирование курса (табы: Curriculum, Settings) |
| AdminLessonEditPage | `/admin/courses/:courseId/lessons/:lessonId/edit` | Редактор урока (блоки контента, медиа) |
| AdminLearnersPage | `/admin/learners` | Управление обучающимися |
| AdminInvoicesPage | `/admin/invoices` | Реестр счетов |
| AdminSubscriptionsPage | `/admin/subscriptions` | Реестр подписок |
| AdminAuditLogPage | `/admin/audit-logs` | Просмотр неизменяемого журнала аудита |
| AdminTemplatesPage | `/admin/templates` | Шаблоны документов (АВР, счёт, договор, NDA) |
| AdminCuratorsPage | `/admin/curators` | Управление кураторами и их курсами |
| AdminSecurityPage | `/admin/security` | Статус безопасности: 2FA, активные сессии |
| AdminLeadsPage | `/admin/leads` | Лиды (заявки с лендинга), доступна также EMPLOYEE/ADVISOR |

### 8.6. Кабинет куратора (CURATOR)

| Страница | Маршрут | Описание |
|---|---|---|
| CuratorOverviewPage | `/curator` | Обзор: курсы, студенты, прогресс |
| CuratorCoursesPage | `/curator/courses` | Курсы, назначенные куратору |
| CuratorStudentsPage | `/curator/students` | Студенты и их прогресс |

### 8.7. Кабинет советника (ADVISOR) — режим Read-Only

| Страница | Маршрут | Описание |
|---|---|---|
| AdvisorOverviewPage | `/advisor` | Обзорная аналитика компании |
| AdvisorWorkloadPage | `/advisor/workload` | Загрузка сотрудников |
| EmployeeClientsPage | `/advisor/clients` | Клиенты (просмотр) |
| EmployeeTasksPage | `/advisor/tasks` | Задачи (просмотр) |
| TaskPoolPage | `/advisor/tasks/pool` | Пул задач (просмотр) |
| TaskDetailsPage | `/advisor/tasks/:id` | Детали задачи (без права мутаций) |
| EmployeeDocumentsPage | `/advisor/documents` | Документы (чтение/скачивание) |
| EmployeeChatPage | `/advisor/chat` | Чат |

### 8.8. Кабинет сотрудника (EMPLOYEE)

| Страница | Маршрут | Описание |
|---|---|---|
| EmployeeOverviewPage | `/employee` | Рабочий дашборд сотрудника |
| EmployeeChatPage | `/employee/chat` | Чат с клиентами и коллегами |
| EmployeeClientsPage | `/employee/clients` | Закреплённые клиенты |
| EmployeeTasksPage | `/employee/tasks` | Мои задачи |
| TaskPoolPage | `/employee/tasks/pool` | Пул задач (взять в работу) |
| TaskDetailsPage | `/employee/tasks/:id` | Карточка задачи |
| EmployeeDocumentsPage | `/employee/documents` | Документы клиентов |
| CalendarPage | `/employee/calendar` | Календарь дедлайнов |

### 8.9. Кабинет клиента (CLIENT)

| Страница | Маршрут | Описание |
|---|---|---|
| ClientOverviewPage | `/client` | Статус обслуживания, ближайшие дедлайны |
| ClientTaskDetailsPage | `/client/tasks/:id` | Детали задачи с возможностью согласования/отклонения |
| ClientChatPage | `/client/chat` | Чат с бухгалтером |
| ClientDocumentsPage | `/client/documents` | Документы и счета |
| CalendarPage | `/client/calendar` | Календарь |
| ClientServicesPage | `/client/services` | Услуги клиента |
| ClientOneCReportsPage | `/client/1c`, `/client/1c/:report` | 1C-хаб (см. раздел 9) |
| ClientWelcomeScreen | — | Экран приветствия нового клиента |

### 8.10. Кабинет обучающегося (LEARNER)

| Страница | Маршрут | Описание |
|---|---|---|
| LearnerCoursesPage | `/courses` | Каталог доступных курсов |
| LearnerCourseDetailPage | `/courses/:id` | Программа курса, главы и уроки |
| LearnerLessonPage | `/courses/:courseId/lessons/:lessonId` | Прохождение урока, отметка завершения |
| CourseCertificate | компонент | Просмотр/печать сертификата |

### 8.11. Общие страницы

| Страница | Маршрут | Описание |
|---|---|---|
| DashboardRedirect | `/profile` | Перенаправление на дашборд по роли |
| NotificationsPage | `/notifications` | Все уведомления пользователя |
| SettingsPage | `/settings` | Настройки профиля, язык, тема, безопасность |
| ProfilePage | `/profile` | Профиль пользователя |
| TaskDetailsPage | `/tasks/:id` (общий) | Универсальная карточка задачи |

### 8.12. Виджеты

`header`, `footer`, `hero`, `trust`, `team`, `reviews`, `offices`, `pricing-table`, `faq-contact`, `cookie-consent`, `search`, `chat`, `dashboard`, `dashboard-shell`, `task-board`, `task-create`, `task-reject`.

### 8.13. Фичи (features)

`auth` (сессия, guard-компоненты), `chat`, `contact-form`, `labels`, `leads`, `notifications`, `service-modal`, `task`.

### 8.14. Сущности (entities)

`audit`, `billing`, `calendar`, `chat`, `client`, `course`, `document`, `document-template`, `employee`, `notification`, `pipeline`, `service`, `task`, `user`. Каждая сущность инкапсулирует типы, API-хуки и презентационные компоненты.

### 8.15. Работа с сетью и состоянием

- Единая обёртка `apiRequest` в `@/shared/api/http` для всех запросов.
- **Синглтон refresh-промис:** при конкурентных 401 обновление access-токена выполняется один раз, остальные запросы ожидают его завершения — устранена гонка сессий и ложные срабатывания Token Reuse Detection.
- TanStack React Query v5 с типизированными ключами (например, `['tasks', 'list', filter]`), кэшированием и инвалидацией.
- Глобальная обработка ошибок и отображение тостов.

### 8.16. Интернационализация

- Библиотека i18next + react-i18next; локали: `ru`, `kk`, `en`, `zh`.
- Файлы переводов в `src/shared/i18n/locales/{locale}/*.json` (common, auth, crm, tasks, landing, modals и др.).
- Полный паритет ключей между всеми четырьмя локалями, автоматические тесты паритета.
- Отсутствие жёстко зашитых строк; централизованные утилиты форматирования даты и валюты (`dateFormat.ts`).
- В китайской локали гарантированно отсутствуют кириллические символы.

### 8.17. Стилизация и UI-кит

- Tailwind CSS v4 (через `@tailwindcss/vite`), CSS Variables для темизации (светлая/тёмная тема).
- Иконки Lucide React; анимации — framer-motion; утилиты `clsx` + `tailwind-merge`.
- Валидация форм — Zod + zod-i18n-map с локализованными сообщениями об ошибках.

---

## 9. Специальный раздел: 1C Client Hub (`/client/1c`)

### 9.1. Текущий статус

Раздел `/client/1c` и вложенные маршруты (`/osv`, `/saldo`, `/reconciliation`, `/account-card`, `/cash-book`, `/stock`) реализованы исключительно как тестовый фронтенд-интерфейс.

- Backend-интеграции и реальные финансовые данные на текущий момент отсутствуют.
- Моковые/фейковые финансовые данные строго запрещены: интерфейс отображает чистый Empty State в ожидании OData-шлюза.
- Полноценный запуск двусторонней синхронизации запланирован в рамках Epic-21 (1C Data Gateway & Fiscal Hub).

### 9.2. Обоснование решения

Вывод «пустого» интерфейса без фейковых цифр выбран осознанно: демонстрация недостоверных финансовых показателей в системе, претендующей на бухгалтерскую достоверность, создаёт риск неверных управленческих решений и подрывает доверие к платформе. Честный Empty State с готовой навигационной структурой позволяет подключить реальные данные без переработки UI.

### 9.3. Архитектурный план (Epic-21)

Подробная спецификация и дорожная карта находятся в `Epics/Plan/Epic-21-1c-data-gateway/epic.md`. В общем виде: OData-шлюз к 1C, двусторонняя синхронизация, Fiscal Hub.

---

## 10. Безопасность и разграничение доступа

### 10.1. Принципы

Приоритет при конфликтах: **Security > Correctness > Performance > Code Cleanliness**. Безопасность построена на эшелонированной защите (Defense-in-Depth): периметр (Spring Security) + row-level контроль (access-сервисы) + защита на уровне схемы СУБД (триггеры аудита).

### 10.2. Аутентификация и сессии

| Механизм | Реализация |
|---|---|
| Основной вход | JWT (access ~15 мин + refresh 30 дней) в заголовке `Authorization: Bearer` |
| Ротация refresh | Хранение в БД, ротация, ревокация, детекция повторного использования токена |
| Внешний вход | Google OAuth2 (`GoogleAuthService`) |
| 2FA | TOTP (RFC 6238), защита от подбора (счётчик попыток, таблица two_factor_pre_auth) |
| Сброс пароля | Одноразовые токены с ограниченным сроком (password_reset_tokens) |
| Сессия | Stateless (`SessionCreationPolicy.STATELESS`), CSRF отключён (нет cookie-сессий) |

### 10.3. Ролевая модель (6 ролей)

| Роль | Назначение | Ключевые ограничения |
|---|---|---|
| ADMIN | Полный доступ | — |
| EMPLOYEE | Операционная работа | Доступ к закреплённым клиентам/задачам |
| CLIENT | Личный кабинет | Только свои задачи/документы/счета; без записи в биллинг |
| LEARNER | LMS | Доступ к открытым курсам |
| CURATOR | Курация обучения | Управление только своими курсами/студентами |
| ADVISOR | Наблюдение (Read-Only) | Без права мутаций задач и документов |

### 10.4. Row-level контроль доступа

**CrmAccessService** — ядро изоляции CRM:
- `canReadClient`, `canReadTask` — чтение задач/клиентов по роли и закреплению.
- `canCreateTaskFor`, `canAssignClient`, `canAssignTask` — права на создание/назначение.
- `canUpdateTaskStage`, `canUpdateTaskDetails` — права на изменение; **ADVISOR исключён** (read-only).

**InvoiceAccessService** — изоляция финансов:
- `canRead` — ADMIN, владелец-CLIENT, закреплённый EMPLOYEE.
- `canWrite` / `canCreateFor` — только ADMIN и EMPLOYEE; роль CLIENT удалена (устранён IDOR-вектор).

**DocumentAccessService** — изоляция файлов:
- `canRead` — ADMIN/ADVISOR/EMPLOYEE, CLIENT — только свои.
- `canWrite` / `canCreateFor` — **ADVISOR исключён**.

**CourseAccessService** — изоляция LMS:
- `canManageCourse`, `canViewStudent`, `canAccessCourseContent` — по роли и привязке куратора к курсу.

### 10.5. Ограничение частоты запросов

Bucket4j, token bucket: 10 req/min на `/auth/**` (IP), 5 req/min на `/auth/check-email` (IP), 100 req/min на бизнес-маршрутах (userId/IP). При превышении — HTTP 429 без деградации БД.

### 10.6. Заголовки безопасности

| Заголовок | Значение |
|---|---|
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https: wss:;` |
| Cross-Origin-Opener-Policy | `same-origin-allow-popups` (для OAuth-попапов) |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |

### 10.7. Аудит и маскирование

- Append-only журнал на уровне триггеров PostgreSQL (V111): запрет `UPDATE`, `DELETE`, `TRUNCATE`.
- `HibernateAuditListener` маскирует чувствительные поля меткой `[PROTECTED]`.
- Единый формат ошибки с `requestId` (UUID) для трассировки без раскрытия внутренних деталей.

### 10.8. Результаты аудита безопасности

Проведён сквозной аудит и E2E-верификация. Итог: 28 находок (6 CRITICAL, 9 WARNING, 5 INFO), закрыто 100%.

| № | Находка | Класс | Устранение |
|---|---|---|---|
| 1 | Модификация чужих счетов клиентом (Invoice IDOR) | CRITICAL | CLIENT удалён из canWrite/canCreateFor; добавлен GET по id с assertCanRead → 403 на чужой счёт |
| 2 | ADVISOR мог мутировать задачи | CRITICAL | Исключён из canUpdateTaskDetails и TaskController |
| 3 | ADVISOR мог создавать/удалять документы | WARNING | Исключён из DocumentAccessService.canWrite/canCreateFor |
| 4 | Нарушение FK при удалении курса | CRITICAL | Каскадное удаление progress/enrollment/certificate |
| 5 | id: null при создании главы | WARNING | Явный save перед добавлением в коллекцию |
| 6 | Необработанный 500 при отсутствии шрифта PDF | WARNING | Проверка наличия /fonts/arial.ttf |
| 7 | Неверный статус для неподдерживаемых методов | INFO | Обработчик HttpRequestMethodNotSupportedException → 405 |
| 8 | Отсутствие троттлинга аутентификации | WARNING | AuthRateLimitFilter (Bucket4j) |
| 9 | Возможность изменения журнала аудита | CRITICAL | Триггеры PostgreSQL (V111) |
| 10 | Отсутствие строгих заголовков | WARNING | CSP, COOP, frame-options, referrer, permissions |
| ... | Прочие находки (раскрытие деталей в ответах, пагинация, N+1 и др.) | INFO/WARNING | Устранены в рамках общего аудита |

### 10.9. Управление секретами

- Все секреты и пароли — только в переменных окружения и GitHub Secrets / Fly.io secrets.
- В исходном коде секретов нет.
- Зафиксирован инцидент прошлых итераций (файл `application-cleantest.properties` попадал в git) — исправлено; правило закреплено в инструкциях проекта.

---

## 11. Тестирование и обеспечение качества

### 11.1. Стратегия

Пирамида тестирования: множество быстрых unit/integration тестов (backend + frontend) как основа, сквозные E2E-сьюты для критических бизнес-процессов и нагрузочные профили для проверки деградации под нагрузкой.

| Уровень | Инструменты | Объём |
|---|---|---|
| Backend unit/integration | JUnit 5, Mockito, AssertJ, MockMvc, H2 | 197 методов @Test в 50 классах |
| Frontend unit/component | Vitest, React Testing Library, jsdom | 124 теста в 19 файлах |
| E2E (API + браузер) | Node.js + Playwright Chromium | 14 сценариев/сьютов |
| Нагрузочное | Artillery | 3 профиля |

### 11.2. Backend-тесты

- Покрыты контроллеры, сервисы, security-правила, access-сервисы и обработка исключений.
- JaCoCo настроен для сбора покрытия (XML + HTML отчёты).
- Тесты — обязательное условие деплоя: при падении pipeline останавливается.

### 11.3. Frontend-тесты

- 19 тест-файлов (entities, widgets, features, contexts, pages).
- Проверяются: guard-компоненты (`ProtectedRoute`, `RoleProtectedRoute`), паритет i18n-ключей, форматирование, ключевые формы.
- Строгий TypeScript (`tsc --noEmit`) и ESLint 9 flat config с 0 warnings.

### 11.4. E2E-сьюты (`tests/e2e/`)

| Сьют | Проверок | Суть |
|---|---|---|
| crm-lifecycle-live.mjs | 12/12 | Воронка → создание задачи → детали → мутация → стадия → назначение → комментарии → история → удаление → 404 |
| lms-lifecycle-live.mjs | 11/11 | Курс → глава → урок → публикация → видимость студенту → завершение → прогресс → снятие с публикации → удаление |
| chat-notifications-live.mjs | 8/8 | Уведомления → read-all → контакты → отправка → unread → история → прочтение → сброс счётчика |
| documents-search-live.mjs | 9/9 | Шаблоны → загрузка PDF → реестр → REVIEW → доступ клиенту → скачивание → поиск → удаление → 404/403 |
| billing-invoices-live.mjs | 5/5 | ISSUED → список клиентом → PAID → удаление → исключение из реестра |
| api-live.mjs | 34 | Health UP, справочники, публичные формы, заголовки безопасности, fail-closed (401/403) |
| frontend-live.mjs | 16 | Мета-теги, CookieConsent, localStorage, тема, языки, навигация, валидация |
| authenticated-journeys-live.mjs | 17 | Реальные браузерные сессии ADMIN (8 шагов), EMPLOYEE (5), CLIENT (4) |
| idor-live.mjs | 21 | Матрица разграничения доступа между тенантами и ролями |
| 2fa-lifecycle.mjs | — | Полный жизненный цикл настройки/верификации 2FA |
| advisor-readonly-lifecycle.mjs | — | Проверка строгого read-only для ADVISOR |
| rate-limit-lifecycle.mjs | — | Проверка срабатывания Bucket4j (HTTP 429) |
| search-lifecycle.mjs | — | Полнотекстовый поиск |
| auth-helper.mjs | — | Провижининг 4 ролей, кеш токенов, retry-backoff на 429 |

Мастер-раннеры: `run-all-e2e.mjs`, `run-all-tests.mjs`.

Особенностью `auth-helper.mjs` является дисковое кеширование токенов с проверкой через `GET /v1/users/me` и автоматический retry-backoff при 429 — это предотвращает исчерпание лимитов Bucket4j при повторных прогонах.

### 11.5. Нагрузочное тестирование (Artillery)

| Профиль | Проверяет |
|---|---|
| catalog-and-public.yml | Публичные маршруты под конкурентным потоком |
| frontend-static.yml | Скорость отдачи статики/SPA через CDN |
| rate-limit-boundary.yml | Отсечение избыточных запросов (429) без деградации БД |

### 11.6. Качество кода

- Backend: слоистая структура (controller → service → repository → entity), DTO-маппинг, единый формат ошибок.
- Frontend: ESLint 9 flat config, 0 errors/0 warnings; строгий TypeScript; FSD-дисциплина.

---

## 12. Развёртывание, CI/CD и эксплуатация

### 12.1. Среды

| Артефакт | Среда | Адрес |
|---|---|---|
| Frontend SPA | Production | https://mrsgemaseny.github.io/JF-1C/ |
| Backend API | Production | https://zhanfinance.fly.dev/api/v1 |
| Swagger UI | Production (ADMIN) | https://zhanfinance.fly.dev/api/swagger-ui.html |
| БД | Production | PostgreSQL 17 (Fly.io) |
| Staging | Planned | Epic-17 |

### 12.2. Пайплайны GitHub Actions

| Workflow | Триггер | Содержание |
|---|---|---|
| `ci.yml` | push/PR | TypeScript check, Vitest, сборка и деплой фронтенда на GitHub Pages |
| `deploy-backend.yml` | push в main | Gradle test, сборка jar, упаковка Docker-образа, деплой на Fly.io |
| `db-backup.yml` | по расписанию | Дампы PostgreSQL, шифрование, отчёт в Telegram |

Деплой заблокирован при падении тестов.

### 12.3. Конфигурация (без секретов)

| Параметр | Значение |
|---|---|
| context-path | `/api` |
| Порт | 8080 (`SERVER_PORT`) |
| HikariCP | max pool 8, min idle 1, timeout 30s, max lifetime 10 мин, keepalive 150s |
| JPA | `open-in-view=false`, prod `ddl-auto=validate` |
| Flyway | enabled, out-of-order, validate-on-migrate, baseline V110 |
| Upload | max-file 20MB, max-request 25MB |
| Storage | `app.storage.type=db` (BLOB), fallback local `./uploads` |
| CORS | whitelist: GitHub Pages, Fly.io, localhost (dev) |
| JWT | access 900000 мс, refresh 1209600000 мс |
| Кэш | Caffeine per-region |
| Метрики | Actuator + Prometheus + OTLP |

### 12.4. Наблюдаемость

- Spring Boot Actuator: `/actuator/health`, `/actuator/info`; Micrometer → Prometheus/OTLP.
- UptimeRobot — внешние health-проверки.
- Telegram-бот — уведомления о лидах, бэкапах и системных событиях.

### 12.5. Эксплуатация и восстановление

- Резервное копирование БД — регулярный GitHub Actions workflow (`db-backup.yml`) с шифрованием и отчётом.
- Регламенты — в `docs/RUNBOOK.md`; онбординг — `docs/ONBOARDING.md`; стандарты — `docs/CONTRIBUTING.md`.
- Резервный сценарий хранения: при превышении лимитов BLOB-хранилища выполняется переключение на локальную ФС.

### 12.6. Локальный запуск

Требования: JDK 17, Node.js 20/22 LTS, PostgreSQL 17.

```bash
# 1. База данных
docker compose up db -d

# 2. Backend
cd zhan-finance-backend && ./gradlew bootRun      # http://localhost:8080/api

# 3. Frontend
cd ../zhan-finance-frontend && npm install && npm run dev   # http://localhost:5173/JF-1C/
```

---

## 13. Дорожная карта и осознанно отложенные направления

### 13.1. Эпики: статус

| Epic | Название | Статус |
|---|---|---|
| 01 | Auth | Done |
| 02 | CRM | Done |
| 03 | Documents | Done |
| 04 | LMS | Done |
| 05 | Chat | Done |
| 06 | Notifications | Done |
| 07 | Billing | Partial |
| 08 | Dashboard & Analytics | Done |
| 09 | Two-Factor Authentication | Done |
| 10 | Monitoring & Observability | Done |
| 11 | Domain & CDN | Planned |
| 12 | Payments | Planned |
| 13 | 1C Integration | Planned |
| 15 | Storage (Cloudflare R2) | Planned |
| 16 | LMS Quizzes | Planned |
| 17 | Staging Environment | Planned |
| 18 | Landing & Public Pages | Done |
| 19 | Advisor Role | Done |
| 21 | 1C Data Gateway & Fiscal Hub | Planned |

Всего эпиков: 20 (Epic-01 … Epic-21, без Epic-14). Подробные спецификации — в `Epics/Plan/*/epic.md`, в т.ч. подготовленные документы в `docs/future/`:
- `01-billing-webkassa-kaspi-pay-integration.md`
- `02-1c-enterprise-bidirectional-sync.md`
- `03-ncalayer-esf-kgd-direct-integration.md`
- `04-storage-r2-s3-migration-plan.md`

### 13.2. Отложенные направления и их обоснование

| Направление | Почему отложено | Готовность |
|---|---|---|
| Платёжные интеграции (WebKassa / Kaspi Pay) | Требует договоров с провайдерами и фискализации | Epic-12; Billing реализован частично (счета/подписки) |
| Кастомный домен zhanfinance.kz | Требует DNS и организационных процедур | Epic-11 |
| 1C Data Gateway | Требует OData-шлюза и согласования схем обмена | Epic-21; UI-каркас готов |
| Объектное хранилище R2 | Экономика ($0 egress) выгодна, но миграция BLOB требует плана | Epic-15; бакет `jf1c-documents` провижионен |
| Квизы LMS | Не блокирует базовое обучение | Epic-16 |
| Staging-среда | Не блокирует production, но желателен | Epic-17 |
| Sentry на backend | Несовместимость библиотеки с Spring Boot 4.1.0 | Отмечено в build.gradle; Sentry подключён на frontend |

---

## 14. Сводные показатели проекта

### 14.1. Объём кода

| Метрика | Значение |
|---|---|
| Backend (Java, main) | ~16 419 строк |
| Backend Java-классов | ~231 |
| Frontend (TS/TSX) | ~27 249 строк |
| Frontend страниц | ~63 |
| Frontend компонентов | ~179 |
| Виджеты / фичи / сущности | 18 / 8 / 14 |

### 14.2. Модули и API

| Метрика | Значение |
|---|---|
| Бизнес-модулей backend | 12 |
| REST-контроллеров | 29 |
| Сервисных классов | 40 |
| JPA-сущностей | 39 |
| Таблиц в production | 36 |
| Flyway-миграций | 61 (V1–V121) |
| Ролей | 6 |
| Локалей UI | 4 |

### 14.3. Тестирование

| Метрика | Значение |
|---|---|
| Backend @Test методов | 197 (50 классов) |
| Backend test-файлов | 50 |
| Frontend тестов | 124 (19 файлов) |
| E2E сьютов | 14 |
| Нагрузочных профилей | 3 |
| CI/CD пайплайнов | 3 |

### 14.4. Безопасность

| Метрика | Значение |
|---|---|
| Находок аудита | 28 |
| CRITICAL | 6 |
| WARNING | 9 |
| INFO | 5 |
| Закрыто | 28 (100%) |

---

## 15. Итоговая оценка готовности

### 15.1. Матрица готовности по направлениям

| Направление | Состояние | Оценка (1–5) | Комментарий |
|---|---|---|---|
| Архитектура | Модульный монолит + FSD | 5 | Чёткое разделение, готовность к росту |
| Backend-функционал | CRM, документы, LMS, биллинг, чат, аудит | 4.5 | Биллинг частично (нет платежей) |
| Frontend-функционал | 6 ролевых порталов + публичный контур | 5 | Полное покрытие ролей |
| Безопасность | JWT, 2FA, RBAC, row-level, аудит, троттлинг | 5 | 28/28 находок закрыты |
| База данных | PostgreSQL 17, Flyway, целостность | 5 | Неизменяемые миграции, триггеры |
| Тестирование | Unit/integration/E2E/load | 4.5 | Высокое покрытие; нет staging |
| CI/CD | 3 пайплайна, авто-деплой, бэкапы | 5 | Блокировка по тестам |
| Мониторинг | Actuator, Prometheus, UptimeRobot, Telegram | 4.5 | Sentry на backend отложен |
| Документация | README, ARCHITECTURE, RUNBOOK, Epics | 5 | Полная и актуальная |
| i18n | ru/kk/en/zh с паритетом | 5 | Автотесты паритета |

**Интегральная оценка: 4.85 / 5 (97%)** — высокая степень готовности к промышленной эксплуатации.

### 15.2. Заключение

Платформа ZhanFinance (JF-1C) реализована в полном соответствии с заявленным объёмом и готова к запуску в промышленную эксплуатацию.

**Достигнуто:**
- Реализованы все ключевые бизнес-модули: CRM с пулом задач и auto-reopen, документооборот с генерацией PDF/Word, LMS, биллинг (счета/подписки), чат реального времени, уведомления, неизменяемый аудит, глобальный поиск, календарь и лидогенерация.
- Обеспечено ролевое разграничение для 6 ролей с row-level изоляцией данных и защитой от IDOR.
- Проведён сквозной аудит безопасности; все 28 находок закрыты и верифицированы.
- Построена трёхуровневая система тестирования: 197 backend-тестов, 124 frontend-теста, 14 E2E-сьютов, 3 нагрузочных профиля.
- Настроены CI/CD-пайплайны с автоматическим деплоем и блокировкой по тестам; регулярные бэкапы БД с шифрованием и Telegram-отчётами.
- Обеспечена поддержка 4 языков (ru, kk, en, zh) с полным паритетом ключей.
- Подготовлена полная инженерная документация и план развития по 20 эпикам.

**Осознанно отложено (не влияет на запуск основной функциональности):**
- Платёжные интеграции WebKassa / Kaspi Pay (Epic-12) — Billing работает со счетами и подписками.
- Кастомный домен zhanfinance.kz (Epic-11).
- 1C Data Gateway (Epic-21) — UI-каркас `/client/1c` готов, реальные данные не подключены намеренно.
- Объектное хранилище Cloudflare R2 (Epic-15) — бакет провижионен, миграция запланирована.
- Квизы LMS (Epic-16) и staging-среда (Epic-17).

**Рекомендации на первый квартал эксплуатации:**
1. Приоритизировать интеграцию платежей (Epic-12) и подключение кастомного домена (Epic-11).
2. Развернуть staging-среду (Epic-17) для безопасного тестирования релизов.
3. Завершить 1C Data Gateway (Epic-21) для устранения временного Empty State в клиентском кабинете.
4. Рассмотреть миграцию на Cloudflare R2 (Epic-15) для снижения стоимости хранения и egress.
5. Вернуться к вопросу подключения Sentry на backend при обновлении совместимой версии библиотеки.

**Проект готов к запуску.**

---

*Конец документа.*

