# Epic-02: CRM

**Цель:** Управление задачами, клиентами и воронкой продаж внутри компании
**Домен:** CRM
**Роли:** ADMIN, EMPLOYEE, CLIENT, ADVISOR
**Статус:** Done
**Миграции:** V16 — V60 (примерно)

## Реализовано
- [x] Tasks (создание, назначение, статусы, история)
- [x] Task Pool — незаназначенные задачи видны всем EMPLOYEE
- [x] Subtasks
- [x] Task comments
- [x] Task tags + user labels
- [x] Pipeline (воронка продаж)
- [x] Kanban-доска по стадиям
- [x] Stages управление
- [x] Client profiles
- [x] IDOR защита на batch-операциях
- [x] CrmAccessService — изоляция доступа
- [x] PipelineSeederService через ApplicationReadyEvent (race condition fix)
- [x] Task Pool reopening -- задачи из стадии LOST автоматически возвращаются на первую OPEN стадию при назначении из пула
- [x] ADVISOR имеет полный доступ ко всем задачам и клиентам
- [x] Отменённые задачи (LOST/CANCELLED) скрывают кнопки действий

## Acceptance Criteria
- [x] EMPLOYEE видит только свои задачи после назначения
- [x] Незаназначенные задачи доступны всем EMPLOYEE (Task Pool)
- [x] Batch-операции проверяют ownership
