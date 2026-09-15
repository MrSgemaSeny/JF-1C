Да. И здесь я сразу **исправляю важный момент из первой части**: я неверно интерпретировал упоминание tenant isolation как признак SaaS/multi-tenant архитектуры.

## Зафиксировал: JF-1C — НЕ MULTI-TENANT

В рамках этого аудита считаем архитектурный контекст таким:

> **JF-1C — внутренняя информационная система одной конкретной финансовой/бухгалтерской компании.**

То есть:

```text
                    JF-1C
                      │
             ОДНА КОМПАНИЯ
                      │
       ┌──────────────┼──────────────┐
       │              │              │
   Employees       Clients        Management
       │              │
       └────── Tasks / Documents ───┘
                      │
                  Billing
                      │
                    Audit
```

А **не**:

```text
Platform
├── Company A
├── Company B
├── Company C
└── Company D
```

Поэтому из дальнейшего аудита я **убираю multi-tenancy как обязательное требование**. `tenant_id`, PostgreSQL RLS, tenant isolation и прочее не должны считаться недостающими production-фичами. Для вашей задачи это был бы лишний architectural overhead.

Это существенно меняет оценку: часть критики из первой части про multi-tenancy была **не применима к реальной цели JF-1C**. В исходном аудите это было отмечено как зона, которую стоило бы проверять, но теперь её следует трактовать именно как ошибочную предпосылку. 

---

# ЧАСТЬ II — BRUTAL CODE / ARCHITECTURE AUDIT

Вторая часть должна быть гораздо жёстче первой.

Первая часть отвечала:

> **«Насколько хорошо спроектирована система?»**

Теперь вопрос другой:

> **«Где конкретно система может сломаться, где архитектура может деградировать и что реально необходимо исправлять?»**

При этом я не буду выдавать предположение за найденный баг. В исходном аудите прямо отмечено ограничение: без полного line-by-line анализа всего исходного дерева нельзя честно заявлять отсутствие SQL injection, IDOR во всех endpoint'ах и т. п. 

---

# 1. НОВАЯ АРХИТЕКТУРНАЯ ОЦЕНКА

После уточнения назначения я бы оценивал систему так:

| Область               |      Оценка |
| --------------------- | ----------: |
| Архитектура           |    **9/10** |
| Backend               |  **8.5/10** |
| Frontend              |    **8/10** |
| Security              |    **8/10** |
| RBAC                  |  **8.5/10** |
| Database              |    **8/10** |
| Testing               |  **7.5/10** |
| CI/CD                 |    **8/10** |
| DevOps                |    **7/10** |
| Observability         |    **7/10** |
| Documentation         |    **7/10** |
| Business architecture |    **9/10** |
| Production readiness  |  **7.5/10** |
| Maintainability       |    **8/10** |
| Scalability           |    **8/10** |
| **Итог**              | **~8.1/10** |

Почему выросло?

Потому что:

> **JF-1C не обязан решать проблему изоляции нескольких организаций.**

Это внутренняя система одной компании.

И для такого сценария **modular monolith — практически идеальная архитектурная стратегия**.

В первой части именно modular monolith был назван одной из сильнейших сторон проекта. 

---

# 2. ГЛАВНЫЙ ВОПРОС: А НЕ ПЕРЕАРХИТЕКТУРИЛИ ЛИ ВЫ?

Вот здесь интересный момент.

Проект уже содержит:

```text
Auth
CRM
Tasks
Task Pool
Documents
Billing
Subscriptions
LMS
Chat
Notifications
Audit
Search
Admin
Landing
```

Это очень много.

Но я **не считаю это автоматически плохим**.

Потому что эти модули соответствуют одной организации и могут работать внутри одного business workflow:

```text
Клиент
   ↓
CRM
   ↓
Задачи
   ↓
Сотрудник
   ↓
Документы
   ↓
Счёт
   ↓
Оплата
   ↓
Аудит
```

И это как раз одна из самых сильных идей JF-1C. В предыдущем аудите этот workflow был выделен как потенциальное product moat. 

Поэтому:

### ❌ Не надо делать

```text
crm-service
task-service
billing-service
document-service
chat-service
```

### ✅ Надо оставить

```text
JF-1C
└── Modular Monolith
    ├── auth
    ├── crm
    ├── task
    ├── documents
    ├── billing
    ├── courses
    ├── chat
    └── notifications
```

Я бы **не переписывал архитектуру**.

---

# 3. НО MODULAR MONOLITH ДОЛЖЕН ОСТАВАТЬСЯ MODULAR

Вот это уже серьёзный риск.

Сегодня:

```text
billing
crm
documents
auth
```

логически разделены.

Через год может получиться:

```text
BillingService
   ↓
CrmService
   ↓
TaskService
   ↓
DocumentService
   ↓
CommonService
   ↓
AuthService
```

И формально у вас всё ещё будет:

> modular monolith

а фактически:

