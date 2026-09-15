# Epic-21: 1C Data Gateway & Fiscal Hub

## Мета

| Поле           | Значение                                                             |
|----------------|----------------------------------------------------------------------|
| **Домен**      | Integration / Accounting / Billing                                   |
| **Роли**       | ADMIN, EMPLOYEE, CLIENT                                              |
| **Статус**     | Planned                                                              |
| **Приоритет**  | Фаза 3 (Q4 2026) — после Фазы 2 (WebKassa + Kaspi Pay + домен)      |
| **Миграции**   | V122+                                                                |
| **Зависит от** | Epic-01, Epic-02, Epic-03, Epic-07, Epic-12                          |
| **Блокирует**  | US-21.3 (R2 storage уже готов — bucket jf1c-documents, 09.09.2026)  |

---

## Зачем этот эпик

Двусторонний интеграционный шлюз между ZhanFinance и «1С:Бухгалтерия для Казахстана 8.3». Без него клиент не видит оперативных финансовых показателей (сальдо, остатки 1030/1210/3310, ОСВ), вынужден вручную запрашивать акты сверок и счета, а бухгалтеры тратят часы на ручное дублирование проводок и выбивание фискальных чеков.

---

## Пользовательские истории

| ID      | Роль     | Хочу                                                                   | Чтобы                                                                         | Приоритет | Статус  |
|---------|----------|------------------------------------------------------------------------|-------------------------------------------------------------------------------|-----------|---------|
| US-21.1 | CLIENT   | видеть сальдовую ведомость и остатки по счетам (1030, 1210, 3310)      | контролировать активы, дебиторку и кредиторку в реальном времени             | Must-have | Planned |
| US-21.2 | CLIENT   | формировать и выгружать акты сверок и счета в PDF                      | передавать документы контрагентам без ожидания бухгалтера                    | Must-have | Planned |
| US-21.3 | CLIENT   | скачивать накладные, АВР и квитанции к оплаченным налогам              | иметь единый архив закрывающих документов (R2-хранилище готово)              | Must-have | Planned |
| US-21.4 | EMPLOYEE | видеть автоматическую синхронизацию статусов первичных документов      | CRM-задачи автоматически закрывались при проведении первички в 1С            | Should    | Planned |
| US-21.5 | EMPLOYEE | пакетно формировать счета-фактуры и реализации из CRM в 1С             | исключить ручной ввод однотипных документов                                  | Should    | Planned |
| US-21.6 | CLIENT   | получать фискальные чеки (WebKassa / ОФД) при онлайн-оплате счетов     | соблюдать требования налогового законодательства РК                          | Must-have | Planned |
| US-21.7 | ADMIN    | настраивать параметры подключения OData/HTTP-сервисов 1С               | безопасно разграничивать доступ к базам разных организаций                   | Must-have | Planned |
| US-21.8 | ADMIN    | видеть статус последней синхронизации и логи ошибок интеграции         | быстро обнаруживать сбои шлюза без доступа к серверным логам                 | Should    | Planned |
| US-21.9 | CLIENT   | получать уведомление (email / in-app), когда отчёт готов или обновлён  | не опрашивать интерфейс вручную                                              | Nice      | Planned |

---

## Out of Scope

- Прямое редактирование конфигурации 1С на стороне CRM (только OData или `.cfe` расширение).
- Полный кадровый расчёт больничных/отпускных в веб-интерфейсе — только итоговые ведомости из 1С.
- Offline-режим 1С (шлюз требует сетевой доступности 1С-сервера).

---

## Архитектура

### Компоненты

