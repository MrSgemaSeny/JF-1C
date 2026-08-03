# Epic-09: Two-Factor Authentication (2FA)

**Цель:** Дополнительный уровень защиты аккаунта через TOTP
**Домен:** Auth
**Роли:** Все
**Статус:** Done
**Миграции:** V110

## Реализовано
- [x] V110 — колонки totp_secret, two_factor_enabled в app_users
- [x] V110 — таблица two_factor_pre_auth (token, expires_at)
- [x] totp-spring-boot-starter подключён
- [x] Индексы на two_factor_pre_auth(token) и (expires_at)
- [x] US-09.1 -- Включение 2FA (генерация QR-кода)
- [x] US-09.2 -- Верификация TOTP при логине
- [x] US-09.3 -- Отключение 2FA
- [x] US-09.4 -- Резервные коды восстановления
- [x] US-09.5 -- Frontend: страница настройки 2FA
- [x] US-09.6 -- Очистка expired записей two_factor_pre_auth (@Scheduled)

## Acceptance Criteria
- [x] QR-код сканируется в Google Authenticator / Authy
- [x] При включённой 2FA логин требует TOTP код
- [x] Неверный код → 401, не инвалидирует сессию
- [x] Expired pre-auth записи очищаются автоматически

6 unit tests in TwoFactorServiceTest.