> **distributed spaghetti внутри одного JVM.**

В предыдущем аудите этот риск уже был выделен отдельно. 

### Что я бы сделал

**ArchUnit.**

Например:

```text
auth
  ↓
не может импортировать
crm.internal

billing
  ↓
не может напрямую обращаться
crm.repository

documents
  ↓
работает через
public application API
```

Разрешённые точки связи:

```text
Module API
Domain Event
Shared infrastructure
```

---

# 4. `common/` — ВОТ ЗДЕСЬ Я БЫ СЛЕДИЛ ОСОБЕННО ЖЁСТКО

Одна из самых опасных папок в modular monolith:

```text
common/
```

Потому что она очень быстро становится:

```text
common/
├── User
├── Client
├── Task
├── Invoice
├── Whatever
├── Helper
├── Utils
└── SomeRandomService
```

И через полгода:

```text
всё зависит от common
```

Это архитектурная смерть.

В аудите этот риск также был отдельно отмечен. 

### Нормальный `common`

```text
common/
├── config
├── exception
├── security
├── infrastructure
└── shared primitives
```

### Ненормальный

```text
common/
└── бизнес-логика всех модулей
```

---

# 5. AUTH — ОДНА ИЗ САМЫХ КРИТИЧНЫХ ЗОН

У вас достаточно серьёзная auth-система:

```text
JWT
+
Refresh Token
+
Rotation
+
2FA
+
Password Reset
+
Google OAuth
+
RBAC
+
Rate Limiting
```

Это уже далеко не учебный login.

В первой части я оценил authentication примерно на **8.5/10**. 

Но сложность сама становится риском.

---

# 6. REFRESH TOKEN — ПРОВЕРИТЬ НЕ ПРОСТО «РАБОТАЕТ»

Нужна гарантия:

```text
refresh token
     ↓
rotation
     ↓
old token invalid
     ↓
new token valid
```

А теперь race:

```text
Browser
 │
 ├── Request A → 401
 │
 └── Request B → 401
       │
       ├── refresh
       └── refresh
```

Если оба refresh происходят независимо, можно сломать rotation chain.

Хорошо, что frontend уже предусматривает singleton refresh promise. Это было отмечено как сильная деталь реализации. 

Но backend всё равно должен быть устойчивым к:

```text
double refresh
stolen refresh token
replay
concurrent refresh
logout
password change
session revocation
```

---

# 7. PASSWORD RESET

Здесь нельзя ограничиваться:

```text
token = UUID
```

Нужна модель:

```text
raw token
     ↓
hash
     ↓
DB
```

и:

```text
expires_at
used_at
user_id
```

Требования:

* одноразовость;
* expiration;
* rate limit;
* отсутствие email enumeration;
* invalidation старых sessions;
* невозможность повторного использования.

В проекте secure password reset уже выделен отдельным изменением, а test plan предусматривает zero-enumeration flow. Это плюс. 

---

# 8. 2FA

TOTP — правильный выбор.

Но production-модель должна включать:

```text
2FA secret
backup codes
recovery
rate limit
audit
session invalidation
```

Особенно:

```text
ADMIN
```

Я бы сделал:

> **ADMIN → mandatory 2FA**

а не:

> ADMIN → optional 2FA.

Это особенно важно именно потому, что JF-1C — внутренняя система одной финансовой компании.



---

# 9. RBAC — ХОРОШО

Ваши роли:

```text
ADMIN
EMPLOYEE
CLIENT
LEARNER
CURATOR
ADVISOR
```

имеют понятный бизнес-смысл.

Особенно хорошо, что ADVISOR должен быть read-only.

Но я бы не позволил бизнес-правилам расползаться по коду:

```java
if (user.getRole() == ADMIN) ...
if (user.getRole() == ADVISOR) ...
if (...)
```

в каждом сервисе.

Нужен единый access layer.

Например концептуально:

```text
AccessService

canRead()
canCreate()
canUpdate()
canDelete()
canApprove()
canAssign()
```

И resource ownership должен определяться централизованно.

Это особенно важно из-за большого количества сущностей. 

---

# 10. IDOR — ГЛАВНЫЙ SECURITY RISK

Не потому что я утверждаю, что IDOR у вас сейчас есть.

А потому что архитектура создаёт **огромное количество мест, где он может появиться**.

Например:

```http
GET /api/v1/clients/123
GET /api/v1/tasks/123
GET /api/v1/documents/123
GET /api/v1/invoices/123
GET /api/v1/courses/123
```

Нельзя делать:

```java
repository.findById(id)
```

и считать, что authorization закончена.

Должно быть концептуально:

```text
resource
+
current user
+
permission
```

Проект уже исправлял invoice IDOR и имеет E2E-направление для таких проверок — это большой плюс. 

---

# 11. BATCH ENDPOINTS — ОСОБЕННО ОПАСНЫ

Например:

```http
PATCH /tasks/batch
```