```
ZhanFinance Backend
└── modules/onec/
    ├── gateway/
    │   ├── OneCGatewayClient.java       -- OData HTTP-клиент (WebClient + retry)
    │   ├── OneCGatewayConfig.java       -- endpoint, timeout, credentials из env
    │   └── OneCGatewayHealthIndicator.java  -- Spring Actuator health
    ├── cache/
    │   └── OneCCacheService.java        -- Caffeine: TTL 5m (остатки) / 15m (ОСВ)
    ├── fiscal/
    │   ├── WebKassaClient.java          -- WebKassa REST API
    │   └── FiscalReceiptService.java    -- fiskalizatsiya + сохранение в BD
    ├── document/
    │   └── OneCDocumentService.java     -- PDF/XLSX из 1С → Cloudflare R2
    ├── sync/
    │   ├── OneCDocStatusSyncJob.java    -- @Scheduled polling (doc status → task status)
    │   └── OneCSyncLogService.java      -- запись SyncLog в БД + US-21.8
    └── api/
        ├── OneCReportController.java    -- /api/v1/onec/reports/**
        ├── OneCDocumentController.java  -- /api/v1/onec/documents/**
        └── OneCAdminController.java     -- /api/v1/admin/onec/**
```

### Схема потоков

```
CLIENT browser
    |
    | HTTPS
    v
ZhanFinance API (Spring Boot)
    |
    +--[Caffeine Cache]----> OData /saldo, /osv (TTL 5-15m)
    |                             |
    |                             v
    |                     1C:Enterprise 8.3
    |                     (OData endpoint, local network / VPN)
    |
    +--[WebKassa Client]---> WebKassa API (RK fiscal cloud)
    |
    +--[R2 Client]---------> Cloudflare R2 (jf1c-documents bucket, уже активен)
    |
    +--[SyncJob @Scheduled]--> 1C doc status -> CRM TaskStatus update
```

### Мультитенантность / изоляция

- Все OData-запросы фильтруются по `Организация_Key` (БИН/ИИН клиента), получаемому из `ClientProfile.inn`.
- `CrmAccessService` проверяет принадлежность ИНН к текущему `ClientProfile` перед каждым gateway-запросом.
- [CRITICAL] Запрос без явного `$filter=Организация_Key eq '...'` — запрещён на уровне `OneCGatewayClient` (guard-метод, бросает исключение если фильтр отсутствует).

---

## Технические решения

### OData-клиент
- Spring Boot `WebClient` (non-blocking) с retry (3 попытки, exponential backoff 1s/2s/4s).
- Basic Auth к 1С-сервисному аккаунту — credentials только в env vars / Fly Secrets (`ONEC_USERNAME`, `ONEC_PASSWORD`, `ONEC_BASE_URL`).
- Таймаут: connect 3s, read 15s (отчёты тяжёлые).
- [WARNING] 1С OData не поддерживает WebSocket/SSE — polling-only для sync.

### Кэш
- Caffeine (уже в стеке) с двумя регионами:
  - `onec-balances`: TTL 5 минут — остатки 1030/1210/3310.
  - `onec-reports`: TTL 15 минут — ОСВ.
- `@CacheEvict` вызывается при ручном refresh-запросе из UI (кнопка "Обновить").
- [WARNING] Caffeine — in-process, не готов к горизонтальному масштабированию. Future consideration: Redis при переходе к кластеру.

### Фискальный контур (WebKassa)
- Вызов WebKassa API происходит синхронно после подтверждения оплаты в Epic-07 (Kaspi Pay).
- При сбое WebKassa — оплата НЕ откатывается, фискализация ставится в retry-очередь (таблица `fiscal_retry_queue`).
- [CRITICAL] Без успешной фискализации клиент нарушает требования НК РК. SLA retry: 3 попытки за 30 минут, потом ADMIN-alert.

### Документы → R2
- PDF/XLSX из 1С сохраняются в `jf1c-documents` bucket (уже создан) по ключу `{org_bin}/{doc_type}/{doc_id}.pdf`.
- Presigned URL с TTL 15 минут отдаётся клиенту через `OneCDocumentController`.
- Существующий `DocumentAccessService` расширяется: проверка что `org_bin` в ключе совпадает с БИН клиента.

### Статус-синхронизация (US-21.4)
- `@Scheduled(fixedDelay = 60_000)` — опрашивает 1С на проведённые документы за последние N минут.
- При получении статуса "Проведён" — вызывает `TaskService.updateStatus(taskId, DONE)`.
- `SyncLog` пишется в БД (`sync_logs` таблица, V122) — основа для US-21.8.

