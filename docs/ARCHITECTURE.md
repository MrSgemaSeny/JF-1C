# Архитектура JF-1C (ZhanFinance)

Документ описывает верхнеуровневую архитектуру, модули, концепцию безопасности и организацию данных в платформе JF-1C (SaaS CRM / бухгалтерская система).

---

## 1. Стек технологий

* **Backend**: Spring Boot 3.4+ (Java 17), PostgreSQL 17, Flyway, Caffeine Cache, Hibernate/JPA, Gradle.
* **Frontend**: React 19, Vite, TypeScript, Tailwind v4, Feature-Sliced Design (FSD).
* **Безопасность**: Spring Security 6, JWT (access + refresh token с ротацией), Row-Level Access Control (`CrmAccessService`), 2FA (TOTP) для админов и эдвайзеров.
* **Обсервабилити**: Micrometer OTLP Metrics, UptimeRobot, Prometheus.
* **Коммуникации**: STOMP / SockJS over WebSocket (авторизованные топики `/topic/chat/{userId}`).
* **Инфраструктура**: Fly.io (Backend API), GitHub Pages (Frontend SPA), GitHub Actions (CI/CD, Nightly DB Backups в Telegram).

---

## 2. Архитектура бэкенда

Бэкенд организован по модульному принципу внутри пакета `com.example.zhanfinancebackend.modules`.
Все API запросы роутятся через `context-path=/api` и версионированы как `/v1/**` (итоговые пути `/api/v1/...`).

### Основные модули:
1. **auth**: Логин, регистрация (со статусами PENDING/APPROVED/REJECTED), генерация JWT, ротация refresh-токенов, 2FA, rate-limiting фильтры.
2. **crm**: Задачи (`Task`), стадии (`Stage`), пайплайны (`Pipeline`), клиенты (`Client`). Единый Task Pool с логикой автоматического переоткрытия.
3. **billing**: Инвойсы (`Invoice`), подписки (`Subscription`), финансовый учет.
4. **lms**: Обучающая платформа (`Course` -> `Chapter` -> `Lesson` -> `LessonBlock`), квизы, выдача сертификатов.
5. **documents**: Генерация официальных документов (PDF через Thymeleaf + OpenHTMLtoPDF), строгая фильтрация файлов по MIME/расширениям.
6. **chat**: Чат в реальном времени через WebSocket.
7. **audit & notifications**: Журналирование действий (с защитой от изменения/удаления) и отправка email/telegram уведомлений.

---

## 3. Ролевая модель и безопасность

Система поддерживает 6 ролей:
* `ADMIN`: Полный доступ ко всем модулям и административным функциям.
* `EMPLOYEE`: Сотрудник компании. Имеет доступ к назначенным задачам, клиентам и чатам.
* `ADVISOR`: Расширенный сотрудник. Может просматривать задачи всех клиентов и аналитику (в рамках своего доступа).
* `CLIENT`: Клиент бухгалтерской фирмы. Доступ строго ограничен своими задачами, документами и инвойсами.
* `LEARNER`: Ученик LMS-платформы. Доступ к купленным курсам и урокам.
* `CURATOR`: Куратор курсов. Доступ к проверке заданий и прогрессу учеников.

### Row-Level Access Control (`CrmAccessService`)
Безопасность строится не только на `@PreAuthorize("hasRole(...)")`, но и на уровне записей. `CrmAccessService` проверяет привязку сущности к `userId` перед чтением/изменением, предотвращая IDOR-уязвимости даже при пакетных (batch) операциях.

---

## 4. База данных и миграции Flyway

* **Правило неизменяемости миграций**: Все миграции в `src/main/resources/db/migration/` (от `V1` до `V110+`) являются строго неизменяемыми. Изменение примененных скриптов ломает чексуммы и деплой.
* **Инициализация данных**: Заполнение первичных данных (сидинг) выполняется исключительно через событие `@EventListener(ApplicationReadyEvent.class)`. Использование `@PostConstruct` для операций с БД строго запрещено.
* **Защита аудита**: В PostgreSQL созданы триггеры, запрещающие выполнение `UPDATE` и `DELETE` запросов на таблицы аудита.

---

## 5. Архитектура фронтенда (FSD)

Код фронтенда организован по методологии Feature-Sliced Design:
```text
src/
├── app/          # Инициализация приложения, провайдеры, роутер
├── pages/        # Страницы приложения (LoginPage, DashboardPage, AdminEmployeesPage...)
├── widgets/      # Крупные самостоятельные блоки UI (TaskKanbanBoard, DocumentViewer...)
├── features/     # Пользовательские сценарии (contact-form, 2fa-setup, auth...)
├── entities/     # Бизнес-сущности (task, client, user, course...)
└── shared/       # Переиспользуемый код (api/http, ui, lib, i18n...)
```

### Запросы и состояние:
* Все сетевые запросы используют единую обертку `apiRequest` в `@/shared/api/http`.
* Состояние данных управляется через TanStack React Query с жесткой структурой ключей `['tasks', 'list', filter]`.
