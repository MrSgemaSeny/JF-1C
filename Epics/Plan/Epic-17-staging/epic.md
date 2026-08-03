# Epic-17: Staging Environment

**Цель:** Отдельная среда для тестирования перед деплоем на прод
**Домен:** Infra
**Роли:** —
**Статус:** Planned

## Planned
- [ ] US-17.1 — Создать staging app на Fly.io (zhanfinance-staging.fly.dev)
- [ ] US-17.2 — Отдельная БД для staging
- [ ] US-17.3 — GitHub Actions: деплой на staging при push в develop
- [ ] US-17.4 — GitHub Actions: деплой на prod только из main после staging pass
- [ ] US-17.5 — Smoke tests на staging перед промоутом

## Acceptance Criteria
- [ ] Каждый PR проходит через staging
- [ ] Прод деплоится только если staging зелёный
