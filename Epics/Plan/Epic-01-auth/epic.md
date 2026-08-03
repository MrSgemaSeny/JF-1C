# Epic-01: Auth

## Мета

| Поле         | Значение                                                    |
|--------------|-------------------------------------------------------------|
| **Домен**    | Auth                                                        |
| **Роли**     | ADMIN, EMPLOYEE, CLIENT, CURATOR, LEARNER, ADVISOR          |
| **Статус**   | Done                                                        |
| **Миграции** | V1 — V15                                                    |
| **Зависит от** | нет зависимостей                                            |
| **Блокирует**  | Все остальные эпики                                         |

---

## Зачем этот эпик

Без этого эпика система не может различать пользователей и их роли, что делает невозможным безопасный доступ к данным CRM, LMS и биллинга. Эпик обеспечивает надежную аутентификацию, авторизацию и защиту сессий (JWT, CSRF, Cookies).

---

## Пользовательские истории

| ID       | Роль      | Хочу                                      | Чтобы                                              | Статус |
|----------|-----------|-------------------------------------------|----------------------------------------------------|--------|
| US-01.1  | *Любая*   | входить в систему по email/паролю или Google | получить доступ к своему рабочему пространству      | Done   |
| US-01.2  | *Любая*   | безопасно хранить свою сессию             | мой аккаунт не могли угнать через XSS или CSRF     | Done   |
| US-01.3  | ADMIN     | блокировать (soft delete) пользователей   | мгновенно прекращать им доступ к системе           | Done   |
| US-01.4  | *Любая*   | иметь разные уровни доступа (роли)        | видеть только ту информацию, которая мне положена  | Done   |

---

## Out of Scope

- Двухфакторная аутентификация (2FA) — Epic-09

---

## Технические решения

- **httpOnly cookie + SameSite=None вместо localStorage** — токены недоступны из JS (защита от XSS), работают cross-origin между Github Pages и Fly.dev.
- **Custom CsrfHeaderFilter (X-Requested-With)** — защита от CSRF для SPA без необходимости стейтфул CSRF-токенов.
- **Refresh token rotation + revocation** — автоматическое продление сессии и полный отзыв (revokeAll) при смене пароля или логауте.
- **WebSocket Auth через Cookie** — отказ от передачи токена в URL, что предотвращает утечку токенов в access логах.

---

## Acceptance Criteria

- [x] [US-01.1] Успешный логин выдает httpOnly cookie с access и refresh токенами.
- [x] [US-01.2] Любой state-changing запрос без заголовка `X-Requested-With` блокируется (403 Forbidden).
- [x] [US-01.3] При soft delete пользователя все его активные сессии сбрасываются.
- [x] [US-01.4] Ролевой доступ строго контролируется через аннотации `@PreAuthorize` и `CrmAccessService`.
- [x] Неавторизованный запрос возвращает 401.

---

## Definition of Done

- [x] Все US из таблицы выше реализованы или явно перенесены в другой эпик с указанием куда
- [x] Flyway-миграции добавлены и проверены на чистой БД
- [x] Smoke-тесты покрывают happy path каждой US
- [x] Секреты только в env vars / Fly secrets, не в коде
- [x] Нет raw stack trace в ответах API (ошибки через ApiException + ErrorCode)
- [x] CI/CD pipeline зелёный (все тесты проходят перед деплоем)
- [x] Эпик задеплоен на прод и проверен вручную

---

## Известные ограничения / технический долг

- `[INFO]` Токены JWT не имеют blacklist'а для access-токена, отзыв сессии инвалидирует только refresh-токен. Access-токен продолжает жить до истечения своего короткого TTL (15 минут).
- `[INFO]` CSRF-фильтр пропускает `application/json` запросы, полагаясь на механизм CORS-preflight в браузерах.

---

## Связанные ресурсы

- Миграции: `zhan-finance-backend/src/main/resources/db/migration/`
- Контроллер: `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/auth/controller/`
- Тесты: `zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/auth/`
- Frontend: `zhan-finance-frontend/src/features/auth/` и `zhan-finance-frontend/src/pages/auth/`
