# Epic-07: Billing

---

## Мета

| Поле | Значение |
|---|---|
| **Домен** | Billing |
| **Роли** | ADMIN / CLIENT |
| **Статус** | Partial |
| **Миграции** | V1__Init_Schema.sql — V22, V128__Billing_Payment_Receipts.sql, V129__Subscription_Add_Pending_Status.sql |
| **Зависит от** | нет зависимостей |
| **Блокирует** | Epic-12 |

---

## Зачем этот эпик

Эпик предоставляет функционал управления услугами компании, подписками клиентов и выпиской инвойсов. Без этого эпика невозможно вести прозрачный учет оказанных услуг, отслеживать оплаты и автоматизировать финансовые взаиморасчеты с клиентами.
В рамках инициативы **Billing v1** реализуется MVP ручной верификации платежей (банковский перевод / Kaspi) с загрузкой PDF-чеков в Cloudflare R2 и автоматической сменой статуса подписки.

---

## Пользовательские истории

| ID | Роль | Хочу | Чтобы | Статус |
|---|---|---|---|---|
| US-07.1 | ADMIN | управлять каталогом услуг и их особенностями | формировать актуальный прайс-лист для клиентов | Done |
| US-07.2 | ADMIN | создавать и отслеживать инвойсы по клиентам | контролировать финансовые поступления и задолженности | Done |
| US-07.3 | CLIENT | видеть свои подписки и выставленные инвойсы | своевременно получать информацию об оплатах | Done |
| US-07.4 | ADMIN | связывать оказываемые услуги с задачами CRM | вести точный учет выполнения работ по каждой услуге | Done |
| US-07.5 | CLIENT | оплачивать инвойсы через Kaspi Pay | быстро совершать платежи в привычном приложении (перенесено в Epic-12) | Planned |
| US-07.6 | CLIENT | оплачивать инвойсы через Halyk Epay | иметь альтернативный способ безналичной оплаты (перенесено в Epic-12) | Planned |
| US-07.7 | ADMIN | отправлять автоматические напоминания об оплате | снизить дебиторскую задолженность клиентов | Planned |
| US-07.8 | CLIENT | скачивать инвойс в формате PDF | сохранять и распечатывать официальные документы на оплату | Done |
| US-07.9 | CLIENT | загружать официальный PDF-чек об оплате тарифа/подписки | подтвердить факт банковского перевода через Kaspi / расчетный счет (Billing v1) | Done |
| US-07.10 | ADMIN | верифицировать загруженные PDF-чеки (подтверждать или отклонять с причиной) | активировать подписку клиента со статусом ACTIVE на 30 дней и переводить инвойс в PAID (Billing v1) | Done |
| US-07.11 | CLIENT | видеть реестр своих платежей и статус модерации чека (AWAITING_REVIEW / CONFIRMED / REJECTED) | отслеживать статус подписки и видеть причину отклонения (Billing v1) | Done |
| US-07.12 | ADMIN / CLIENT | получать push-уведомления в Telegram о загрузке чека, решении администратора и окончании подписки | своевременно реагировать на оплату и продлевать тариф (Billing v1) | Done |

---

## Out of Scope

- Интеграция с эквайрингом Kaspi Pay (API QR/эквайринг) — перенесена в Epic-12
- Интеграция с эквайрингом Halyk Epay — перенесена в Epic-12
- Автоматическая фискализация чеков (WebKassa) — перенесена в Epic-12 / Epic-21

---

## Технические решения

- **InvoiceAccessService и эндпоинт GET /{id}** — централизованная проверка прав доступа к инвойсам. Добавлен эндпоинт `GET /api/v1/invoices/{id}` с `assertCanRead`. Клиенты (`CLIENT`) имеют права строго на чтение (`canRead`) своих счетов; создание и редактирование (`canWrite`, `canCreateFor`) строго ограничено ролями `ADMIN` и `EMPLOYEE`.
- **InvoiceOverdueScheduler** — фоновый процесс по расписанию (cron = "0 0 1 * * *"), который автоматически переводит статус просроченных инвойсов в OVERDUE по часовому поясу Asia/Almaty
- **PdfGeneratorService (OpenHTMLtoPDF + Thymeleaf)** — генерация PDF-версий инвойсов с поддержкой кириллических шрифтов (Arial) на основе HTML-шаблонов и безопасной проверкой наличия шрифтов в classpath
- **Рефакторинг схемы данных (миграция V22)** — переход от сервисных запросов (service_requests) к прямому связыванию подписок и инвойсов с задачами (task_id)
- **Billing v1 (Ручная верификация платежей и Cloudflare R2)**:
  - **Миграции V128 & V129**: создание таблицы `payment_receipts` с поддержкой оптимистичной блокировки `version` (P1-01) и добавление статуса `PENDING` в перечисление статусов подписки `subscriptions`.
  - **PaymentReceiptAccessService**: Row-Level Security контроль доступа к чекам и файлам. Клиент имеет доступ только к своим документам; подтверждение/отклонение чеков строго для `ADMIN`. Иммутабельность чеков после финализации (`CONFIRMED`/`REJECTED`).
  - **Безопасность файлов в R2**: загрузка PDF-файлов (валидация MIME-типа через Apache Tika, лимит 10 МБ, нормализация имени в UUID) с генерацией 15-минутных Presigned URL для просмотра. Публичные ссылки на хранилище исключены.
  - **Telegram Outbox Integration**: гарантированная отправка оповещений через микросервис `zhan-finance-tgbot` при поступлении чека, аппруве, реджекте и за 3 дня до окончания подписки (`SubscriptionRenewalReminderScheduler`).
  - **Frontend UI & 100% i18n Parity**: страницы `ClientBillingPage` и `AdminPaymentReceiptsPage`, модалки `PaymentModal` и `RejectReceiptModal`, таблица `PaymentHistoryTable`, полная поддержка 4 локалей (`ru`, `kk`, `en`, `zh`).