с:

```json
[
  101,
  102,
  103,
  104
]
```

Проблемный сценарий:

```text
101 → мой
102 → мой
103 → чужой
104 → мой
```

Что должно произойти?

### Вариант A

```text
всё rollback
```

### Вариант B

```text
101 success
102 success
103 forbidden
104 success
```

Но это должно быть **явно определено**.

В предыдущем аудите batch endpoints были отдельно отмечены как зона повышенного риска. 

Для финансовой/операционной системы я предпочёл бы:

> **all-or-nothing**, если операция логически единая.

---

# 12. CONCURRENCY

Вот это я считаю более важным, чем многие UI-фичи.

Представьте:

```text
Task #100
status = OPEN
```

Два сотрудника:

```text
Employee A ──┐
              ├── PICK
Employee B ──┘
```

Если нет concurrency control:

```text
A → получил
B → тоже получил
```

Нужна гарантия:

```text
только один winner
```

Варианты:

```text
@Version
```

или:

```sql
UPDATE task
SET assigned_to = ?
WHERE id = ?
AND status = 'OPEN';
```

или:

```sql
SELECT ... FOR UPDATE
```

В аудите этот класс race conditions отдельно выделен для задач, invoice, subscriptions, counters и refresh tokens. 

---

# 13. TASK POOL — ОДНА ИЗ САМЫХ ИНТЕРЕСНЫХ ЧАСТЕЙ

Я бы здесь вообще поставил:

**9/10 по бизнес-идее.**

Потому что:

```text
Task
 ↓
Pool
 ↓
Employee
 ↓
Pick
 ↓
Work
 ↓
Review
 ↓
Done
```

это уже не CRUD.

Это workflow.

А workflow должен иметь формальную state machine.

---

# 14. TASK STATE MACHINE

Я бы не позволял делать:

```text
task.setStatus(...)
```

из разных мест системы.

Вместо этого:

```text
TaskStateMachine
```

Например:

```text
OPEN
 ↓
IN_PROGRESS
 ↓
REVIEW
 ↓
DONE
```

и:

```text
REVIEW
 ↓
REJECTED
 ↓
IN_PROGRESS
```

Каждый transition:

```text
current state
+
actor
+
action
=
next state
```

Например:

```text
CLIENT
cannot
OPEN → DONE
```

но:

```text
EMPLOYEE
can
IN_PROGRESS → REVIEW
```

---

# 15. AUTO-REOPEN — ПРАВИЛЬНО, НО ОПАСНО

Сценарий:

```text
DONE
 ↓
CLIENT rejects
 ↓
OPEN
```

очень хороший.

Но такие автоматические переходы надо обязательно писать в audit:

```text
actor = CLIENT
action = TASK_REJECTED
previous = DONE
new = OPEN
reason = ...
```

Иначе через полгода никто не поймёт:

> почему задача внезапно снова стала OPEN.

---

# 16. BILLING — ЗДЕСЬ Я БЫ БЫЛ БЕЗЖАЛОСТНЫМ

Текущий lifecycle:

```text
DRAFT
ISSUED
PAID
OVERDUE
CANCELED
```

сам по себе нормальный. 

Но финансовая сущность должна быть **намного более строгой**, чем обычная CRUD entity.

---

# 17. PAID INVOICE НЕ ДОЛЖЕН ВЕДУЩИМ ОБРАЗОМ РЕДАКТИРОВАТЬСЯ

Вот это важнейшее замечание второй части.

Если:

```text
Invoice #100
amount = 100 000
status = PAID
```

то:

```text
PUT /invoice/100

amount = 50 000
```

не должен просто изменить запись.

Потому что тогда история становится:

```text
вчера:
100 000

сегодня:
50 000

аудит:
???
```

В нормальной финансовой модели:

```text
PAID
 ↓
IMMUTABLE
```

Коррекция:

```text
credit note
replacement invoice
adjustment
```

а не:

```sql
UPDATE invoice
SET amount = ...
```

Это было выделено в исходном аудите как один из главных business-security gaps. 

---

# 18. INVOICE НУЖЕН БОЛЕЕ БОГАТЫЙ DOMAIN MODEL

Сейчас модель типа:

```text
Invoice
 └── amount
```

со временем станет слишком примитивной.

Лучше:

```text
Invoice
├── number
├── client
├── currency
├── status
├── subtotal
├── tax
├── total
│
└── lines[]
      ├── description
      ├── quantity
      ├── unitPrice
      ├── taxRate
      └── amount
```

Иначе очень быстро начнутся проблемы с:

```text
VAT
discount
multiple services
tax
rounding
```

Это уже было отдельно отмечено в аудите. 

---

# 19. MONEY

Здесь правило железное:

```text
BigDecimal
```

а не:

```text
double
float
```

И в PostgreSQL:

```text
NUMERIC
```

с заранее определённой precision/scale.

Плюс:

```text
currency
```

