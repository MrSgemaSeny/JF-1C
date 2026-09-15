# JF-1C — Полный план тестового покрытия

> Цель: довести проект до состояния "живее всех живых" — юнит, интеграционные, E2E, линт, нагрузка.
> Каждый раздел: что уже есть → что не покрыто → что писать.

---

## Текущее состояние (baseline)

| Слой | Инструмент | Кол-во тестов | Статус |
|------|-----------|--------------|--------|
| Backend unit/integration | JUnit 5 + Mockito + MockMvc | ~169 | Частично — есть дыры в контроллерах |
| Frontend unit | Vitest + RTL | 74 | Частично — покрыты только auth + kanban + shared |
| E2E live API | Node.js mjs-скрипты | 9 сьютов | Есть, но не в CI |
| E2E browser | Playwright | ~17 тестов | Есть, но не в CI |
| Load | Artillery | 3 профиля | Есть, но без SLA-gate в CI |
| Lint | — | — | **ОТСУТСТВУЕТ** |
| TypeScript strict | частично | — | Не блокирует CI |
| Coverage enforcement | JaCoCo подключён | — | Порог не выставлен |
| Kaspi/Billing | — | — | **ОТСУТСТВУЕТ** (M2-M4 IN_PROGRESS) |
| Search module | — | — | **ОТСУТСТВУЕТ** |
| Notifications scheduler | 1 тест | — | Минимальное |
| WebSocket ACL | — | — | **ОТСУТСТВУЕТ** (M3 PLANNED) |

---

## Раздел 1 — Backend: что дописать

### 1.1 Модули без тестов контроллеров (MockMvc)

Сейчас тесты контроллеров есть только у: `AuditLog`, `ContactRequest`, `AvatarDownload`.
Всё остальное — либо дымовые смоки, либо ничего.

**Написать MockMvc-тесты для:**

