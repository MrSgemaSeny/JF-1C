# Архитектурная карта JF-1C (ZhanFinance)

Краткий справочник архитектуры, структуры проекта и соглашений для разработчиков и AI-ассистентов.

---

## 1. Tech Stack & Overview

SaaS CRM и бухгалтерско-управленческая платформа для казахстанской бухгалтерской аутсорсинг-компании «ЖАН FINANCE». Обеспечивает ведение клиентов, пайплайны задач, документооборот, биллинг, генерацию договоров/актов в PDF, корпоративное обучение (LMS) и интеграцию с Telegram-ботом.

### Backend
- **Язык & Среда**: Java 17, Spring Boot 3 / 4.x, Gradle
- **База данных**: PostgreSQL 17, Flyway (миграции V1–V127, строгий запрет правки существующих файлов)
- **Безопасность**: Spring Security 6, JWT (access + refresh rotation), TOTP 2FA, Google OAuth 2.0 (GIS), Gmail OTP protection
- **Отказоустойчивость & Производительность**: Bucket4j (Rate Limiting), Caffeine Cache, Optimistic Locking (`@Version` в `BaseEntity`)
- **Интеграции & Коммуникация**: WebSocket (STOMP/SockJS), OpenHTMLtoPDF + Thymeleaf (генерация PDF с поддержкой кириллицы), Poi-tl (Word-шаблоны), Apache Tika, Spring Mail (SMTP)
- **Telegram Bot Microservice**: Отдельный сервис `zhan-finance-tgbot` (`port 8081`, Spring Boot 3), общающийся с монолитом через внутренний API `/api/v1/internal/**` по защищенному токену `X-Internal-Token` (`Role.INTERNAL_BOT`)

### Frontend
- **Язык & Среда**: TypeScript 5+, React 19, Vite, Tailwind CSS v4
- **Архитектура**: Feature-Sliced Design (FSD: `shared` -> `entities` -> `features` -> `widgets` -> `pages` -> `app`)
- **Состояние & Сеть**: TanStack React Query v5, Axios/Fetch обертка `http.ts` с singleton refresh token логикой
- **Интернационализация**: 4 языка (`ru`, `kk`, `en`, `zh`), полное покрытие через `react-i18next`
- **Мобильная сборка**: Capacitor (Android / PWA)

---

## 2. Project Structure (Directory Map)

```text
JF-1C/
├── .agents/                                # Контекст и правила AI-ассистентов (AGENTS.md, CONTEXT.md)
├── Epics/                                  # Архитектурные спецификации и планы фичей (Epic-01..Epic-21)
├── docs/                                   # Отчеты аудитов, регламенты и runbooks (RUNBOOK.md)
│
├── zhan-finance-backend/                   # Монолит бэкенда (Spring Boot 3, Java 17)
│   └── src/
│       ├── main/
│       │   ├── java/com/example/zhanfinancebackend/
│       │   │   ├── ZhanFinanceBackendApplication.java  # Точка входа, статический .env загрузчик
│       │   │   ├── common/                             # Сквозная инфраструктура
│       │   │   │   ├── audit/                          # BaseEntity, аудирование изменений
│       │   │   │   ├── config/                         # SecurityConfig, CorsConfig, WebMvcConfig
│       │   │   │   ├── exception/                      # GlobalExceptionHandler, ErrorResponse, кастомные ошибки
│       │   │   │   ├── filter/                         # ApiRateLimitFilter, CsrfHeaderFilter
│       │   │   │   └── response/                       # Стандартизированные DTO ответов
│       │   │   └── modules/                            # Доменные модули (слои: controller, service, entity, repo, dto)
│       │   │       ├── admin/                          # Системное администрирование и метрики
│       │   │       ├── audit/                          # Журнал аудита действий пользователей
│       │   │       ├── auth/                           # Аутентификация, токены, 2FA, Google GIS, роли
│       │   │       ├── billing/                        # Счета (Invoice), подписки, платежные шлюзы
│       │   │       ├── chat/                           # Внутренний чат, WebSocket контроллеры
│       │   │       ├── courses/                        # LMS: курсы, модули, уроки, сертификаты
│       │   │       ├── crm/                            # Задачи (Task), пайплайны (Stage), профили клиентов
│       │   │       ├── documents/                      # Хранение файлов, генерация PDF/Docx шаблонов
│       │   │       ├── landing/                        # Контактные формы и лиды с публичного сайта
│       │   │       ├── notifications/                  # In-app и email уведомления
│       │   │       ├── search/                         # Глобальный поиск по системе
│       │   │       ├── services/                       # Справочник бухгалтерских услуг
│       │   │       └── telegram/                       # Outbox-уведомления и связывание аккаунтов с ботом
│       │   └── resources/
│       │       ├── application.properties              # Основная конфигурация
│       │       ├── application-prod.properties         # Продакшн настройки
│       │       ├── db/migration/                       # Неизменяемые Flyway-миграции (V1..V127)
│       │       ├── templates/                          # Thymeleaf шаблоны PDF документов
│       │       └── messages*.properties                # Словари локализации ошибок бэкенда
│       └── test/                                   # Юнит, интеграционные и security тесты
│
├── zhan-finance-frontend/                  # Клиентская часть (React 19, Vite, FSD)
│   └── src/
│       ├── app/                                    # Инициализация приложения, роутер, провайдеры
│       ├── pages/                                  # Страницы приложения (по ролям: admin, client, employee и т.д.)
│       ├── widgets/                                # Крупные UI-комплексы (Header, Sidebar, Kanban Board)
│       ├── features/                               # Бизнес-сценарии (auth, chat, task-actions, filters)
│       ├── entities/                               # Модели данных, API-клиенты и React Query хуки
│       └── shared/                                 # UI-кит, утилиты (dateFormat, cn), конфиги, i18n
│
└── tests/                                  # Сквозные Playwright / Artillery нагрузочные тесты
```

