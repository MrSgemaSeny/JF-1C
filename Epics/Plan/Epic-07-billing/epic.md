# Epic-07: Billing

**Цель:** Управление подписками, инвойсами и услугами компании
**Домен:** Billing
**Роли:** ADMIN, CLIENT
**Статус:** Partial

## Реализовано
- [x] invoices таблица
- [x] subscriptions таблица
- [x] services таблица
- [x] service_features таблица
- [x] service_requests таблица
- [x] ServiceDatabaseSeeder
- [x] task_services (связь задач и услуг)

## Planned
- [ ] US-07.5 — Kaspi Pay интеграция → Epic-12
- [ ] US-07.6 — Halyk Epay интеграция → Epic-12
- [ ] US-07.7 — Автоматические напоминания об оплате
- [ ] US-07.8 — PDF инвойс для клиента

## Acceptance Criteria
- [ ] Клиент может оплатить через Kaspi Pay
- [ ] Инвойс генерируется в PDF