```
modules/auth/controller/AuthControllerTest.java
  - POST /api/v1/auth/login — 200 с валидными кредами, 401 неверный пароль,
    403 PENDING-аккаунт, 400 пустой body
  - POST /api/v1/auth/register — 201 успех, 409 дубль email, 400 невалидный phone
  - POST /api/v1/auth/refresh — 200 с валидным refresh, 401 протухший
  - POST /api/v1/auth/logout — 200, зачистка refresh token
  - POST /api/v1/auth/forgot-password — 200 (всегда, zero-enum), rate limit 429
  - POST /api/v1/auth/reset-password — 200, 400 протухший токен, 400 неверный

modules/auth/controller/TwoFactorControllerTest.java
  - GET /api/v1/auth/2fa/setup — 200 для ADMIN, 403 для EMPLOYEE
  - POST /api/v1/auth/2fa/confirm — 200 верный TOTP, 401 неверный
  - DELETE /api/v1/auth/2fa/disable — 200, 401 неверный пароль

modules/auth/controller/UserControllerTest.java
  - GET /api/v1/users/me — 200 с Bearer, 401 без токена
  - PUT /api/v1/users/me — 200 обновление профиля, 400 невалидный email
  - PUT /api/v1/users/me/password — 200, 401 неверный текущий пароль

modules/admin/controller/AdminControllerTest.java
  - GET /api/v1/admin/employees — ADMIN 200, EMPLOYEE 403
  - POST /api/v1/admin/approve/{id} — 200, 404 несуществующий, 409 уже approved
  - DELETE /api/v1/admin/users/{id} — 200, 403 EMPLOYEE, 404 несуществующий
  - PATCH /api/v1/admin/users/{id}/role — 200, 400 невалидная роль

modules/crm/controller/TaskControllerTest.java
  - POST /api/v1/crm/tasks — ADMIN/EMPLOYEE 201, CLIENT 403
  - GET /api/v1/crm/tasks — фильтрация по stage/assignee/pipeline
  - PUT /api/v1/crm/tasks/{id} — 200, ADVISOR 403 (read-only enforcement)
  - PATCH /api/v1/crm/tasks/{id}/stage — 200, невалидный stageId 400
  - PATCH /api/v1/crm/tasks/{id}/assign — 200, назначение на чужого employee 403
  - DELETE /api/v1/crm/tasks/{id} — ADMIN 200, EMPLOYEE 403
  - POST /api/v1/crm/tasks/batch — bulk update, частичный success
  - PATCH /api/v1/crm/tasks/batch/stage — 200
  - GET /api/v1/crm/tasks/{id}/history — 200, 403 CLIENT на чужой task
  - GET /api/v1/crm/tasks/pool — EMPLOYEE 200, CLIENT 403

modules/crm/controller/ClientControllerTest.java
  - POST /api/v1/crm/clients — ADMIN 201, CLIENT 403
  - GET /api/v1/crm/clients/{id} — IDOR: EMPLOYEE видит только своего клиента
  - PUT /api/v1/crm/clients/{id} — 200, ADVISOR 403
  - DELETE /api/v1/crm/clients/{id} — ADMIN 200, EMPLOYEE 403

modules/crm/controller/DashboardControllerTest.java
  - GET /api/v1/dashboard/admin — ADMIN 200, EMPLOYEE 403
  - GET /api/v1/dashboard/employee — EMPLOYEE 200, данные только своих задач
  - GET /api/v1/dashboard/client — CLIENT 200, только свои данные
  - GET /api/v1/dashboard/advisor — ADVISOR 200, все данные read-only

modules/crm/controller/PipelineControllerTest.java
  - GET /api/v1/crm/pipelines — 200 любой авторизованный
  - POST /api/v1/crm/pipelines — ADMIN 201, EMPLOYEE 403
  - PUT /api/v1/crm/pipelines/{id}/stages — 200, дублирующий порядок 400

modules/billing/controller/InvoiceControllerTest.java
  - POST /api/v1/billing/invoices — ADMIN/EMPLOYEE 201, CLIENT 403
  - GET /api/v1/billing/invoices — CLIENT видит только свои, ADMIN видит все
  - GET /api/v1/billing/invoices/{id} — IDOR: CLIENT не видит чужой invoice (403)
  - PUT /api/v1/billing/invoices/{id} — ADMIN 200, CLIENT 403
  - DELETE /api/v1/billing/invoices/{id} — ADMIN 200, 404 несуществующий
  - PATCH /api/v1/billing/invoices/{id}/status — переход ISSUED→PAID, невалидный 400

modules/billing/controller/SubscriptionControllerTest.java
  - GET /api/v1/billing/subscriptions — 200
  - POST /api/v1/billing/subscriptions — 200, перекрывающие даты 409

modules/courses/controller/AdminCourseControllerTest.java
  - POST /api/v1/admin/courses — ADMIN 201, LEARNER 403
  - GET /api/v1/admin/courses — пагинация, LEARNER 403
  - DELETE /api/v1/admin/courses/{id} — 200, каскадное удаление прогресса
  - POST /api/v1/admin/courses/{id}/chapters — 201, несуществующий курс 404
  - POST /api/v1/admin/courses/{id}/lessons — 201

modules/courses/controller/LearnerCourseControllerTest.java
  - GET /api/v1/courses — только опубликованные курсы
  - GET /api/v1/courses/{id} — структура глав и уроков
  - POST /api/v1/courses/{cId}/lessons/{lId}/complete — 200, повторный 200 (идемпотент)
  - GET /api/v1/courses/{id}/progress — 0% без completions, 100% после всех

modules/courses/controller/CuratorCourseControllerTest.java
  - GET /api/v1/curator/courses — только назначенные курсы
  - GET /api/v1/curator/students — CURATOR 200, LEARNER 403

modules/chat/controller/ChatControllerTest.java
  - GET /api/v1/chat/contacts — 200, пустой список новому юзеру
  - POST /api/v1/chat/{userId} — 200, сохранение в БД
  - GET /api/v1/chat/{userId} — история с пагинацией
  - PUT /api/v1/chat/{userId}/read — 200, unread count → 0
  - GET /api/v1/chat/unread — 0 без сообщений, N после получения

modules/documents/controller/DocumentControllerTest.java
  - POST /api/v1/documents/upload — multipart с PDF (200), с .exe (400 MIME rejection)
  - GET /api/v1/documents — EMPLOYEE видит все, CLIENT видит только свои
  - PATCH /api/v1/documents/{id}/status — 200, ADVISOR 403
  - DELETE /api/v1/documents/{id} — ADMIN 200, CLIENT 403
  - GET /api/v1/documents/{id}/download — stream response, IDOR 403

modules/search/controller/GlobalSearchControllerTest.java
  - GET /api/v1/search?q=test — 200, результаты из tasks/clients/documents
  - GET /api/v1/search?q= — 400 пустой запрос
  - GET /api/v1/search?q=тест — UTF-8 поиск
  - GET /api/v1/search — CLIENT видит только свои данные (IDOR)

modules/notifications/controller/NotificationControllerTest.java
  - GET /api/v1/notifications — 200, пагинация
  - POST /api/v1/notifications/read-all — 200, счётчик → 0
  - PATCH /api/v1/notifications/{id}/read — 200, 404 чужое уведомление

modules/crm/controller/CalendarControllerTest.java
  - POST /api/v1/calendar/events — 200, дублирующий слот 409
  - GET /api/v1/calendar/events — только свои события
  - DELETE /api/v1/calendar/events/{id} — 200, 403 чужое событие
```

