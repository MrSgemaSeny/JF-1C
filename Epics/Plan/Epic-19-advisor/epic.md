# Epic-19: Advisor Role

## Мета

| Поле         | Значение                                                    |
|--------------|-------------------------------------------------------------|
| **Домен**    | Cross                                                       |
| **Роли**     | ADVISOR                                                     |
| **Статус**   | Done                                                        |
| **Миграции** | V109                                                        |
| **Зависит от** | Epic-01, Epic-02, Epic-03, Epic-05                         |
| **Блокирует**  | ничего                                                      |

---

## Зачем этот эпик

Без этого эпика старшие менеджеры и советники не могут иметь полноценного контроля и мониторинга процессов компании, так как их доступ был бы ограничен назначением на конкретные задачи или клиентов. Эпик дает сквозной доступ к метрикам, клиентам, задачам, документам и чатам организации.

---

## Пользовательские истории

| ID       | Роль      | Хочу                                      | Чтобы                                              | Статус |
|----------|-----------|-------------------------------------------|----------------------------------------------------|--------|
| US-19.1  | ADVISOR   | видеть сводный обзор (Overview) со всеми ключевыми метриками | оперативно оценивать текущее состояние компании    | Done   |
| US-19.2  | ADVISOR   | отслеживать нагрузку по сотрудникам (Workload) | контролировать распределение задач в команде        | Done   |
| US-19.3  | ADVISOR   | иметь сквозной Read-Only доступ ко всем клиентам, задачам и Task Pool | анализировать статус любых рабочих процессов в качестве супервизора без риска мутации данных | Done |
| US-19.4  | ADVISOR   | иметь Read-Only доступ ко всем документам и чатам клиентов и сотрудников | проверять артефакты и историю коммуникаций без возможности удаления или изменения файлов | Done |
| US-19.5  | ADVISOR   | использовать навигацию в sidebar (Overview, Workload, Tasks, Clients, Task Pool, Documents, Chat) | быстро переходить между рабочими разделами        | Done   |

---

## Out of Scope

- Администрирование пользователей и управление ролями — Epic-01
- Интеграция с внешней учетной системой 1С — Epic-13

---

## Технические решения

- **CrmAccessService и DocumentAccessService** — роль ADVISOR авторизована исключительно в режиме сквозного чтения (Read-Only). Полномочия на изменение задач (`canUpdateTaskDetails`), создание и удаление документов (`canWrite`, `canCreateFor`) для роли ADVISOR заблокированы как на сервисном уровне, так и в `@PreAuthorize` контроллеров.
- **Advisor Overview и Advisor Workload** — дашборды с агрегированной аналитикой по метрикам компании и распределению нагрузки среди персонала.
- **Конфигурация бокового меню (nav-config.ts)** — адаптирована система навигации для предоставления ролевых пунктов меню роли ADVISOR (Overview, Workload, Tasks, Clients, Task Pool, Documents, Chat).

---

## Acceptance Criteria

- [x] [US-19.1] ADVISOR видит сводную страницу со всеми метриками (Overview).
- [x] [US-19.2] ADVISOR видит нагрузку по сотрудникам (Workload).
- [x] [US-19.3] ADVISOR видит всех клиентов компании, все задачи всех сотрудников и незаназначенные задачи в Task Pool в режиме Read-Only.
- [x] [US-19.4] ADVISOR имеет доступ к просмотру документов и чатам любого клиента и сотрудника без права модификации.
- [x] [US-19.5] Навигация в sidebar содержит все необходимые пункты для роли ADVISOR (Overview, Workload, Tasks, Clients, Task Pool, Documents, Chat).
- [x] CrmAccessService и DocumentAccessService корректно авторизуют роль ADVISOR в режиме строгого чтения, попытки мутаций возвращают 403 Forbidden (`tests/e2e/idor-live.mjs`).

---

## Definition of Done

- [x] Все US из таблицы выше реализованы или явно перенесены в другой эпик с указанием куда
- [x] Flyway-миграции добавлены и проверены на чистой БД
- [x] Smoke-тесты покрывают happy path каждой US
- [x] Секреты только в env vars / Fly secrets, не в коде
- [x] Нет raw stack trace в ответах API (ошибки через ApiException + ErrorCode)
- [x] CI/CD pipeline зелёный (все тесты проходят перед деплоем)
- [x] Эпик задеплоен на прод и проверен вручную

---

## Известные ограничения / технический долг

- `[INFO]` Права роли ADVISOR реализуются программно через сервисы доступа (`CrmAccessService`, `DocumentAccessService`), требуя явной поддержки роли во всех новых сервисах и эндпоинтах.

---

## Связанные ресурсы

- Миграции: `zhan-finance-backend/src/main/resources/db/migration/V109__Add_Advisor_Role_Support.sql`
- Контроллеры и сервисы: `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/crm/service/CrmAccessService.java`, `modules/documents/service/DocumentAccessService.java`, `modules/crm/controller/DashboardController.java`
- Тесты: `zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/crm/AdvisorSecurityIntegrationTest.java`
- Frontend: `zhan-finance-frontend/src/pages/dashboard/advisor/`, `zhan-finance-frontend/src/widgets/dashboard-shell/nav-config.ts`