должна быть частью модели.

Даже если сейчас:

```text
KZT
```

---

# 20. PAYMENT — САМАЯ ВАЖНАЯ БУДУЩАЯ ЧАСТЬ

Когда появится Kaspi/WebKassa, система должна перейти от:

```text
Invoice
```

к:

```text
Invoice
 ↓
Payment
 ↓
Provider
 ↓
Webhook
 ↓
Reconciliation
```

Нельзя строить:

```text
Kaspi webhook
 ↓
set invoice PAID
```

без idempotency.

---

# 21. IDEMPOTENCY

Обязательно:

```text
provider_transaction_id UNIQUE
```

и желательно:

```text
idempotency_key
```

Сценарий:

```text
Webhook #1
→ PAID

Webhook #2
→ no-op

Webhook #3
→ no-op
```

а не:

```text
payment
payment
payment
```

В аудите именно idempotency была указана как обязательная часть будущей payment architecture. 

---

# 22. DOCUMENT HUB

Документы — сильная часть проекта.

Но здесь есть две разные вещи:

```text
metadata
```

и:

```text
binary data
```

Я бы архитектурно разделил их.

### PostgreSQL

```text
document
├── id
├── name
├── mime
├── size
├── checksum
├── created_by
└── storage_key
```

### Object Storage

```text
actual file bytes
```

Сейчас комбинация PostgreSQL BLOB + filesystem fallback годится для MVP, но при росте будет становиться тяжёлой. 

---

# 23. DOCUMENT VERSIONING

Для внутренней финансовой системы это особенно полезно.

Не:

```text
contract.pdf
```

который просто перезаписывается.

А:

```text
Contract
 ├── v1
 ├── v2
 └── v3
```

с:

```text
version
checksum
created_by
created_at
```

Тогда можно доказать:

> какой документ существовал на момент операции.

---

# 24. FILE SECURITY

Уже есть хорошие вещи:

```text
MIME whitelist
Apache Tika
path traversal protection
limits
```

Это хороший фундамент.

Но если клиент может загружать документы, я бы добавил:

```text
magic bytes
↓
quarantine
↓
antivirus
↓
approved
```

и только потом:

```text
available
```

Плюс защита от:

```text
ZIP bomb
archive bomb
oversized PDF
malicious filename
```

---

# 25. AUDIT LOG — ОЧЕНЬ СИЛЬНАЯ ЧАСТЬ

Здесь JF-1C реально выделяется.

Если audit table защищён DB trigger'ами от:

```text
UPDATE
DELETE
TRUNCATE
```

это намного серьёзнее обычного:

```java
auditRepository.save(...)
```

потому что приложение само не может просто изменить историю. 

Я бы дал:

> **Audit architecture: 9/10**

---

# 26. НО AUDIT ДОЛЖЕН ОТВЕЧАТЬ НА ВОПРОС «КТО, ЧТО, КОГДА И ПОЧЕМУ»

Хорошая модель:

```text
event_id
timestamp
actor_id
action
resource_type
resource_id
before
after
request_id
trace_id
IP
user_agent
```

И особенно:

```text
reason
```

для чувствительных операций.

Например:

```text
Invoice cancelled
actor: employee #52
reason: client request
```

---

# 27. SOFT DELETE

Для обычного CRUD:

```text
DELETE
```

нормально.

Для:

```text
Invoice
Document
Client
Task
```

я бы часто предпочёл:

```text
deleted_at
deleted_by
delete_reason
```

Особенно invoice.

А для audit:

> **никакого delete вообще.**

Это уже отмечалось в первой части аудита. 

---

# 28. DATABASE — СИЛЬНАЯ, НО НУЖНА ЖЁСТКАЯ DISCIPLINE

Ваш стек:

```text
PostgreSQL
+
JPA
+
Flyway
```

очень хороший.

Но у вас уже был реальный migration incident вокруг V117/checksum. Это значит, что проблема не теоретическая. 

Главное правило:

> **Applied migration нельзя переписывать.**

Если:

```text
V117
```

уже применён:

```text
V118
```

исправляет его последствия.

Не:

```text
изменить V117
```

---

# 29. POSTGRES 15 VS 17

Это уже конкретный configuration drift:

```text
README → PostgreSQL 17
Compose → PostgreSQL 15
```

Это необходимо синхронизировать.

В аудите это было отмечено как реальная проблема environment parity. 

---

# 30. REDIS

С Redis я бы сейчас сделал очень простой вывод:

### Если не нужен:

```text
DELETE FROM architecture
```

то есть:

> убрать его из Compose.

### Если нужен:

использовать реально:

```text
Redis
├── distributed rate limit
├── cache
└── distributed locks
```

Особенно полезно это может стать для scheduler/rate limiting.

В текущем состоянии наличие Redis выглядит недостаточно обоснованным. 

---

# 31. SCHEDULER

Если сейчас:

```text
Spring scheduler
```

