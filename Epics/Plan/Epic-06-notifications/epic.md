# Epic-06: Notifications

**Цель:** Уведомления пользователей о событиях в системе (in-app + email)
**Домен:** Notifications
**Роли:** Все
**Статус:** Partial

## Реализовано
- [x] notifications таблица
- [x] In-app уведомления
- [x] Email через SMTP (прод) / mock (локально)
- [x] Fly.io secrets для SMTP

## Planned
- [ ] US-06.5 — Push уведомления (браузерные)
- [ ] US-06.6 — Telegram уведомления для ADMIN
- [ ] US-06.7 — Настройки уведомлений per-user

## Acceptance Criteria
- [x] Email отправляется на проде
- [x] Локально ошибок не бросает (mock fallback)
