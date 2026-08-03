# Epic-08: Dashboard & Analytics

**Цель:** Сводная информация о состоянии бизнеса для ADMIN и EMPLOYEE
**Домен:** Cross
**Роли:** ADMIN, EMPLOYEE, ADVISOR
**Статус:** Partial

## Реализовано
- [x] Dashboard cache (Caffeine, per-region)
- [x] Базовые метрики
- [x] Advisor Overview страница (сводка по всем клиентам/задачам)
- [x] Advisor Workload страница
- [x] Advisor навигация в sidebar (Tasks, Clients, Documents, Chat)
- [x] Leads Page с унифицированным скроллингом

## Planned
- [ ] US-08.3 — Графики по задачам (выполнено / в работе / просрочено)
- [ ] US-08.4 — Выручка по периодам
- [ ] US-08.5 — Активность сотрудников
- [ ] US-08.6 — Конверсия воронки продаж

## Acceptance Criteria
- [ ] Dashboard загружается < 1s (кеш)
- [ ] Данные актуальны с задержкой не более 5 минут