и одна backend instance:

```text
✓
```

Но если будет:

```text
backend × 3
```

то:

```text
scheduler A
scheduler B
scheduler C
```

могут одновременно отправить одно уведомление.

Нужен:

```text
distributed lock
```

или отдельный job mechanism.

---

# 32. OUTBOX — Я БЫ ДОБАВИЛ

Это одна из самых полезных будущих архитектурных доработок.

Сейчас потенциально:

```text
DB transaction
 ↓
send email
 ↓
Telegram
 ↓
WebSocket
```

Плохо.

Лучше:

```text
DB transaction
 ├── business change
 └── outbox event
        ↓
      COMMIT
        ↓
      worker
        ├── Email
        ├── Telegram
        └── WebSocket
```

Если Telegram умер:

```text
business transaction ≠ rollback
```

Это сильно повышает надёжность.

---

# 33. FRONTEND

React 19 + TypeScript + Vite + FSD + TanStack Query — хороший фундамент.

Особенно правильное решение:

> server state не дублировать в Redux.

TanStack Query для этого подходит хорошо. 

---

# 34. ZOD

Zod тоже хороший выбор.

Но есть опасность:

```text
Java DTO
+
TypeScript interface
+
Zod schema
```

три разных источника истины.

Получаем:

```text
Backend says:
status = PAID

Frontend says:
status = PAYMENT_COMPLETED
```

и начинается цирк.

---

# 35. OPENAPI → TYPESCRIPT

Вот это я бы реально внедрил.

```text
Spring OpenAPI
       ↓
generated TypeScript
       ↓
TanStack Query
       ↓
React
```

Тогда backend изменил:

```text
InvoiceStatus
```

и frontend сразу перестал компилироваться.

Это намного лучше ручной синхронизации. 

---

# 36. ERROR CONTRACT

Нужен единый формат:

```json
{
  "timestamp": "...",
  "status": 403,
  "code": "ACCESS_DENIED",
  "message": "...",
  "path": "...",
  "traceId": "..."
}
```

Чтобы frontend никогда не угадывал:

```text
что именно пришло с backend.
```

Особенно:

```text
400
401
403
404
409
422
429
500
```

В аудите отдельно отмечалась необходимость единого error contract. 

---

# 37. ENUM → 500 — ЭТО РЕАЛЬНЫЙ API QUALITY BUG

Например:

```json
{
  "status": "SUPER_PAID"
}
```

Если Jackson падает:

```text
InvalidFormatException
```

нельзя выдавать:

```http
500 Internal Server Error
```

Потому что сервер работает.

Клиент прислал неправильное значение.

Должно быть:

```http
400 Bad Request
```

или, если вы формализуете semantic validation:

```http
422 Unprocessable Entity
```

Это конкретная проблема, которую уже фиксировал verification report. 

---

# 38. HTTP SEMANTICS

Я бы формализовал:

```text
400
malformed request

401
not authenticated

403
authenticated but forbidden

404
resource does not exist / intentionally hidden

409
state conflict

422
business validation

429
rate limit

500
actual server failure
```

Это делает frontend гораздо проще.

---

# 39. WEBSOCKET — САМАЯ НЕОПРЕДЕЛЁННАЯ SECURITY ЗОНА

Вот здесь я бы поставил:

> **6.5–7/10 пока не доказано тестами.**

Не потому что там обязательно уязвимость.

А потому что:

```text
/ws/**
```

и:

```text
/api/ws/**
```

допускаются SecurityConfig, а настоящая authorization может происходить на STOMP layer. 

Значит надо доказать:

```text
unauthenticated → rejected
```

```text
Alice → Bob topic → rejected
```

```text
Alice → senderId=Bob → rejected
```

```text
expired token → rejected
```

---

# 40. CHAT НЕ ДОЛЖЕН ДОВЕРЯТЬ senderId

Плохой вариант:

```json
{
  "senderId": 123,
  "message": "..."
}
```

если сервер просто доверяет `senderId`.

Правильно:

```text
JWT
 ↓
Principal
 ↓
currentUserId
```

и:

```text
senderId = Principal.id
```

То есть клиент **не решает, от чьего имени он пишет**.

---

# 41. TESTING

243 теста — это хороший показатель.

Но:

> **243 теста ≠ 243 доказательства корректности.**

В проекте уже есть:

```text
Backend
Frontend
E2E
Playwright
Artillery
```

и test coverage plan довольно разумно перечисляет gaps. 

---

# 42. TESTING Я БЫ РАЗДЕЛИЛ НА 6 УРОВНЕЙ

```text
1. Unit
2. Integration
3. API
4. Security
5. E2E
6. Load
```

Но поверх этого:

```text
Business invariants
```

отдельным слоем.

---

# 43. BUSINESS TESTS

Например:

```text
PAID invoice
→ amount immutable
```

```text
CANCELED invoice
→ cannot become PAID
```

