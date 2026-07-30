# Архитектура JF-1C (ZhanFinance)

Документ описывает верхнеуровневую архитектуру, модули, концепцию безопасности и организацию данных в платформе JF-1C (SaaS CRM / бухгалтерская система).

---

## 1. Стек технологий

* **Backend**: Spring Boot 3 (Java 17), PostgreSQL, Flyway, Caffeine Cache, Hibernate/JPA, Gradle.
* **Frontend**: React 19, Vite, TypeScript, Tailwind v4, Feature-Sliced Design (FSD).
* **Безопасность**: Spring Security, JWT (access + refresh token), Row-Level Access Control (`CrmAccessService`).
* **Коммуникации**: STOMP / SockJS over WebSocket.
* **Инфраструктура**: Fly.io (Backend API), GitHub Pages (Frontend SPA), GitHub Actions (CI/CD, Nightly DB Backups).

---

## 2. Архитектура бэкенда

Бэкенд организован по модульному принципу внутри пакета `com.example.zhanfinancebackend.modules`:

### Основные модули:
1. **auth**: Логин, регистрация, генерация JWT, ротация refresh-токенов, фиксация провайдеров (LOCAL, GOOGLE).
2. **crm**: Задачи (`Task`), стадии (`Stage`), пайплайны (`Pipeline`), клиенты (`Client`).
   * Доступ к задачам и клиентам изолируется через `CrmAccessService`.
3. **billing**: Инвойсы (`Invoice`), подписки (`Subscription`), финансовый учет.
4. **lms**: Обучающая платформа (`Course` -> `Chapter` -> `Lesson` -> `LessonBlock`), выдача сертификатов.
5. **documents**: Генерация официальных документов (PDF через Thymeleaf + OpenHTMLtoPDF, DOCX шаблоны).
6. **chat**: Чат в реальном времени через WebSocket (`/topic/chat/{userId}`).
7. **audit & notifications**: Журналирование действий пользователей и отправка уведомлений.

---

## 3. Ролевая модель и безопасность

Система поддерживает 5 ролей:
* `ADMIN`: Полный доступ ко всем модулям и административным функциям.
* `EMPLOYEE`: Сотрудник компании. Имеет доступ к назначенным задачам, клиентам и чатам.
* `CLIENT`: Клиент бухгалтерской фирмы. Доступ строго ограничен своими задачами, документами и инвойсами.
* `LEARNER`: Ученик LMS-платформы. Доступ к купленным курсам и урокам.
* `CURATOR`: Куратор курсов. Доступ к проверке заданий и прогрессу учеников.

### Row-Level Access Control (`CrmAccessService`)
Безопасность строится не только на `@PreAuthorize("hasRole(...)")`, но и на уровне записей. `CrmAccessService` проверяет привязку сущности к `userId` перед чтением/изменением.

---

## 4. База данных и миграции Flyway

* **Правило неизменяемости миграций**: Все миграции в `src/main/resources/db/migration/` (начиная с `V1`) являются строго неизменяемыми. Любые изменения структуры или данных добавляются строго новыми файлами (`V109__name.sql`, `V110__name.sql` и т.д.).
* **Инициализация данных**: Заполнение первичных данных (сидинг) выполняется исключительно через событие `@EventListener(ApplicationReadyEvent.class)`. Использование `@PostConstruct` для операций с БД запрещено из-за race condition с миграциями Flyway.

---

## 5. Архитектура фронтенда (FSD)

Код фронтенда организован по методологии Feature-Sliced Design:
```
src/
├── app/          # Инициализация приложения, провайдеры, роутер
├── pages/        # Страницы приложения (LoginPage, DashboardPage, TasksPage...)
├── widgets/      # Крупные самостоятельные блоки UI (TaskKanbanBoard, Header...)
├── features/     # Пользовательские сценарии (contact-form, solution-picker, auth...)
├── entities/     # Бизнес-сущности (task, client, user, course...)
└── shared/       # Переиспользуемый код (api/http, ui, lib, i18n...)
```

### Запросы и состояние:
* Все сетевые запросы используют единую обертку `apiRequest` в `@/shared/api/http`.
* Состояние CRM-данных управляется через React Query с ключами формата `['tasks', 'list', filter]`.
