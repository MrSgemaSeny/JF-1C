# Epic-11: Domain & CDN

**Цель:** Собственный домен + Cloudflare для защиты и производительности
**Домен:** Infra
**Роли:** —
**Статус:** Planned

## Planned
- [ ] US-11.1 — Подключить домен zhanfinance.kz
- [ ] US-11.2 — Cloudflare DNS + проксирование
- [ ] US-11.3 — SSL сертификат через Cloudflare
- [ ] US-11.4 — CF-Connecting-IP header для rate limiting (закрывает known issue)
- [ ] US-11.5 — Перенести фронтенд с GitHub Pages на Cloudflare Pages

## Acceptance Criteria
- [ ] https://zhanfinance.kz открывается
- [ ] CF-Connecting-IP корректно обрабатывается в ApiRateLimitFilter
- [ ] HTTP → HTTPS редирект
