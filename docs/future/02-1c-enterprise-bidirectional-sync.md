# Архитектурный план интеграции: Двусторонняя связка с 1С:Предприятие 8.3 (REST / OData)

## 1. Теоретический базис и особенности 1С:Бухгалтерия для Казахстана

### 1.1. Специфика платформы 1С:Предприятие 8.3 в РК
В Республике Казахстан стандартом автоматизации бухгалтерского и налогового учета является типовая конфигурация «1С:Бухгалтерия для Казахстана, ред. 3.0» (БКТ 3.0), разработанная с учетом:
- Национального плана счетов бухгалтерского учета (Приказ МФ РК № 281):
  - Счет `1030` — «Денежные средства на текущих банковских счетах».
  - Счет `1210` — «Краткосрочная дебиторская задолженность покупателей и заказчиков».
  - Счет `3310` — «Краткосрочная кредиторская задолженность поставщикам и подрядчикам».
  - Счет `3110` — «Корпоративный подоходный налог, подлежащий уплате».
  - Счет `3130` — «Налог на добавленную стоимость».
- Требований НК РК по выписке первичных учетных документов: Акт выполненных работ (форма Р-1, утвержденная Приказом МФ РК № 562), Накладная на отпуск запасов на сторону (форма З-2), Доверенность (форма Д-1).

### 1.2. Выбор протокола интеграции: OData vs Нативные HTTP-сервисы 1С
Платформа 1С:Предприятие 8.3 предоставляет два базовых механизма внешнего API:

| Критерий | Стандартный интерфейс OData | Кастомный HTTP-сервис 1С (cfe-расширение) |
| :--- | :--- | :--- |
| **Развертывание** | Включается флажком при публикации базы на веб-сервере | Требует разработки расширения конфигурации (.cfe) |
| **Операции с данными** | Доступ к плоским таблицам справочников и документов | Вызов прикладных процедур проведения с блокировками |
| **Транзакционность** | Только запись объекта; проведение требует вызова `POST .../Post` | Атомарное проведение с контролем остатков и счетов |
| **Сложные выборки** | Ограничено синтаксисом OData v3 (`$filter`, `$expand`) | Любые произвольные запросы на языке 1С к регистрам |
| **Скорость** | Средняя (накладные расходы парсинга OData-модели) | Максимальная (прямой возврат компактного JSON) |

**Архитектурное решение для JF-1C:**
Используется **гибридный подход**:
1. **Кастомный HTTP-сервис JF-1C (`/hs/jf1c/v1/`)**: Реализуется через неинвазивное расширение конфигурации 1С (.cfe). Служит для комплексных бизнес-транзакций: проведение реализации, разнесение выписки, расчет заработной платы, генерация подписанной печатной формы PDF.
2. **OData-интерфейс (`/odata/standard.odata/`)**: Используется как резервный канал и для быстрых операций чтения нормативно-справочной информации (НСИ: Номенклатура, Единицы измерения, Банки, Статьи движения денежных средств).

---

## 2. Модель синхронизации и управление мастер-данными (Master Data Management)

### 2.1. Матрица владения данными (Data Ownership)

```
+--------------------------------------------------------------------+
| Сущность              | Мастер-система   | Направление синхронизации |
+--------------------------------------------------------------------+
| Клиенты / Контрагенты | JF-1C CRM        | Двустороннее (Sync Bidirectional)
| Заказы / Заявки       | JF-1C CRM        | JF-1C -> 1C (One-way push)
| Счета на оплату       | JF-1C CRM        | JF-1C -> 1C (One-way push)
| Реализации / АВР      | 1С:Предприятие   | 1C -> JF-1C (Status & PDF pull)
| Банковские выписки    | 1С:Предприятие   | 1C -> JF-1C (Balances & Transactions)
| Номенклатура / Прайс  | 1С:Предприятие   | 1C -> JF-1C (Read-only catalog)
+--------------------------------------------------------------------+
```

### 2.2. Архитектура очередей и разрешения конфликтов
1. **Идемпотентность и сопоставление ключей:**
   - Каждая сущность в JF-1C хранит внешний идентификатор 1С: `external_1c_guid` (UUID записи в 1С).
   - Каждая запись в 1С в дополнительных реквизитах хранит `JF1C_ID` (Long ID в PostgreSQL).
2. **Оптимистические блокировки и версионирование:**
   - 1С использует поле `DataVersion` (Base64 таймстемп изменения записи).
   - При коллизии изменений приоритет отдается данным из CRM по контактным данным клиента, и данным из 1С по учетно-финансовым показателям (задолженность, сальдо, расчетный счет).

