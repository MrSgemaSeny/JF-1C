# JF-1C Telegram Bot — Full Plan

## Концепция

Отдельный Spring Boot сервис (`jf-tg-bot`). Читает данные из основного JF-1C бека через REST.
Клиент привязывает Telegram через одноразовый токен из веб-интерфейса.
После привязки бот делает запросы к основному беку с заголовком `X-Internal-Token` + `clientId`.

```
[Telegram API] ←(Long Polling)→ [JF-1C TG Bot (локально / сервер)]
                                       ↓ GET / POST + X-Internal-Token (RestClient)
                                [JF-1C Backend (Fly.io)]
                                       ↓
                                [Fly.io PostgreSQL]
```

---

## Изменения в основном беке (минимальные)

### 1. Новый env секрет

```properties
INTERNAL_BOT_TOKEN=<криптостойкая случайная строка, минимум 64 символа>
```

### 2. Фильтр межсервисной аутентификации

```java
// InternalTokenFilter.java
// Защита от timing attacks через MessageDigest.isEqual
// Если запрос приходит на /internal/** с заголовком X-Internal-Token == INTERNAL_BOT_TOKEN
// → выставляем Authentication с ролью INTERNAL_BOT в SecurityContext
// → контроллеры защищаются @PreAuthorize("hasRole('INTERNAL_BOT')")
```

### 3. Новые эндпоинты под бота

```
GET /internal/clients/{clientId}/tasks
GET /internal/clients/{clientId}/documents
GET /internal/clients/{clientId}/status
POST /internal/telegram/bind
GET /internal/telegram/pending-notifications
POST /internal/telegram/notifications/ack
```

### 4. Flyway миграции (в основном беке)

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

-- VN+1__add_telegram_notifications.sql (Transactional Outbox)

CREATE TABLE telegram_notifications (
    id          BIGSERIAL PRIMARY KEY,
    chat_id     BIGINT NOT NULL,
    message     TEXT NOT NULL,
    sent        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- Partial index: выборка только неотправленных уведомлений
CREATE INDEX idx_tg_notif_pending ON telegram_notifications (created_at) WHERE sent = false;
CREATE INDEX idx_tg_notif_retention ON telegram_notifications (created_at) WHERE sent = true;
```

### 5. Эндпоинты генерации токена (для веб-профиля клиента)

```
POST /api/v1/telegram/link/generate   → { token, deeplink, expiresAt }
DELETE /api/v1/telegram/link/unlink   → отвязать Telegram
GET /api/v1/telegram/link/status      → { linked: boolean, username?: string }
```

### 6. Retention Cron (очистка в основном беке)

```java
// TelegramCleanupScheduler.java
// 1. Очистка протухших токенов привязки раз в час:
// DELETE FROM telegram_link_tokens WHERE expires_at < NOW();

// 2. Очистка отправленных push-уведомлений старше 7 дней раз в сутки:
// DELETE FROM telegram_notifications WHERE sent = true AND created_at < NOW() - INTERVAL '7 days';
```

---

## Структура TG Bot проекта (`jf-tg-bot`)

```
jf-tg-bot/
├── src/main/java/com/jf/bot/
│   ├── JfTgBotApplication.java
│   ├── config/
│   │   ├── BotConfig.java               # @Configuration, TelegramClient bean
│   │   └── RestClientConfig.java        # RestClient bean с таймаутами (3s connect, 5s read)
│   ├── bot/
│   │   ├── JfBot.java                   # Long Polling потребитель (telegrambots 7.x)
│   │   └── UpdateDispatcher.java        # роутинг команд (/start, /status, /docs, /help)
│   ├── handler/
│   │   ├── StartHandler.java            # /start TOKEN → привязка chat_id
│   │   ├── StatusHandler.java           # /status → активные задачи клиента
│   │   ├── DocsHandler.java             # /docs → последние 5 документов
│   │   └── HelpHandler.java             # /help
│   ├── service/
│   │   ├── LinkService.java             # привязка chat_id через токен
│   │   ├── JfApiClient.java             # вызовы к основному беку через RestClient
│   │   └── MessageFormatter.java        # форматирование HTML/Markdown для Telegram
│   └── scheduler/
│       └── NotificationPoller.java      # polling новых событий каждые 30 сек + rate limit 35-50ms
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
   → фронт вызывает POST /api/v1/telegram/link/generate
   → основной бек генерирует UUID-токен, пишет в telegram_link_tokens
     с expires_at = now() + 15 min
   → возвращает deeplink: https://t.me/YOUR_BOT?start=TOKEN

2. Клиент переходит по deeplink
   → Telegram открывает бота, бот получает /start TOKEN

3. StartHandler:
   → POST запрос к основному беку через JfApiClient: /internal/telegram/bind
     { token: TOKEN, chatId: UPDATE.getChatId() }
   → основной бек: ищет токен, проверяет expires_at, создаёт telegram_links, удаляет токен
   → бот отвечает клиенту: "Готово. Теперь вы будете получать уведомления здесь."

4. Если токен истёк или не найден:
   → бот: "Ссылка устарела. Сгенерируйте новую в личном кабинете."
```

---

## JfApiClient — вызовы к основному беку через `RestClient`

```java
@Configuration
public class RestClientConfig {
    @Bean
    public RestClient jfRestClient(@Value("${jf.api.base-url}") String baseUrl,
                                   @Value("${jf.api.internal-token}") String token) {
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
            HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build()
        );
        requestFactory.setReadTimeout(Duration.ofSeconds(5));

        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-Internal-Token", token)
                .requestFactory(requestFactory)
                .build();
    }
}
```

Методы клиента:
```java
getTasksByClientId(Long clientId)       → List<TaskDto>
getDocumentsByClientId(Long clientId)   → List<DocumentDto>
bindTelegram(String token, Long chatId)  → BindResultDto
getPendingNotifications()               → List<NotificationDto>
ackNotifications(List<Long> ids)        → void
```

---

## Push-уведомления (Transactional Outbox + NotificationPoller)

1. Основной бек при бизнес-событиях (смена статуса задачи, готовность документа) в рамках той же транзакции БД делает:
   ```sql
   INSERT INTO telegram_notifications (chat_id, message, sent) VALUES (?, ?, false);
   ```
2. Бот опрашивает основной бек каждые 30 секунд (`NotificationPoller`):
   ```
   GET /internal/telegram/pending-notifications
   → возвращает список неотправленных сообщений
   → бот отправляет каждое сообщение с паузой 35–50 мс (защита от Telegram HTTP 429)
   → POST /internal/telegram/notifications/ack { ids: [...] } → помечает sent = true
   ```

---

## `build.gradle` бота (Spring Boot 3.2+ / Java 17)

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.3.4'
    id 'io.spring.dependency-management' version '1.1.6'
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
    implementation 'org.springframework.boot:spring-boot-starter-web' // для RestClient & Jackson
    
    // Telegram Bots 7.x
    implementation 'org.telegram:telegrambots-longpolling:7.2.1'
    implementation 'org.telegram:telegrambots-client:7.2.1'

    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

---

## `application.properties` бота

```properties
telegram.bot.token=${TELEGRAM_BOT_TOKEN}
telegram.bot.username=${TELEGRAM_BOT_USERNAME}

