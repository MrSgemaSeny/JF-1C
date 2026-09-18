# JF-1C Telegram Bot — Full Plan

## Концепция

Отдельный Spring Boot сервис. Читает данные из основного JF-1C бека через REST.
Клиент привязывает Telegram через одноразовый токен из веб-интерфейса.
После привязки бот делает запросы к основному беку с `X-Internal-Token` + `clientId`.

```
[Telegram] ←→ [TG Bot (локально)]
                      ↓ GET + X-Internal-Token
              [JF-1C Backend (Fly.io)]
                      ↓
              [Fly.io Postgres]
```

---

## Изменения в основном беке (минимальные)

### 1. Новый env секрет

```
INTERNAL_BOT_TOKEN=<случайный UUID, минимум 32 символа>
```

### 2. Один фильтр/интерсептор

```java
// InternalTokenFilter.java
// Если запрос приходит с заголовком X-Internal-Token == INTERNAL_BOT_TOKEN
// → пропускаем Spring Security, выставляем Authentication с ролью INTERNAL_BOT
// → контроллеры помечаются @PreAuthorize("hasRole('INTERNAL_BOT')")
```

### 3. Новые эндпоинты под бота (если текущие завязаны на httpOnly cookie)

```
GET /internal/clients/{clientId}/tasks
GET /internal/clients/{clientId}/documents
GET /internal/clients/{clientId}/status
```

Если существующие эндпоинты принимают clientId как параметр и не завязаны на сессию — можно переиспользовать их напрямую.

### 4. Flyway миграция (в основном беке)

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

CREATE INDEX idx_tg_tokens_expires ON telegram_link_tokens(expires_at);
```

### 5. Эндпоинт генерации токена (в основном беке)

```
POST /api/telegram/link/generate   → { token, deeplink, expiresAt }
DELETE /api/telegram/link/unlink   → отвязать Telegram
GET /api/telegram/link/status      → привязан ли аккаунт
```

Эти три эндпоинта вызывает фронт JF-1C из профиля клиента.

---

## Структура TG Bot проекта

```
jf-tg-bot/
├── src/main/java/com/jf/bot/
│   ├── JfTgBotApplication.java
│   ├── config/
│   │   └── BotConfig.java               # @Configuration, RestTemplate bean
│   ├── bot/
│   │   ├── JfBot.java                   # extends TelegramLongPollingBot
│   │   └── UpdateDispatcher.java        # роутинг команд
│   ├── handler/
│   │   ├── StartHandler.java            # /start TOKEN → привязка
│   │   ├── StatusHandler.java           # /status → активные задачи
│   │   ├── DocsHandler.java             # /docs → список документов
│   │   └── HelpHandler.java             # /help
│   ├── service/
│   │   ├── LinkService.java             # привязка chat_id через токен
│   │   ├── JfApiClient.java             # все вызовы к основному беку
│   │   └── MessageFormatter.java        # форматирование текста для Telegram
│   └── scheduler/
│       └── NotificationPoller.java      # polling новых событий каждые 30 сек
├── src/main/resources/
│   └── application.properties
├── .env                                 # не в git
├── .gitignore
└── build.gradle
```

---

## Флоу привязки

```
1. Клиент в веб JF-1C → "Привязать Telegram"
   → фронт вызывает POST /api/telegram/link/generate
   → основной бек генерирует UUID-токен, пишет в telegram_link_tokens
     с expires_at = now() + 15 min
   → возвращает deeplink: https://t.me/YOUR_BOT?start=TOKEN

2. Клиент переходит по deeplink
   → Telegram открывает бота, бот получает /start TOKEN

3. StartHandler:
   → POST запрос к основному беку: /internal/telegram/bind
     { token: TOKEN, chatId: UPDATE.getChatId() }
   → основной бек: ищет токен, проверяет expires_at, создаёт telegram_links,
     удаляет токен
   → бот отвечает клиенту: "Готово. Теперь вы будете получать уведомления здесь."

4. Если токен истёк или не найден:
   → бот: "Ссылка устарела. Сгенерируйте новую в личном кабинете."
```

---

## JfApiClient — все запросы к основному беку

```java
// Все методы добавляют заголовок X-Internal-Token из env
// Основной бек проверяет токен и возвращает данные по clientId

