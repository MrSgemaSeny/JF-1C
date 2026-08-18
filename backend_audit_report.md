# Backend Audit Report: Performance, Concurrency, and Security

В данном отчете зафиксированы все критические проблемы, обнаруженные в ходе аудита бэкенда ZhanFinance. 

> [!CAUTION]
> Кодовая база не модифицировалась. Это обзорный документ для последующего исправления.

---

## Часть 1: Производительность и Конкурентность (Performance & Concurrency)

### [CRITICAL] 1. Dashboard N+1 (Множественный `JOIN FETCH`)
- **Проблема:** Использование 6 `JOIN FETCH` на коллекции без пагинации приводит к in-memory фильтрации (Hibernate вытягивает декартово произведение строк в память приложения и фильтрует там).
- **Риск:** OutOfMemoryError (OOM) и катастрофическое падение производительности под нагрузкой.
- **Решение:** Разбить на несколько запросов (например, `@BatchSize`, `@EntityGraph` без декартова произведения, или 2-3 независимых запроса).

### [CRITICAL] 2. Chat Contacts N+1
- **Проблема:** 201 запрос к БД на одно открытие списка контактов чата. Классическая проблема N+1.
- **Решение:** Переписать на 1 нативный запрос с использованием оконных функций (Window Functions) для получения последних сообщений, либо использовать 2 bulk-запроса (один для контактов, один для последних сообщений `IN (...)`).

### [CRITICAL] 3. Генерация PDF (OpenHTMLtoPDF Thread Exhaustion)
- **Проблема:** `OpenHTMLtoPDF` — синхронная и тяжелая операция. Сейчас она блокирует основной поток Tomcat (HTTP-worker). При 5+ одновременных запросах на генерацию PDF весь пул потоков сервера начнет "задыхаться".
- **Решение:** Вынести генерацию в `@Async` с **обязательным** выделенным пулом потоков (ограниченным, например, `core=2, max=4, queue=50`), чтобы тяжелые задачи не съедали потоки, обрабатывающие легкие API-запросы.

### [WARNING] 4. Настройка `@Async` для Email
- **Проблема:** `@Async` включен, но по умолчанию Spring может использовать `SimpleAsyncTaskExecutor`, который создает новый OS-поток на каждый вызов без ограничений (нет пула потоков).
- **Решение:** Явно сконфигурировать `ThreadPoolTaskExecutor` для асинхронных задач (например, `Thread-Email-X`).

---

## Часть 2: Безопасность (Security)

### [CRITICAL] 1. Hardcoded Google Client ID (`@Value` default)
- **Файл:** `GoogleAuthService.java`
- **Суть:** Production Client ID зашит как дефолтное значение: `@Value("${google.client.id:24916...}")`. Оседает в истории Git и маскирует отсутствие конфигурации.
- **Решение:** Убрать дефолтное значение, использовать Fail-fast.

### [CRITICAL] 2. Уязвимый CSRF-bypass (`Content-Type` check)
- **Файл:** `CsrfHeaderFilter.java`
- **Суть:** Логика доверяет `Content-Type: application/json`. С 2017 года `fetch()` может обходить preflight при CORS misconfiguration (а у нас `allowedOriginPatterns` включает `localhost:*`).
- **Решение:** `SameSite=Strict/Lax` или Double Submit Cookie / Synchronizer Token.

### [CRITICAL] 3. `SameSite=None` на auth cookies
- **Файл:** `AuthCookieHelper.java`
- **Суть:** Куки отправляются на кросс-доменные запросы, что в связке с отсутствием реального CSRF-токена является уязвимостью.
- **Решение:** Изменить на `SameSite=Lax` (или `Strict`).

### [WARNING] 4. Spoofing `Fly-Client-IP`
- **Файлы:** `AuthRateLimitFilter.java`, `ApiRateLimitFilter.java`
- **Суть:** Доверие к заголовку `Fly-Client-IP`. Любой клиент может напрямую передать этот заголовок и обойти Rate Limiting.
- **Решение:** Использовать `request.getRemoteAddr()` или жестко закрыть ingress.

### [WARNING] 5. JWT передается в query param (WebSocket)
- **Файл:** `JwtAuthenticationFilter.java`
- **Суть:** Токен читается из `?token=...`, что приводит к утечке токена в access/proxy/browser логах.
- **Решение:** Использовать только заголовки STOMP CONNECT.

### [WARNING] 6. WS CORS default `*`
- **Файл:** `WebSocketConfig.java`
- **Суть:** `@Value("${app.cors.allowed-origins:* }")` — открывает сокеты для всех.
- **Решение:** Убрать `*` как дефолт.

### [WARNING] 7. Public file upload без MIME-verification
- **Файл:** `ContactRequestService.java`
- **Суть:** Файлы проверяются только по строковому расширению (`.pdf`). Можно загрузить EXE под видом PDF.
- **Решение:** Apache Tika MIME detection.

### [WARNING] 8. Avatar upload: Content-Type trust & size
- **Файл:** `UserService.java`
- **Суть:** Нет лимита размера, доверие заголовку `Content-Type` от клиента, нет проверки magic bytes.
- **Решение:** Tika (magic bytes) + size limit (5MB).

### [WARNING] 9. `checkEmail` user enumeration
- **Файлы:** `AuthController.java`, `AuthService.java`
- **Суть:** Позволяет собрать список зарегистрированных email-ов для credential stuffing.
- **Решение:** Защитить строгим Rate Limit (покрыть путь `/v1/auth/`).

### [WARNING] 10. 2FA `verify` Race Condition
- **Файл:** `TwoFactorService.java`
- **Суть:** Удаление и создание pre-auth токена идет последовательно. Параллельные запросы могут создать два валидных токена.
- **Решение:** Атомарный upsert или `@Transactional` + `@Lock`.

### [WARNING] 11. CSV formula injection
- **Файл:** `ExportController.java`
- **Суть:** Поля, начинающиеся с `=`, `+`, `-`, `@`, выполняются как макросы в Excel.
- **Решение:** Экранирование (префикс `'`).

### [INFO] 12. Exception Leak (TestEmailController)
- Убрать `e.toString()` (stack trace) из HTTP-ответа.

### [INFO] 13. IDOR проверка (DocumentController)
- Покрыть тестом проверку `targetUserId` в `uploadDocument`.

### [INFO] 14. Timing Attack (AuthService)
- Уравнять время ответа (сделать фиктивный вызов `passwordEncoder.matches()`) при `DisabledException`.