### 1.2 Сервисы без тестов

```
modules/crm/service/DashboardServiceTest.java
  - getAdminDashboard() — null safety при пустых pipelines
  - getEmployeeDashboard() — только задачи assignedTo текущего employee
  - getClientDashboard() — только задачи clientId текущего client

modules/crm/service/UserLabelServiceTest.java
  - createLabel() — 200, дубль name 409
  - assignLabelToTask() — 200, несуществующий task 404
  - removeLabelFromTask() — 200

modules/crm/service/TaskService (дополнить TaskServiceIntegrationTests)
  - requestTask() @Transactional — при исключении аудит не записывается (регрессия C5)
  - batchUpdateTasks() — partial rollback при невалидном taskId в списке
  - reopenLostTask() — задача из LOST стадии уходит в первую OPEN

modules/notifications/service/DeadlineAlertSchedulerTest.java
  - sendDeadlineAlerts() — задачи со сроком через 24ч попадают в уведомления
  - не отправляет дубли если уведомление уже было отправлено

modules/notifications/service/TelegramNotifierServiceTest.java
  - sendMessage() — mockito на RestClient, проверка тела запроса
  - graceful degrade при 429 от Telegram API

modules/billing/service/PdfGeneratorServiceTest.java
  - generateInvoicePdf() — успешная генерация для валидного invoice
  - fallback при отсутствующем arial.ttf (регрессия из IDOR audit)

modules/courses/service/CertificateGeneratorServiceTest.java
  - generateCertificate() — 200 при 100% progress
  - не генерирует при progress < 100%
  - не дублирует если сертификат уже существует

modules/courses/service/LessonServiceTest.java
  - createLesson() — сортировка sortOrder
  - deleteLesson() — каскадное удаление LessonProgress

modules/auth/service/GoogleAuthServiceTest.java
  - authenticateWithGoogle() — создание нового юзера при первом входе
  - логин существующего юзера по email
  - 401 при невалидном Google token

modules/documents/service/DatabaseStorageServiceTest.java
  - store() — сохранение bytes в StoredFile
  - retrieve() — 404 при несуществующем ключе
  - path traversal protection (дополнить LocalStoragePathTraversalTest)
```

### 1.3 WebSocket ACL (M3 — сейчас PLANNED, нужны тесты перед реализацией)

```
modules/chat/WebSocketAclTest.java
  - подписка на /topic/chat/{userId} своего userId — разрешено
  - подписка на /topic/chat/{чужой userId} — SUBSCRIBE rejected
  - отправка SEND с подменённым senderId — rejected
  - подключение без Bearer токена — 401 на handshake
  - подключение с протухшим токеном — 401
```

### 1.4 Kaspi Payments (M4 — сейчас PLANNED)

```
modules/billing/kaspi/KaspiQrServiceTest.java
  - generateQrPayload() — корректный формат QR-строки
  - generateDeepLink() — валидный URL для Kaspi app

modules/billing/kaspi/KaspiWebhookControllerTest.java
  - POST /api/v1/billing/kaspi/callback — валидная подпись 200
  - невалидная подпись 403
  - дублирующий webhook (idempotency) — 200 без повторной обработки
  - успешный webhook → invoice переходит в PAID
  - успешный webhook → CRM task переходит в следующую стадию

modules/billing/kaspi/KaspiPaymentProviderTest.java
  - MockKaspiPaymentProvider возвращает success
  - timeout handling
```

