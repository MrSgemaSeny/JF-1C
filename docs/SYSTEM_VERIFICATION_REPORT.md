### Архитектура и структура созданных E2E-сьютов

1. **Централизованный модуль аутентификации (`tests/e2e/auth-helper.mjs`)**:
   - Автоматически провижинит 4 роли: `ADMIN`, `EMPLOYEE` (с авто-подтверждением администратором), `CLIENT` и `LEARNER` (создание через `POST /v1/admin/learners`).
   - Реализует дисковое кеширование токенов с проверкой валидности через `GET /v1/users/me`, что устраняет лишние запросы на авторизацию и предотвращает исчерпание лимитов `Bucket4j` (10 req/min) при повторных запусках.
   - Содержит автоматический retry-backoff при получении HTTP 429.

2. **CRM Tasks & Pipeline Lifecycle (`tests/e2e/crm-lifecycle-live.mjs`) — 12/12 PASS (100%)**:
   - Опрос пайплайнов и верификация дефолтного пайплайна со стадиями.
   - Создание задачи администратором (`POST /v1/crm/tasks`).
   - Получение деталей задачи (`GET /v1/crm/tasks/{id}`).
   - Мутация задачи (`PUT /v1/crm/tasks/{id}`).
   - Перевод задачи на следующую стадию воронки (`PATCH /v1/crm/tasks/{id}/stage`).
   - Назначение ответственного сотрудника (`PATCH /v1/crm/tasks/{id}/assign`).
   - Создание комментария администратором (`POST /v1/crm/tasks/{id}/comments`).
   - Получение и проверка комментария сотрудником (`GET /v1/crm/tasks/{id}/comments`).
   - Проверка истории активности и аудита задачи (`GET /v1/crm/tasks/{id}/history`).
   - Удаление задачи (`DELETE /v1/crm/tasks/{id}`) и валидация статуса 404 при повторном запросе.

3. **LMS Courses & Learner Progression Lifecycle (`tests/e2e/lms-lifecycle-live.mjs`) — 11/11 PASS (100%)**:
   - Создание курса администратором (`POST /v1/admin/courses`).
   - Создание главы курса (`POST /v1/admin/courses/{id}/chapters`).
   - Добавление урока типа `DOCUMENT` (`POST /v1/admin/courses/{id}/lessons`).
   - Публикация курса (`PUT /v1/admin/courses/{id}?isPublished=true`).
   - Обнаружение курса обучающимся в публичном каталоге (`GET /v1/courses`).
   - Получение структуры курса и уроков обучающимся (`GET /v1/courses/{id}`).
   - Завершение урока студентом (`POST /v1/courses/{courseId}/lessons/{lessonId}/complete`).
   - Верификация сохранения прогресса обучения (`GET /v1/courses/{courseId}/progress`).
   - Снятие курса с публикации (`PUT /v1/admin/courses/{id}?isPublished=false`).
   - Проверка скрытия снятого с публикации курса из каталога для студентов.
   - Удаление независимого тестового курса администратором (`DELETE /v1/admin/courses/{id}`).

4. **Chat & Real-Time Notifications Lifecycle (`tests/e2e/chat-notifications-live.mjs`) — 8/8 PASS (100%)**:
   - Запрос списка уведомлений (`GET /v1/notifications`).
   - Массовая отметка всех уведомлений прочитанными (`POST /v1/notifications/read-all`).
   - Получение списка доступных чат-контактов (`GET /v1/chat/contacts`).
   - Отправка прямого сообщения от администратора сотруднику (`POST /v1/chat/{empId}`).
   - Фиксация увеличения счетчика непрочитанных сообщений у сотрудника (`GET /v1/chat/unread`).
   - Чтение истории переписки сотрудником (`GET /v1/chat/{adminId}`).
   - Отметка диалога как прочитанного (`PUT /v1/chat/{adminId}/read`).
   - Верификация сброса счетчика непрочитанных сообщений в 0.