---

## 3. Диаграмма архитектурного взаимодействия

```mermaid
sequenceDiagram
    autonumber
    participant Task as Менеджер / Бухгалтер JF-1C
    participant CRM as JF-1C Backend
    participant Queue as 1C Sync Queue (PostgreSQL)
    participant Worker as Sync Background Worker
    participant Ext1C as 1C HTTP-сервис (/hs/jf1c/v1)
    participant Core1C as База данных 1С (PostgreSQL/MSSQL)

    Task->>CRM: Перевод задачи в статус "Выставить реализацию / АВР"
    CRM->>Queue: Регистрация задания POST_INVOICE_TO_1C
    CRM-->>Task: Статус: "В очереди на синхронизацию с 1С"

    Worker->>Queue: Захват пачки заданий (FOR UPDATE SKIP LOCKED)
    Worker->>Ext1C: POST /hs/jf1c/v1/documents/sales (JSON payload)
    
    Note over Ext1C,Core1C: В транзакции 1С:
    Ext1C->>Core1C: Поиск/создание Договора и Контрагента
    Ext1C->>Core1C: Создание документа "РеализацияТоваровУслуг"
    Ext1C->>Core1C: Проведение документа по регистру бухгалтерии
    Ext1C->>Core1C: Генерация печатной формы Акта Р-1 (PDF в Base64)
    Core1C-->>Ext1C: Успешное проведение, ДокументСсылка, Номер, PDF
    
    Ext1C-->>Worker: HTTP 200 OK (Guid, DocNumber, Status, PdfBytes)
    Worker->>CRM: Обновление статуса задачи: "Проведено в 1С"
    Worker->>CRM: Сохранение печатной формы в электронный архив документов
    Worker->>Queue: Пометка задания COMPLETED
```

---

## 4. Схема структуры базы данных JF-1C (Flyway V123)

```sql
-- Таблица сопоставления внешних сущностей 1С
CREATE TABLE sync_1c_mappings (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(64) NOT NULL, -- 'CLIENT', 'INVOICE', 'TASK', 'NOMENCLATURE'
    internal_id BIGINT NOT NULL,
    external_1c_guid UUID NOT NULL,
    external_1c_code VARCHAR(64),
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    sync_version VARCHAR(64), -- DataVersion из 1С
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sync_mapping UNIQUE (entity_type, internal_id),
    CONSTRAINT uq_sync_external UNIQUE (entity_type, external_1c_guid)
);

-- Таблица очереди регламентного обмена с 1С
CREATE TABLE sync_1c_queue (
    id BIGSERIAL PRIMARY KEY,
    action_type VARCHAR(64) NOT NULL, 
    -- 'PUSH_CLIENT', 'PULL_CLIENT', 'PUSH_SALE', 'PULL_BANK_STATEMENT'
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', 
    -- 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'RETRY_WAIT'
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 10,
    error_message TEXT,
    next_execution_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_queue_poll ON sync_1c_queue (status, next_execution_at)
    WHERE status IN ('PENDING', 'RETRY_WAIT');

-- Журнал банковских проводок из 1С (Выписка)
CREATE TABLE bank_transactions_1c (
    id BIGSERIAL PRIMARY KEY,
    external_1c_guid UUID NOT NULL UNIQUE,
    document_number VARCHAR(64) NOT NULL,
    document_date DATE NOT NULL,
    operation_type VARCHAR(64) NOT NULL, -- 'PAYMENT_FROM_CUSTOMER', 'PAYMENT_TO_SUPPLIER'
    account_number VARCHAR(34) NOT NULL, -- ИИК (IBAN KZ...)
    counterparty_bin VARCHAR(12) NOT NULL,
    counterparty_name VARCHAR(255) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KZT',
    purpose_payment TEXT NOT NULL, -- Назначение платежа
    kbe VARCHAR(2), -- КБЕ (Код бенефициара)
    knp VARCHAR(3), -- КНП (Код назначения платежа)
    matched_invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

## 5. Контракты API и реализация на стороне 1С и Spring Boot

### 5.1. JSON-контракт HTTP-сервиса 1С: Создание реализации и формирование Акта (Р-1)

#### Запрос из JF-1C в 1С:
```http
POST /jf1c_base/hs/jf1c/v1/documents/sales
Authorization: Basic d3NfdXNlcjpwYXNzd29yZA==
Content-Type: application/json; charset=utf-8
```

```json
{
  "crmTaskId": 852,
  "organizationBin": "240140023819",
  "clientBin": "220940039182",
  "clientName": "ТОО Astana Digital Solutions",
  "date": "2026-09-09T12:00:00",
  "currencyCode": "KZT",
  "includeVat": false,
  "lines": [
    {
      "nomenclatureCode": "00-00001429",
      "nomenclatureName": "Бухгалтерское сопровождение по договору № 41",
      "quantity": 1.0,
      "price": 340000.0,
      "amount": 340000.0,
      "vatRate": "WithoutVAT"
    }
  ],
  "generatePdfForm": true
}
```

#### Ответ от 1С:
```json
{
  "success": true,
  "documentGuid": "e5b8d29a-5f12-11ef-8104-00155d014902",
  "documentNumber": "ЗФ-00000841",
  "posted": true,
  "totalAmount": 340000.0,
  "accountingEntries": [
    {
      "debet": "1210",
      "kredit": "6010",
      "amount": 340000.0,
      "subcontoDebet": ["ТОО Astana Digital Solutions", "Основной договор"],
      "subcontoKredit": ["Услуги основного производства"]
    }
  ],
  "pdfBase64": "JVBERi0xLjQKJeLjz9M..."
}
```

### 5.2. Клиент на Spring Boot 3 с использованием RestClient и Resilience4j

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class OneCEnterpriseClientImpl implements OneCEnterpriseClient {

    private final RestClient oneCRestClient;
    private final Sync1CMappingRepository mappingRepository;

    @Override
    @CircuitBreaker(name = "oneCService", fallbackMethod = "salesFallback")
    @Retry(name = "oneCService")
    public OneCSaleResponse createAndPostSaleDocument(CreateSaleDocumentRequest request) {
        log.info("Отправка запроса на создание реализации в 1С для задачи CRM #{}", request.getCrmTaskId());

        return oneCRestClient.post()
                .uri("/hs/jf1c/v1/documents/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                    String errorBody = new String(resp.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    log.error("1С вернула критическую ошибку 500: {}", errorBody);
                    throw new OneCIntegrationException("Ошибка в модуле 1С: " + errorBody);
                })
                .body(OneCSaleResponse.class);
    }

    public OneCSaleResponse salesFallback(CreateSaleDocumentRequest request, Throwable t) {
        log.warn("Контур 1С временно недоступен. Задание для задачи #{} переведено в очередь отложенного выполнения. Причина: {}", 
                request.getCrmTaskId(), t.getMessage());
        throw new OneCTemporaryUnavailableException("1C недоступна, запланирован повтор через воркер", t);
    }
}
```