jf.api.base-url=${JF_API_BASE_URL}
jf.api.internal-token=${INTERNAL_BOT_TOKEN}

# Без embedded веб-сервера (Tomcat не стартует, память ~50-70 МБ RAM)
spring.main.web-application-type=none
```

---

## Модель безопасности и сетевая изоляция

1. **Прикладной уровень (Обязательный, достаточный)**:
   - `INTERNAL_BOT_TOKEN` — криптографический секрет длиной 64+ символов.
   - Проверка заголовка `X-Internal-Token` в `InternalTokenFilter` выполняется через `MessageDigest.isEqual` (constant-time, защита от timing attacks).
   - Это гарантирует полную безопасность даже при работе бота с **динамического IP-адреса** (локально или на домашнем/офисном сервере).

2. **Сетевой уровень (Defense in Depth / Hardening — nice to have)**:
   - *Фаза 1 (Локальный запуск / динамический IP)*: Защита обеспечивается криптостойким `X-Internal-Token`.
   - *Фаза 2 (Переезд на физический сервер / продакшн)*:
     - Опция А: При наличии статического IP — добавление IP-вайтлиста на Cloudflare WAF для путей `/internal/**`.
     - Опция Б: VPN-туннель (WireGuard / Tailscale / Fly.io 6PN) между сервером бота и бекендом.

---

## Roadmap реализации

### Фаза 1 — Основа и привязка
- [ ] Создать репозиторий/папку `jf-tg-bot`, настроить `build.gradle` (Spring Boot 3.3, TelegramBots 7.2.1)
- [ ] Конфигурация `RestClientConfig` (таймауты 3s/5s) + `application.properties` + `.env`
- [ ] Основной бек: Flyway миграции `telegram_links` и `telegram_link_tokens`
- [ ] Основной бек: `InternalTokenFilter` + `POST /internal/telegram/bind`
- [ ] Основной бек: эндпоинты генерации ссылки `/api/v1/telegram/link/generate`
- [ ] Бот: `JfBot` (Long Polling) + `StartHandler` (`/start TOKEN`)
- [ ] Бот: `HelpHandler` (`/help`)

### Фаза 2 — Команды чтения данных
- [ ] Основной бек: `GET /internal/clients/{clientId}/tasks` и `/status`
- [ ] Бот: `StatusHandler` (`/status` — список активных задач клиента)
- [ ] Бот: `DocsHandler` (`/docs` — последние документы)
- [ ] Бот: `MessageFormatter` (аккуратный HTML-формат сообщений)

### Фаза 3 — Push-уведомления (Outbox)
- [ ] Основной бек: Flyway миграция `telegram_notifications` с partial index `WHERE sent = false`
- [ ] Основной бек: Запись событий в `telegram_notifications` при смене статуса задачи и генерации документов
- [ ] Основной бек: эндпоинты `/internal/telegram/pending-notifications` и `/ack`
- [ ] Бот: `NotificationPoller` (cron каждые 30 сек + rate limit 35-50ms между сообщениями)
- [ ] Основной бек: Cron-очистка протухших токенов (1 раз/час) и старых отправленных уведомлений (1 раз/сутки)

### Фаза 4 — UI & Polish
- [ ] Фронтенд: Кнопка «Привязать Telegram» и «Отвязать Telegram» в профиле клиента
- [ ] Команда `/unlink` в самом Telegram-боте