5. **Documents Management & Global Search Lifecycle (`tests/e2e/documents-search-live.mjs`) — 9/9 PASS (100%)**:
   - Запрос системных шаблонов документов (`GET /v1/document-templates`).
   - Загрузка PDF-документа для клиента через multipart/form-data (`POST /v1/documents/upload`).
   - Верификация появления документа в общем реестре (`GET /v1/documents/all`).
   - Перевод статуса документа в `REVIEW` (`PATCH /v1/documents/{id}/status?status=REVIEW`).
   - Получение документа клиентом в личном кабинете (`GET /v1/documents`).
   - Потоковое скачивание бинарного файла (`GET /v1/documents/{id}/download`) с валидацией содержимого.
   - Глобальный поиск по ключевым словам файла (`GET /v1/search?q=...`).
   - Удаление документа администратором (`DELETE /v1/documents/{id}`).
   - Валидация недоступности удаленного документа (404/403).

6. **Billing & Invoices Lifecycle (`tests/e2e/billing-invoices-live.mjs`) — 5/5 PASS (100%)**:
   - Выставление инвойса клиенту со статусом `ISSUED` (`POST /v1/billing/invoices`).
   - Получение списка счетов клиентом (`GET /v1/billing/invoices`).
   - Корректировка суммы и перевод инвойса в статус `PAID` (`PUT /v1/billing/invoices/{id}`).
   - Удаление счета администратором (`DELETE /v1/billing/invoices/{id}`).
   - Верификация исключения удаленного счета из реестра.

7. **Мастер-раннер E2E-тестирования (`tests/run-all-e2e.mjs`)**:
   - Запускает все 9 уровней проверки:
     - 1. Backend API Boundaries & Security Headers
     - 2. Browser Public Pages E2E (Playwright Chrome)
     - 3. Browser Authenticated User Journeys (Playwright Chrome: Admin, Employee, Client)
     - 4. RBAC & IDOR Security Audit Suite
     - 5. CRM Pipeline & Tasks Full Lifecycle
     - 6. LMS Courses & Learner Progression Full Lifecycle
     - 7. Chat & Real-Time Notifications Full Lifecycle
     - 8. Documents Management & Global Search Full Lifecycle
     - 9. Billing & Invoices Full Lifecycle

---

### Архитектурные выводы и выявленные нюансы живой системы

1. **Hibernate Cascade & Generated Identity**:
   - В `CourseService.createChapter` добавление сущности в коллекцию родителя `course.getChapters().add(chapter)` возвращает DTO с `id == null`, если транзакция еще не закоммичена. В методе `createLesson` вызов `chapterRepository.save(chapter)` решает эту проблему.
2. **Строгая валидация Enums в Spring Boot**:
   - Перечисление `LessonType` поддерживает значения `VIDEO`, `PRESENTATION`, `DOCUMENT`.
   - Перечисление `InvoiceStatus` поддерживает `DRAFT`, `ISSUED`, `PAID`, `OVERDUE`, `CANCELED`.
   - Несоответствие вызывает `InvalidFormatException` (HTTP 500) на уровне Jackson до входа в сервис.
3. **Целостность данных PostgreSQL (Foreign Keys в LMS)**:
   - Удаление курса, по которому зафиксирован прогресс студентов, блокируется ограничением внешнего ключа `fk_enrollments_course_id`. Это подтверждает корректность реляционной целостности СУБД (нельзя удалить курс, оставив сиротские записи прогресса). Рекомендуется использовать мягкую деактивацию (`isPublished = false`).

---

### Синхронизация и статус репозиториев

- **JF-1C**: Зафиксировано и отправлено в `main` (коммит `a4d6703`). Добавлены все 5 сьютов жизненного цикла, централизованный `auth-helper.mjs`, мастер-раннер `run-all-e2e.mjs`, обновлен `CONTEXT.md` и `.gitignore`.
- **Second Brain**: Зафиксировано и отправлено в `main` (коммит `14f456b`). Дополнен журнал `journal/2026-09-08/jf-1c.md` (раздел 11) и актуализирован статус проекта в `projects/jf-1c/_status.md`.