### 1.5 JaCoCo — выставить порог покрытия

В `build.gradle` добавить:

```groovy
// build.gradle
jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                // Instruction coverage — ниже этого CI падает
                minimum = 0.70
            }
        }
        rule {
            element = 'CLASS'
            excludes = [
                // Исключить сгенерированный код и конфиги
                'com.example.zhanfinancebackend.modules.*.dto.*',
                'com.example.zhanfinancebackend.modules.*.entity.*',
                'com.example.zhanfinancebackend.ZhanFinanceBackendApplication',
            ]
            limit {
                counter = 'LINE'
                minimum = 0.60
            }
        }
    }
}

tasks.named('test') {
    useJUnitPlatform()
    finalizedBy jacocoTestReport
}

check.dependsOn jacocoTestCoverageVerification
```

---

## Раздел 2 — Frontend: что дописать

### 2.1 Entities — API-слой (сейчас 0 тестов)

Паттерн для всех: мокаем `apiRequest` через `vi.mock('@/shared/api/http')`, проверяем что функция вызывается с правильным URL и методом.

```
entities/task/api/taskApi.test.ts
  - getTasks(filter) вызывает GET /crm/tasks?...
  - createTask(data) вызывает POST /crm/tasks
  - updateTaskStage(id, stageId) вызывает PATCH /crm/tasks/{id}/stage
  - deleteTask(id) вызывает DELETE /crm/tasks/{id}

entities/billing/api/billingApi.test.ts
  - getInvoices() → GET /billing/invoices
  - createInvoice(data) → POST /billing/invoices
  - updateInvoiceStatus(id, status) → PATCH /billing/invoices/{id}/status

entities/client/api/clientApi.test.ts
  - getClients() → GET /crm/clients
  - createClient(data) → POST /crm/clients
  - getClient(id) → GET /crm/clients/{id}

entities/course/api/courseApi.test.ts
  - getCourses() → GET /courses (только опубликованные)
  - getCourseById(id) → GET /courses/{id}
  - completeLesson(cId, lId) → POST /courses/{cId}/lessons/{lId}/complete

entities/notification/api/notificationApi.test.ts
  - getNotifications() → GET /notifications
  - markAllRead() → POST /notifications/read-all

entities/document/api/documentApi.test.ts
  - uploadDocument(formData) → POST /documents/upload с FormData
  - downloadDocument(id) → GET /documents/{id}/download
```

### 2.2 Features — бизнес-логика (покрыта частично)

```
features/auth/authApi.test.ts
  - login(credentials) → POST /auth/login
  - register(data) → POST /auth/register
  - refreshToken() → POST /auth/refresh
  - logout() → POST /auth/logout

features/contact-form/useContactForm.test.ts
  - submit() открывает WhatsApp с правильным номером и сообщением
  - валидация: пустое name → ошибка, пустой phone → ошибка

features/notifications/NotificationContext.test.tsx
  - контекст предоставляет unreadCount
  - markAllRead() сбрасывает unreadCount в 0
  - новое уведомление увеличивает unreadCount

features/labels/api/labelsApi.test.ts
  - getLabels() → GET /crm/labels
  - createLabel(data) → POST /crm/labels
  - assignLabel(taskId, labelId) → POST /crm/tasks/{taskId}/labels/{labelId}
```

### 2.3 Widgets — UI-компоненты (покрыты только task-board)

```
widgets/chat/ChatDrawer.test.tsx
  - рендерится без крэша при пустом списке контактов
  - отображает аватар пользователя (не статичный дефолтный)
  - ввод сообщения + Enter → вызывает sendMessage
  - список сообщений скроллится вниз при новом сообщении

widgets/dashboard-shell/DashboardSidebar.test.tsx
  - ADMIN видит все пункты меню (Tasks, Clients, Billing, LMS, Audit)
  - EMPLOYEE не видит Billing и Audit
  - CLIENT не видит CRM-разделы
  - ADVISOR видит все пункты меню но с меткой read-only

widgets/dashboard-shell/NotificationBell.test.tsx
  - отображает badge с числом при unreadCount > 0
  - не отображает badge при unreadCount === 0
  - клик → открывает панель уведомлений

widgets/task-board/TaskCreateModal.test.tsx
  - форма рендерится
  - submit с пустым title → показывает ошибку
  - успешный submit → вызывает onSuccess callback

widgets/task-board/TaskRejectModal.test.tsx  (сейчас 0 тестов)
  - рендерится с текстом задачи
  - submit без причины → ошибка валидации
  - submit с причиной → вызывает onReject

widgets/search/GlobalSearch.test.tsx
  - ввод 2 символов → не отправляет запрос (debounce)
  - ввод 3+ символов → отправляет GET /search?q=...
  - результаты отображаются по категориям (tasks / clients / documents)
  - Escape → закрывает поиск
```