```text
same webhook twice
→ one payment
```

```text
two employees pick task
→ one winner
```

```text
lesson completion twice
→ one completion
```

Вот такие тесты ценнее десятков обычных:

```text
shouldReturn200()
```

---

# 44. COVERAGE

Я согласен с предложением проекта:

```text
global ≈ 70%
```

но critical areas:

```text
auth       90%+
billing    90%+
security   90%+
access     90%+
```

Coverage gate должен реально блокировать merge.

В test plan такая идея уже присутствует. 

---

# 45. CI/CD

Сейчас CI уже заметно лучше, чем описано в некоторых старых документах.

Frontend делает:

```text
npm ci
lint
typecheck
test
build
```

что было подтверждено в исходном аудите. 

Backend также тестируется перед deployment.

Это хороший фундамент.

---

# 46. НО Я БЫ СДЕЛАЛ PIPELINE ТАКИМ

```text
PR
 │
 ├── format
 ├── lint
 ├── typecheck
 ├── unit tests
 ├── integration tests
 ├── ArchUnit
 ├── security scan
 ├── dependency scan
 ├── coverage gate
 ├── build
 ├── Docker build
 ├── container scan
 └── E2E
       ↓
    STAGING
       ↓
   smoke test
       ↓
   approval
       ↓
  PRODUCTION
```

Такой target pipeline уже сформулирован в исходном аудите. 

---

# 47. STAGING

Для внутренней финансовой системы я бы **обязательно** добавил:

```text
production
staging
```

а не:

```text
main → production
```

Потому что особенно опасны:

```text
Flyway migration
auth
billing
permissions
```

---

# 48. DATABASE MIGRATION DEPLOYMENT

Нужно использовать принцип:

```text
Expand
 ↓
Deploy
 ↓
Migrate data
 ↓
Contract
```

а не:

```text
изменили DB
 ↓
новый backend
```

Если новый backend не совместим со старой схемой, deployment может упасть.

Это уже было отмечено в архитектурном target. 

---

# 49. DOCKER

Multi-stage build:

```text
builder
 ↓
runtime
```

— хороший.

Но:

```text
bootJar -x test
```

означает, что Docker build сам тесты не запускает.

Это нормально, если pipeline гарантирует:

```text
tests
 ↓
build
 ↓
docker
```

Именно так сейчас и следует организовывать процесс. 

---

# 50. JVM 384 MB

Для:

```text
JPA
WebSocket
PDF
Mail
OTEL
Cache
```

лимит:

```text
-Xmx384m
```

может оказаться слишком агрессивным.

Не говорю:

> «увеличить прямо сейчас».

Говорю:

> **измерить.**

Нужно смотреть:

```text
heap
GC
RSS
CPU
DB pool
latency
```

при реальной нагрузке.

---

# 51. PERFORMANCE

N+1 уже активно исправлялся.

Используются:

```text
@EntityGraph
@BatchSize
pagination
DISTINCT ON
```

и в истории был отдельный performance pass. 

Это очень хороший знак.

Но теперь следующий уровень:

> **не оптимизировать вслепую.**

---

# 52. DATABASE PERFORMANCE AUDIT

Для каждого hot query:

```sql
EXPLAIN ANALYZE
```

и смотреть:

```text
WHERE
JOIN
ORDER BY
GROUP BY
INDEX
```

Особенно:

```text
tasks
documents
chat
notifications
audit
invoices
```

И обязательно realistic dataset.

---

# 53. REALISTIC LOAD

Не:

```text
100 requests
GET /public
```

а:

```text
10 000 clients
100 000 tasks
1 000 000 audit records
100 000 document metadata
```

и:

```text
concurrent employees
chat
billing
search
documents
```

В предыдущем аудите такой подход уже предлагался. 

---

# 54. AUDIT TABLE — БУДУЩИЙ BIG DATA CANDIDATE

Если:

```text
1000 events/day
```

— никаких проблем.

Если:

```text
1 000 000/day
```

совсем другая история.

При:

```text
10M+ rows
```

может понадобиться:

```text
partitioning
cursor pagination
retention
archival
```

Вместо бесконечного:

```text
OFFSET
```

---

# 55. CHAT HISTORY

Для истории сообщений:

```sql
WHERE created_at < ?
ORDER BY created_at DESC
LIMIT 50
```

обычно будет лучше при больших объёмах, чем глубокий:

```text
OFFSET 900000
```

То же самое относится к audit и notifications. 

---

# 56. OBSERVABILITY

У вас уже есть:

```text
Actuator
Micrometer
Prometheus
OTLP
OpenTelemetry
```

Это хороший foundation.

Но важно перейти от:

> «у нас есть OpenTelemetry»

к:

> «мы можем диагностировать production incident».

---

# 57. IDEAL REQUEST TRACE

Например:

```text
POST /invoice
traceId=abc123
│
├── InvoiceService 35ms
│
├── PostgreSQL 21ms
│
├── Audit 5ms
│
└── serialization 4ms
```

