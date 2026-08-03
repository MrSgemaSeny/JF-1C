# Epic-10: Monitoring & Observability

**Цель:** Знать о проблемах раньше пользователей
**Домен:** Infra
**Роли:** ADMIN (внутренний)
**Статус:** Planned

## Реализовано
- [x] Actuator endpoints (health, info, metrics, prometheus)
- [x] micrometer-registry-prometheus подключен
- [ ] /actuator/prometheus закрыт JWT -- внешний Prometheus не может скрейпить
- [x] Backend Sentry SDK
- [x] Backend OTLP (US-10.1 partial)
- [x] US-10.2 — Sentry для error tracking (backend + frontend)

## Planned
- [ ] US-10.1 — Prometheus + Grafana на Fly.io (доделать)
- [ ] US-10.3 — UptimeRobot для uptime мониторинга
- [ ] US-10.4 — Алерты в Telegram при падении

## Acceptance Criteria
- [ ] Алерт приходит в Telegram в течение 2 минут после падения
- [ ] Grafana показывает latency, error rate, DB connections
