# Zhan Finance (JF-1C) — Enterprise SaaS Platform

Zhan Finance (JF-1C) — специализированная высокопроизводительная B2B SaaS-платформа и CRM для автоматизации бухгалтерского бизнеса, финансового консалтинга и операционных процессов.

Проект создан как полноценная, масштабируемая альтернатива универсальным коробочным порталам (Bitrix24, amoCRM). Платформа объединяет CRM, сквозной биллинг, генерацию документов, внутреннее обучение (LMS), безопасные WebSocket-чаты и публичную лидогенерацию.

## Документация и База Знаний

* **[ARCHITECTURE.md](file:///c:/Users/murat/IdeaProjects/JF-1C/docs/ARCHITECTURE.md)**: Полный обзор архитектуры, ролевая модель (5 ролей), концепция безопасности `CrmAccessService`, модули и стратегия БД.
* **[ONBOARDING.md](file:///c:/Users/murat/IdeaProjects/JF-1C/docs/ONBOARDING.md)**: Быстрый старт для новых разработчиков (разворачивание окружения, сидинг, запуск тестов).
* **[RUNBOOK.md](file:///c:/Users/murat/IdeaProjects/JF-1C/docs/RUNBOOK.md)**: Регламент эксплуатации, действия при авариях (Incident Response), резервное копирование и Health-проверки.
* **[CONTRIBUTING.md](file:///c:/Users/murat/IdeaProjects/JF-1C/docs/CONTRIBUTING.md)**: Стандарты написания кода, правила Git Workflow, политика неизменяемости миграций и борьба с оверинжинирингом.

---

## Архитектура и Технологический Стек

### Backend
- **Core Framework**: Java 17, Spring Boot 3.4+
- **Security & Auth**: Spring Security 6, JWT (Access + Refresh с полной ротацией и аннулированием сессий), Google OAuth2
- **Data & Migration**: PostgreSQL 17, Spring Data JPA, Flyway DB Migrations (цепочка миграций V1–V108)
- **Real-Time Communication**: WebSocket, STOMP, SockJS с точечной авторизацией подписок
- **Caching & Metrics**: Caffeine (per-region cache), Micrometer Metrics, Prometheus (/actuator/prometheus)
- **PDF & Documents**: Thymeleaf, OpenHTMLtoPDF (полная поддержка кириллицы и шрифтов), DocumentGeneratorService
- **Audit System**: Hibernate Interceptor / Entity Listener с автоматическим маскированием чувствительных полей (`[PROTECTED]`)
- **Rate Limiting**: ApiRateLimitFilter (100 req/min) и AuthRateLimitFilter (10 req/min)

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
- **CI/CD**: GitHub Actions (Автоматическое тестирование, проверка типов, создание дампов PostgreSQL с абертами в Telegram)

---

## Ключевые Модули Системы

1. **CRM & Task Management**:
   - Кастомные пайплайны и стадии с поддержкой Канбан-доски (drag-and-drop).
   - Единый Task Pool (очередь нераспределённых задач) для самостоятельного захвата сотрудниками.
   - Подзадачи, теги, комментарии, истории активности и управление исполнителями.
2. **Billing & Subscriptions**:
   - Автоматическая генерация счетов на оплату в PDF.
   - Учёт разовых и рекуррентных подписок с отслеживанием статуса оплаты.
3. **Document Hub**:
   - Генерация документов по корпоративным шаблонам.
   - Двухуровневое хранилище (БД + локальный fallback).
   - Строгая изоляция доступа к скачиванию через `DocumentAccessService`.
4. **LMS (Learning Management System)**:
   - Структура: Курс -> Глава -> Урок -> Блок контента (видео, текст, тесты).
   - Поддержка роли `LEARNER` для обучения и сертификации сотрудников/клиентов.
5. **Real-time Chat**:
   - Персональные и групповые диалоги на базе WebSocket STOMP.
   - Валидация подписок `/topic/chat/{userId}` на уровне ролей `ADMIN`, `EMPLOYEE`, `CLIENT`.
6. **System Audit & Monitoring**:
   - Автоматический трекинг всех изменений записей в БД (CREATE, UPDATE, DELETE).
   - Маскирование паролей, токенов и секретов в логах аудита.

---

## Структура Проекта

```
JF-1C/
├── zhan-finance-backend/     # Spring Boot backend приложение
│   ├── src/main/java/        # Исходный код Java
│   ├── src/main/resources/   # Конфигурации и Flyway миграции (V1..V108)
│   └── src/test/java/        # Unit & Integration тесты (56 тестов)
├── zhan-finance-frontend/    # React TypeScript SPA приложение
│   ├── src/app/              # Инициализация приложения
│   ├── src/pages/            # Слой страниц FSD
│   ├── src/widgets/          # Слой виджетов FSD
│   ├── src/features/         # Слой фичей FSD
│   ├── src/entities/         # Слой сущностей FSD
│   └── src/shared/           # Общие компоненты и API клиенты
├── markdowns_obsidian/       # Документация, отчёты и дорожные карты
└── docker-compose.yml        # Локальное окружение (Postgres 17 + App)
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

### Backend Unit & Integration Tests (56 тестов):

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
- **Flyway Migrations**: Миграции V1-V108 неизменяемы.
- **Безопасность токенов**: Смена пароля отзывает все выданные refresh-токены во всей системе.
- **Защита от утекших секретов**: Отсутствуют хардкод секретов, настройка исключительно через env и Secrets.