Если request занимает:

```text
500ms
```

вы должны знать:

> **почему.**

---

# 58. SENTRY

Frontend Sentry есть.

Backend Sentry в текущей конфигурации был закомментирован из-за Boot 4.1 compatibility, при этом OTEL остаётся альтернативой. 

Я бы не стал любой ценой возвращать Sentry.

Если:

```text
OpenTelemetry
+
Prometheus
+
Grafana
+
Tempo
+
Loki
```

будут нормально настроены, этого может быть достаточно.

---

# 59. LOGGING

Нельзя логировать:

```text
password
JWT
refresh token
TOTP secret
document contents
financial secrets
```

И желательно иметь автоматический sanitizer.

Для внутренней системы это особенно важно: сотрудники могут видеть application logs.

В аудите этот список был отдельно обозначен. 

---

# 60. PII

У вас потенциально есть:

```text
email
phone
IIN
BIN
address
documents
financial data
```

Я бы ввёл data classification:

```text
PUBLIC
INTERNAL
CONFIDENTIAL
HIGHLY_CONFIDENTIAL
```

и уже от этого определял:

```text
logging
audit
access
retention
export
```

---

# 61. BACKUP

Nightly PostgreSQL backup — хорошо.

Но:

> **backup, который никогда не восстанавливали, — это гипотеза.**

Нужен регулярный:

```text
restore drill
```

Сценарий:

```text
new PostgreSQL
 ↓
restore backup
 ↓
Flyway
 ↓
backend
 ↓
smoke tests
```

В исходном аудите это было выделено как обязательный следующий шаг. 

---

# 62. RPO / RTO

Для компании надо формально определить:

```text
RPO
RTO
```

Например:

```text
RPO = 1 hour
RTO = 30 minutes
```

Но это **бизнес-решение**, а не техническое число, поэтому конкретное значение я бы не придумывал за вас.

---

# 63. DATA RESIDENCY

И вот здесь важно не смешивать это с multi-tenancy.

Это не:

> «данные разных компаний».

Это:

> **где находятся данные одной компании.**

Если там персональные и финансовые данные, нужно отдельно определить требования компании и применимое законодательство.

Особенно если backend/database находятся не в Казахстане.

В первой части это было отмечено как отдельный бизнес-критичный вопрос. 

---

# 64. SECURITY POLICY

Вот это конкретный недостающий артефакт:

```text
SECURITY.md
```

Security overview репозитория показывал отсутствие security policy. 

Даже если проект не Open Source, документ полезен.

Минимум:

```text
supported versions
vulnerability reporting
security contact
response process
scope
```

---

# 65. SUPPLY CHAIN

У проекта много зависимостей.

Поэтому я бы добавил:

```text
Dependabot/Renovate
+
OSV/dependency scanning
+
Trivy
+
SBOM
```

И на release:

```text
JF-1C 1.0.0
   ↓
CycloneDX SBOM
```

Это уже уровень серьёзной production engineering practice. 

---

# 66. DOCKER IMAGE PINNING

Не:

```text
redis:latest
```

а:

```text
redis:7.x-alpine
```

или ещё лучше digest.

То же самое для PostgreSQL.

Это предотвращает ситуацию:

```text
сегодня build
→ работает

завтра build
→ внезапно другой image
→ сломалось
```

В исходном audit это отдельно отмечено. 

---

# 67. ДОКУМЕНТАЦИЯ — У ВАС ЕЁ МНОГО

Есть:

```text
ARCHITECTURE
RUNBOOK
ONBOARDING
CONTRIBUTING
SYSTEM_VERIFICATION_REPORT
TEST_COVERAGE_PLAN
```

Это **очень хороший показатель**.

Но проблема не в количестве.

Проблема:

> документация иногда отстаёт от текущего состояния системы.

Например:

```text
README:
Spring Boot 3.4+

build.gradle:
Spring Boot 4.1.0
```

и:

```text
README:
3 languages

recent CI:
4-language localization
```

Это уже систематический documentation drift.  

---

# 68. CURRENT_STATE.md

Я бы сделал один файл:

```text
CURRENT_STATE.md
```

где:

```text
Backend:
Spring Boot 4.1.0
Java 17

Frontend:
React 19
Vite 8
TypeScript 6

Database:
PostgreSQL 17

Languages:
...

Deployment:
...

Tests:
...

Known limitations:
...
```

И именно он должен быть source of truth для текущего состояния.

Старые аудиты не должны восприниматься как актуальная документация. 

---

# 69. ADR

Очень рекомендую:

```text
docs/adr/
├── 001-modular-monolith.md
├── 002-jwt-auth.md
├── 003-postgresql.md
├── 004-document-storage.md
├── 005-websocket.md
├── 006-billing-model.md
└── 007-outbox.md
```

Главный вопрос ADR:

> **Почему мы приняли именно это решение?**

