Да. Я сделал именно **аудит проекта**, а не поверхностный разбор README: посмотрел структуру репозитория, архитектурную документацию, тестовую стратегию, `build.gradle`, Docker/Compose, SecurityConfig, frontend package, CI/CD, Issues/Security и историю Actions. Репозиторий сейчас очень активно меняется — на момент аудита `main` имеет **664 коммита**, а CI продолжает выполняться. ([GitHub][1])

Сразу главный вывод:

> **JF-1C уже не выглядит как “учебный CRUD”. Это довольно серьёзный modular-monolith CRM/SaaS с хорошей инженерной дисциплиной и заметным security/performance hardening. Но проект пока находится между “сильный production prototype / pre-production” и полноценной production-grade системой.**
>
> Самая большая проблема сейчас — **не отсутствие фич**, а рассинхрон между документацией, инфраструктурой и реальным текущим состоянием кода + недостаточная глубина автоматических гарантий для финансовой системы.

---

# JF-1C — ИСЧЕРПЫВАЮЩИЙ АУДИТ

**Дата аудита:** 15 сентября 2026
**Источник:** публичный репозиторий `MrSgemaSeny/JF-1C`
[Открыть репозиторий JF-1C](https://github.com/MrSgemaSeny/JF-1C?utm_source=chatgpt.com)

---

# 1. EXECUTIVE SUMMARY

## Моя итоговая оценка

| Область               |      Оценка |
| --------------------- | ----------: |
| Архитектура           |  **8.5/10** |
| Backend               |  **8.5/10** |
| Frontend              |    **8/10** |
| Security              |    **8/10** |
| RBAC / IDOR           |  **8.5/10** |
| Database architecture |    **8/10** |
| Testing               |  **7.5/10** |
| CI/CD                 |    **8/10** |
| DevOps                |    **7/10** |
| Observability         |    **7/10** |
| Documentation         |  **7.5/10** |
| Product architecture  |  **8.5/10** |
| Production readiness  |    **7/10** |
| Maintainability       |    **8/10** |
| Scalability           |  **7.5/10** |
| Business completeness |    **7/10** |
| Open-source readiness |    **4/10** |
| **ИТОГО**             | **~7.8/10** |

Но эта цифра немного обманчива.

Если оценивать **как pet-project/portfolio project**:

> **9+/10**

Если оценивать **как реальную внутреннюю систему бухгалтерской/финансовой компании**:

> **7–7.5/10**

Если оценивать **как систему, которой завтра можно доверить критически важные финансовые операции без дополнительного hardening**:

> **пока нет.**

---

# 2. ЧТО ЭТО ВООБЩЕ ЗА ПРОЕКТ

JF-1C — это не просто CRM.

Фактически здесь пытаются собрать **внутреннюю operating platform финансовой компании**:

* CRM;
* Task Management;
* Task Pool;
* документооборот;
* billing;
* subscriptions;
* LMS;
* чаты;
* notifications;
* audit;
* authentication;
* 2FA;
* RBAC;
* IDOR protection;
* генерация PDF;
* поиск;
* лидогенерация;
* monitoring;
* backup;
* CI/CD.

Это видно даже из верхнеуровневой архитектуры проекта. ([GitHub][1])

То есть концептуально это ближе к:

**CRM + ERP-lite + DMS + LMS + internal collaboration platform**

чем к обычной CRM.

И это одновременно **главное преимущество и главный риск проекта**.

---

# 3. САМАЯ СИЛЬНАЯ СТОРОНА ПРОЕКТА

## Архитектурно выбран правильный масштаб

Очень хорошее решение — **modular monolith**, а не микросервисы.

Backend:

```text
Spring Boot
    │
    ├── auth
    ├── crm
    ├── billing
    ├── courses
    ├── documents
    ├── chat
    ├── notifications
    ├── admin
    └── landing
```

Это правильнее микросервисов для такого размера команды/проекта.

Почему:

* единая транзакционная модель;
* PostgreSQL;
* меньше сетевых границ;
* проще deployment;
* проще debugging;
* проще локальная разработка;
* проще security;
* проще тестирование.

И при этом модули уже логически разделены.

Это **очень хороший архитектурный выбор**.

---

# 4. BACKEND

## Стек

Сейчас реальный `build.gradle` уже показывает:

* Java 17;
* Spring Boot **4.1.0**;
* Spring Security;
* Spring Data JPA;
* PostgreSQL;
* Flyway;
* WebSocket;
* Mail;
* OpenAPI;
* JWT;
* Thymeleaf;
* OpenHTMLToPDF;
* Bucket4j;
* Caffeine;
* TOTP;
* Apache Tika;
* Micrometer;
* Prometheus;
* OTLP;
* OpenTelemetry. ([GitHub][2])

Это серьёзный стек.

### Но здесь уже обнаружилась первая проблема.

README говорит:

> Spring Boot 3.4+

А `build.gradle` уже:

> **Spring Boot 4.1.0**

То есть документация **отстаёт от кода**. ([GitHub][1])

Это не просто косметика.

Для финансовой системы документация должна отражать **реальный runtime stack**.

---

# 5. SPRING BOOT 4 — ВАЖНЫЙ МОМЕНТ

Текущий проект фактически уже перешёл на Boot 4.

И это видно не только по Gradle.

В `SecurityConfig` используется современный Spring Security API, `jakarta.servlet`, современная конфигурация SecurityFilterChain и т.д. ([GitHub][3])

Это хорошо.

Но возникает вопрос:

### Почему README продолжает говорить про Spring Boot 3.4+?

Нужно сделать один источник истины:

```text
README
docs/ARCHITECTURE.md
build.gradle
Dockerfile
CI
```

должны описывать **одну и ту же платформу**.

---

# 6. SECURITY — ОЧЕНЬ СИЛЬНАЯ ЧАСТЬ

SecurityConfig выглядит заметно лучше среднего.

Есть:

```text
CSRF
CORS
CSP
COOP
Frame-Deny
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
STATELESS
JWT filter
Auth rate limit
API rate limit
```

([GitHub][3])

Это уже не уровень:

```java
http.authorizeHttpRequests(...)
```

и всё.

---

# 7. PASSWORD SECURITY

Используется:

```java
BCryptPasswordEncoder
```

Это правильный выбор. ([GitHub][3])

Здесь вопросов существенно меньше.

---

# 8. JWT

Архитектурно:

```text
Access Token
    ↓
короткоживущий

Refresh Token
    ↓
долгоживущий
    ↓
rotation
    ↓
DB
```

Это хороший дизайн.

README заявляет:

* access 15 минут;
* refresh 30 дней;
* rotation в БД. ([GitHub][1])

Но я бы здесь потребовал отдельный security audit именно реализации refresh-token lifecycle:

### Проверить:

* reuse detection;
* race condition;
* parallel refresh;
* logout;
* revoke all sessions;
* password change → invalidate sessions;
* refresh-token hashing в DB;
* device/session tracking;
* concurrent tabs;
* stolen refresh token;
* rotation failure atomicity.

Причём сам проект уже понимает эту проблему: frontend специально имеет singleton refresh promise, предотвращающий гонки параллельного обновления JWT. ([GitHub][1])

Это хороший признак.

---

# 9. FRONTEND JWT RACE HANDLING

Это одна из деталей, которая мне реально понравилась.

Проект не просто делает:

```text
401 → refresh
```

а предотвращает ситуацию:

```text
request A → 401
request B → 401
request C → 401

A → refresh
B → refresh
C → refresh
```

которая может уничтожить rotation chain.

В документации прямо указано, что используется **singleton refresh promise**. ([GitHub][1])

Это уже уровень человека, который сталкивался с реальными race conditions.

---

# 10. RBAC

Шесть ролей:

```text
ADMIN
EMPLOYEE
CLIENT
LEARNER
CURATOR
ADVISOR
```

([GitHub][1])

Причём роли не просто декоративные.

Есть различия:

### ADMIN

полный доступ.

### EMPLOYEE

рабочие задачи/клиенты/документы.

### CLIENT

только свои данные.

### LEARNER

LMS.

### CURATOR

контроль обучения.

### ADVISOR

**read-only**.

И вот последний пункт особенно интересен.

---

# 11. ADVISOR READ-ONLY

Проект отдельно исправлял проблему, когда ADVISOR потенциально мог выполнять mutation.

Были изменены:

```text
CrmAccessService
DocumentAccessService
TaskController
```

чтобы advisor действительно стал read-only. ([GitHub][1])

Это правильный подход:

> безопасность не должна зависеть только от UI.

Если кнопка Edit исчезла — это ещё ничего не значит.

Backend должен запрещать mutation.

И здесь именно это и сделано.

---

# 12. IDOR — ХОРОШО, НО ЭТО ТА ОБЛАСТЬ, ГДЕ НЕЛЬЗЯ РАССЛАБЛЯТЬСЯ

Отдельно закрывался:

```text
Invoice IDOR
```

Клиент больше не может читать/модифицировать чужие invoices. ([GitHub][1])

И есть отдельный E2E IDOR suite.

Это очень хороший знак.

Но для такого проекта я бы поднял security model ещё на один уровень.

Не просто:

```text
role → permission
```

а:

```text
user
 ↓
tenant
 ↓
organization
 ↓
client
 ↓
resource
 ↓
action
```

То есть **ABAC/RBAC hybrid**.

---

# 13. MULTI-TENANCY

Вот здесь я вижу одну из самых важных архитектурных зон роста.

В документации фигурирует:

> tenant isolation / RBAC & IDOR

Но из публичной архитектуры не видно полноценной фундаментальной multi-tenant модели уровня:

```text
tenant_id
organization_id
```

во всех бизнес-таблицах + database-level enforcement.

Если система реально предназначена для **B2B SaaS**, это должно стать фундаментальным принципом.

Например:

```text
Task
 └── tenant_id

Client
 └── tenant_id

Invoice
 └── tenant_id

Document
 └── tenant_id

Course
 └── tenant_id
```

и далее.

Идеально:

```text
WHERE tenant_id = currentTenant
```

не должно быть делом доброй воли каждого Service.

---

# 14. ЛУЧШИЙ ВАРИАНТ — PostgreSQL RLS

Если JF-1C действительно будет multi-tenant SaaS, я бы рассмотрел:

```text
PostgreSQL Row Level Security
```

как дополнительный security boundary.

Получится:

```text
Application authorization
        +
Service-level access checks
        +
Database-level RLS
```

То есть defense-in-depth.

Это особенно важно для:

* invoices;
* documents;
* clients;
* tasks;
* financial records.

---

# 15. AUDIT LOG

Вот это сделано очень интересно.

Проект использует PostgreSQL triggers, которые запрещают:

```text
UPDATE
DELETE
TRUNCATE
```

для audit tables.

([GitHub][1])

Это гораздо лучше, чем просто:

```java
auditRepository.save(...)
```

потому что application-level audit можно случайно изменить.

DB-level append-only намного надёжнее.

---

# 16. НО AUDIT LOG МОЖНО СДЕЛАТЬ ЕЩЁ СИЛЬНЕЕ

Сейчас:

```text
append-only
```

Но для финансовой системы можно пойти дальше.

Например:

```text
event_id
timestamp
actor_id
tenant_id
action
resource_type
resource_id
before_hash
after_hash
request_id
ip
user_agent
correlation_id
```

И добавить hash chaining:

```text
hash_n =
SHA256(
    event_n +
    hash_(n-1)
)
```

Получаем tamper-evident audit trail.

Тогда изменение истории становится обнаруживаемым.

---

# 17. FILE STORAGE

Document Hub:

```text
PostgreSQL BLOB
        ↓
local filesystem fallback
```

([GitHub][1])

Для MVP это нормально.

Для production — **не идеальная архитектура**.

Я бы предпочёл:

```text
PostgreSQL
    ↓
metadata

Object Storage
    ↓
actual file
```

Например:

```text
S3
MinIO
Cloudflare R2
Fly volumes/object storage
```

---

# 18. ПОЧЕМУ BLOB В POSTGRES — ПРОБЛЕМА

Представим:

```text
100 000 документов
×
5 MB
```

Это уже:

```text
500 GB
```

Если хранить всё в DB:

* backup становится тяжёлым;
* replication становится тяжелее;
* VACUUM;
* IO;
* WAL;
* restore;
* migrations;
* DB size.

Для финансового DMS лучше:

```text
DB:
document_id
tenant_id
sha256
mime
size
storage_key
created_at

Object storage:
actual bytes
```

---

# 19. ПРИ ЭТОМ У ПРОЕКТА ЕСТЬ ХОРОШАЯ ЗАЩИТА FILE UPLOAD

Используется:

* MIME whitelist;
* path traversal protection;
* Apache Tika;
* ограничения. ([GitHub][1])

Это хорошо.

Но я бы обязательно добавил:

```text
magic-byte verification
antivirus scanning
quarantine state
content-disposition hardening
filename normalization
size limit
archive bomb protection
zip bomb protection
PDF parser hardening
```

Особенно если документы приходят от клиентов.

---

# 20. PDF GENERATION

Используются:

```text
Thymeleaf
+
OpenHTMLToPDF
```

Это нормальный выбор.

Есть даже отдельная обработка отсутствующего шрифта `/fonts/arial.ttf`, чтобы вместо uncontrolled 500 не падать. ([GitHub][1])

Но:

### OpenHTMLToPDF не должен быть вызван без ограничений.

Нужно контролировать:

* CPU;
* memory;
* document size;
* page count;
* execution time;
* external resource loading;
* template injection;
* CSS complexity.

PDF generation потенциально является **resource exhaustion vector**.

---

# 21. GLOBAL ERROR HANDLING

Хорошо, что отдельно обрабатывается:

```text
HttpRequestMethodNotSupportedException
```

и вместо:

```text
500
```

возвращается:

```text
405
```

([GitHub][1])

Это правильная REST semantics.

---

# 22. ENUM ERROR — РЕАЛЬНАЯ ПРОБЛЕМА

И здесь есть интересная вещь в собственном verification report.

Если приходит неправильный enum:

```text
LessonType
InvoiceStatus
```

Jackson может бросить:

```text
InvalidFormatException
```

до попадания в service layer.

Документ прямо признаёт, что это может превращаться в **HTTP 500**. ([GitHub][4])

Вот это я бы обязательно исправил.

Неверный пользовательский enum:

```text
500 ❌
```

должен стать:

```text
400 Bad Request
```

например:

```json
{
  "status": 400,
  "code": "INVALID_ENUM",
  "field": "status",
  "message": "Unsupported invoice status"
}
```

Это важный API quality issue.

---

# 23. DATABASE

Используется:

```text
PostgreSQL
+
Hibernate/JPA
+
Flyway
```

Это правильный стек.

И особенно хорошо:

> migration chain считается immutable.

В проекте уже больше сотни миграций — README указывает V1–V121. ([GitHub][1])

---

# 24. НО УЖЕ ЕСТЬ MIGRATION DEBT

История Actions показывает, что проект уже сталкивался с:

```text
Flyway checksum error
```

и был отдельный commit:

> `fix(db): restore V117 and rollback schema to fix flyway checksum error`

([GitHub][5])

Это очень важный сигнал.

Не потому что это катастрофа.

А потому что:

> **migration discipline уже была нарушена настолько, что потребовался rollback/restore.**

Для production DB:

**никогда не переписывать applied migration.**

Если ошибка:

```text
V117
```

уже попала в production:

```text
V118 corrective migration
```

а не:

```text
изменить V117
```

---

# 25. ЕЩЁ ОДИН DATABASE ISSUE

В README:

> PostgreSQL 17

А `docker-compose.yml`:

```yaml
image: postgres:15-alpine
```

([GitHub][1])

Это серьёзный configuration drift.

Получается:

```text
Production:
PostgreSQL 17

Local:
PostgreSQL 15
```

И уже был отдельный commit, связанный с PostgreSQL 17 и `DISTINCT ON`. ([GitHub][5])

Значит local environment **не реплицирует production**.

Это надо исправить немедленно:

```yaml
postgres:17-alpine
```

если именно 17 — production target.

---

# 26. DOCKER COMPOSE — ЕЩЁ НЕСКОЛЬКО ПРОБЛЕМ

Сейчас в compose:

```text
postgres
redis
backend
frontend
```

При этом:

```text
POSTGRES_USER=test_user
POSTGRES_PASSWORD=pass1
JWT_SECRET=change-me...
```

прямо прописаны в compose. ([GitHub][6])

Да, это очевидно dev environment.

Но даже для dev я бы сделал:

```text
.env
.env.example
```

и:

```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
JWT_SECRET: ${JWT_SECRET}
```

---

# 27. И ЕЩЁ: REDIS

Compose поднимает:

```text
Redis
```

но текущий `build.gradle` не показывает Redis starter. ([GitHub][2])

То есть надо ответить на вопрос:

> **Зачем Redis существует в compose?**

Если не используется:

**удалить.**

Если используется:

**явно интегрировать.**

Не должно быть:

```text
архитектурный призрак
```

---

# 28. LOCAL ENVIRONMENT НЕ ДОЛЖЕН БЫТЬ "ПОХОЖИМ"

Нужно добиться:

```text
DEV
STAGE
PROD
```

максимально одинаковых:

```text
Java
Spring
PostgreSQL
Docker
proxy
headers
storage
```

Различаться должны:

```text
credentials
URLs
logging
scale
observability
```

а не версия DB.

---

# 29. DOCKERFILE

Dockerfile хороший по базовой структуре:

```text
multi-stage build
        ↓
JDK builder
        ↓
JRE runtime
```

([GitHub][7])

Это хорошо.

---

# 30. НО TESTS SKIPPED В DOCKER BUILD

Ключевая строка:

```text
./gradlew bootJar --no-daemon -x test
```

([GitHub][7])

Это нормально **только потому**, что CI должен тестировать до build.

Но тогда нужно гарантировать:

```text
CI test
 ↓
CI build
 ↓
Docker build
 ↓
deploy
```

и Docker build не должен быть самостоятельным "source of truth".

Сейчас pipeline backend действительно запускает Gradle tests перед deployment. README это описывает, а workflow присутствует. ([GitHub][8])

---

# 31. JVM MEMORY

Docker:

```text
-Xmx384m
-Xms256m
-MaxMetaspaceSize=256m
```

([GitHub][7])

Для такой системы:

* JPA;
* PDF;
* WebSocket;
* Mail;
* OpenTelemetry;
* cache;

384 MB heap выглядит **довольно агрессивно**.

Не обязательно плохо.

Но обязательно нужен load test:

```text
100 users
500 users
1000 users
WebSocket
PDF
documents
DB pool
```

и измерение:

```text
heap
GC
CPU
RSS
DB connections
latency
```

---

# 32. N+1

Здесь проект сделал хорошую работу.

Есть:

```text
@EntityGraph
@BatchSize(25)
DISTINCT ON
pagination
```

([GitHub][1])

И судя по истории commits, отдельный performance pass действительно проводился:

> `fix(perf): resolve N+1 queries in chat and documents...`

([GitHub][5])

Это сильная сторона.

---

# 33. Но JPA остаётся потенциальным BOTTLENECK

В системе много связей:

```text
Client
 └── Tasks
     └── Comments
         └── Audit

Course
 └── Chapters
      └── Lessons
           └── Progress
```

и:

```text
Invoice
Subscription
User
Document
Chat
Notification
```

JPA прекрасно работает до определённого масштаба.

Но надо очень внимательно следить за:

```text
fetch strategy
collection size
count queries
pagination
sort
joins
```

---

# 34. PAGINATION

Хорошо:

> списки используют `Pageable` и сортировку. ([GitHub][1])

Но я бы проверил, что нигде не осталось:

```text
findAll()
```

на больших таблицах.

Особенно:

```text
audit
chat
documents
notifications
tasks
```

---

# 35. CHAT

STOMP/WebSocket — хороший выбор для internal CRM.

Но архитектурно именно здесь я вижу один из главных security risks.

В `SecurityConfig`:

```text
/ws/**
/api/ws/**
```

помечены `permitAll`. ([GitHub][3])

Это **может быть абсолютно правильно**, если authentication происходит на STOMP CONNECT/interceptor уровне.

Но тогда это должно быть **жёстко доказано тестами**.

И в `TEST_COVERAGE_PLAN` как раз есть:

```text
WebSocket ACL
```

с проверками:

* own topic;
* чужой topic;
* sender spoofing;
* unauthenticated handshake;
* expired token.

([GitHub][9])

Это правильные тесты.

---

# 36. НО ОНИ БЫЛИ ПОКАЗАНЫ КАК PLANNED

В coverage plan прямо указано:

> WebSocket ACL — отсутствует / M3 planned. ([GitHub][9])

Вот это я считаю **одним из наиболее важных оставшихся security gaps**.

Для chat:

```text
authentication ≠ authorization
```

Недостаточно проверить:

> "пользователь залогинен".

Нужно проверить:

> "пользователь имеет право подписаться именно на этот destination".

---

# 37. ИДЕАЛЬНАЯ ПРОВЕРКА CHAT

Нужно гарантировать:

```text
Alice
  ↓
/topic/chat/alice
✓

Alice
  ↓
/topic/chat/bob
✗

Alice
  ↓
SEND sender=bob
✗

anonymous
  ↓
CONNECT
✗
```

И сервер должен брать sender:

```text
Principal
```

а не доверять:

```json
{
  "senderId": "bob"
}
```

---

# 38. TESTING

Вот здесь проект одновременно **сильный и слабый**.

Количество тестов впечатляет:

```text
Backend: 169
Frontend: 74
Total: 243
```

([GitHub][10])

Плюс:

```text
E2E
Playwright
Artillery
```

Это отлично.

---

# 39. НО КОЛИЧЕСТВО TESTS ≠ COVERAGE

Сам проект это признаёт.

`TEST_COVERAGE_PLAN.md` говорит:

* есть дыры в controllers;
* frontend API layer почти не покрыт;
* search отсутствует;
* WebSocket ACL отсутствует;
* Kaspi отсутствует;
* coverage threshold не установлен;
* lint ранее отсутствовал/был проблемой. ([GitHub][9])

Это очень важный документ.

То есть:

> **243 теста — хорошо, но цифра сама по себе не доказывает качество покрытия.**

---

# 40. ОСОБЕННО ХОРОШО: ТЕСТОВЫЙ ПЛАН

Мне нравится сам подход:

```text
что есть
↓
что отсутствует
↓
какие тесты писать
↓
какие security cases
```

Например:

```text
CLIENT → чужой invoice → 403
ADVISOR → mutation → 403
EMPLOYEE → чужой client → 403
```

([GitHub][9])

Это гораздо полезнее, чем просто:

```text
TaskServiceTest
```

на 100% coverage.

---

# 41. НО НУЖЕН COVERAGE GATE

В coverage plan предлагается:

```text
70% instruction
60% line
```

и `check.dependsOn jacocoTestCoverageVerification`. ([GitHub][9])

Я бы действительно это включил.

Но:

### Не ставить просто "80%".

Лучше:

```text
global:
70%

security packages:
90%

access-control:
95%

billing:
90%

auth:
90%

critical services:
90%
```

---

# 42. FINANCIAL MODULE

Вот здесь начинается самое интересное.

Сейчас billing содержит:

```text
Invoice
Subscription
statuses
```

и lifecycle tests. ([GitHub][1])

Но проект пока не является полноценной финансовой платформой.

Почему?

Потому что открытые Issues показывают:

> Kaspi Pay integration — ещё open.

и:

> WebKassa fiscalization — ещё open. ([GitHub][11])

---

# 43. KASPI

Есть Epic:

```text
Kaspi Pay
```

но integration ещё не считается законченной.

Это значит:

```text
Invoice
```

есть.

Но:

```text
payment provider
webhook
signature
idempotency
reconciliation
```

ещё не являются полностью production-grade closed loop.

---

# 44. WEBKASSA

То же самое с:

```text
WebKassa
```

Для Казахстана это очень важный слой.

Если продукт реально предназначен для финансового/бухгалтерского бизнеса в РК, то fiscalization — не "nice to have".

---

# 45. BILLING STATE MACHINE

Сейчас:

```text
DRAFT
ISSUED
PAID
OVERDUE
CANCELED
```

([GitHub][4])

Хорошо.

Но я бы формализовал transitions:

```text
DRAFT
 ├── ISSUED
 └── CANCELED

ISSUED
 ├── PAID
 ├── OVERDUE
 └── CANCELED

OVERDUE
 └── PAID
```

И запрещать:

```text
PAID → DRAFT
PAID → ISSUED
CANCELED → PAID
```

если бизнес явно не разрешает.

---

# 46. ДЕНЬГИ НЕЛЬЗЯ ХРАНИТЬ В DOUBLE

Нужно убедиться, что monetary fields:

```text
BigDecimal
```

а не:

```text
double
float
```

Это обязательная проверка.

Для денег:

```text
NUMERIC(19,4)
```

или аналогичный precision.

---

# 47. ИДЕМПОТЕНТНОСТЬ

При появлении Kaspi/WebKassa обязательно:

```text
idempotency_key
provider_transaction_id
unique constraint
```

И webhook должен быть:

```text
repeatable
```

То есть:

```text
Webhook #1 → PAID
Webhook #2 → no-op
Webhook #3 → no-op
```

а не:

```text
duplicate payment
```

---

# 48. DOCUMENTS

Функционально это одна из самых полезных частей системы.

Есть:

```text
upload
status
download
search
delete
templates
```

и E2E lifecycle. ([GitHub][4])

Это уже реальный workflow.

---

# 49. SEARCH

Есть global search:

```text
tasks
clients
documents
```

Но в `TEST_COVERAGE_PLAN` search module был отмечен как отсутствующий/недостаточно покрытый. ([GitHub][9])

Я бы сделал search отдельным bounded context:

```text
SearchService
```

и позже:

```text
PostgreSQL FTS
```

или:

```text
OpenSearch/Elasticsearch
```

только если PostgreSQL перестанет справляться.

---

# 50. LMS

LMS — неожиданно полноценная часть.

Есть:

```text
Course
 ↓
Chapter
 ↓
Lesson
 ↓
LessonBlock
```

плюс:

```text
progress
certificates
publication
```

([GitHub][10])

Для CRM это даже немного overbuilt.

Но бизнес-смысл есть:

> onboarding сотрудников / клиентов.

---

# 51. LMS CASCADE ISSUE

Проект реально встретил:

```text
fk_enrollments_course_id
```

и удаление курса ломалось.

Это было исправлено предварительным удалением:

```text
progress
enrollments
certificates
```

([GitHub][1])

Это хороший пример того, что проект не просто генерировался "в вакууме", а проходил через реальные интеграционные проблемы.

---

# 52. FRONTEND ARCHITECTURE

React 19 + TypeScript + Vite + FSD.

Структура:

```text
app
pages
widgets
features
entities
shared
```

([GitHub][10])

Это хороший выбор для приложения такого размера.

---

# 53. FSD — ПЛЮС

Если соблюдать правила:

```text
shared
↓
entities
↓
features
↓
widgets
↓
pages
↓
app
```

то frontend можно масштабировать.

Но FSD очень легко превратить в:

```text
1000 папок
```

без настоящей архитектуры.

Поэтому нужно проверять imports:

```text
entities → features
```

не наоборот.

---

# 54. TYPESCRIPT

Текущий frontend:

```text
TypeScript 6.x
```

и CI выполняет:

```text
tsc --noEmit
```

([GitHub][12])

Это хорошо.

Но README говорит:

```text
TypeScript 5.x
```

то есть документация опять устарела.

---

# 55. FRONTEND DEPENDENCY STACK

Сейчас очень современный:

```text
React 19.2
Vite 8
TypeScript 6
React Router 7
TanStack Query 5
Tailwind 4
Vitest 4
Zod
Sentry
STOMP
dnd-kit
```

([GitHub][12])

Технологически frontend довольно свежий.

---

# 56. МОЙ ВОПРОС К FRONTEND — DEPENDENCY CHURN

Версии очень свежие.

Это хорошо для проекта.

Но для production:

```text
React 19.x
Vite 8
TypeScript 6
Vitest 4
```

означают:

> довольно высокий upgrade velocity.

Я бы закрепил:

```text
lockfile
Dependabot/Renovate
weekly update branch
automated tests
```

а не обновлять всё вручную.

---

# 57. CI/CD

Здесь проект реально хороший.

GitHub Actions:

```text
CI/CD Pipeline
DB Backup
Deploy Backend
Codespaces
```

([GitHub][13])

CI frontend выполняет:

```text
npm ci
lint
typecheck
vitest
build
```

([GitHub][14])

Это именно то, что должно быть.

---

# 58. НО BACKEND CI

Backend pipeline запускает Gradle tests перед deploy. ([GitHub][8])

Это правильно.

Но я бы добавил:

```text
dependency vulnerability scan
SAST
secret scan
container scan
SBOM
migration validation
coverage gate
```

---

# 59. SECURITY SCANNING

И вот здесь существенный пробел.

GitHub Security показывает:

> **No security policy detected**

То есть `SECURITY.md` отсутствует. ([GitHub][15])

Для финансового проекта это надо исправить.

---

# 60. НУЖЕН SECURITY.MD

Минимально:

```text
Supported versions
Reporting vulnerabilities
Private disclosure process
Expected response time
Security contact
Out-of-scope
```

Даже если проект private/internal.

---

# 61. SECRET MANAGEMENT

Нужно проверить все workflows.

В CI уже используются GitHub secrets:

```text
VITE_SENTRY_DSN
SENTRY_AUTH_TOKEN
```

и variables/secrets для API URL. ([GitHub][14])

Это хорошо.

Но публичный compose:

```text
JWT_SECRET=change-me...
```

должен быть явно помечен:

```text
DEV ONLY
```

и production deployment должен fail-fast при использовании default secret.

Например:

```java
if (secret.equals(DEFAULT_SECRET)) {
    throw new IllegalStateException(...)
}
```

---

# 62. RATE LIMITING

Есть:

```text
auth: 10/min/IP
email check: 5/min/IP
general: 100/min/user/IP
```

([GitHub][1])

Это хорошо.

Но тут есть архитектурная проблема:

### Bucket4j + local memory

Если backend масштабируется:

```text
instance A
instance B
instance C
```

то:

```text
100 req/min
```

становится:

```text
100 × 3
```

если bucket локальный.

---

# 63. ИМЕННО ЗДЕСЬ REDIS МОГ БЫТЬ НУЖЕН

И тогда странный Redis в Compose начинает иметь смысл.

Если сделать:

```text
Bucket4j
+
Redis
```

можно получить distributed rate limiting.

Но сейчас нужно либо:

### вариант A

убрать Redis;

или:

### вариант B

реально использовать Redis для:

* rate limits;
* distributed locks;
* cache;
* WebSocket broker coordination.

---

# 64. SCALE

Сейчас архитектура:

```text
Frontend
   ↓
Fly.io backend
   ↓
Postgres
```

Для небольшого бизнеса нормально.

Но для horizontal scaling нужно решить:

```text
WebSocket sessions
rate limiting
cache
scheduled jobs
file storage
```

---

# 65. SCHEDULED JOBS

Есть deadline scheduler.

Но если поднять:

```text
backend × 3
```

получишь:

```text
scheduler A
scheduler B
scheduler C
```

и потенциальные дубликаты уведомлений.

Нужны:

```text
distributed lock
```

или:

```text
external scheduler
```

или:

```text
job queue
```

---

# 66. TELEGRAM

Telegram notifications — хороший operational feature.

Но Telegram не должен быть единственным каналом alerting.

Нужно:

```text
application log
metrics
alerts
Telegram
```

а не:

```text
Telegram = monitoring
```

---

# 67. OBSERVABILITY

Есть:

```text
Actuator
Micrometer
Prometheus
OTLP
OpenTelemetry
```

([GitHub][10])

Это очень хорошо.

Но я бы хотел увидеть полноценную observability model:

```text
logs
metrics
traces
```

с единым:

```text
correlation_id
request_id
trace_id
```

---

# 68. METRICS

Минимальный production dashboard:

```text
HTTP RPS
p50
p95
p99
5xx
401
403
429
DB pool usage
DB latency
JVM heap
GC
WebSocket connections
PDF generation time
file upload size
scheduler failures
email failures
```

---

# 69. DATABASE POOL

HikariCP есть.

Но для production обязательно провести capacity planning:

```text
Fly instances
×
Hikari maxPool
≤
Postgres max_connections
```

Нельзя сделать:

```text
10 instances
×
50 DB connections
=
500
```

при PostgreSQL:

```text
max_connections = 200
```

---

# 70. PERFORMANCE TESTING

Есть Artillery:

```text
catalog
public routes
frontend static
rate limit
```

([GitHub][1])

Это хорошо.

Но **это ещё не настоящий capacity test бизнес-системы**.

Нужны сценарии:

### Scenario A

```text
100 employees
tasks
```

### Scenario B

```text
1000 clients
documents
```

### Scenario C

```text
100 concurrent chat users
```

### Scenario D

```text
invoice creation
```

### Scenario E

```text
PDF generation
```

### Scenario F

```text
search
```

---

# 71. НУЖНЫ SLA GATES

Например:

```text
p95 < 500 ms
p99 < 1 s
5xx < 0.1%
429 only when expected
DB CPU < 70%
```

И CI/CD должен падать, если benchmark деградирует.

В `TEST_COVERAGE_PLAN` прямо отмечено, что load testing существует, но SLA-gate в CI отсутствует. ([GitHub][9])

---

# 72. BACKUPS

Есть отдельный DB Backup workflow.

README указывает:

> nightly PostgreSQL dumps + encryption + Telegram report. ([GitHub][1])

Это хорошо.

Но:

> **backup ≠ recovery.**

---

# 73. НУЖЕН RESTORE DRILL

Самая частая ошибка:

```text
backup exists
```

и никто никогда не проверял:

```text
restore works
```

Нужно регулярно:

```text
pg_dump
↓
new PostgreSQL
↓
restore
↓
migrations
↓
application boot
↓
smoke tests
```

---

# 74. RPO / RTO

Нужно официально определить:

```text
RPO = ?
RTO = ?
```

Например:

```text
RPO: 24h
RTO: 2h
```

или для серьёзной системы:

```text
RPO: 1h
RTO: 30m
```

Пока это больше operational mechanism, чем полноценная DR strategy.

---

# 75. PRODUCTION INFRASTRUCTURE

Сейчас:

```text
Frontend → GitHub Pages
Backend → Fly.io
DB → PostgreSQL/Fly
```

([GitHub][1])

Для MVP — отлично.

Для серьёзного B2B:

### GitHub Pages frontend

нормально.

### Fly.io backend

нормально.

### Но database architecture надо документировать гораздо точнее.

---

# 76. SINGLE REGION

README указывает backend region:

```text
ams
```

([GitHub][1])

Для Казахстанского бизнеса это не идеально.

Не обязательно проблема.

Но latency:

```text
Kazakhstan
   ↓
Amsterdam
```

нужно измерять.

---

# 77. DATA RESIDENCY

А вот это уже **бизнес-критичный вопрос**.

Если система реально хранит:

* персональные данные;
* документы;
* бухгалтерскую информацию;
* клиентские данные;

то необходимо отдельно определить:

```text
где физически находятся данные
```

и:

```text
имеет ли компания право хранить их там
```

Это уже не техническая мелочь.

---

# 78. PRODUCT ARCHITECTURE

С точки зрения продукта проект очень интересный.

Главный workflow выглядит примерно так:

```text
Lead
 ↓
Client
 ↓
Task
 ↓
Employee
 ↓
Document
 ↓
Invoice
 ↓
Payment
 ↓
Audit
```

Это правильная цепочка.

---

# 79. CRM + TASK POOL

Task Pool — одна из лучших product features.

Вместо:

```text
manager manually assigns everything
```

получаем:

```text
unassigned task
       ↓
employee picks it
       ↓
works
       ↓
client rejects
       ↓
auto-reopen
```

([GitHub][1])

Это уже автоматизация бизнес-процесса, а не просто CRUD.

---

# 80. AUTO-REOPEN

Очень хорошая идея:

```text
DONE
 ↓
client rejects
 ↓
OPEN
```

Но здесь нужен formal state machine.

Иначе со временем появится:

```text
если status == X
и stage == Y
и rejectReason != null
и assignedTo...
```

и получится state spaghetti.

---

# 81. TASK STATE MACHINE

Я бы вынес:

```text
TaskStateMachine
```

с явными transitions:

```text
NEW → OPEN
OPEN → IN_PROGRESS
IN_PROGRESS → REVIEW
REVIEW → DONE
REVIEW → REOPENED
REOPENED → IN_PROGRESS
...
```

И отдельными permission rules.

---

# 82. БИЗНЕС-ПРАВИЛА ДОЛЖНЫ БЫТЬ EXPLICIT

Например:

```text
CLIENT cannot move task to arbitrary stage
EMPLOYEE cannot approve own task
ADVISOR cannot mutate
ADMIN can override
```

Это лучше, чем десятки:

```java
if (role == ...)
```

по всему коду.

---

# 83. DOMAIN LAYER

Следующий уровень зрелости:

```text
Controller
 ↓
Application Service
 ↓
Domain
 ↓
Repository
```

а не:

```text
Controller
 ↓
huge Service
 ↓
JPA
```

Если бизнес-правил становится больше, domain objects/state machines очень помогут.

---

# 84. FRONTEND UX

По package и описанию видно, что UI достаточно богатый:

* Kanban;
* dashboard;
* roles;
* chat;
* documents;
* LMS;
* settings;
* i18n;
* themes;
* responsive/public pages.

Но статический GitHub-аудит не позволяет мне честно дать полноценную UX-оценку.

Для этого нужен отдельный:

> **UI/UX audit production-сайта с проходом всех ролей.**

---

# 85. I18N

Здесь проект недавно активно работал.

В Actions видны коммиты:

> `feat(i18n): complete 100% 4-language localization...`

и свежий:

> `fix(i18n): fix calendarPage namespace and robust Kazakh date formatting`

([GitHub][13])

Это показывает, что локализация реально развивается.

Причём для Казахстана это особенно важно.

---

# 86. НО README ГОВОРИТ 3 ЯЗЫКА

Архитектура/README:

```text
KZ/RU/EN
```

([GitHub][1])

А свежий commit заявляет:

> 4-language localization. ([GitHub][13])

Опять documentation drift.

Это уже систематическая проблема проекта.

---

# 87. ДОКУМЕНТАЦИЯ

Документации много:

```text
ARCHITECTURE
RUNBOOK
ONBOARDING
CONTRIBUTING
SYSTEM_VERIFICATION_REPORT
TEST_COVERAGE_PLAN
```

([GitHub][1])

Это очень хорошо.

Но проблема:

> документация быстро устаревает.

---

# 88. ДОКУМЕНТАЦИЯ ДОЛЖНА БЫТЬ GENERATED WHERE POSSIBLE

Например:

### Version

не писать вручную:

```text
Spring Boot 3.4+
```

а генерировать/ссылаться на:

```text
build.gradle
```

### API

OpenAPI.

### DB

Flyway.

### dependency versions

Gradle/package-lock.

---

# 89. REPOSITORY HEALTH

Сейчас:

```text
664 commits
2 open issues
0 PR
1 star
0 forks
```

([GitHub][1])

Это выглядит как:

> **личный/внутренний активно разрабатываемый проект**, а не open-source community project.

И это нормально.

---

# 90. OPEN SOURCE READINESS

Если цель:

> сделать GitHub-проект, который впечатляет работодателей

то уже хорошо.

Если цель:

> привлечь contributors

то пока нет.

Нужны:

```text
CONTRIBUTING
SECURITY.md
CODE_OF_CONDUCT
issue templates
PR template
release process
changelog
versioning
```

---

# 91. RELEASE MANAGEMENT

Сейчас версия backend:

```text
0.0.1-SNAPSHOT
```

([GitHub][2])

При этом проект уже имеет:

* production;
* deployment;
* 600+ commits;
* migrations;
* CI.

Это странно.

Нужна нормальная версия:

```text
0.1.0
```

или:

```text
1.0.0
```

если бизнес считает продукт production-ready.

---

# 92. SEMVER

Рекомендую:

```text
0.x
```

если API ещё активно меняется.

Например:

```text
0.8.0
0.9.0
1.0.0
```

и release notes.

---

# 93. GIT HISTORY

664 commits — это много.

С одной стороны:

**огромный плюс**.

Видно:

```text
security audit
performance fixes
CI fixes
database fixes
auth fixes
i18n
testing
Docker
```

То есть развитие довольно системное. ([GitHub][5])

---

# 94. НО 664 COMMITS ЗА КОРОТКОЕ ВРЕМЯ

По activity видно чрезвычайно интенсивную разработку.

Это создаёт риск:

```text
feature
↓
fix
↓
fix fix
↓
audit
↓
rollback
↓
hotfix
```

То есть проект может двигаться быстрее, чем стабилизируется.

Особенно опасно это для:

```text
Flyway
security
auth
billing
```

---

# 95. НУЖЕН STABILIZATION WINDOW

Я бы ввёл:

```text
feature freeze
↓
security
↓
performance
↓
migration verification
↓
E2E
↓
release candidate
↓
production
```

а не:

```text
feature → immediately deploy
```

---

# 96. Самый большой процессный риск

Проект очень активно использует AI/agents.

В репозитории даже есть:

```text
.agents
AI_agent_instruction.md
CONTEXT.md
```

([GitHub][1])

Это может быть очень эффективно.

Но AI-generated code создаёт риск:

```text
локально правильный код
+
неправильное глобальное предположение
```

Особенно:

* permissions;
* migrations;
* transactions;
* concurrency;
* security.

---

# 97. AI AGENT GOVERNANCE

Я бы сделал обязательное правило:

AI не может самостоятельно merge:

```text
/security
/db/migration
/billing
/auth
```

без второго review.

То есть:

```text
AI
 ↓
tests
 ↓
human review
 ↓
CI
 ↓
merge
```

---

# 98. TRANSACTIONS

В финансовом проекте нужно отдельно проверить:

```text
@Transactional
```

на всех critical workflows.

Например:

```text
create invoice
 ↓
audit
 ↓
task update
 ↓
notification
```

Что происходит, если:

```text
notification fails?
```

Не должна откатиться финансовая операция только потому, что Telegram API умер.

---

# 99. OUTBOX PATTERN

Я бы настоятельно рекомендовал:

```text
transaction
    ↓
business DB
    +
outbox_event
    ↓
commit
    ↓
worker
    ↓
Telegram/email/webhook
```

Это решит массу проблем:

```text
DB committed
but Telegram failed
```

---

# 100. EMAIL

История Actions показывает отдельную работу:

> `fix(mail): harden email engine with smtp timeouts, mailExecutor...`

([GitHub][5])

Это хорошо.

Но снова:

email должен быть asynchronous.

Не:

```text
HTTP request
 ↓
SMTP
 ↓
response
```

а:

```text
HTTP
 ↓
DB transaction
 ↓
outbox
 ↓
worker
 ↓
SMTP
```

---

# 101. NOTIFICATIONS

То же самое:

```text
Notification
Email
Telegram
WebSocket
```

лучше представить как event consumers.

Например:

```text
TaskStageChanged
      │
      ├── Audit
      ├── Notification
      ├── Email
      └── WebSocket
```

а не:

```text
TaskService
  ├── email()
  ├── telegram()
  ├── websocket()
  └── audit()
```

---

# 102. ARCHITECTURAL EVENT MODEL

Это, на мой взгляд, **следующий большой шаг проекта**.

Сейчас:

```text
modular monolith
```

Следующий уровень:

```text
modular monolith
+
domain events
+
outbox
```

И тогда в будущем при необходимости:

```text
event
 ↓
Kafka/RabbitMQ
```

будет намного проще.

---

# 103. НЕ НУЖНО ПЕРЕХОДИТЬ НА MICROSERVICES

Это принципиально.

Я **не рекомендую** сейчас:

```text
CRM service
Billing service
LMS service
Chat service
...
```

Это будет ухудшением.

Лучше:

```text
modular monolith
```

до момента, когда действительно появятся:

* разные scale profiles;
* разные teams;
* independent deploy;
* clear bounded contexts.

---

# 104. SECURITY HEADERS

В `SecurityConfig` уже довольно хороший набор:

```text
CSP
Frame deny
Content-Type options
Referrer Policy
Permissions Policy
COOP
```

([GitHub][3])

Это сильнее среднего проекта.

---

# 105. CSP

Сейчас:

```text
style-src 'self' 'unsafe-inline'
```

([GitHub][3])

Это компромисс.

Не катастрофа.

Но если возможно:

```text
nonce-based CSP
```

или устранить inline styles.

---

# 106. CORS

Нужно отдельно проверить:

```text
allowed origins
credentials
methods
headers
```

Особенно потому что frontend на GitHub Pages, backend на Fly.io.

Не должно быть:

```text
*
```

при:

```text
credentials=true
```

---

# 107. COOKIE SECURITY

Если refresh token хранится cookie, обязательно:

```text
HttpOnly
Secure
SameSite
Domain
Path
```

и особенно проверить cross-origin deployment.

Это одна из зон, которую я бы проверил динамически.

---

# 108. GOOGLE AUTH

Frontend имеет:

```text
@react-oauth/google
```

и deploy использует Google Client ID. ([GitHub][12])

Backend использует Google API client. ([GitHub][2])

Нужно убедиться, что backend:

```text
НЕ доверяет email из frontend
```

а валидирует:

```text
Google ID token
issuer
audience
expiration
signature
email_verified
```

---

# 109. PASSWORD RESET

В Actions есть отдельный commit:

> `feat(auth): implement secure password reset flow`

([GitHub][5])

Это хорошо.

Но production-grade reset должен гарантировать:

```text
one-time token
hashed token in DB
expiration
single use
rate limiting
no email enumeration
invalidate sessions
```

---

# 110. EMAIL ENUMERATION

В coverage plan прямо предлагается:

```text
forgot-password
→ always 200
→ zero-enum
```

([GitHub][9])

Это правильный security pattern.

---

# 111. 2FA

Используется:

```text
TOTP RFC 6238
```

и библиотека:

```text
totp-spring-boot-starter
```

([GitHub][1])

Хорошо.

Но я бы добавил:

```text
backup codes
recovery process
rate limit
lockout
revoke sessions after 2FA change
audit events
```

---

# 112. ADMIN SECURITY

Для ADMIN я бы рекомендовал:

```text
2FA mandatory
```

а не просто:

```text
2FA available.
```

Для financial SaaS:

```text
ADMIN without 2FA
```

нежелателен.

---

# 113. ADVISOR 2FA

Если advisor имеет доступ к чувствительной информации — тоже разумно.

Документация уже говорит, что 2FA ориентирован на admins/advisors. ([GitHub][10])

---

# 114. ADMIN ACTIONS

Все критические admin actions должны audit:

```text
change role
approve user
delete user
delete invoice
change billing
disable 2FA
reset password
delete document
```

И audit должен быть immutable.

---

# 115. SOFT DELETE

В financial system я бы очень осторожно относился к:

```text
DELETE
```

Особенно:

```text
invoice
document
audit
client
task
```

Лучше:

```text
deleted_at
deleted_by
delete_reason
```

для многих сущностей.

---

# 116. INVOICE DELETE

Сейчас E2E проверяет:

```text
DELETE invoice
```

([GitHub][1])

Я бы пересмотрел саму бизнес-семантику.

Если invoice был:

```text
ISSUED
```

его, возможно, **вообще нельзя физически удалять**.

Нужно:

```text
CANCELED
```

и audit.

---

# 117. FINANCIAL IMMUTABILITY

Особенно:

```text
PAID invoice
```

не должен редактироваться как обычная сущность.

Например:

```text
amount
currency
client
```

после PAID должны быть immutable.

Если correction:

```text
credit note
replacement invoice
adjustment
```

а не:

```text
UPDATE invoice SET amount=...
```

---

# 118. ЭТО ОДИН ИЗ ГЛАВНЫХ BUSINESS SECURITY GAPS

Сейчас E2E показывает:

> client invoice lifecycle, включая корректировку суммы и перевод в PAID. ([GitHub][1])

Для MVP нормально.

Для настоящего accounting platform:

**это надо пересмотреть.**

---

# 119. CURRENCY

Нужно формализовать:

```text
currency
```

не подразумевать:

```text
KZT
```

даже если сейчас только Казахстан.

Лучше:

```text
currency = KZT
```

и:

```text
amount = BigDecimal
```

---

# 120. TAX

Если это бухгалтерский SaaS, со временем появятся:

```text
VAT
tax rate
tax inclusive/exclusive
invoice lines
discount
subtotal
tax
total
```

Поэтому Invoice:

```text
amount
```

очень скоро станет недостаточно.

---

# 121. INVOICE LINE MODEL

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
 └── InvoiceLine[]
       ├── description
       ├── quantity
       ├── unitPrice
       ├── taxRate
       └── amount
```

---

# 122. SUBSCRIPTIONS

Subscription есть.

Но нужна проверка:

```text
overlapping subscriptions
```

В coverage plan как раз предлагается тестировать overlapping dates → 409. ([GitHub][9])

Это хорошо.

Но database constraint тоже желателен, если бизнес-правило критично.

---

# 123. DATABASE CONSTRAINTS

Не полагаться только на:

```java
if (...)
```

Нужно максимально переносить инварианты в DB:

```text
UNIQUE
NOT NULL
CHECK
FK
INDEX
```

Например:

```text
invoice number unique per tenant
email unique
subscription overlap
audit immutable
provider transaction id unique
```

---

# 124. INDEXES

В проекте заявлены индексы для pagination.

Но я бы провёл отдельный DB index audit:

```text
WHERE
JOIN
ORDER BY
UNIQUE
FK
```

и проверить:

```sql
EXPLAIN ANALYZE
```

на всех hot queries.

---

# 125. QUERY OBSERVABILITY

В production нельзя просто смотреть:

```text
request = 500ms
```

Нужно понимать:

```text
HTTP 500ms
 ├── DB 420ms
 │    ├── query 1 20ms
 │    ├── query 2 300ms
 │    └── query 3 100ms
 └── serialization 80ms
```

OpenTelemetry как раз может здесь сильно помочь.

---

# 126. ARCHITECTURE DOCUMENTATION

`ARCHITECTURE.md` хороший, но слишком верхнеуровневый.

Нужны отдельные:

```text
ADR/
  001-modular-monolith.md
  002-jwt.md
  003-postgresql.md
  004-file-storage.md
  005-websocket.md
  006-multi-tenancy.md
```

---

# 127. ADR — ОЧЕНЬ РЕКОМЕНДУЮ

Особенно потому что проект развивается очень быстро.

Через 6 месяцев никто не вспомнит:

> почему именно modular monolith?

ADR решает проблему.

---

# 128. CURRENT ARCHITECTURAL DRIFT

Я бы составил автоматическую проверку:

```text
README claims
       ↓
actual build.gradle
       ↓
package.json
       ↓
docker-compose
       ↓
CI
       ↓
production
```

И CI должен ловить:

```text
README says Boot 3
build says Boot 4
```

---

# 129. PROJECT MANAGEMENT

Сейчас Issues:

```text
Kaspi
WebKassa
```

([GitHub][11])

Но проекту нужен полноценный roadmap:

```text
MVP
RC
1.0
1.1
2.0
```

---

# 130. EPIC SYSTEM

Есть `Epics/`, что хорошо. ([GitHub][1])

Но я бы сделал:

```text
Epic
 ↓
Business outcome
 ↓
Acceptance criteria
 ↓
API
 ↓
DB changes
 ↓
Tests
 ↓
Observability
```

То есть feature считается готовой только когда:

```text
code + tests + docs + monitoring
```

---

# 131. DEFINITION OF DONE

Например:

```text
[ ] Backend implemented
[ ] Frontend implemented
[ ] RBAC tested
[ ] IDOR tested
[ ] Unit tests
[ ] Integration test
[ ] E2E
[ ] Migration
[ ] Rollback plan
[ ] Metrics
[ ] Logging
[ ] Documentation
```

---

# 132. SECURITY MATURITY

Я бы оценил:

### Authentication

**8.5/10**

### Authorization

**8.5/10**

### Data isolation

**8/10**

### File security

**8/10**

### Audit

**9/10**

### Secrets

**7/10**

### WebSocket

**6.5–7/10 пока не доказан ACL**

### Dependency security

**6.5/10**

### Incident response

**6/10**

---

# 133. Самая большая security-проблема

Не вижу сейчас одну очевидную:

> "RCE!!!"

или:

> "SQL injection!!!"

Это было бы неправильно утверждать по публичному статическому аудиту.

Основной риск другой:

> **complexity-driven authorization bug.**

Чем больше сущностей:

```text
User
Client
Task
Invoice
Document
Course
Chat
Notification
Subscription
```

тем выше вероятность, что один endpoint забудет:

```text
assertCanRead()
```

или:

```text
tenant check
```

---

# 134. Поэтому нужен CENTRAL ACCESS MODEL

Например:

```java
access.canRead(user, resource)
access.canWrite(user, resource)
access.canDelete(user, resource)
```

и обязательная политика:

> Ни один controller не должен самостоятельно решать resource ownership.

---

# 135. BATCH ENDPOINTS — ОСОБЫЙ РИСК

Есть:

```text
batch update
batch stage
```

([GitHub][9])

Batch endpoints опаснее обычных.

Проверять нужно:

```text
task #1 → own
task #2 → own
task #3 → foreign
```

и что произойдёт.

Не должно быть:

```text
частично применили
+
частично не применили
```

без чёткой семантики.

---

# 136. ATOMICITY

Для batch:

### вариант 1

all-or-nothing:

```text
10 tasks
1 unauthorized
→ rollback all
```

### вариант 2

partial success:

```json
{
  "success": [...],
  "failed": [...]
}
```

Но это должно быть **явно определено**.

---

# 137. RACE CONDITIONS

Особенно опасны:

```text
Task assignment
Invoice payment
Subscription
Task stage
Unread counter
Refresh token
```

Например:

```text
employee A picks task
employee B picks task
```

Оба одновременно.

Должен выиграть только один.

Это должно защищаться:

```text
optimistic locking
```

или:

```text
SELECT FOR UPDATE
```

или:

```text
atomic UPDATE ... WHERE status='OPEN'
```

---

# 138. OPTIMISTIC LOCKING

Для:

```text
Task
Invoice
Subscription
```

можно использовать:

```java
@Version
```

где уместно.

Тогда:

```text
version 10
```

и второй update на version 10 падает корректно.

---

# 139. CHAT COUNTERS

Unread counter:

```text
message
 ↓
unread++
```

может иметь race.

Нужно убедиться, что используется atomic DB operation.

---

# 140. LMS PROGRESS

То же:

```text
complete lesson
```

должно быть idempotent.

В тестовом плане это уже предусмотрено:

> повторное completion должно быть идемпотентным. ([GitHub][9])

Отлично.

---

# 141. FRONTEND DATA MODEL

TanStack Query — хороший выбор.

Особенно:

```text
server state
```

не нужно дублировать в Redux.

Это уменьшает complexity.

---

# 142. ZOD

Использование Zod — плюс.

Но желательно иметь:

```text
API contract
```

и не дублировать schema:

```text
Java DTO
+
TypeScript interface
+
Zod
```

три раза вручную.

---

# 143. ИДЕАЛЬНО — OPENAPI → TYPES

Backend OpenAPI уже есть.

Можно генерировать frontend types:

```text
OpenAPI
 ↓
TypeScript client
 ↓
React Query
```

Это сильно уменьшит API drift.

---

# 144. API CONTRACT

Это один из самых полезных будущих improvements.

Например:

```text
backend changes InvoiceStatus
↓
OpenAPI
↓
frontend generated types
↓
TS compilation fails
```

И bug ловится до production.

---

# 145. FRONTEND DEPLOYMENT

GitHub Pages + SPA fallback через:

```text
404.html
```

([GitHub][1])

Рабочий hack.

Но для B2B SaaS я предпочёл бы:

```text
Cloudflare Pages
Vercel
Netlify
S3 + CloudFront
```

если появятся требования к:

* headers;
* edge;
* custom domains;
* redirects;
* security;
* preview environments.

---

# 146. CURRENT DEPLOYMENT IS GOOD FOR MVP

Не нужно сейчас менять всё.

GitHub Pages:

**cheap + reliable + simple.**

Это хорошее решение на текущей стадии.

---

# 147. PREVIEW ENVIRONMENTS

Очень рекомендую:

```text
PR
 ↓
frontend preview
 ↓
backend ephemeral environment
 ↓
E2E
```

Это будет следующий уровень CI/CD.

---

# 148. STAGING

Сейчас особенно не хватает явного:

```text
staging
```

Pipeline:

```text
main
 ↓
build
 ↓
tests
 ↓
staging
 ↓
E2E
 ↓
manual approval
 ↓
production
```

Для финансового приложения это лучше, чем:

```text
main → production
```

---

# 149. DEPLOYMENT STRATEGY

Нужны:

```text
rollback
healthcheck
readiness
startup
migration strategy
```

Особенно:

### DB migration

Если новый backend несовместим со старой схемой:

```text
deploy fails
```

Нужна backward-compatible migration:

```text
expand
 ↓
deploy
 ↓
migrate data
 ↓
contract
```

---

# 150. FLY.IO

Fly.io вполне нормален для текущего масштаба.

Но:

> не надо считать Fly инфраструктурной архитектурой.

Это просто execution platform.

Настоящая архитектура:

```text
compute
database
storage
queue
observability
backup
DNS
secrets
```

---

# 151. DATA STORAGE

Как я писал выше:

**Postgres BLOB + filesystem** я бы постепенно заменил.

Целевая архитектура:

```text
PostgreSQL
    │
    ├── metadata
    └── audit

Object Storage
    │
    └── documents
```

---

# 152. DOCUMENT VERSIONING

Для бухгалтерской системы это очень полезно:

```text
Document
 ↓
v1
v2
v3
```

а не:

```text
overwrite file
```

Нужны:

```text
created_by
created_at
version
checksum
parent_document
```

---

# 153. CHECKSUM

Для файлов:

```text
SHA-256
```

чтобы:

* обнаруживать corruption;
* дедуплицировать;
* подтверждать целостность;
* проверять скачивание.

---

# 154. AUDIT + DOCUMENTS

Идеально:

```text
Document uploaded
 ↓
SHA-256
 ↓
Audit event
 ↓
Document approved
 ↓
Audit event
 ↓
Downloaded
 ↓
Audit event
```

Для чувствительных документов это очень полезно.

---

# 155. PERSONAL DATA

В проекте уже есть `[PROTECTED]` masking в audit. ([GitHub][1])

Хорошо.

Но нужен formal PII inventory:

```text
email
phone
IIN
BIN
address
documents
financial info
```

и классификация:

```text
public
internal
confidential
highly confidential
```

---

# 156. LOGGING

Никогда не логировать:

```text
JWT
refresh token
password
TOTP secret
document contents
financial sensitive fields
```

Нужен automated log sanitizer.

---

# 157. GDPR-LIKE DATA LIFECYCLE

Даже если конкретная юрисдикция другая, архитектурно полезно иметь:

```text
retention policy
```

например:

```text
audit → 7 years
documents → X years
logs → 90 days
sessions → 30 days
```

---

# 158. BUSINESS CONTINUITY

Для бухгалтерской компании это важно.

Нужно определить:

```text
Что происходит если Fly.io недоступен?
Что происходит если DB повреждена?
Что происходит если Telegram недоступен?
Что происходит если SMTP недоступен?
Что происходит если object storage недоступен?
```

---

# 159. GRACEFUL DEGRADATION

Например:

```text
Telegram DOWN
```

не должен ломать:

```text
create task
```

или:

```text
invoice
```

---

# 160. CURRENT PROJECT ALREADY MOVES IN THIS DIRECTION

История commits показывает отдельные fixes:

```text
mail hardening
security audit
N+1
JWT
rate limiting
security headers
database
E2E
```

([GitHub][5])

Это очень хороший признак engineering culture.

---

# 161. ПРОЕКТ НЕ СТРАДАЕТ ОТ "FEATURE-ONLY DEVELOPMENT"

И это, пожалуй, один из лучших выводов аудита.

Видно не только:

```text
feat:
```

но и:

```text
fix(security)
fix(perf)
fix(db)
fix(auth)
fix(ci)
fix(ops)
test
docs
refactor
```

Это уже правильный development lifecycle.

---

# 162. НО НУЖНО СНИЖАТЬ VELOCITY

Сейчас разработка слишком активная.

Я бы ввёл:

```text
weekly release
```

а не:

```text
каждый push → production
```

---

# 163. CODE QUALITY

Плюсы:

* modular packages;
* DTO;
* services;
* access services;
* tests;
* FSD;
* Gradle;
* Flyway.

Минусы:

* вероятная service complexity;
* много cross-module interactions;
* риск большого `common`;
* documentation drift.

---

# 164. COMMON PACKAGE — ПОТЕНЦИАЛЬНЫЙ РИСК

В архитектуре:

```text
common/
```

([GitHub][1])

Следить, чтобы туда не превратился:

```text
"сюда кладём всё, что не знаем куда положить"
```

Если `common` разрастается — это architectural smell.

---

# 165. MODULE BOUNDARIES

Я бы добавил ArchUnit.

Например:

```text
auth
  cannot access
crm internal classes

billing
  cannot access
crm repositories directly
```

Разрешать только:

```text
public application interfaces
domain events
```

---

# 166. ARCHUNIT

Очень рекомендую.

Например:

```java
classes()
  .that().resideInAPackage("..billing..")
  .should().onlyDependOnClassesThat()
  ...
```

Это позволит сохранить modular monolith действительно modular.

---

# 167. CURRENT MODULAR MONOLITH CAN DECAY

Это один из главных рисков.

Сегодня:

```text
modules/
  auth
  crm
  billing
```

Через год:

```text
billing → crm → auth → documents → courses → common
```

и всё становится связанным со всем.

ArchUnit предотвратит это.

---

# 168. API DESIGN

Versioning:

```text
/api/v1
```

— правильно. ([GitHub][10])

Но нужно:

```text
deprecation policy
```

Например:

```text
v1
 ↓
v2
```

не ломать клиентов.

---

# 169. ERROR CONTRACT

Нужен единый:

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

---

# 170. 409 vs 422

Я бы формализовал.

Например:

```text
400 malformed JSON
422 valid JSON but business validation failed
409 state conflict
```

Это делает API очень предсказуемым.

---

# 171. 500 НЕЛЬЗЯ ИСПОЛЬЗОВАТЬ ДЛЯ VALIDATION

В verification report уже есть пример enum → 500. ([GitHub][4])

Это надо исправить.

---

# 172. API DOCUMENTATION

Swagger существует.

Но:

> Swagger UI доступен только ADMIN. ([GitHub][3])

Для internal system это может быть разумно.

Но можно иметь:

```text
public contract
```

без чувствительных endpoints.

---

# 173. HEALTH CHECK

Есть:

```text
/actuator/health
```

и E2E его проверяет. ([GitHub][1])

Хорошо.

Но health должен различать:

```text
liveness
readiness
```

Например:

```text
DB unavailable
```

не обязательно означает:

```text
process dead
```

---

# 174. STARTUP CHECKS

При startup желательно проверить:

```text
DB
Flyway
required secrets
storage
external dependencies
```

но не делать приложение зависимым от:

```text
Telegram
SMTP
Google
```

если они не критичны.

---

# 175. DEPENDENCY HEALTH

Нужны metrics:

```text
DB
SMTP
Google
Telegram
object storage
```

и отдельные alarms.

---

# 176. FRONTEND ERROR MONITORING

Sentry уже присутствует в dependencies и CI. ([GitHub][12])

Это плюс.

Но обязательно:

```text
source maps
release version
environment
user role
trace ID
```

и не отправлять PII без необходимости.

---

# 177. BACKEND SENTRY

В `build.gradle` Sentry пока закомментирован из-за несовместимости с Boot 4.1. ([GitHub][2])

То есть:

> frontend Sentry есть, backend Sentry пока нет.

Это пробел observability.

Но если OTEL уже работает, это частично компенсируется.

---

# 178. OTEL — ПРАВИЛЬНЫЙ ПУТЬ

Я бы не обязательно возвращал Sentry.

Можно построить:

```text
OpenTelemetry
 ↓
collector
 ↓
Grafana
Tempo
Prometheus
Loki
```

и получить полноценный observability stack.

---

# 179. LOAD TESTING — НУЖЕН REALISTIC DATA

Нагрузка на public endpoint мало говорит о:

```text
CRM
billing
documents
chat
```

Нужен seed:

```text
10k clients
100k tasks
1m audit records
100k documents metadata
```

и реальные query patterns.

---

# 180. BIGGEST DATABASE QUESTION

Как ведёт себя:

```text
audit
```

при:

```text
10 million rows?
```

Если:

```text
GET /audit?page=...
```

нужно:

```text
index
partition
cursor pagination
```

в зависимости от объёма.

---

# 181. OFFSET PAGINATION

`Pageable` отлично работает на средних объёмах.

Но:

```text
OFFSET 900000
```

становится дорогим.

Для:

```text
audit
chat
notifications
```

может потребоваться:

```text
cursor pagination
```

---

# 182. CHAT HISTORY

Для больших историй:

```text
WHERE created_at < cursor
ORDER BY created_at DESC
LIMIT 50
```

лучше, чем:

```text
OFFSET
```

---

# 183. AUDIT PARTITIONING

В перспективе:

```text
audit_log_2026_09
audit_log_2026_10
```

или PostgreSQL range partitioning.

Это может сильно упростить retention.

---

# 184. DATABASE BACKUP + AUDIT

Нужно также подумать:

> должен ли audit backup храниться отдельно от primary DB?

Для tamper resistance:

```text
DB
+
immutable object storage backup
```

лучше.

---

# 185. SUPPLY CHAIN SECURITY

Сейчас проект имеет большое количество dependencies.

Нужны:

```text
Dependabot/Renovate
OSV
Snyk/GitHub dependency scanning
Trivy
SBOM
```

---

# 186. SBOM

На release:

```text
JF-1C 1.0.0
 ↓
SBOM
 ↓
CycloneDX
```

Это уже enterprise-grade practice.

---

# 187. CONTAINER SCANNING

Docker image:

```text
eclipse-temurin:17-jre-alpine
```

([GitHub][7])

Нужно регулярно проверять:

```text
CVEs
```

---

# 188. PINNING

Лучше не использовать:

```text
redis:latest
```

как сейчас в Compose. ([GitHub][6])

Всегда:

```text
redis:7.x-alpine
```

или digest.

---

# 189. POSTGRES IMAGE

Тоже:

```text
postgres:17-alpine
```

конкретная версия.

---

# 190. REPRODUCIBLE BUILD

Backend Gradle wrapper есть.

Frontend lockfile используется в CI:

```text
npm ci
```

([GitHub][14])

Это хорошо.

---

# 191. FRONTEND DEPLOY SCRIPT

В `package.json` прямо прописан Google Client ID. ([GitHub][12])

Client ID не является секретом сам по себе.

Но лучше всё равно:

```text
VITE_GOOGLE_CLIENT_ID
```

из environment.

CI уже это поддерживает. ([GitHub][14])

---

# 192. CURRENT CI IS BETTER THAN README

Это важный вывод.

По факту CI уже делает:

```text
lint
typecheck
test
build
```

([GitHub][14])

А старый `TEST_COVERAGE_PLAN` описывает отсутствие lint как baseline. ([GitHub][9])

Значит часть документации **уже устарела относительно CI**.

---

# 193. НУЖНО УБРАТЬ СТАРЫЕ AUDITS

Если есть:

```text
old audit
new audit
old coverage
new coverage
```

они начинают противоречить друг другу.

Нужен:

```text
CURRENT_STATE.md
```

который автоматически обновляется или регулярно пересматривается.

---

# 194. МНЕ НРАВИТСЯ SYSTEM_VERIFICATION_REPORT

Потому что он документирует **реальные баги**, например:

```text
generated identity
enum
foreign keys
```

([GitHub][4])

Такие документы гораздо ценнее маркетингового:

> "Enterprise-grade architecture."

---

# 195. НЕ НРАВИТСЯ ФРАЗА "100% GREEN"

В README:

```text
243 tests
100% GREEN
```

([GitHub][1])

Это звучит хорошо.

Но профессионально лучше:

```text
243 tests passed in latest CI run
```

с commit SHA.

Потому что:

```text
100% green
```

не означает:

```text
100% coverage
100% security
100% production readiness
```

---

# 196. ПРОЕКТ НУЖНО ОТДЕЛИТЬ ОТ TEST SUITE

Сейчас есть риск:

```text
test suite passes
→ project is good
```

Нужно:

```text
functional correctness
security
performance
reliability
observability
operability
business correctness
```

отдельно.

---

# 197. BUSINESS CORRECTNESS — САМАЯ СЛАБАЯ ЧАСТЬ

Технические тесты выглядят неплохо.

Но финансовый продукт требует:

```text
accounting invariants
```

Например:

```text
invoice total
tax
payment
refund
cancel
overdue
reconciliation
```

Это пока выглядит менее зрелым, чем security/engineering layer.

---

# 198. ЧТО Я БЫ НЕ ТРОГАЛ

Очень важно.

Я **не стал бы сейчас менять**:

```text
Spring Boot
React
PostgreSQL
Gradle
FSD
TanStack Query
modular monolith
Flyway
```

Это хорошие решения.

---

# 199. ЧТО Я БЫ ТРОГАЛ ПЕРВЫМ

### P0

1. **PostgreSQL 15 → 17 в Compose**
2. Убрать config drift.
3. WebSocket ACL.
4. Финализировать refresh-token security.
5. Enum 500 → 400.
6. Security.md.
7. Secrets/default credentials.
8. Проверить tenant isolation.
9. Coverage gate.
10. Restore drill.

---

# 200. P1

11. OpenAPI → TypeScript generation.
12. ArchUnit.
13. distributed rate limiting.
14. distributed scheduler lock.
15. outbox.
16. object storage.
17. invoice state machine.
18. financial immutability.
19. idempotency.
20. optimistic locking.

---

# 201. P2

21. cursor pagination.
22. audit partitioning.
23. SBOM.
24. dependency scanning.
25. container scanning.
26. staging.
27. preview environments.
28. ADR.
29. release/versioning.
30. proper DR.

---

# 202. P0 — ЧТО МОЖЕТ РЕАЛЬНО УБИТЬ ПРОЕКТ

Если оставить как есть и проект станет успешным:

### №1

**Authorization bug.**

Не SQL injection.

Не React.

Именно:

```text
client A sees client B
```

или:

```text
employee A edits B
```

---

### №2

**Financial mutation bug.**

Например:

```text
PAID invoice
→ amount changed
```

---

### №3

**Migration disaster.**

История V117 уже показывает, что это реальный риск. ([GitHub][5])

---

### №4

**WebSocket authorization.**

Особенно private chat.

---

### №5

**Backup that can't restore.**

---

# 203. ЧТО МОЖЕТ УБИТЬ ПРОЕКТ НЕ ТЕХНИЧЕСКИ

### Scope explosion.

Сейчас:

```text
CRM
+
Billing
+
LMS
+
Chat
+
Documents
+
Search
+
Payments
+
Fiscalization
```

Это огромный surface area.

Если продолжать добавлять:

```text
HR
warehouse
accounting
AI
ERP
calendar
...
```

проект превратится в:

> "мы строим всё".

---

# 204. НУЖЕН CORE PRODUCT

Я бы определил:

## Core

```text
Client
Task
Document
Invoice
Payment
Audit
```

## Supporting

```text
Auth
Notifications
Chat
Search
```

## Optional

```text
LMS
```

И всё остальное оценивать относительно core.

---

# 205. PRODUCT MOAT

Самая сильная идея проекта:

> **связать работу бухгалтерской компании в один workflow.**

Не:

```text
CRM отдельно
1C отдельно
WhatsApp отдельно
documents отдельно
invoice отдельно
```

а:

```text
Client
 ↓
Task
 ↓
Document
 ↓
Invoice
 ↓
Payment
 ↓
Audit
```

Вот это и есть настоящий продукт.

---

# 206. Я БЫ НЕ НАЗЫВАЛ ЭТО ПРОСТО CRM

Маркетингово лучше:

> **Financial Operations Platform**

или:

> **B2B Financial Operations & Client Management Platform**

Потому что функционально это уже больше CRM.

---

# 207. ARCHITECTURAL TARGET

Я бы привёл систему примерно к:

```text
                    ┌───────────────┐
                    │   React SPA   │
                    └───────┬───────┘
                            │
                     HTTPS / WSS
                            │
              ┌─────────────▼─────────────┐
              │      API / Security       │
              │ JWT / RBAC / ABAC / 2FA   │
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │      Modular Monolith     │
              │                           │
              │ Auth                      │
              │ CRM                       │
              │ Documents                 │
              │ Billing                   │
              │ Payments                  │
              │ LMS                       │
              │ Chat                      │
              │ Notifications             │
              │ Audit                     │
              └─────┬─────────────┬───────┘
                    │             │
             ┌──────▼─────┐ ┌────▼────────┐
             │ PostgreSQL │ │ ObjectStore │
             └────────────┘ └─────────────┘
                    │
             ┌──────▼──────┐
             │ Outbox      │
             │ Events      │
             └──────┬──────┘
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
       Email     Telegram   WebSocket
```

---

# 208. TARGET SECURITY

```text
                 Internet
                     │
                CDN / WAF
                     │
                Rate Limit
                     │
                  API
                     │
        ┌────────────┴────────────┐
        │ Authentication          │
        │ JWT + Refresh + 2FA     │
        └────────────┬────────────┘
                     │
                Authorization
              RBAC + ABAC + RLS
                     │
              ┌──────▼──────┐
              │   Domain    │
              │ invariants  │
              └──────┬──────┘
                     │
              PostgreSQL
                     │
                 RLS/FK
                     │
               Immutable Audit
```

---

# 209. TARGET CI

```text
PR
 │
 ├── formatting
 ├── lint
 ├── typecheck
 ├── unit tests
 ├── integration tests
 ├── architecture tests
 ├── security scan
 ├── dependency scan
 ├── coverage gate
 ├── build
 ├── container scan
 └── E2E
       │
       ▼
   STAGING
       │
       ▼
   smoke tests
       │
       ▼
   approval
       │
       ▼
  PRODUCTION
```

---

# 210. МОЙ ИТОГ ПО КАЖДОМУ СЛОЮ

## Architecture

**8.5/10**

Очень хороший modular monolith.

---

## Backend

**8.5/10**

Современный Spring stack, хорошая декомпозиция.

---

## Frontend

**8/10**

FSD + React Query + TS — правильный фундамент.

---

## Security

**8/10**

Очень серьёзная работа уже проведена.

Но complexity всё ещё создаёт риски.

---

## Database

**8/10**

PostgreSQL + Flyway + constraints — хорошо.

Но migration discipline и environment parity нужно улучшать.

---

## Testing

**7.5/10**

Очень много правильных тестов.

Но пока:

> количество > глубина.

---

## CI/CD

**8/10**

Для такого проекта — хорошо.

---

## Observability

**7/10**

Стек есть.

Operational maturity ещё можно сильно повысить.

---

## Documentation

**7.5/10**

Документации много.

Но она **заметно расходится с текущим кодом**.

---

## Product

**8.5/10**

Самая сильная сторона — связность бизнес-процессов.

---

## Production readiness

**7/10**

Можно эксплуатировать в контролируемом окружении.

Но я бы не объявлял:

> "enterprise financial production ready"

пока не закрыты:

* WebSocket ACL;
* financial invariants;
* migration discipline;
* DR restore;
* tenant isolation;
* distributed concerns;
* storage;
* payment/fiscalization;
* security policy.

---

# 211. МОЙ САМЫЙ ВАЖНЫЙ ВЫВОД

Если отбросить всё второстепенное:

**JF-1C уже находится на довольно высоком инженерном уровне для одного активно развиваемого проекта.**

Особенно впечатляют:

* modular monolith;
* RBAC;
* IDOR remediation;
* immutable audit;
* JWT rotation;
* rate limiting;
* security headers;
* Flyway;
* N+1 remediation;
* E2E;
* Artillery;
* CI;
* backup automation;
* FSD;
* i18n;
* observability.

Это не выглядит как проект, который просто "написали и забыли".

История Actions показывает последовательные security/performance/DB/auth/CI работы, включая отдельные security audit passes и исправление N+1. ([GitHub][5])

---

# 212. НО ЕСТЬ ОЧЕНЬ ВАЖНАЯ ОГОВОРКА

**Я не буду притворяться, что это полноценный line-by-line source-code security audit.**

GitHub web-доступ в этой сессии позволил мне глубоко посмотреть публичную структуру, документацию, конфигурацию, SecurityConfig, build system, CI/CD и отдельные артефакты, но не дал мне нормально скачать весь repository для локального статического анализа.

Поэтому я **не утверждаю**, например:

> "SQL injection отсутствуют во всём проекте"

или:

> "IDOR отсутствуют во всех 100+ endpoints".

Это можно доказать только полноценным code-level audit с доступом ко всему исходному дереву.

---

# 213. И ВОТ ГДЕ Я БЫ ПРОВЁЛ ВТОРОЙ ЭТАП

Если задача — реально **разъебать проект до уровня профессионального аудита**, следующий аудит должен быть уже не архитектурным, а:

### FULL SOURCE CODE AUDIT

Проверить буквально:

```text
1. every Controller
2. every endpoint
3. every Service
4. every Repository
5. every Entity
6. every DTO
7. every Flyway migration
8. every Security rule
9. every WebSocket handler
10. every file upload path
11. every SQL query
12. every external integration
13. every scheduled job
14. every transaction
15. every test
16. every CI workflow
17. every Docker layer
18. every dependency
19. every secret
20. every authorization boundary
```

И построить таблицу:

```text
ID | Severity | File | Line | Problem | Exploit | Fix | Test
```

Например:

```text
SEC-001 | CRITICAL
InvoiceController
PUT /billing/invoices/{id}
CLIENT mutation
...
```

или:

```text
PERF-014 | HIGH
ChatMessageRepository
N+1
...
```

или:

```text
DB-009 | HIGH
V121
FK mismatch
...
```

---

# 214. А ЕСЛИ СОВСЕМ КОРОТКО

Мой вердикт:

> **JF-1C — сильный, необычно амбициозный modular-monolith проект с уже проведённым security/performance hardening. Его сильнейшая сторона — инженерный подход, а не количество CRUD-фич. Главная слабость — проект развивается быстрее, чем синхронизируются документация, инфраструктура и formal production guarantees.**

И отдельно:

> **Я бы не переписывал архитектуру. Я бы её стабилизировал.**

То есть не:

```text
"давайте микросервисы"
```

а:

```text
"давайте доведём существующий modular monolith до железобетонного состояния".
```

И именно после этого уже:

```text
Kaspi
→ WebKassa
→ payments
→ object storage
→ outbox
→ staging
→ DR
→ 1.0
```

становятся естественными следующими шагами.

([GitHub][1])

Если хочешь, я могу следующим сообщением сделать **вторую часть — brutal code audit JF-1C: endpoint-by-endpoint / module-by-module с рейтингом CRITICAL/HIGH/MEDIUM/LOW и конкретными местами, которые надо чинить в первую очередь**.

[1]: https://github.com/MrSgemaSeny/JF-1C "GitHub - MrSgemaSeny/JF-1C: Internal CRM platform for a financial company — client and task management, role-based access control. · GitHub"
[2]: https://github.com/MrSgemaSeny/JF-1C/blob/main/zhan-finance-backend/build.gradle "JF-1C/zhan-finance-backend/build.gradle at main · MrSgemaSeny/JF-1C · GitHub"
[3]: https://github.com/MrSgemaSeny/JF-1C/blob/main/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/common/config/SecurityConfig.java "JF-1C/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/common/config/SecurityConfig.java at main · MrSgemaSeny/JF-1C · GitHub"
[4]: https://github.com/MrSgemaSeny/JF-1C/blob/main/docs/SYSTEM_VERIFICATION_REPORT.md "JF-1C/docs/SYSTEM_VERIFICATION_REPORT.md at main · MrSgemaSeny/JF-1C · GitHub"
[5]: https://github.com/MrSgemaSeny/JF-1C/actions/workflows/deploy-backend.yml "Deploy Backend to Fly.io · Workflow runs · MrSgemaSeny/JF-1C · GitHub"
[6]: https://github.com/MrSgemaSeny/JF-1C/blob/main/docker-compose.yml "JF-1C/docker-compose.yml at main · MrSgemaSeny/JF-1C · GitHub"
[7]: https://github.com/MrSgemaSeny/JF-1C/blob/main/zhan-finance-backend/Dockerfile "JF-1C/zhan-finance-backend/Dockerfile at main · MrSgemaSeny/JF-1C · GitHub"
[8]: https://github.com/MrSgemaSeny/JF-1C/blob/main/docs/RUNBOOK.md "JF-1C/docs/RUNBOOK.md at main · MrSgemaSeny/JF-1C · GitHub"
[9]: https://github.com/MrSgemaSeny/JF-1C/blob/main/TEST_COVERAGE_PLAN.md "JF-1C/TEST_COVERAGE_PLAN.md at main · MrSgemaSeny/JF-1C · GitHub"
[10]: https://github.com/MrSgemaSeny/JF-1C/blob/main/docs/ARCHITECTURE.md "JF-1C/docs/ARCHITECTURE.md at main · MrSgemaSeny/JF-1C · GitHub"
[11]: https://github.com/MrSgemaSeny/JF-1C/issues "Issues · MrSgemaSeny/JF-1C · GitHub"
[12]: https://github.com/MrSgemaSeny/JF-1C/blob/main/zhan-finance-frontend/package.json "JF-1C/zhan-finance-frontend/package.json at main · MrSgemaSeny/JF-1C · GitHub"
[13]: https://github.com/MrSgemaSeny/JF-1C/actions "Workflow runs · MrSgemaSeny/JF-1C · GitHub"
[14]: https://github.com/MrSgemaSeny/JF-1C/actions/runs/34940988260/workflow "fix(i18n): fix calendarPage namespace and robust Kazakh date formatting · MrSgemaSeny/JF-1C@c670e88 · GitHub"
[15]: https://github.com/MrSgemaSeny/JF-1C/security "Overview · MrSgemaSeny/JF-1C · GitHub"
