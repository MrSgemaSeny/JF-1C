# Billing v1 — План интеграции ручной верификации платежей

> Контекст: JF-1C / ZhanFinance. Миграции V1–V127 существуют, следующая — V128.
> Текущий Flyway: PostgreSQL 17. Хранение файлов: Cloudflare R2.
> TG-бот — отдельный микросервис, общается через `/api/v1/internal/**` + `X-Internal-Token`.
> Epic-12 (Kaspi Pay / Halyk Epay) остаётся на будущее. Этот план — MVP-замена.

---

## 1. Что строим

Клиент оплачивает тариф банковским переводом / через Kaspi → загружает PDF-чек через веб →
ADMIN получает уведомление в TG → смотрит чек → подтверждает или отклоняет →
подписка активируется / клиент получает уведомление.

---

## 2. Схема данных

### Новые таблицы (миграция V128)

```sql
-- V128__Billing_Payment_Receipts.sql

CREATE TABLE payment_receipts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES users(id),
    subscription_id UUID REFERENCES subscriptions(id),
    invoice_id      UUID REFERENCES invoices(id),

    amount          NUMERIC(12,2) NOT NULL,
    currency        VARCHAR(3)    NOT NULL DEFAULT 'KZT',

    receipt_file_key TEXT NOT NULL,          -- R2 object key, не URL
    receipt_file_url TEXT,                   -- presigned URL (опционально, кешируем)

    status          VARCHAR(32)   NOT NULL DEFAULT 'AWAITING_REVIEW'
                    CHECK (status IN ('AWAITING_REVIEW', 'CONFIRMED', 'REJECTED')),

    reviewed_by     UUID REFERENCES users(id),  -- ADMIN
    reviewed_at     TIMESTAMPTZ,
    reject_note     TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    version         BIGINT NOT NULL DEFAULT 0   -- optimistic locking
);

CREATE INDEX idx_payment_receipts_client    ON payment_receipts(client_id);
CREATE INDEX idx_payment_receipts_status    ON payment_receipts(status);
CREATE INDEX idx_payment_receipts_created   ON payment_receipts(created_at DESC);
```

### Изменения в существующих таблицах (V129)

```sql
-- V129__Subscription_Add_Pending_Status.sql

-- Добавляем PENDING статус к подписке
ALTER TABLE subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('PENDING', 'ACTIVE', 'PAUSED', 'CANCELED'));

-- Добавляем period-поля если их нет (судя по entity, endsAt уже есть)
-- startsAt и endsAt уже присутствуют в Subscription entity
```

---

## 3. Backend — что добавляем

### 3.1 Новая сущность

```
modules/billing/entity/PaymentReceipt.java
modules/billing/entity/PaymentReceiptStatus.java  (enum)
modules/billing/repository/PaymentReceiptRepository.java
modules/billing/dto/PaymentReceiptDto.java
modules/billing/dto/PaymentReceiptReviewRequest.java
modules/billing/service/PaymentReceiptService.java
modules/billing/controller/PaymentReceiptController.java
```

### 3.2 PaymentReceiptService — ключевая логика

```java
// modules/billing/service/PaymentReceiptService.java

// submitReceipt(clientId, subscriptionId, invoiceId, amount, file)
//   - валидирует что subscription принадлежит клиенту
//   - загружает PDF в R2 (ключ: receipts/{year}/{month}/{uuid}.pdf)
//   - создаёт PaymentReceipt(AWAITING_REVIEW)
//   - публикует ApplicationEvent -> TG-уведомление ADMIN

// confirmReceipt(adminId, receiptId)
//   - @Transactional
//   - receipt.status = CONFIRMED, reviewed_by, reviewed_at
//   - subscription.status = ACTIVE
//   - subscription.startsAt = today, endsAt = today + 30 days
//   - invoice.status = PAID (если invoice_id привязан)
//   - публикует TelegramOutboxEvent -> уведомление CLIENT

// rejectReceipt(adminId, receiptId, note)
//   - @Transactional
//   - receipt.status = REJECTED, reject_note
//   - subscription.status остаётся PENDING
//   - публикует TelegramOutboxEvent -> уведомление CLIENT с причиной
```

### 3.3 Эндпоинты

```
POST   /api/v1/billing/receipts              -- CLIENT: загрузить чек (multipart/form-data)
GET    /api/v1/billing/receipts              -- CLIENT: своя история платежей
GET    /api/v1/billing/receipts/{id}/file    -- CLIENT + ADMIN: получить presigned URL к PDF

GET    /api/v1/admin/billing/receipts        -- ADMIN: все платежи (фильтр по status)
POST   /api/v1/admin/billing/receipts/{id}/confirm  -- ADMIN: подтвердить
POST   /api/v1/admin/billing/receipts/{id}/reject   -- ADMIN: отклонить (тело: {note})
```

### 3.4 Валидация файла

```java
// В PaymentReceiptService.submitReceipt():
// - MimeType через Apache Tika (уже в стеке): только application/pdf
// - Размер: не более 10 MB
// - Имя файла: нормализовать до UUID, игнорировать оригинальное
```

### 3.5 Уведомления TG

Используем существующий outbox-паттерн (`telegram` module, `OutboxNotificationPoller`).