Через год это бесценно.

В частности, ADR для modular monolith поможет не допустить бессмысленного перехода на microservices. 

---

# 70. PRODUCT SCOPE

Вот здесь я бы **не стал ничего автоматически вырезать**.

LMS, Chat и прочее могут быть нужны именно вашей компании.

Но нужно определить:

### Core

```text
Clients
Tasks
Documents
Billing
Audit
```

### Supporting

```text
Auth
Notifications
Chat
Search
```

### Internal enablement

```text
LMS
```

Это не значит:

> «LMS плохой».

Это значит:

> приоритет разработки должен определяться core workflow.

Такой подход уже предлагался в первой версии аудита. 

---

# 71. ЧТО Я БЫ ВООБЩЕ НЕ ТРОГАЛ

Вот это важно.

Я **не вижу необходимости сейчас менять**:

```text
Spring Boot
React
TypeScript
PostgreSQL
Gradle
Flyway
FSD
TanStack Query
modular monolith
JWT
```

Это не те места, где у проекта проблема.

---

# 72. ЧТО Я БЫ ИЗМЕНИЛ В ПЕРВУЮ ОЧЕРЕДЬ

С учётом вашего уточнения про одну компанию мой priority list выглядит так.

## P0 — обязательно

### 1.

**WebSocket ACL**

### 2.

**Refresh-token lifecycle audit**

### 3.

**Financial invariants**

### 4.

**PAID invoice immutability**

### 5.

**Enum 500 → 400**

### 6.

**PostgreSQL environment parity**

### 7.

**Flyway discipline**

### 8.

**Backup restore drill**

### 9.

**Security.md**

### 10.

**Default secrets / credentials**

---

# 73. P1

```text
11. OpenAPI → TS generation
12. ArchUnit
13. distributed scheduler protection
14. Outbox
15. Object Storage
16. Idempotency
17. Optimistic locking
18. Task state machine
19. Invoice state machine
20. unified error contract
```

---

# 74. P2

```text
21. cursor pagination
22. audit partitioning
23. SBOM
24. dependency scanning
25. container scanning
26. staging
27. preview environments
28. ADR
29. release/versioning
30. formal DR plan
```

Эта приоритизация очень близка к исходному аудиту, но **tenant isolation я из неё убираю полностью**. В оригинале он был ошибочно поставлен в P0 из-за предположения о SaaS-модели. 

---

# 75. ИТОГОВЫЙ VERDICT ПО JF-1C

Теперь, когда я понимаю реальную постановку:

> **JF-1C — внутренняя система одной финансовой компании, а не SaaS для нескольких компаний.**

Мой вердикт становится заметно позитивнее.

Это уже не:

> «студенческий CRUD».

И даже не просто:

> «CRM».

Архитектурно это:

> **внутренняя Financial Operations Platform компании на базе modular monolith.**

В проекте уже присутствует необычно много инженерных практик:

```text
RBAC
IDOR protection
JWT rotation
2FA
rate limiting
security headers
immutable audit
Flyway
N+1 optimization
E2E
Playwright
Artillery
CI/CD
backup automation
FSD
i18n
OpenTelemetry
Prometheus
```

Эта комбинация действительно выглядит как результат **систематической инженерной работы**, а не просто накопления CRUD-функций. 

---

# МОЯ ФИНАЛЬНАЯ ОЦЕНКА

### Как учебный проект

**10/10**

Слишком серьёзный уровень для обычного university CRUD.

### Как portfolio project

**9.5/10**

Показывает:

```text
architecture
backend
frontend
security
database
DevOps
testing
business logic
```

### Как внутренняя система реальной компании

**8–8.5/10**

Уже очень серьёзно.

### Как система, которой можно безоговорочно доверить критические финансовые операции

**пока нет.**

Не потому что архитектура плохая.

А потому что надо ещё доказать:

```text
authorization
+
concurrency
+
financial invariants
+
migration safety
+
recovery
+
WebSocket ACL
+
operational reliability
```

---

## И главное

Я **не рекомендую переписывать JF-1C**.

Не надо:

```text
Spring → другой framework
React → другой framework
Monolith → microservices
Postgres → другая DB
```

Это будет огромная ошибка.

Правильное направление:

```text
                   СЕЙЧАС
                     │
              Modular Monolith
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
     Feature work          Hardening
                               │
                    ┌──────────┼──────────┐
                    ↓          ↓          ↓
                 Security   Financial   Reliability
                    │          │          │
                    └──────────┼──────────┘
                               ↓
                            Staging
                               ↓
                            DR tests
                               ↓
                         Production
                               ↓
                            1.0
```

То есть проекту сейчас **не нужна новая архитектура**.

Ему нужна **архитектурная стабилизация и доказательство корректности уже существующей архитектуры**.

И это, на мой взгляд, намного более зрелая ситуация, чем если бы пришлось начинать всё с нуля. 
