# Zhan Finance (JF-1C) — Enterprise SaaS Platform

Zhan Finance (JF-1C) — специализированная высокопроизводительная B2B SaaS-платформа и CRM для автоматизации бухгалтерского бизнеса, финансового консалтинга и операционных процессов.

Проект создан как полноценная, масштабируемая альтернатива универсальным коробочным порталам (Bitrix24, amoCRM). Платформа объединяет CRM, сквозной биллинг, генерацию документов, внутреннее обучение (LMS), безопасные WebSocket-чаты, публичную лидогенерацию и мощную систему аналитики.

## Документация и База Знаний

* **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Полный обзор архитектуры, ролевая модель (6 ролей), концепция безопасности `CrmAccessService`, модули и стратегия БД.
* **[ONBOARDING.md](docs/ONBOARDING.md)**: Быстрый старт для новых разработчиков (разворачивание окружения, сидинг, запуск тестов).
* **[RUNBOOK.md](docs/RUNBOOK.md)**: Регламент эксплуатации, действия при авариях (Incident Response), резервное копирование и Health-проверки.
* **[CONTRIBUTING.md](docs/CONTRIBUTING.md)**: Стандарты написания кода, правила Git Workflow, политика неизменяемости миграций и борьба с оверинжинирингом.

---

## Архитектура и Технологический Стек

### Backend
- **Core Framework**: Java 17, Spring Boot 3.4+
- **Security & Auth**: Spring Security 6, JWT (Access + Refresh с полной ротацией и аннулированием сессий), 2FA (TOTP)
- **Data & Migration**: PostgreSQL 17, Spring Data JPA, Flyway DB Migrations (цепочка миграций V1–V110+)
- **Real-Time Communication**: WebSocket, STOMP, SockJS с точечной авторизацией подписок
- **Caching & Metrics**: Caffeine (per-region cache), Micrometer Metrics (OTLP Push), Prometheus, UptimeRobot
- **PDF & Documents**: Thymeleaf, OpenHTMLtoPDF (полная поддержка кириллицы и шрифтов), DocumentGeneratorService
- **Audit & Security**: Hibernate Interceptor / Entity Listener с автоматическим маскированием полей, PostgreSQL триггеры на блокировку UPDATE/DELETE аудита.
- **Rate Limiting**: ApiRateLimitFilter и AuthRateLimitFilter

### Frontend
- **Core Stack**: React 19, TypeScript, Vite
- **Architecture**: Feature-Sliced Design (FSD) (shared -> entities -> features -> widgets -> pages)
- **Styling**: Tailwind CSS v4, Vanilla CSS Design System, Framer Motion
- **Data Fetching**: TanStack React Query v5 с глобальной обработкой ошибок и ретраями
- **Localization**: i18next (Русский и Английский язык из коробки)
- **Interactive UI**: @dnd-kit (Канбан-доски), SunEditor (Rich Text), Lucide Icons

### Infrastructure & Deployment
- **API Base Path**: Context-Path `/api`, Versioned Endpoints `/v1/**` (`/api/v1/...`)
- **Hosting**: Fly.io (Backend Docker Container), GitHub Pages (Frontend Single Page App)
- **CI/CD**: GitHub Actions (Автоматическое тестирование, проверка типов, создание дампов PostgreSQL с алертами в Telegram, деплой)

---

## Ключевые Модули Системы

1. **CRM & Task Management**:
   - Кастомные пайплайны и стадии с поддержкой Канбан-доски (drag-and-drop).
   - Единый Task Pool (очередь нераспределённых задач) для самостоятельного захвата сотрудниками (auto-reopen логика).
   - Подзадачи, теги, комментарии, истории активности и управление исполнителями.
2. **Role Management (6 ролей)**:
   - `ADMIN`, `EMPLOYEE`, `CLIENT`, `LEARNER`, `CURATOR`, `ADVISOR` (с расширенным доступом к клиентам).
   - Жесткий Registration Status flow (PENDING, APPROVED, REJECTED) для новых сотрудников.
3. **Billing & Subscriptions**:
   - Автоматическая генерация счетов на оплату в PDF.
   - Учёт разовых и рекуррентных подписок с отслеживанием статуса оплаты.
4. **Document Hub**:
   - Генерация документов по корпоративным шаблонам.
   - Двухуровневое хранилище (БД + локальный fallback) с фильтрацией загрузки по расширениям (PDF, DOCX, XLSX, PNG, JPG, ZIP).
   - Строгая изоляция доступа к скачиванию через `DocumentAccessService`.
5. **LMS (Learning Management System)**:
   - Структура: Курс -> Глава -> Урок -> Блок контента (видео, текст, тесты).
   - Поддержка сертификации сотрудников и клиентов.
6. **Communications & Alerts**:
   - Персональные и групповые диалоги на базе WebSocket STOMP.
   - Telegram-уведомления (Business Alerts) для администраторов о новых лидах и задачах.
7. **Public Landing Pages**:
   - Интегрированные публичные страницы: Home, Services, About, Solution Picker, Contact, Leads.

---

## Структура Проекта

```
JF-1C/
├── zhan-finance-backend/     # Spring Boot backend приложение
│   ├── src/main/java/        # Исходный код Java
│   ├── src/main/resources/   # Конфигурации и Flyway миграции (V1..V110+)
│   └── src/test/java/        # Unit & Integration тесты (JUnit + Mockito)
├── zhan-finance-frontend/    # React TypeScript SPA приложение
│   ├── src/app/              # Инициализация приложения
│   ├── src/pages/            # Слой страниц FSD
│   ├── src/widgets/          # Слой виджетов FSD
│   ├── src/features/         # Слой фичей FSD
│   ├── src/entities/         # Слой сущностей FSD
│   └── src/shared/           # Общие компоненты и API клиенты
├── Epics/                    # Планирование, задачи и прогресс по эпикам
├── .agents/                  # AI контекст, инструкции и системные промпты
└── docker-compose.yml        # Локальное окружение (Postgres 17)
```

---

## Запуск в Локальном Окружении

### Требования
- Java 17 JDK
- Node.js 20+
- PostgreSQL 17 (или Docker Desktop)

### 1. Поднятие Базы Данных (Docker)

```bash
docker compose up db -d
```

### 2. Запуск Backend

```bash
cd zhan-finance-backend
./gradlew bootRun
```
*Сервер поднимется на `http://localhost:8080/api`.*
*Swagger UI доступен по адресу `http://localhost:8080/api/swagger-ui.html`.*

### 3. Запуск Frontend

```bash
cd zhan-finance-frontend
npm install
npm run dev
```
*Приложение откроется на `http://localhost:5173/JF-1C/`.*

---

## Запуск Тестов

### Backend Unit & Integration Tests:

```bash
cd zhan-finance-backend
./gradlew test
```

### Frontend TypeScript Verification:

```bash
cd zhan-finance-frontend
npx tsc --noEmit
```

---

## Политический статус безопасности и комплаенса
- **Flyway Migrations**: Миграции строго неизменяемы, целостность чексумм критична.
- **Безопасность токенов**: Полная защита от брутфорса, автоматическая очистка устаревших refresh-токенов, 2FA (TOTP) для всех администраторов и эдвайзеров.
- **Защита от утекших секретов**: Отсутствует хардкод секретов, настройка исключительно через env и GitHub Secrets.
- **Интегритет БД**: Исключено прямое удаление логов аудита и подделка MIME-типов документов.