Добавляем два типа событий в TelegramOutboxEvent:
- `PAYMENT_RECEIPT_SUBMITTED` → ADMIN: "Новый чек от {clientName}, сумма {amount} KZT. [Посмотреть в панели]"
- `PAYMENT_CONFIRMED` → CLIENT: "Ваш платёж подтверждён. Подписка активна до {date}."
- `PAYMENT_REJECTED` → CLIENT: "Платёж отклонён. Причина: {note}. Загрузите новый чек."

---

## 4. Frontend — что добавляем

### 4.1 Клиентский раздел

```
pages/dashboard/client/billing/ClientBillingPage.tsx
  - текущий тариф + статус подписки
  - дата окончания / "истекает через N дней" (бейдж-варнинг если < 7 дней)
  - кнопка "Оплатить" → открывает PaymentModal

features/billing/ui/PaymentModal.tsx
  - шаг 1: показывает реквизиты (IBAN/БИН — из env или конфига)
  - шаг 2: загрузка PDF (drag-and-drop или кнопка)
  - шаг 3: подтверждение ("Чек отправлен, ожидайте проверки")

features/billing/ui/PaymentHistoryTable.tsx
  - список платежей: дата, сумма, статус-бейдж (AWAITING / CONFIRMED / REJECTED)
  - при REJECTED — показать причину
```

### 4.2 Админский раздел

```
pages/dashboard/admin/billing/AdminPaymentReceiptsPage.tsx
  - таблица: клиент, дата, сумма, статус, кнопки "Подтвердить" / "Отклонить"
  - фильтр по статусу (дефолт: AWAITING_REVIEW)
  - клик по строке → открывает PDF в новой вкладке через presigned URL
  - RejectModal — поле причины, валидация непустого текста
```

### 4.3 API-слой (FSD: entities/billing)

```
entities/billing/api/paymentReceiptApi.ts
  - submitReceipt(FormData)
  - getMyReceipts()
  - getReceiptFileUrl(id)
  - [admin] getAllReceipts(status?)
  - [admin] confirmReceipt(id)
  - [admin] rejectReceipt(id, note)
```

---

## 5. R2 — хранение чеков

```
Ключ: receipts/{yyyy}/{MM}/{receiptId}.pdf
Bucket: jf1c-documents (уже существует)
Доступ: presigned URL с TTL 15 минут (генерируется бэкендом по запросу)
Никогда не отдавать публичный URL напрямую
```

---

## 6. Scheduler — напоминания об оплате

```java
// modules/billing/service/SubscriptionRenewalReminderScheduler.java
// cron = "0 0 9 * * *" (09:00 Asia/Almaty)
// Находит subscriptions где:
//   status = ACTIVE AND endsAt = today + 3 days
// Публикует TelegramOutboxEvent: "Ваша подписка истекает через 3 дня. Оплатите заранее."
```

---

## 7. Security

- `POST /api/v1/billing/receipts` — `@PreAuthorize("hasRole('CLIENT')")`
- `GET /api/v1/billing/receipts` — `@PreAuthorize("hasRole('CLIENT')")`
- `GET /api/v1/billing/receipts/{id}/file` — InvoiceAccessService-паттерн: проверка что receipt.clientId == текущий юзер OR ADMIN
- `/api/v1/admin/billing/receipts/**` — `@PreAuthorize("hasRole('ADMIN')")`
- Файл из R2 никогда не отдаётся без проверки прав; только presigned URL через бэкенд

---

## 8. Env vars (новые)

```properties
# уже должны быть для R2, но проверить:
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_BUCKET=jf1c-documents

# реквизиты для отображения клиенту (статичные)
PAYMENT_IBAN=KZ...
PAYMENT_BIN=...
PAYMENT_RECIPIENT_NAME=ТОО ЖАН FINANCE
```

---

## 9. Порядок реализации (очерёдность)

```
Шаг 1. Миграции V128 + V129
Шаг 2. PaymentReceipt entity + repository
Шаг 3. PaymentReceiptService (submit + confirm + reject)
Шаг 4. PaymentReceiptController (client endpoints)
Шаг 5. Admin endpoints + права доступа
Шаг 6. TG-уведомления (outbox events)
Шаг 7. Scheduler напоминаний
Шаг 8. Frontend: ClientBillingPage + PaymentModal
Шаг 9. Frontend: AdminPaymentReceiptsPage
Шаг 10. Тесты: PaymentReceiptServiceTest, интеграционный flow
```

---

## 10. Риски и ограничения

| Маркер | Описание |
|---|---|
| [WARNING] | Фрод: PDF не валидируется программно — только глазами. Осознанное решение для MVP. |
| [WARNING] | Presigned URL TTL 15 мин. Если ADMIN долго не открывает — ссылка протухнет. Нужен endpoint для перегенерации. |
| [INFO] | Subscription.status = PENDING не существует в текущем enum — добавляем через V129. Миграция безопасна (ADD CONSTRAINT). |
| [INFO] | R2 SDK (AWS S3-compatible) уже должен быть в зависимостях если есть document upload. Проверить build.gradle. |
| [INFO] | Epic-12 (Kaspi Pay) в будущем заменит этот flow. PaymentReceipt останется как fallback / история. |

---

## 11. Связанные файлы (не трогать)

- `V1–V127` — не менять никогда
- `Invoice.java`, `Subscription.java` — расширяем, не переписываем
- `InvoiceAccessService.java` — паттерн для нового `PaymentReceiptAccessService`
- `OutboxNotificationPoller.java` (tgbot) — переиспользуем без изменений