### 2.4 Pages — интеграционные тесты страниц (сейчас покрыты только auth + legal)

```
pages/dashboard/admin/AdminEmployeesPage.test.tsx
  - список сотрудников рендерится
  - кнопка "Одобрить" вызывает approve API
  - кнопка "Уволить" вызывает dismiss API

pages/dashboard/admin/AdminTasksPage.test.tsx
  - переключение между Kanban и Grid view
  - фильтр по стадии работает

pages/dashboard/admin/billing/AdminInvoicesPage.test.tsx
  - список инвойсов рендерится
  - фильтр по статусу (ISSUED/PAID/OVERDUE)
  - кнопка создания инвойса открывает форму

pages/dashboard/client/ClientOverviewPage.test.tsx
  - показывает задачи только текущего клиента
  - показывает инвойсы только текущего клиента

pages/dashboard/advisor/AdvisorOverviewPage.test.tsx
  - все данные отображаются в read-only режиме
  - кнопки мутации (Edit, Delete) отсутствуют

pages/dashboard/shared/settings/SettingsPage.test.tsx
  - смена пароля — форма валидируется
  - 2FA секция показывается только для ADMIN/ADVISOR

pages/dashboard/learner/LearnerCoursesPage.test.tsx
  - список курсов рендерится
  - прогресс-бар отображается корректно

pages/dashboard/learner/LearnerLessonPage.test.tsx
  - кнопка "Завершить урок" вызывает complete API
  - переход к следующему уроку после завершения
```

### 2.5 Shared — утилиты (почти пусто)

```
shared/i18n/notificationTranslator.test.ts
  - translateNotification(type, params) возвращает правильный текст на ru/kk/en/zh
  - неизвестный type → fallback строка

shared/lib/dateFormat.test.ts  (файл пустой — нужно заполнить)
  - форматирование ISO → DD.MM.YYYY
  - форматирование ISO → HH:mm
  - null/undefined → '-'

shared/i18n/taskTranslator.test.ts
  - translateTaskStatus(status) → локализованный статус
  - все значения enum покрыты (нет switch-fall-through)
```

### 2.6 Lint — сейчас отсутствует полностью

**Добавить ESLint + TypeScript strict:**

```bash
# package.json — добавить в devDependencies:
# "@typescript-eslint/eslint-plugin": "^8.x"
# "@typescript-eslint/parser": "^8.x"  
# "eslint": "^9.x"
# "eslint-plugin-react-hooks": "^5.x"
# "eslint-plugin-import": "^2.x"
```

```jsonc
// eslint.config.js (flat config)
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    }
  }
)
```

```jsonc
// tsconfig.json — включить strict mode:
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

```json
// package.json — добавить в scripts:
"lint": "eslint src --max-warnings 0",
"lint:fix": "eslint src --fix",
"typecheck": "tsc --noEmit"
```

### 2.7 Coverage enforcement

```typescript
// vite.config.ts — добавить в test:
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.ts',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov', 'html'],
    thresholds: {
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70,
    },
    exclude: [
      'src/main.tsx',
      'src/**/*.d.ts',
      'src/shared/assets/**',
      'src/shared/i18n/locales/**',
    ]
  }
}
```

```json
// package.json — добавить:
"test:coverage": "vitest run --coverage"
```

---

## Раздел 3 — E2E: что дописать и что починить

### 3.1 Новые сьюты

```
tests/e2e/rate-limit-lifecycle.mjs
  Цель: убедиться что Bucket4j не пропускает лишнего и не режет легитимного.
  
  Тесты:
  - 10 запросов за 1 мин на /auth/login с одного IP → последние отдают 429
  - после cooldown (60s) — снова 200
  - /auth/forgot-password: 3 запроса за 15 мин → 429 на 4-м
  - /auth/check-email: 5 запросов за 1 мин → 429 на 6-м
  - разные userId на одном IP — лимиты изолированы
  - Rate-Limit-Remaining header убывает корректно