---

## 3. Key Components & Entry Points

### 1. Точки входа
- **Backend Main**: [`ZhanFinanceBackendApplication.java`](file:///c:/Users/murat/IdeaProjects/JF-1C/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/ZhanFinanceBackendApplication.java) — метод `loadDotEnv()` автоматически читает корневой `.env` до старта Spring-контекста.
- **Frontend Main**: [`main.tsx`](file:///c:/Users/murat/IdeaProjects/JF-1C/zhan-finance-frontend/src/main.tsx) и [`App.tsx`](file:///c:/Users/murat/IdeaProjects/JF-1C/zhan-finance-frontend/src/app/App.tsx) — инициализация React Query, Google OAuth, i18n и роутинга.

### 2. Маршрутизация API (Context Path)
- `server.servlet.context-path=/api`
- Все REST-контроллеры маппятся на `/v1/**`
- **Итоговые внешние эндпоинты**: `/api/v1/**`

### 3. Ключевые контроллеры
- **Аутентификация**: `AuthController` (`/api/v1/auth/**`) — логин, регистрация, refresh токенов, подтверждение Gmail OTP, 2FA.
- **CRM Задачи & Стейджи**: `TaskController`, `StageController`, `ClientProfileController` (`/api/v1/crm/**`).
- **Биллинг & Инвойсы**: `InvoiceController` (`/api/v1/billing/**`).
- **Документы**: `DocumentController`, `DocumentTemplateController` (`/api/v1/documents/**`).
- **Связка с Telegram**: `TelegramLinkController` (`/api/v1/telegram/link/**`) — генерация 15-минутных токенов привязки бота.
- **Внутренний API для Telegram-микросервиса**: `InternalTelegramController` (`/api/v1/internal/**`) — проверка привязки, опрос очереди outbox (`/pending`), подтверждение отправки (`/ack`).

### 4. WebSocket & Realtime
- `WebSocketConfig.java`: эндпоинт подключения `/ws`, подписки `/topic/chat/{userId}`, строгий контроль прав пользователя при подключении.

---

## 4. Cross-Cutting Concerns

### Обработка исключений
- [`GlobalExceptionHandler.java`](file:///c:/Users/murat/IdeaProjects/JF-1C/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/common/exception/GlobalExceptionHandler.java) (`@RestControllerAdvice`):
  - Возвращает единообразный `ErrorResponse` (status, code, message, path, requestId).
  - Санитизирует стек-трейсы: клиенту никогда не отдаются внутренние детали БД или библиотек.
  - Маппит:
    - 400: `MethodArgumentNotValidException`, `HttpMessageNotReadableException`, `IllegalArgumentException`, `ConstraintViolationException`
    - 401: `UnauthorizedException`, `AuthenticationException`
    - 403: `AccessDeniedException`
    - 404: `ResourceNotFoundException`
    - 409: `ConflictException`, `OptimisticLockException`, `DataIntegrityViolationException`
    - 500: общие необработанные `Exception` с генерацией уникального `requestId` для поиска в логах.

### Безопасность и авторизация
- [`SecurityConfig.java`](file:///c:/Users/murat/IdeaProjects/JF-1C/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/common/config/SecurityConfig.java):
  - **InternalTokenFilter**: перехватывает `/v1/internal/**` и валидирует заголовок `X-Internal-Token` алгоритмом постоянного времени (`MessageDigest.isEqual`), присваивая роль `ROLE_INTERNAL_BOT`.
  - **JwtAuthenticationFilter**: валидирует Bearer JWT и наполняет `SecurityContext`.
  - **ApiRateLimitFilter** & **AuthRateLimitFilter**: защита от брутфорса и DDoS на базе ведра токенов (Bucket4j).
  - **Роли пользователей (6)**: `ADMIN`, `EMPLOYEE`, `CLIENT`, `LEARNER`, `CURATOR`, `ADVISOR` + служебная `INTERNAL_BOT`.
  - **Row-Level безопасность**: `CrmAccessService` — проверка прав доступа текущего пользователя к задачам, клиентам и файлам на уровне строк БД.

### Переменные окружения и конфигурация
- Корневой `.env` подгружается как бэкендом, так и ботом и фронтендом.
- Основные ключи:
  - `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
  - `JWT_SECRET` (обязательно >= 32 байт)
  - `INTERNAL_BOT_TOKEN` (секрет связи бэкенда и микросервиса бота)
  - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM`
  - `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`

---

## 5. Where to Put New Code (Cheat Sheet)

| Что нужно сделать | Куда помещать код |
|---|---|
| **Новая таблица БД / миграция** | `zhan-finance-backend/src/main/resources/db/migration/V{next}__Description.sql` *(Существующие миграции V1..V127 менять ЗАПРЕЩЕНО)* |
| **Новая бизнес-сущность бэкенда** | `zhan-finance-backend/.../modules/{domain}/entity/{Entity}.java` (наследовать от `BaseEntity`) |
| **Запросы к БД / репозиторий** | `zhan-finance-backend/.../modules/{domain}/repository/{Entity}Repository.java` |
| **Бизнес-логика бэкенда** | `zhan-finance-backend/.../modules/{domain}/service/{Entity}Service.java` (аннотация `@Transactional`) |
| **Новый REST контроллер** | `zhan-finance-backend/.../modules/{domain}/controller/{Name}Controller.java` (`@RequestMapping("/v1/{domain}")`) |
| **Эндпоинт для Telegram-бота** | `zhan-finance-backend/.../modules/telegram/controller/InternalTelegramController.java` (`@PreAuthorize("hasRole('INTERNAL_BOT')")`) |
| **Новая логика команд бота** | Репозиторий `zhan-finance-tgbot`: `src/main/java/kz/zhanfinance/bot/handler/` |
| **Новая страница во фронтенде** | `zhan-finance-frontend/src/pages/{portal}/{Feature}Page.tsx` + роут в `src/shared/config/routes.ts` |
| **Новый виджет / блок дашборда** | `zhan-finance-frontend/src/widgets/{widget-name}/` |
| **API-запрос / React Query хук** | `zhan-finance-frontend/src/entities/{entity}/api/{entity}Api.ts` и `queries.ts` |
| **Переиспользуемый UI компонент** | `zhan-finance-frontend/src/shared/ui/{ComponentName}/` |
| **Новые тексты / локализация** | `zhan-finance-frontend/src/shared/i18n/locales/{ru,kk,en,zh}/` (строгий паритет ключей во всех 4 языках) |
| **Новый архитектурный эпик / фича** | `Epics/Plan/Epic-{N}-{slug}/epic.md` (шаблон см. в `AI_agent_instruction.md`) |