getTasksByClientId(Long clientId)      → List<TaskDto>
getDocumentsByClientId(Long clientId)  → List<DocumentDto>
bindTelegram(String token, Long chatId) → BindResult
getChatIdByClientId(Long clientId)     → Optional<Long>  // для push-уведомлений
```

---

## Push-уведомления (NotificationPoller)

Бот polling основного бека каждые 30 секунд:

```
GET /internal/telegram/pending-notifications
→ [ { chatId, message, type } ]
→ бот шлёт каждому chatId его сообщение
→ POST /internal/telegram/notifications/ack  { ids: [...] }  — пометить как отправленные
```

Для этого в основном беке нужна таблица:

```sql
-- VN+1__add_telegram_notifications.sql
CREATE TABLE telegram_notifications (
    id          BIGSERIAL PRIMARY KEY,
    chat_id     BIGINT NOT NULL,
    message     TEXT NOT NULL,
    sent        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);
```

Основной бек пишет в эту таблицу когда происходит событие (смена статуса задачи, документ готов). Бот читает, шлёт, помечает `sent = true`.

---

## application.properties бота

```properties
# application.properties
telegram.bot.token=${TELEGRAM_BOT_TOKEN}
telegram.bot.username=${TELEGRAM_BOT_USERNAME}

jf.api.base-url=${JF_API_BASE_URL}
jf.api.internal-token=${INTERNAL_BOT_TOKEN}

spring.main.web-application-type=none
```

`spring.main.web-application-type=none` — бот не поднимает HTTP сервер, только long polling. Меньше памяти, проще запуск.

---

## .env (не в git, добавить в .gitignore)

```
TELEGRAM_BOT_TOKEN=xxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_BOT_USERNAME=jf_notify_bot
JF_API_BASE_URL=https://zhanfinance.fly.dev
INTERNAL_BOT_TOKEN=<случайный UUID>
```

---

## build.gradle (только новые зависимости)

```gradle
implementation 'org.telegram:telegrambots:6.9.7'
implementation 'org.springframework.boot:spring-boot-starter'
implementation 'org.springframework.boot:spring-boot-starter-web'   // для RestTemplate
```

Без `spring-boot-starter-data-jpa` — бот не имеет прямого доступа к БД.

---

## Команды бота

| Команда | Действие |
|---|---|
| `/start TOKEN` | Привязка Telegram к аккаунту JF-1C |
| `/status` | Активные задачи клиента |
| `/docs` | Последние 5 документов |
| `/help` | Список команд |

---

## Roadmap

### Фаза 1 — Основа (делать сейчас)
- [ ] Создать проект, build.gradle, структура папок
- [ ] `application.properties` + `.env` + `.gitignore`
- [ ] `JfBot.java` + `UpdateDispatcher.java` — long polling работает
- [ ] `JfApiClient.java` — RestTemplate + X-Internal-Token заголовок
- [ ] Изменения в основном беке: `InternalTokenFilter` + `/internal/**` эндпоинты
- [ ] Flyway миграции в основном беке (telegram_links + telegram_link_tokens)
- [ ] `StartHandler` — флоу привязки работает end-to-end
- [ ] `HelpHandler` — `/help`

### Фаза 2 — Данные
- [ ] `StatusHandler` — `/status` возвращает задачи клиента
- [ ] `DocsHandler` — `/docs` возвращает документы
- [ ] `MessageFormatter` — читаемый формат вывода

### Фаза 3 — Push-уведомления
- [ ] Flyway миграция: `telegram_notifications`
- [ ] Основной бек пишет в таблицу при событиях (статус задачи, документ)
- [ ] `NotificationPoller` — polling каждые 30 сек, шлёт и помечает sent=true

### Фаза 4 — Polish
- [ ] Кнопка "Привязать Telegram" на фронте JF-1C (профиль клиента)
- [ ] Кнопка "Отвязать Telegram"
- [ ] Cron-job в основном беке: очистка протухших токенов раз в час

---

## Подводные камни

**[CRITICAL]** `INTERNAL_BOT_TOKEN` — это мастер-ключ доступа к данным всех клиентов. Минимум 32 символа, только в env, ротировать при компрометации. В основном беке проверять его до любой бизнес-логики.

**[WARNING]** Long polling держит постоянный connection к Telegram. Локально — не проблема. При деплое на сервер — следить за памятью.

**[WARNING]** `telegram_notifications` будет расти. Добавить индекс на `sent` + `created_at` и партиционирование или очистку старых записей (`sent = true AND created_at < now() - interval '7 days'`).

**[INFO]** `spring.main.web-application-type=none` — бот не слушает порт. Если понадобится health check endpoint для мониторинга — убрать эту строку и добавить `spring-boot-starter-actuator`.

**[INFO]** RestTemplate синхронный. Если Fly.io бек лагает — бот зависает на время таймаута. Установить явные таймауты: `connectTimeout=3s`, `readTimeout=5s`.
