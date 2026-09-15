# План реализации: Hardening JF-1C по итогам аудита

**Дата**: 15 сентября 2026  
**Основание**: [full_audit_chatgpt_1.md](file:///C:/Users/murat/IdeaProjects/JF-1C/docs/reports/full_audit_chatgpt_1.md) + [full_audit_chatgpt_2.md](file:///C:/Users/murat/IdeaProjects/JF-1C/docs/reports/full_audit_chatgpt_2.md)  
**Контекст**: CONTEXT.md — R2 уже провижн, WebSocket ACL тесты есть в бэкенде, 168 frontend тестов.

> [!IMPORTANT]
> Цель — не переписывать архитектуру. Цель — **стабилизировать и доказать корректность** существующего modular monolith.

---

## Актуализация по CONTEXT.md

Следующие пункты из аудита **частично или полностью закрыты** по состоянию CONTEXT.md:

| Пункт аудита | Статус |
|---|---|
| WebSocket ACL тесты | Частично — бэкенд покрыт, но нужна финальная проверка |
| Object Storage (Cloudflare R2) | Провижн, но не интегрирован в DocumentService |
| Frontend tests | 168 Vitest тестов, strict TS, ESLint clean |
| i18n | 4 языка, 96/96 parity tests |

---

## P0 — Критические (делать в первую очередь)

Блокируют использование в production финансовой системой.

| # | Задача | Файлы / область | Трудоёмкость | Epic |
|---|---|---|---|---|
| P0-1 | **Refresh-token lifecycle audit** — проверить reuse detection, replay protection, stolen token, session revocation при смене пароля | `AuthService`, `RefreshTokenService`, auth tests | M (3-5ч) | Epic-09 |
| P0-2 | **PAID invoice immutability** — запретить PUT/PATCH на PAID/CANCELED invoice; изменения только через credit note | `InvoiceService`, `InvoiceController`, Flyway V122+ | M (4-6ч) | Epic-21 / Billing |
| P0-3 | **Invoice state machine** — явные allowed transitions, guard в service | `InvoiceService`, `InvoiceStatus` enum | S (2-3ч) | Billing |
| P0-4 | **Enum → HTTP 400** — глобальный `@ExceptionHandler` на `HttpMessageNotReadableException` / `InvalidFormatException` | `GlobalExceptionHandler` | S (1-2ч) | Crosscut |
| P0-5 | **PostgreSQL 17 в docker-compose** — синхронизировать с production | `docker-compose.yml` | XS (30мин) | DevOps |
| P0-6 | **Flyway discipline** — добавить CI-шаг: validate checksums перед деплоем | `.github/workflows/`, `build.gradle` | S (1-2ч) | CI/CD |
| P0-7 | **Backup restore drill** — написать runbook + CI workflow, который restore-ит dump на ephemeral PG и прогоняет smoke tests | `.github/workflows/restore-test.yml`, `docs/RUNBOOK.md` | M (4-6ч) | DevOps |
| P0-8 | **SECURITY.md** — создать файл с vulnerability reporting process | `SECURITY.md` | XS (30мин) | Docs |
| P0-9 | **Default secrets fail-fast** — startup validation JWT_SECRET != "change-me..." | `SecurityConfig` или Application listener | XS (30мин) | Security |
| P0-10 | **Documentation drift → CURRENT_STATE.md** — актуальный стек, версии, known limitations | `CURRENT_STATE.md` | S (1-2ч) | Docs |
| P0-11 | **Coverage gate в CI** — JaCoCo threshold: global 70%, auth/billing/security 90% | `build.gradle`, CI | S (2-3ч) | CI/CD |
| P0-12 | **WebSocket ACL финальная проверка** — убедиться: senderId берётся из Principal, а не из body; чужой topic = reject | `ChatController`, `ChatWebSocketHandler`, существующие тесты | S (2-3ч) | Security |

**Итого P0**: ~25-40 часов разработки

---

## P1 — Архитектурный долг (следующая итерация)

Влияют на надёжность и maintainability в production.

| # | Задача | Файлы / область | Трудоёмкость | Epic |
|---|---|---|---|---|
| P1-1 | **Task state machine** — `TaskStateMachine` с явными transitions + permission rules per role | `TaskService`, новый `TaskStateMachine` | M (4-6ч) | CRM |
| P1-2 | **Optimistic locking** — `@Version` на `Task`, `Invoice`, `Subscription` | Entity классы, Flyway V123+ | S (2-3ч) | Crosscut |
| P1-3 | **Race condition: Task Pool pickup** — атомарный `UPDATE ... WHERE status='OPEN' AND assigned_to IS NULL` | `TaskService.pickTask()`, Repository query | S (2-4ч) | CRM |
| P1-4 | **Outbox pattern** — вынести Email/Telegram/WebSocket из транзакции в outbox event → worker | `OutboxEvent` entity, `OutboxWorker`, Flyway V124+ | L (8-12ч) | Crosscut |
| P1-5 | **Cloudflare R2 интеграция** — перенести binary storage из DB/filesystem на уже провижн-нутый R2 bucket | `DocumentStorageService`, `DocumentController`, Flyway V125+ | L (8-12ч) | Epic-15 |
| P1-6 | **Idempotency для webhooks** — `provider_transaction_id UNIQUE`, idempotency_key header | `PaymentWebhookController`, Flyway V126+ | M (4-6ч) | Epic-21/Billing |
| P1-7 | **ArchUnit** — тесты на модульные границы: billing не может напрямую обращаться к crm.repository | `ArchitectureTest.java` | S (2-3ч) | Quality |
| P1-8 | **OpenAPI → TypeScript codegen** — настроить `openapi-typescript` в CI, убрать ручные дубли интерфейсов | `package.json`, CI, `src/shared/api/` | M (4-6ч) | Frontend |
| P1-9 | **Distributed scheduler lock** — ShedLock (PG-backed) на deadline scheduler и другие @Scheduled | `build.gradle` (ShedLock dep), `SchedulerConfig`, Flyway V127+ | M (3-5ч) | DevOps |
| P1-10 | **Unified error contract** — единый `ErrorResponse` DTO на все 400/401/403/404/409/422/429/500 | `GlobalExceptionHandler`, `ErrorResponse` | S (2-3ч) | Crosscut |
| P1-11 | **Monetary fields audit** — проверить все `amount` поля: `BigDecimal` + `NUMERIC` в PG, не `double`/`float` | Все Billing entity + Flyway migration если нужно | S (2-3ч) | Billing |
| P1-12 | **Rate limiting distributed** — Bucket4j + PostgreSQL или Redis backend вместо in-memory | `RateLimitConfig`, `build.gradle` | M (4-6ч) | Security |
| P1-13 | **2FA mandatory для ADMIN** — enforce 2FA при логине если role=ADMIN | `AuthService`, `LoginController` | S (2-3ч) | Security |
| P1-14 | **Auto-reopen audit trail** — при TASK_REJECTED писать audit event с reason | `TaskService.reject()`, `AuditService` | XS (1ч) | CRM |
| P1-15 | **Business invariant tests** — тесты уровня "PAID invoice → amount immutable", "double pick task → one winner" | `BillingInvariantTest`, `TaskConcurrencyTest` | M (4-6ч) | Quality |

**Итого P1**: ~65-100 часов разработки

---

## P2 — Долгосрочный roadmap

Важные улучшения, но не блокируют текущую операцию.

| # | Задача | Область | Трудоёмкость |
|---|---|---|---|
| P2-1 | **Staging environment** — Fly.io staging app, отдельные secrets | DevOps | L |
| P2-2 | **Cursor pagination** — audit, chat, notifications (вместо OFFSET) | Backend | M |
| P2-3 | **Audit table partitioning** — range partitioning по месяцу при 10M+ строках | DB | M |
| P2-4 | **SBOM на release** — CycloneDX Gradle plugin | CI/CD | S |
| P2-5 | **Dependabot** — automated dependency updates | GitHub | XS |
| P2-6 | **Container scanning** — Trivy в CI на Docker image | CI/CD | S |
| P2-7 | **ADR** — docs/adr/ с решениями: modular-monolith, jwt, postgresql, r2, websocket | Docs | M |
| P2-8 | **Semver release** — убрать 0.0.1-SNAPSHOT, ввести 0.9.0 + CHANGELOG | Build | S |
| P2-9 | **Document versioning** — version + SHA-256 checksum на документы | Backend + DB | M |
| P2-10 | **Soft delete** — `deleted_at` / `deleted_by` для Invoice, Document, Client | DB + Backend | M |
| P2-11 | **PII inventory** — классификация полей + retention policy | Docs + Backend | M |
| P2-12 | **Log sanitization** — автоматически маскировать JWT/токены/пароли в логах | Infrastructure | S |
| P2-13 | **Backward-compatible migrations** — Expand → Deploy → Contract паттерн | Process | S |
| P2-14 | **Preview environments для PR** — эфемерный deploy на Fly.io | CI/CD | L |
| P2-15 | **Formal DR plan** — RPO/RTO определить + restore drill в CI | Docs + Ops | M |
| P2-16 | **Invoice line model** — `InvoiceLine[]` с quantity, unitPrice, taxRate | DB + Backend | L |
| P2-17 | **File upload hardening** — magic bytes, quarantine state, zip bomb protection | Backend | M |
| P2-18 | **PDF generation limits** — CPU/memory/page count/timeout limits на OpenHTMLToPDF | Backend | S |
| P2-19 | **CORS audit** — проверить: нет `*` при `credentials=true` | SecurityConfig | S |
| P2-20 | **Observability stack** — Grafana + Tempo + Loki поверх OTEL | DevOps | L |

**Итого P2**: ~150+ часов

---

## Epic-привязка

| Epic | Затрагиваемые задачи |
|---|---|
| Epic-09 (2FA) | P0-1, P0-12, P1-13 |
| Billing / Kaspi Pay | P0-2, P0-3, P1-2, P1-6, P1-11, P2-16 |
| Epic-15 (Documents) | P1-5, P2-9, P2-10, P2-17 |
| Epic-21 (1C / Fiscal Hub) | P1-6 |
| CRM / Task Pool | P1-1, P1-3, P1-14 |
| CI/CD | P0-6, P0-7, P0-11, P1-9, P2-4..6, P2-14 |
| Security / CrossCut | P0-4, P0-9, P0-12, P1-4, P1-7, P1-10, P1-12 |
| Docs | P0-8, P0-10, P2-7, P2-8, P2-11, P2-15 |
| Frontend | P1-8 |

---

## Оценка трудоёмкости (сводная)

| Уровень | Задач | Оценка | Когда |
|---|---|---|---|
| P0 | 12 | ~25-40 ч | Сейчас, до следующей фичи |
| P1 | 15 | ~65-100 ч | Следующие 1-2 месяца |
| P2 | 20 | ~150+ ч | Roadmap (квартал+) |

### Размеры задач

| Код | Смысл | Часы |
|---|---|---|
| XS | Конфиг/файл/строки | < 1ч |
| S | Небольшой компонент | 1-3ч |
| M | Средняя задача | 3-6ч |
| L | Большой модуль | 8-12ч |

---

## Порядок выполнения P0 (рекомендуемый)

```text
День 1
  P0-5  PostgreSQL 17 в docker-compose     (XS)
  P0-8  SECURITY.md                        (XS)
  P0-9  Default secrets fail-fast          (XS)
  P0-4  Enum → 400                         (S)

День 2
  P0-10 CURRENT_STATE.md                   (S)
  P0-3  Invoice state machine              (S)
  P0-12 WebSocket senderId → Principal     (S)

День 3-4
  P0-2  PAID invoice immutability          (M)
  P0-11 Coverage gate в CI                (S)

День 5
  P0-1  Refresh-token lifecycle audit      (M)

День 6
  P0-6  Flyway CI validation              (S)
  P0-7  Backup restore drill              (M)
```

---

## Открытые вопросы перед стартом

> [!IMPORTANT]
> 1. **Redis в docker-compose** — оставляем для будущего distributed rate limiting (P1-12) или удаляем сейчас?
> 2. **Outbox pattern** (P1-4) — использовать Spring Events + polling worker или сразу Spring Modulith Outbox?
> 3. **Rate limiting distributed** (P1-12) — Bucket4j + PostgreSQL backend (без Redis dep) или всё-таки Redis?
> 4. **Staged rollout P0** — начинать с XS/S задач (день 1) до согласования порядка P1?
> 5. **Invoice line model** (P2-16) — нужен до Kaspi интеграции или после?