tests/e2e/advisor-readonly-lifecycle.mjs
  Цель: полный сценарий ADVISOR — видит всё, не меняет ничего.

  Тесты:
  - GET /api/v1/crm/tasks — ADVISOR 200
  - PUT /api/v1/crm/tasks/{id} — ADVISOR 403
  - GET /api/v1/crm/clients — ADVISOR 200
  - POST /api/v1/crm/clients — ADVISOR 403
  - GET /api/v1/documents/all — ADVISOR 200
  - DELETE /api/v1/documents/{id} — ADVISOR 403
  - GET /api/v1/billing/invoices — ADVISOR 200
  - POST /api/v1/billing/invoices — ADVISOR 403

tests/e2e/search-lifecycle.mjs
  Цель: Global Search работает и изолирован по ролям.

  Тесты:
  - создать задачу "Тестовый отчет НДФЛ", клиента "ТестКомпани ЛТД"
  - GET /api/v1/search?q=НДФЛ → находит task
  - GET /api/v1/search?q=ТестКомпани → находит client
  - GET /api/v1/search?q=notexistent → пустой results
  - CLIENT токен: GET /api/v1/search?q=НДФЛ → не видит чужие tasks

tests/e2e/2fa-lifecycle.mjs
  Цель: 2FA flow для ADMIN.

  Тесты:
  - GET /api/v1/auth/2fa/setup → QR URI и secret
  - POST /api/v1/auth/2fa/confirm с валидным TOTP → 200, 2FA enabled
  - POST /api/v1/auth/login → требует 2FA токен (409 / pre-auth flow)
  - POST /api/v1/auth/2fa/verify с верным TOTP → финальный JWT
  - POST /api/v1/auth/2fa/verify с неверным → 401
  - DELETE /api/v1/auth/2fa/disable → 200, следующий login без 2FA
```

### 3.2 Перевести E2E в CI

Сейчас E2E-сьюты запускаются только вручную против prod. Нужен staging-профиль в CI:

```yaml
# .github/workflows/ci.yml — добавить job e2e (после backend build):
  e2e:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_DB: jf1c_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Start backend
        working-directory: ./zhan-finance-backend
        run: |
          ./gradlew bootRun &
          sleep 30
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/jf1c_test
          SPRING_DATASOURCE_USERNAME: test
          SPRING_DATASOURCE_PASSWORD: test
          JWT_SECRET: ${{ secrets.JWT_SECRET || 'test-secret-32-chars-minimum-here' }}
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
        working-directory: ./tests
      - name: Run E2E against local backend
        working-directory: ./tests
        run: node run-all-e2e.mjs
        env:
          API_BASE_URL: http://localhost:8080
          SKIP_BROWSER_TESTS: true  # Playwright требует отдельного шага
```

---

## Раздел 4 — Load Testing: Artillery

### 4.1 Что добавить к существующим сценариям

```yaml
# tests/artillery/scenarios/authenticated-crm.yml
# Цель: проверить что под нагрузкой CRM не деградирует

config:
  target: "{{ $processEnvironment.API_BASE_URL }}"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 20
      name: "Sustained load"
  defaults:
    headers:
      Authorization: "Bearer {{ $processEnvironment.ADMIN_TOKEN }}"

scenarios:
  - name: "CRM Task CRUD"
    flow:
      - post:
          url: "/api/v1/crm/tasks"
          json:
            title: "Load test task {{ $randomString() }}"
            pipelineId: 1
          capture:
            - json: "$.id"
              as: taskId
      - get:
          url: "/api/v1/crm/tasks/{{ taskId }}"
      - patch:
          url: "/api/v1/crm/tasks/{{ taskId }}/stage"
          json:
            stageId: 2
      - delete:
          url: "/api/v1/crm/tasks/{{ taskId }}"

# SLA gate — добавить в конфиг:
ensure:
  p99: 2000   # 99-й перцентиль < 2s
  p95: 1000   # 95-й перцентиль < 1s
  maxErrorRate: 1  # < 1% ошибок