---

## Acceptance Criteria

- [x] [US-07.1] ADMIN может управлять услугами (services) и их функциями (service_features)
- [x] [US-07.2] ADMIN может создавать инвойсы (invoices) и управлять подписками (subscriptions)
- [x] [US-07.3] CLIENT видит только свои инвойсы и подписки
- [x] [US-07.4] Услуги корректно связываются с задачами CRM (таблица task_services)
- [ ] [US-07.5] Клиент может оплатить инвойс через Kaspi Pay (перенесено в Epic-12)
- [ ] [US-07.6] Клиент может оплатить инвойс через Halyk Epay (перенесено в Epic-12)
- [ ] [US-07.7] Настроены автоматические напоминания клиентам об оплате инвойсов
- [x] [US-07.8] Инвойс генерируется в формате PDF и доступен для скачивания клиентом (с безопасным fallback при отсутствии шрифта)
- [x] [US-07.9] Клиент может загрузить PDF-чек об оплате с валидацией MIME-типа и размера (до 10 МБ)
- [x] [US-07.10] ADMIN может подтвердить чек (активация подписки со статусом ACTIVE на 30 дней, инвойс -> PAID) или отклонить с причиной
- [x] [US-07.11] Клиент видит историю платежей со статусами и деталями отклонения в личном кабинете
- [x] [US-07.12] Telegram Outbox генерирует уведомления сторонам при отправке чека, решении администратора и за 3 дня до конца подписки
- [x] Сквозной E2E жизненный цикл счетов и биллинга полностью проверен на проде (`tests/e2e/billing-invoices-live.mjs`, 5/5 PASS)

---

## Definition of Done

- [ ] Все US из таблицы выше реализованы или явно перенесены в другой эпик с указанием куда
- [ ] Flyway-миграции добавлены и проверены на чистой БД
- [ ] Smoke-тесты покрывают happy path каждой US
- [ ] Секреты только в env vars / Fly secrets, не в коде
- [ ] Нет raw stack trace в ответах API (ошибки через ApiException + ErrorCode)
- [ ] CI/CD pipeline зелёный (все тесты проходят перед деплоем)
- [ ] Эпик задеплоен на прод и проверен вручную

---

## Известные ограничения / технический долг

- `[INFO]` Интеграции с платежными системами (Kaspi Pay, Halyk Epay) вынесены в отдельный Epic-12 (Payment Gateway)
- `[INFO]` Устаревшая таблица `service_requests` мигрирована и удалена в рамках миграции V22 в пользу прямых связей `task_id`
- `[INFO]` Billing v1 реализует ручную модерацию чеков в качестве рабочего B2B-контура до завершения партнерских интеграций Epic-12

---

## Связанные ресурсы

- Концепция Billing v1: `docs/billing/BILLING_V1_CONCEPT.md`
- План интеграции Billing v1: `docs/billing/BILLING_V1_INTEGRATION_PLAN.md`
- Миграции: `zhan-finance-backend/src/main/resources/db/migration/V1__Init_Schema.sql`, `V2__Accounting_Schema.sql`, `V17__Services_Schema.sql`, `V20__Add_Service_Request_To_Billing.sql`, `V21__Add_Task_Services.sql`, `V22__Migrate_And_Drop_Service_Requests.sql`, `V128__Billing_Payment_Receipts.sql`, `V129__Subscription_Add_Pending_Status.sql`
- Контроллеры: `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/controller/`
- Сервисы: `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/service/`
- Шаблоны: `zhan-finance-backend/src/main/resources/templates/pdf/invoice.html`
- Тесты: `zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/billing/`
- Frontend: `zhan-finance-frontend/src/entities/billing/` и `zhan-finance-frontend/src/pages/dashboard/admin/billing/`