---

## Схема БД (новые таблицы, V122+)

```sql
-- V122
CREATE TABLE onec_connection_configs (
    id           BIGSERIAL PRIMARY KEY,
    org_bin      VARCHAR(12) NOT NULL UNIQUE,    -- БИН организации
    base_url     VARCHAR(512) NOT NULL,
    username_enc VARCHAR(512) NOT NULL,          -- зашифровано, ключ в env
    password_enc VARCHAR(512) NOT NULL,
    connect_timeout_sec INT NOT NULL DEFAULT 3,
    read_timeout_sec    INT NOT NULL DEFAULT 15,
    enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- V123
CREATE TABLE fiscal_receipts (
    id              BIGSERIAL PRIMARY KEY,
    invoice_id      BIGINT NOT NULL REFERENCES invoices(id),
    webkassa_ticket VARCHAR(128),                -- внешний ID чека
    ofd_url         VARCHAR(512),                -- ссылка на чек ОФД
    fiscal_sign     VARCHAR(256),                -- фискальный признак
    status          VARCHAR(32) NOT NULL,        -- PENDING / SUCCESS / FAILED
    attempts        INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- V124
CREATE TABLE fiscal_retry_queue (
    id            BIGSERIAL PRIMARY KEY,
    receipt_id    BIGINT NOT NULL REFERENCES fiscal_receipts(id),
    scheduled_at  TIMESTAMPTZ NOT NULL,
    processed     BOOLEAN NOT NULL DEFAULT FALSE
);

-- V125
CREATE TABLE sync_logs (
    id          BIGSERIAL PRIMARY KEY,
    org_bin     VARCHAR(12) NOT NULL,
    sync_type   VARCHAR(64) NOT NULL,            -- DOC_STATUS / REPORT_REFRESH
    status      VARCHAR(32) NOT NULL,            -- SUCCESS / PARTIAL / FAILED
    records_in  INT,
    records_out INT,
    error_msg   TEXT,
    duration_ms INT,
    synced_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Acceptance Criteria

### US-21.1 — Сальдовая ведомость
- [ ] Клиент в разделе «1С Отчёты» видит сальдо с разбивкой по 1030/1210/3310 за выбранный период.
- [ ] Данные получены через OData с фильтром по `Организация_Key` клиента.
- [ ] Кэш работает: повторный запрос в течение 5 минут не уходит в 1С.
- [ ] При недоступности 1С — возвращается 503 с понятным сообщением, не raw-ошибка 1С.

### US-21.2 — Акты сверок / счета
- [ ] PDF акта сверки по контрагенту с сальдо на начало и конец периода.
- [ ] Файл доступен по presigned URL из R2 (TTL 15 мин).
- [ ] Попытка скачать чужой документ возвращает 403.

### US-21.3 — Архив документов
- [ ] Накладные, АВР, платёжные поручения доступны в архиве.
- [ ] Ключ в R2 содержит БИН — двойная проверка в `DocumentAccessService`.

### US-21.4 — Статус-синхронизация
- [ ] Проведение документа в 1С обновляет статус связанной CRM-задачи в течение 2 минут (polling lag).
- [ ] SyncLog пишется при каждом цикле (success + failed).

### US-21.5 — Пакетная отправка
- [ ] Пакетный запрос из CRM создаёт `РеализациюТоваровУслуг` в 1С.
- [ ] Ответ содержит ID созданного документа 1С, который сохраняется в CRM-задаче.

### US-21.6 — Фискальные чеки
- [ ] Оплата через Kaspi Pay автоматически пробивает чек в WebKassa.
- [ ] Чек (ссылка ОФД + фискальный признак) доступен в личном кабинете клиента.
- [ ] При сбое WebKassa — retry до 3 раз за 30 минут, затем ADMIN-уведомление.
- [ ] [CRITICAL] Сбой WebKassa не откатывает успешную оплату.

### US-21.7 — Настройка подключения
- [ ] ADMIN настраивает endpoint, таймауты, учётные данные — без перезапуска сервиса.
- [ ] Кнопка "Проверить соединение" возвращает статус OData-эндпоинта.
- [ ] Пароли хранятся в зашифрованном виде в БД (ключ шифрования в env).

### US-21.8 — Статус и логи интеграции
- [ ] Страница `/admin/onec/status` показывает время последней синхронизации, статус, кол-во ошибок за 24ч.
- [ ] ADMIN может скачать последние 100 записей SyncLog в CSV.

---

## Риски и подводные камни

| Риск | Уровень | Митигация |
|------|---------|-----------|
| 1С-сервер в локальной сети клиента, недоступен извне | [CRITICAL] | VPN-туннель или 1С-HTTP-сервис через обратный прокси; уточнить с боссом до начала разработки |
| OData 1С — медленный на больших периодах (ОСВ > 1 года) | [WARNING] | Caffeine TTL 15m + async prefetch; страница показывает индикатор загрузки |
| WebKassa API меняет контракт без уведомления | [WARNING] | Версионировать клиент, мониторить changelog WebKassa |
| Шифрование паролей 1С в БД: потеря ключа = потеря доступа | [CRITICAL] | Ключ только в Fly Secrets, бэкап Secrets в зашифрованном виде у боса |
| Caffeine не готов к нескольким инстансам | [INFO] | Future consideration: Redis при кластеризации |
| Документы клиента A доступны клиенту B (IDOR через R2) | [CRITICAL] | Guard в `DocumentAccessService` + E2E тест обязателен |

---

## Definition of Done

- [ ] Все US реализованы и покрыты интеграционными тестами (Mockito + WireMock для 1С OData и WebKassa).
- [ ] Flyway-миграции V122–V125 проверены на чистой БД.
- [ ] Секреты (`ONEC_USERNAME`, `ONEC_PASSWORD`, `ONEC_BASE_URL`, `WEBKASSA_API_KEY`, `ONEC_ENCRYPT_KEY`) — только в Fly Secrets, не в source.
- [ ] API не возвращает raw-ошибки 1С клиенту — всё через `ApiException` + `ErrorCode`.
- [ ] IDOR: попытка доступа к данным чужого БИН возвращает 403, покрыта тестом.
- [ ] `fiscal_retry_queue` обрабатывается, ADMIN получает алерт при исчерпании попыток.
- [ ] SyncLog пишется при каждом цикле — успех и сбой.
- [ ] CI/CD проходит без ошибок.

---

## Порядок реализации (MVP → итерации)

### MVP (строго необходимое для первых клиентов)
1. `OneCGatewayClient` — OData-клиент с retry, timeout, guard по `Организация_Key`.
2. `OneCConnectionConfig` — таблица V122 + ADMIN-настройка (US-21.7).
3. `OneCReportController` — сальдо по 1030/1210/3310 (US-21.1).
4. `ClientOneCReportsPage.tsx` — страница отчётов с date-picker.

### Итерация 2
5. PDF из 1С → R2 → presigned URL (US-21.2, US-21.3).
6. Фискальные чеки WebKassa (US-21.6) — зависит от Epic-07 (Kaspi Pay).
7. `FiscalReceipt` + `fiscal_retry_queue` (V123, V124).

### Итерация 3
8. `OneCDocStatusSyncJob` — polling + `SyncLog` (US-21.4, US-21.8).
9. Пакетная отправка реализаций в 1С (US-21.5).
10. Email/in-app уведомления по готовности отчёта (US-21.9).

---

## Связанные ресурсы

- Frontend: `zhan-finance-frontend/src/pages/dashboard/client/ClientOneCReportsPage.tsx`
- Backend: `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/onec/`
- R2 Bucket: `jf1c-documents` (активен с 09.09.2026)
- Documentation: `docs/future/ONEC_INTEGRATION_SPEC.md`
- Зависимость: Epic-07 (Kaspi Pay) — должен быть завершён до US-21.6
