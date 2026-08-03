# Epic-10: Monitoring & Observability

**Цель:** Знать о проблемах раньше пользователей
**Домен:** Infra
**Роли:** ADMIN (внутренний)
**Статус:** Done

## Реализовано
- [x] Actuator endpoints (health, info, metrics, prometheus)
- [x] micrometer-registry-prometheus подключен
- [x] /actuator/prometheus закрыт JWT -- внешний Prometheus не может скрейпить (Заменено на OTLP PUSH модель, скрейпинг больше не нужен)
- [x] Backend Sentry SDK (Временно отключен из-за бага Sentry + Spring Boot 4.1)
- [x] Backend OTLP (US-10.1)
- [x] US-10.2 — Sentry для error tracking (backend + frontend)
- [x] US-10.3 — UptimeRobot для uptime мониторинга
- [x] US-10.4 — Алерты при падении (Telegram/Email)

## Acceptance Criteria
- [x] Алерт приходит в течение 2 минут после падения
- [x] Grafana показывает latency, error rate, DB connections (через OTLP)