```

### 4.2 Подключить SLA-gate в CI

```yaml
# В CI job добавить шаг нагрузочного теста (только на staging, не prod):
- name: Load test - public endpoints
  run: npx artillery run tests/artillery/scenarios/catalog-and-public.yml --output report.json
- name: Check SLA
  run: npx artillery report report.json --ensure
```

---

## Раздел 5 — CI/CD: что починить и дополнить

### 5.1 Текущий ci.yml — проблемы

1. **Backend-тесты отсутствуют в CI.** Сейчас `ci.yml` запускает только `npx vitest run` (фронтенд). Gradle test не вызывается нигде в пайплайне.
2. **Lint отсутствует.**
3. **TypeScript typecheck отсутствует** — `tsc && vite build` есть, но ошибки TS не блокируют если build проходит.

### 5.2 Полный ci.yml

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  # ── 1. Backend ──────────────────────────────────────────────
  backend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./zhan-finance-backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: 'gradle'
      - name: Run tests + JaCoCo
        run: ./gradlew test jacocoTestReport jacocoTestCoverageVerification
      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: jacoco-report
          path: zhan-finance-backend/build/reports/jacoco/

  # ── 2. Frontend lint + typecheck + test ─────────────────────
  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./zhan-finance-frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: ./zhan-finance-frontend/package-lock.json
      - run: npm ci
      - run: npm run lint           # ESLint — блокирует при ошибках
      - run: npm run typecheck      # tsc --noEmit — блокирует при ошибках TS
      - run: npm run test:coverage  # Vitest + coverage threshold
      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: vitest-coverage
          path: zhan-finance-frontend/coverage/

  # ── 3. Frontend build ────────────────────────────────────────
  frontend-build:
    runs-on: ubuntu-latest
    needs: frontend-test
    defaults:
      run:
        working-directory: ./zhan-finance-frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: ./zhan-finance-frontend/package-lock.json
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL || 'https://zhanfinance.fly.dev' }}
          VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: "zhanfinance"
          SENTRY_PROJECT: "javascript-react"
      - run: cp dist/index.html dist/404.html
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./zhan-finance-frontend/dist

  # ── 4. Deploy (только main) ──────────────────────────────────
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## Раздел 6 — Приоритеты выполнения

Делать в этом порядке — от максимального риска к минимальному:

### Sprint 1 — Критические дыры (1-2 дня)

1. Добавить backend-тесты в `ci.yml` (`./gradlew test`) — CI сейчас не проверяет backend.
2. Добавить ESLint в проект и `npm run lint` в CI — TypeScript `any` и мёртвый код прямо сейчас не блокируют пуш.
3. Добавить `npm run typecheck` в CI.
4. Выставить JaCoCo порог 70% — сейчас JaCoCo генерирует отчёт но не блокирует.

### Sprint 2 — Безопасность (2-3 дня)

5. `TaskControllerTest.java` — ADVISOR read-only enforcement, IDOR между employees.
6. `InvoiceControllerTest.java` — CLIENT IDOR (уже был баг C1 из аудита).
7. `DocumentControllerTest.java` — MIME spoofing rejection, path traversal.
8. `GlobalSearchControllerTest.java` — изоляция результатов по роли.
9. `WebSocketAclTest.java` — cross-user subscription rejection.

### Sprint 3 — Бизнес-логика (3-4 дня)

10. `AuthControllerTest.java` — полный flow login/register/reset/2fa.
11. `DashboardServiceTest.java` — null safety (регрессия из `NullSafetyDashboardAndBillingRegressionTest`).
12. `CrmTaskControllerTest.java` — batch operations, stage transitions.
13. `LearnerCourseControllerTest.java` — progress idempotency.
14. `ChatControllerTest.java` + `WebSocketAclTest.java`.

### Sprint 4 — Frontend (2-3 дня)

15. `widgets/chat/ChatDrawer.test.tsx` — был баг с аватаром.
16. `widgets/dashboard-shell/DashboardSidebar.test.tsx` — role-based nav.
17. `entities/*/api/*.test.ts` — API-слой (быстро пишется по шаблону).
18. `shared/i18n/notificationTranslator.test.ts`, `dateFormat.test.ts`.

### Sprint 5 — E2E и нагрузка (1-2 дня)

19. `tests/e2e/advisor-readonly-lifecycle.mjs`.
20. `tests/e2e/rate-limit-lifecycle.mjs`.
21. `tests/e2e/search-lifecycle.mjs`.
22. Перевести E2E в CI (staging-профиль).
23. SLA-gate в Artillery.

### Sprint 6 — Kaspi (параллельно с реализацией M4)

24. `KaspiQrServiceTest.java`, `KaspiWebhookControllerTest.java` — писать тесты до кода (TDD).

---

## Раздел 7 — Шаблоны для быстрого старта

### Шаблон MockMvc-теста контроллера (Backend)

```java
// src/test/java/.../modules/crm/controller/TaskControllerTest.java

@WebMvcTest(TaskController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaskService taskService;

    @MockBean
    private CrmAccessService crmAccessService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void createTask_asEmployee_returns201() throws Exception {
        TaskDto dto = new TaskDto(1L, "Test task", ...);
        when(taskService.createTask(any())).thenReturn(dto);

        mockMvc.perform(post("/api/v1/crm/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title": "Test task", "pipelineId": 1}
                """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    @WithMockUser(roles = "ADVISOR")
    void updateTask_asAdvisor_returns403() throws Exception {
        mockMvc.perform(put("/api/v1/crm/tasks/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isForbidden());
    }
}
```

### Шаблон Vitest-теста API (Frontend)

```typescript
// entities/task/api/taskApi.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTasks, createTask } from './taskApi'
import { apiRequest } from '@/shared/api/http'

vi.mock('@/shared/api/http', () => ({
  apiRequest: vi.fn()
}))

const mockApiRequest = vi.mocked(apiRequest)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('taskApi', () => {
  it('getTasks вызывает GET /crm/tasks', async () => {
    mockApiRequest.mockResolvedValue([])
    await getTasks({})
    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/crm/tasks', method: 'GET' })
    )
  })

  it('createTask вызывает POST /crm/tasks с телом', async () => {
    const data = { title: 'Test', pipelineId: 1 }
    mockApiRequest.mockResolvedValue({ id: 1, ...data })
    await createTask(data)
    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', body: data })
    )
  })
})
```

### Шаблон E2E-сьюта

```javascript
// tests/e2e/advisor-readonly-lifecycle.mjs

import { getAuthTokens } from './auth-helper.mjs'

const BASE = process.env.API_BASE_URL ?? 'https://zhanfinance.fly.dev'
let passed = 0, failed = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`  PASS  ${name}`)
    passed++
  } catch (e) {
    console.error(`  FAIL  ${name}: ${e.message}`)
    failed++
  }
}

async function assertStatus(res, expected, msg) {
  if (res.status !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${res.status}`)
  }
}

const { advisor } = await getAuthTokens()
const h = { Authorization: `Bearer ${advisor}`, 'Content-Type': 'application/json' }

console.log('\n=== ADVISOR Read-Only Lifecycle ===\n')

await test('ADVISOR GET /crm/tasks → 200', async () => {
  const res = await fetch(`${BASE}/api/v1/crm/tasks`, { headers: h })
  await assertStatus(res, 200, 'ADVISOR должен читать задачи')
})

await test('ADVISOR PUT /crm/tasks/1 → 403', async () => {
  const res = await fetch(`${BASE}/api/v1/crm/tasks/1`, {
    method: 'PUT', headers: h, body: JSON.stringify({ title: 'hack' })
  })
  await assertStatus(res, 403, 'ADVISOR не должен изменять задачи')
})

// ... остальные тесты

console.log(`\nРезультат: ${passed} PASS / ${failed} FAIL`)
if (failed > 0) process.exit(1)
```

---

## Итоговые цифры цели

| Слой | Сейчас | Цель |
|------|--------|------|
| Backend unit/integration | ~169 тестов | ~300+ тестов |
| Backend coverage | ~неизвестно (порог не выставлен) | ≥ 70% instruction |
| Frontend unit | 74 теста | ~150+ тестов |
| Frontend coverage | нет порога | ≥ 70% lines |
| E2E сьюты | 9 (вручную) | 13+ (в CI) |
| Lint | нет | ESLint strict, 0 warnings |
| TypeScript strict | нет | включён, блокирует CI |
| Load SLA gate | нет | p95 < 1s, error < 1% |
| WebSocket ACL tests | нет | покрыты |
| Kaspi tests | нет | покрыты до реализации |
