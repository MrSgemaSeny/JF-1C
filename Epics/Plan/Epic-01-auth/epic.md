# Epic-01: Auth

**Цель:** Безопасная аутентификация и авторизация пользователей через JWT и Google OAuth2
**Домен:** Auth
**Роли:** Все, ADVISOR
**Статус:** Done
**Миграции:** V1 — V15 (примерно)

## Реализовано
- [x] Регистрация / логин по email + password
- [x] Google OAuth2
- [x] JWT в httpOnly cookie
- [x] Refresh token rotation + revocation
- [x] revokeAll при смене пароля и удалении пользователя
- [x] Роли: ADMIN, EMPLOYEE, CLIENT, CURATOR, LEARNER, ADVISOR
- [x] Soft delete пользователей
- [x] CustomUserDetailsService
- [x] Row-level security через CrmAccessService
- [x] Роль ADVISOR с расширенным доступом ко всем клиентам/задачам/документам

## Acceptance Criteria
- [x] Токены не утекают в localStorage или URL
- [x] Refresh token инвалидируется при logout и смене пароля
- [x] Сессии инвалидируются при soft delete
