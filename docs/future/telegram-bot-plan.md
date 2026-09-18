# Telegram Bot — JF-1C (план внедрения)

> Реализовывать после переезда с Fly.io на физический сервер.
> На Fly.io: tight 512MB RAM + доп. машина = неоправданный cost/risk.

---

## Концепция

Пассивно-информационный бот для клиентов JF-1C. Клиент не управляет системой через бота — только получает информацию:

- уведомления о смене статуса задач
- уведомления о готовности документов
- получение PDF документов прямо в чат
- просмотр текущих статусов по своим задачам (`/status`)

---

## Архитектура

Модуль внутри монолита — не отдельный сервис. Общая БД, прямой доступ к репозиториям без HTTP между сервисами. Отдельный сервис оправдан только при N клиентах с высокой bot-нагрузкой — на текущем масштабе это over-engineering.

```
backend/src/main/java/com/jf/
└── telegram/
    ├── TelegramBotConfig.java
    ├── JFTelegramBot.java                   # extends TelegramLongPollingBot
    ├── TelegramLinkService.java             # client ↔ chat_id привязка + токены
    ├── TelegramNotificationService.java     # sendMessage / sendDocument
    └── handler/
        ├── StartCommandHandler.java         # /start TOKEN → привязка
        └── StatusCommandHandler.java        # /status → активные задачи клиента
```

Long polling (не webhook) — не нужен отдельный публичный endpoint, проще в деплое.

---

## БД (Flyway, следующий после V110+)

```sql
-- VN__add_telegram_links.sql

CREATE TABLE telegram_links (
    id          BIGSERIAL PRIMARY KEY,
    client_id   BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    chat_id     BIGINT NOT NULL UNIQUE,
    linked_at   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE telegram_link_tokens (
    token       VARCHAR(64) PRIMARY KEY,
    client_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP NOT NULL
);

CREATE INDEX idx_telegram_link_tokens_expires ON telegram_link_tokens(expires_at);
```

---

## Флоу привязки (одноразовый токен)

```
1. Клиент в веб-интерфейсе → "Привязать Telegram"
2. POST /api/telegram/link/generate
   → генерируется UUID-токен, expires_at = now() + 15 min
   → возвращается deeplink: https://t.me/YOUR_BOT?start=TOKEN

3. Клиент переходит по deeplink
   → бот получает /start TOKEN
   → ищет токен в telegram_link_tokens
   → если найден и не истёк: запись в telegram_links, токен удаляется
   → бот отвечает: "Привязка успешна."

4. Если токен истёк → бот сообщает об ошибке, клиент генерирует новый через веб.
```

Почему именно так: email-based привязка уязвима к перебору. Токен живёт 15 минут и одноразовый — компрометация исключена.

---

## Подключение к существующим уведомлениям

Рядом с каждым существующим email-вызовом для CLIENT добавляется:

```java
telegramNotificationService.notifyClient(clientId, message);
```

Внутри: ищет `chat_id` в `telegram_links` по `clientId`. Если записи нет — молча пропускает, без исключений. Существующий email-флоу не трогается.

Ключевые точки подключения:
- смена статуса задачи (CRM)
- документ сгенерирован и готов к скачиванию
- задача закрыта / переведена в WON или LOST

---

## Отправка PDF документов

```java
// TelegramNotificationService
public void sendDocument(Long clientId, byte[] pdfBytes, String filename) {
    // найти chat_id → SendDocument API
}
```

Вызывается из `DocumentService` после генерации PDF — клиент получает файл сразу в чат без необходимости заходить в веб-интерфейс.

---

## Зависимость

```gradle
implementation 'org.telegram:telegrambots:6.9.7'
```

---

## Подводные камни

**[WARNING] Long polling и память.** Long polling держит постоянный HTTP-connection к Telegram. После деплоя — первым делом смотреть метрики памяти. На физическом сервере это не проблема, на Fly.io было бы критично.

**[WARNING] Bot token в env.** `TELEGRAM_BOT_TOKEN` и `TELEGRAM_BOT_USERNAME` — только через переменные окружения, никогда в `application.properties` в репо.

**[INFO] Cron для протухших токенов.** `telegram_link_tokens` нужно чистить. Добавить `@Scheduled` job раз в час: `DELETE FROM telegram_link_tokens WHERE expires_at < now()`. Без этого таблица будет тихо расти.

**[INFO] notifyAdmins() не трогать.** Существующие 13 точек `notifyAdmins()` — отдельный канал для ADMIN/ADVISOR. Бот для CLIENT — параллельный канал, не замена.

**[INFO] ADVISOR exclusion.** `ChatService` сейчас исключает ADVISOR из участников. Бот не меняет эту логику — он работает только с ролью CLIENT.

---

## Roadmap

### Фаза 1 — MVP уведомлений
- [ ] Flyway миграция (telegram_links + telegram_link_tokens)
- [ ] `TelegramBotConfig` + `JFTelegramBot` (long polling)
- [ ] `TelegramLinkService`: генерация токена + привязка по `/start TOKEN`
- [ ] `TelegramNotificationService.notifyClient()` — отправка текста
- [ ] Подключить к 2-3 событиям: смена статуса задачи, документ готов
- [ ] `POST /api/telegram/link/generate` эндпоинт
- [ ] Кнопка "Привязать Telegram" в профиле клиента (фронт)
- [ ] Cron-job для очистки протухших токенов

### Фаза 2 — интерактив
- [ ] `/status` команда — список активных задач клиента
- [ ] `sendDocument()` — PDF прямо в чат при генерации документа
- [ ] Кнопка "Отвязать Telegram" в профиле клиента

### Фаза 3 — polish (future consideration)
- [ ] Inline-кнопки в уведомлениях ("Открыть в системе" → deeplink на веб)
- [ ] Язык бота синхронизируется с i18n-настройкой клиента (RU/EN)
- [ ] Rate limiting на `/start` команду (защита от токен-брутфорса)
