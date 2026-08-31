# ZhanFinance (JF-1C) — Enterprise B2B SaaS Platform

[![Release](https://img.shields.io/badge/Release-v1.0.0-blue.svg)](https://github.com/MrSgemaSeny/JF-1C/releases/tag/v1.0.0)
[![Maturity Level](https://img.shields.io/badge/Maturity-Level_4_(Production--Ready)-success.svg)](https://github.com/MrSgemaSeny/JF-1C)
[![Backend](https://img.shields.io/badge/Backend-Spring_Boot_3.4%2B_%7C_Java_17-orange.svg)](https://spring.io/projects/spring-boot)
[![Frontend](https://img.shields.io/badge/Frontend-React_19_%7C_TypeScript_%7C_Tailwind_v4-61DAFB.svg)](https://react.dev)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_17_%7C_Flyway_V1--V120-336791.svg)](https://www.postgresql.org)
[![Automated Tests](https://img.shields.io/badge/Tests-234_Passed_(100%25_Green)-brightgreen.svg)](https://github.com/MrSgemaSeny/JF-1C)
[![Architecture](https://img.shields.io/badge/Architecture-FSD_%2B_Modular_Monolith-purple.svg)](https://feature-sliced.design)

**ZhanFinance (JF-1C)** — специализированная высокопроизводительная B2B SaaS-платформа и операционная CRM-система, спроектированная под специфику бухгалтерского консалтинга, налогового сопровождения и финансового аутсорсинга в Республике Казахстан.

Платформа решает проблему фрагментации операционных процессов (хаотичные переписки в мессенджерах, ручная подготовка актов и счетов, потеря задач в Excel и разрозненные коробочные CRM) и объединяет в едином защищенном контуре: распределенный пул задач, генерацию официальных документов с поддержкой кириллицы, биллинг, корпоративную LMS-академию, защищенные STOMP-чаты и публичную лидогенерацию.

---

## Оглавление

1. [Проблема и Бизнес-Ценность](#1-проблема-и-бизнес-ценность)
2. [Архитектурная Топология Системы](#2-архитектурная-топология-системы)
3. [Технологический Стек](#3-технологический-стек)
4. [Ключевые Модули Платформы](#4-ключевые-модули-платформы)
5. [Безопасность и Защита от Уязвимостей (Defense-in-Depth)](#5-безопасность-и-защита-от-уязвимостей-defense-in-depth)
6. [Производительность и Zero-N+1 Гарантии](#6-производительность-и-zero-n1-гарантии)
7. [Структура Репозитория](#7-структура-репозитория)
8. [Быстрый Старт и Локальное Развертывание](#8-быстрый-старт-и-локальное-развертывание)
9. [Автоматизированное Тестирование и Верификация](#9-автоматизированное-тестирование-и-верификация)
10. [Продакшен-Инфраструктура и CI/CD](#10-продакшен-инфраструктура-и-cicd)
11. [Документация и Руководства](#11-документация-и-руководства)

---

## 1. Проблема и Бизнес-Ценность

Традиционные универсальные CRM (Bitrix24, amoCRM) не учитывают критические требования бухгалтерского аутсорсинга:
- **Высокая цена ошибки и просрочки:** Срыв дедлайна сдачи налоговой декларации или задержка первичных документов ведет к прямым штрафам клиентов от фискальных органов.
- **Узкое горлышко распределения задач:** Ручное назначение задач тимлидом создает задержки. ZhanFinance внедряет **Dynamic Task Pool** с автоматическим захватом задач сотрудниками и auto-reopen логикой при доработках.
- **Отсутствие типового документооборота РК:** Необходимость сторонних генераторов для актов выполненных работ (АВР), счетов-фактур, договоров и соглашений о конфиденциальности (NDA).
- **Сложность онбординга кадров:** Текучесть кадров в консалтинге требует встроенной обучающей платформы (LMS) для быстрой аттестации стажеров и клиентов.

**ZhanFinance** устраняет эти барьеры, предоставляя готовое решение «из коробки» с соблюдением требований законодательства и корпоративных стандартов безопасности.

---

## 2. Архитектурная Топология Системы

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT PRESENTATION LAYER                            │
│  React 19 SPA (Vite) │ Feature-Sliced Design (FSD) │ Tailwind v4 │ i18n (KZ/RU/EN)│
│  TanStack Query v5   │ WebSocket STOMP Client      │ @dnd-kit Kanban Board        │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ HTTPS / WSS
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY & TRAFFIC CONTROL LAYER                         │
│  ApiRateLimitFilter (Bucket4j per User/IP) │ Strict Security Headers (CSP, Frame)│
│  JwtAuthenticationFilter (Bearer/Cookie)   │ CORS / CSRF Token Protection        │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ Context-Path: /api/v1/**
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       SPRING BOOT 3 MODULAR MONOLITH CORE                        │
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌────────────┐ │
│ │ CRM & Task Pool   │ │ Document Hub      │ │ Billing & Subscr  │ │ LMS Engine │ │
│ │ (CrmAccessService)│ │ (OpenHtmlToPdf)   │ │ (Invoices/Plans)  │ │ (Courses)  │ │
│ └───────────────────┘ └───────────────────┘ └───────────────────┘ └────────────┘ │
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌────────────┐ │
│ │ 2FA & Auth Module │ │ Real-Time Chat    │ │ System Health Hub │ │ Audit Log  │ │
│ │ (TOTP Security)   │ │ (STOMP Broker)    │ │ (Health Probing)  │ │ (Triggers) │ │
│ └───────────────────┘ └───────────────────┘ └───────────────────┘ └────────────┘ │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ JDBC (HikariCP Pool) / Regional Cache
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          PERSISTENCE & CACHING LAYER                             │
│  PostgreSQL 17 Database │ Flyway Schema Migrations (V1–V120) │ Caffeine L2 Cache  │
│  DatabaseStorage (BLOB) │ LocalStorage Path Traversal Guard  │ Audit Tables       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Технологический Стек

### Backend
- **Ядро & Среда выполнения:** Java 17, Spring Boot 3.4+, Spring Framework 6.
- **Безопасность & Авторизация:** Spring Security 6, JWT (Access 15 мин + Refresh 30 дней с ротацией), 2FA TOTP (Google Authenticator) с защитой от brute-force.
- **Работа с данными:** PostgreSQL 17, Spring Data JPA, Hibernate 6, HikariCP Connection Pool.
- **Миграции БД:** Flyway (неизменяемая строгая цепочка миграций V1–V120 с контролем контрольных сумм).
- **Сетевой транспорт:** WebSocket, STOMP, SockJS с точечной валидацией подписок и каналов.
- **Кэширование & Ограничение трафика:** Caffeine Cache (per-region TTL), Bucket4j Token Bucket rate limiting (`ApiRateLimitFilter`, `AuthRateLimitFilter`).
- **Генерация документов:** Thymeleaf Engine, OpenHTMLtoPDF (полная поддержка шрифтов, рендеринг кириллицы в PDF/A).
- **Тестирование:** JUnit 5, Mockito, AssertJ, Spring MockMvc, H2 In-Memory Database.

### Frontend
- **Ядро & Сборка:** React 19, TypeScript 5.x, Vite, Rolldown Runtime.
- **Архитектура:** Feature-Sliced Design (FSD v2.1) (`shared` -> `entities` -> `features` -> `widgets` -> `pages` -> `app`).
- **Стилизация & Дизайн-система:** Tailwind CSS v4, CSS Variables, Framer Motion, Lucide Icons.
- **Управление состоянием & Серверный кэш:** TanStack React Query v5 с глобальной обработкой ошибок и ретраями.
- **Интерактивные интерфейсы:** `@dnd-kit` (Drag-and-Drop Канбан с защитой от race condition), SunEditor (Rich Text), Zod (Schema Validation).
- **Интернационализация:** `i18next` (Русский, Казахский, Английский языки).
- **Тестирование:** Vitest, React Testing Library, jsdom.

### Инфраструктура и DevOps
- **Хостинг Backend:** Fly.io (изолированный Docker-контейнер, регион `ams`).
- **Хостинг Frontend:** GitHub Pages (Production SPA с автоматической маршрутизацией через `404.html`).
- **CI/CD:** GitHub Actions (автоматизированный запуск 234 тестов, сборка артефактов, деплой, периодические дампы PostgreSQL в защищенное хранилище и Telegram-алерты).

---

## 4. Ключевые Модули Платформы

### 4.1. CRM & Dynamic Task Pool
- **Кастомные воронки и стадии:** Гибкая настройка этапов ведения клиентов с drag-and-drop перемещением.
- **Единый пул задач (Task Pool):** Нераспределенные задачи попадают в общий пул, откуда свободные сотрудники берут их в работу по компетенциям.
- **Auto-Reopen логика:** Автоматический возврат задачи в пул при отклонении результатов или смене статуса клиентом.
- **Подзадачи, теги и комментарии:** Полный аудит истории действий с фиксацией времени и автора каждого изменения.

### 4.2. Официальный документооборот (Document Hub)
- **Генерация типовых документов РК:** Акты выполненных работ (АВР), счета на оплату, типовые договоры оказания бухгалтерских услуг, соглашения NDA.
- **Двухуровневое хранилище:** Основное хранение файлов в PostgreSQL (`stored_files` BLOB) с прозрачным переключением на локальную файловую систему при превышении лимитов.
- **Защита загрузки:** Белый список MIME-типов (PDF, DOCX, XLSX, PNG, JPG, ZIP) и защита от Path Traversal.

### 4.3. Ролевая модель доступа (6 Ролей)
1. **`ADMIN`** — полный доступ к платформе, финансовым отчетам, аудиту и управлению правами.
2. **`EMPLOYEE`** — операционная работа с задачами, клиентами и прикрепленными документами.
3. **`CLIENT`** — клиентский кабинет: просмотр статуса ведения учета, согласование актов, скачивание счетов.
4. **`LEARNER`** — обучающийся с доступом к назначенным курсам академии.
5. **`CURATOR`** — наставник: проверка домашних заданий, контроль прогресса студентов.
6. **`ADVISOR`** — советник/аудитор: расширенный доступ к аналитике клиентов и задачам в режиме супервизора.

### 4.4. Образовательная академия (LMS)
- **Иерархия контента:** Курс $\rightarrow$ Глава $\rightarrow$ Урок $\rightarrow$ Блоки контента (видео, структурированный текст, тесты, материалы).
- **Управление прогрессом:** Детерминированный порядок сортировки (`sort_order`), трекинг завершения уроков и выпуск сертификатов.

### 4.5. Коммуникации и Real-Time брокер
- **WebSocket STOMP чаты:** Личные и групповые диалоги в реальном времени с индикацией статуса прочтения.
- **Telegram Notifier:** Мгновенные алерты дежурным администраторам о новых заявках с лендинга, критических сбоях и назначении задач.

### 4.6. System Status & Health Hub
- **Служба автоматического мониторинга:** Периодические проверки (Health Probes) состояния PostgreSQL, SMTP-шлюза, WebSocket-брокера и хранилища.
- **90-дневная визуализация доступности:** Uptime-бары по индустриальному стандарту Atlassian Statuspage с расчетом SLA Three Nines (99.9%).

---

## 5. Безопасность и Защита от Уязвимостей (Defense-in-Depth)

1. **Защита от IDOR (Row-Level Security):**
   - Доступ к задачам, клиентам и счетам валидируется на уровне сервисного слоя через `CrmAccessService` и `InvoiceAccessService`. Прямая подмена идентификаторов в URL блокируется с возвратом `403 Forbidden`.
2. **Строгие Security Headers:**
   - `Content-Security-Policy`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https: wss:;`
   - `X-Content-Type-Options`: `nosniff` (блокировка MIME-sniffing атак).
   - `X-Frame-Options`: `DENY` (полная защита от Clickjacking).
   - `Referrer-Policy`: `strict-origin-when-cross-origin`.
   - `Permissions-Policy`: `camera=(), microphone=(), geolocation=()`.
3. **Двухфакторная аутентификация (2FA TOTP):**
   - Реализация RFC 6238 с изоляцией сессий через временный токен `two_factor_pre_auth` и блокировкой brute-force подбора кода.
4. **Неизменяемый журнал аудита (Append-Only Audit):**
   - На уровне PostgreSQL установлены триггеры, запрещающие выполнение `UPDATE` и `DELETE` операций над таблицами аудита.
   - Автоматическое маскирование персональных и чувствительных данных меткой `[PROTECTED]`.
5. **Rate Limiting (Защита от DoS и перебора):**
   - Двухуровневые фильтры на базе Bucket4j: жесткие лимиты на `/auth/**` (5 попыток в минуту) и адаптивные лимиты на бизнес-API с идентификацией по `userId` и fallback на IP.

---

## 6. Производительность и Zero-N+1 Гарантии

- **Исключение проблемы N+1 запросов:** Загрузка связанных сущностей (задачи $\leftrightarrow$ стадии $\leftrightarrow$ исполнители $\leftrightarrow$ теги $\leftrightarrow$ подзадачи) оптимизирована через директивы `@EntityGraph` и аннотации `@BatchSize(size = 25)`.
- **Сквозная пагинация:** Все списочные эндпоинты (аудит, чаты, задачи, документы) работают строго через `Pageable` с детерминированной сортировкой по индексам.
- **Singleton Refresh Token Client:** Фронтенд-клиент `http.ts` использует блокирующий синглтон промиса обновления токена, предотвращая каскадную отправку параллельных refresh-запросов при истечении access-токена.

---

## 7. Структура Репозитория

```text
JF-1C/
├── zhan-finance-backend/           # Spring Boot 3 Java приложение
│   ├── src/main/java/              # Исходный код бэкенда (модульная архитектура)
│   │   └── com/example/zhanfinancebackend/
│   │       ├── common/             # Конфигурации, фильтры, GlobalExceptionHandler
│   │       └── modules/            # Бизнес-модули: admin, auth, billing, chat,
│   │                               # courses, crm, documents, landing, notifications
│   ├── src/main/resources/         # Конфигурации и Flyway-миграции (db/migration/V1..V120)
│   └── src/test/java/              # 169 JUnit 5 + Mockito интеграционных тестов
├── zhan-finance-frontend/          # React 19 + Vite + TypeScript приложение
│   ├── src/
│   │   ├── app/                    # Корневые провайдеры, роутер, стили
│   │   ├── pages/                  # Слой страниц (Admin, Client, Employee, Advisor, Public)
│   │   ├── widgets/                # Крупные UI-блоки (TaskKanbanBoard, Sidebar, Header)
│   │   ├── features/               # Бизнес-фичи (AuthForm, SolutionPicker, ContactForm)
│   │   ├── entities/               # Доменные сущности (Task, User, Document, Invoice)
│   │   └── shared/                 # Переиспользуемые UI-компоненты, API-клиент http.ts
│   └── src/**/*.test.ts(x)         # 65 Vitest + RTL тестов
├── docs/                           # Инженерная документация (ARCHITECTURE, RUNBOOK и др.)
├── Epics/                          # План развития платформы по эпикам
├── .agents/                        # AI правила (AGENTS.md) и актуальный контекст (CONTEXT.md)
├── SYSTEM_STATUS_HEALTH_AUDIT.md   # Архитектурный проект System Status & Health Hub
├── docker-compose.yml              # Локальная инфраструктура (PostgreSQL 17)
└── README.md                       # Главная документация проекта
```

---

## 8. Быстрый Старт и Локальное Развертывание

### Системные требования
- **Java Development Kit (JDK):** Версия 17 (Eclipse Temurin / Amazon Corretto).
- **Node.js:** Версия 20.x или 22.x LTS, менеджер пакетов `npm`.
- **PostgreSQL:** Версия 17 (или Docker Desktop).

### Шаг 1. Клонирование репозитория
```bash
git clone https://github.com/MrSgemaSeny/JF-1C.git
cd JF-1C
```

### Шаг 2. Запуск локальной базы данных
```bash
docker compose up db -d
```
*База данных поднимется на порту `5432` с пользователем `postgres` и схемой `zhanfinance`.*

### Шаг 3. Запуск Backend API
```bash
cd zhan-finance-backend
./gradlew bootRun
```
- API доступно по адресу: `http://localhost:8080/api`
- Интерактивная Swagger/OpenAPI документация: `http://localhost:8080/api/swagger-ui.html`

### Шаг 4. Запуск Frontend SPA
```bash
cd ../zhan-finance-frontend
npm install
npm run dev
```
- Веб-приложение откроется по адресу: `http://localhost:5173/JF-1C/`

---

## 9. Автоматизированное Тестирование и Верификация

Проект покрыт **234 автоматическими тестами**, проверяющими безопасность, бизнес-логику и целостность интерфейса:

| Слой | Тест-раннер | Файлов | Тестов | Результат |
|---|---|---|---|---|
| **Backend** | JUnit 5 + Mockito + MockMvc | 46 классов | 169 тестов | 100% Passed (0 errors) |
| **Frontend** | Vitest + React Testing Library | 17 файлов | 65 тестов | 100% Passed (0 errors) |
| **ИТОГО** | | **63 файла** | **234 теста** | **100% GREEN** |

### Команды запуска тестов:

```bash
# Запуск полного набора тестов бэкенда:
cd zhan-finance-backend
./gradlew test

# Запуск тестов фронтенда:
cd ../zhan-finance-frontend
npm test

# Сборка продакшен-бандла фронтенда с проверкой типов:
npm run build
```

---

## 10. Продакшен-Инфраструктура и CI/CD

- **Production Frontend:** [https://mrsgemaseny.github.io/JF-1C/](https://mrsgemaseny.github.io/JF-1C/)
- **Production Backend:** `https://zhanfinance.fly.dev/api/v1`
- **Автоматизация CI/CD (`.github/workflows/`):**
  - `ci.yml` — проверка типов, запуск Vitest, сборка бандла и деплой на GitHub Pages.
  - `deploy-backend.yml` — запуск Gradle тестов, компиляция `bootJar`, сборка и деплой Docker-образа на Fly.io.
  - `db-backup.yml` — регулярное резервное копирование PostgreSQL с отправкой зашифрованных дампов и Telegram-отчетов.

---

## 11. Документация и Руководства

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — детальная архитектура подсистем, ролевые матрицы и концепция изоляции данных.
- [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — пошаговое руководство по быстрому вводу нового инженера в проект.
- [`docs/RUNBOOK.md`](docs/RUNBOOK.md) — регламент эксплуатации, устранение инцидентов и процедуры Disaster Recovery.
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) — кодстайл, правила оформления коммитов и политика неизменяемости миграций.
- [`SYSTEM_STATUS_HEALTH_AUDIT.md`](SYSTEM_STATUS_HEALTH_AUDIT.md) — спецификация и архитектурный аудит модуля System Status & Health Hub.