---

## 6. Регламентный фоновый синхронизатор банковских выписок

### 6.1. Логика сверки платежей с инвойсами (Reconciliation Engine)
Выписки, загруженные в 1С из банк-клиента (Kaspi, Halyk, Jusan), автоматически опрашиваются JF-1C каждые 15 минут:
1. Запрашиваются все проводки по счету `1030` за последние 24 часа.
2. Алгоритм сверки анализирует назначение платежа (`purpose_payment`) на регулярные выражения:
   - `/(?:счет|инвойс|оплата по счету|заказ)\s*(?:№|номер)?\s*([0-9a-zA-Z\-_]+)/i`.
3. Сопоставляется сумма платежа и БИН плательщика.
4. При точном совпадении инвойс в JF-1C переводится в статус `PAID`, в истории фиксируется номер платежного поручения 1С, а клиенту направляется уведомление о получении оплаты.
5. При расхождении (недоплата, переплата, не распознан номер счета) задача попадает в список ручной сверки бухгалтера с желтым статусом «Требует уточнения».

---

## 7. Этапы внедрения и план релиза

1. **Этап 1: Разработка и тестирование cfe-расширения 1С (Недели 1-2)**
   - Создание расширения конфигурации `JF1C_Integration.cfe`.
   - Настройка прав пользователя с ролью `ИнтеграцияСВнешнимиСистемами`.
   - Тестирование проведения документов на копии рабочей базы БКТ 3.0.
2. **Этап 2: Бэкенд-очередь и отказоустойчивость в JF-1C (Недели 3-4)**
   - Миграция БД V123.
   - Разработка синхронизатора на Spring Boot 3 с CircuitBreaker.
   - Тестирование сценариев аварийного завершения сервера 1С.
3. **Этап 3: Подключение реального контура и пилот (Недели 5-6)**
   - Включение обмена по 5 пилотным клиентам.
   - Сверка корректности формирования проводок по счетам 1210 и 6010.
   - Полномасштабный запуск для всех 18 организаций.
