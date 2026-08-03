# Epic-07: Billing

---

## Мета

| Поле | Значение |
|---|---|
| **Домен** | Billing |
| **Роли** | ADMIN / CLIENT |
| **Статус** | Partial |
| **Миграции** | V1__Init_Schema.sql — V22__Migrate_And_Drop_Service_Requests.sql |
| **Зависит от** | нет зависимостей |
| **Блокирует** | Epic-12 |

---

## Зачем этот эпик

Эпик предоставляет функционал управления услугами компании, подписками клиентов и выпиской инвойсов. Без этого эпика невозможно вести прозрачный учет оказанных услуг, отслеживать оплаты и автоматизировать финансовые взаиморасчеты с клиентами.

---

## Пользовательские истории

| ID | Роль | Хочу | Чтобы | Статус |
|---|---|---|---|---|
| US-07.1 | ADMIN | управлять каталогом услуг и их особенностями | формировать актуальный прайс-лист для клиентов | Done |
| US-07.2 | ADMIN | создавать и отслеживать инвойсы по клиентам | контролировать финансовые поступления и задолженности | Done |
| US-07.3 | CLIENT | видеть свои подписки и выставленные инвойсы | своевременно получать информацию об оплатах | Done |
| US-07.4 | ADMIN | связывать оказываемые услуги с задачами CRM | вести точный учет выполнения работ по каждой услуге | Done |
| US-07.5 | CLIENT | оплачивать инвойсы через Kaspi Pay | быстро совершать платежи в привычном приложении (перенесено в Epic-12) | Planned |
| US-07.6 | CLIENT | оплачивать инвойсы через Halyk Epay | иметь альтернативный способ безналичной оплаты (перенесено в Epic-12) | Planned |
| US-07.7 | ADMIN | отправлять автоматические напоминания об оплате | снизить дебиторскую задолженность клиентов | Planned |
| US-07.8 | CLIENT | скачивать инвойс в формате PDF | сохранять и распечатывать официальные документы на оплату | Planned |

---

## Out of Scope

- Интеграция с эквайрингом Kaspi Pay — перенесена в Epic-12
- Интеграция с эквайрингом Halyk Epay — перенесена в Epic-12
- Автоматическая фискализация чеков — Epic-12

---

## Технические решения

- **InvoiceAccessService** — централизованная проверка прав доступа к инвойсам, исключающая возможность просмотра чужих счетов клиентами (IDOR защита)
- **InvoiceOverdueScheduler** — фоновый процесс по расписанию (cron = "0 0 1 * * *"), который автоматически переводит статус просроченных инвойсов в OVERDUE по часовому поясу Asia/Almaty
- **PdfGeneratorService (OpenHTMLtoPDF + Thymeleaf)** — генерация PDF-версий инвойсов с поддержкой кириллических шрифтов (Arial) на основе HTML-шаблонов
- **Рефакторинг схемы данных (миграция V22)** — переход от сервисных запросов (service_requests) к прямому связыванию подписок и инвойсов с задачами (task_id)

---

## Acceptance Criteria

- [x] [US-07.1] ADMIN может управлять услугами (services) и их функциями (service_features)
- [x] [US-07.2] ADMIN может создавать инвойсы (invoices) и управлять подписками (subscriptions)
- [x] [US-07.3] CLIENT видит только свои инвойсы и подписки
- [x] [US-07.4] Услуги корректно связываются с задачами CRM (таблица task_services)
- [ ] [US-07.5] Клиент может оплатить инвойс через Kaspi Pay (перенесено в Epic-12)
- [ ] [US-07.6] Клиент может оплатить инвойс через Halyk Epay (перенесено в Epic-12)
- [ ] [US-07.7] Настроены автоматические напоминания клиентам об оплате инвойсов
- [ ] [US-07.8] Инвойс генерируется в формате PDF и доступен для скачивания клиентом

---

## Definition of Done

- [ ] Все US из таблицы выше реализованы или явно перенесены в другой эпик с указанием куда
- [ ] Flyway-миграции добавлены и проверены на чистой БД
- [ ] Smoke-тесты покрывают happy path каждой US
- [ ] Секреты только в env vars / Fly secrets, не в коде
- [ ] Нет raw stack trace в ответах API (ошибки через ApiException + ErrorCode)
- [ ] CI/CD pipeline зелёный (все тесты проходят перед деплоем)
- [ ] Эпик задеплоен на прод и проверен вручную

---

## Известные ограничения / технический долг

- `[INFO]` Интеграции с платежными системами (Kaspi Pay, Halyk Epay) вынесены в отдельный Epic-12 (Payment Gateway)
- `[INFO]` Устаревшая таблица `service_requests` мигрирована и удалена в рамках миграции V22 в пользу прямых связей `task_id`

---

## Связанные ресурсы

- Миграции: `zhan-finance-backend/src/main/resources/db/migration/V1__Init_Schema.sql`, `V2__Accounting_Schema.sql`, `V17__Services_Schema.sql`, `V20__Add_Service_Request_To_Billing.sql`, `V21__Add_Task_Services.sql`, `V22__Migrate_And_Drop_Service_Requests.sql`
- Контроллер: `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/controller/`
- Сервисы: `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/service/`
- Шаблоны: `zhan-finance-backend/src/main/resources/templates/pdf/invoice.html`
- Тесты: `zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/billing/`
- Frontend: `zhan-finance-frontend/src/entities/billing/` и `zhan-finance-frontend/src/pages/dashboard/admin/billing/`
