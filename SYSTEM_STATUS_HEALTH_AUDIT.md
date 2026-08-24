# Комплексный аудит, архитектурный анализ и проектирование подсистемы System Status & Health Hub для платформы JF-1C (ZhanFinance)

---

## 1. Введение и стратегическая миссия

В современных SaaS-платформах уровня B2B (особенно в финансово-бухгалтерском сегменте) доверие пользователей и операционная прозрачность являются ключевыми факторами удержания клиентов. Любой неконтролируемый сбой — зависшая отправка налогового отчета, задержка формирования акта выполненных работ, недоступность биллинга или ошибка авторизации — при отсутствии своевременной информации порождает панику, шквал обращений в службу поддержки и прямые репутационные потери.

Эталоны мировой индустрии (в частности, `status.claude.com` на базе Atlassian Statuspage, а также Status Hub'ы от GitHub, Stripe и AWS) демонстрируют зрелый подход к управлению инцидентами. Их цель — **трансформировать технический сбой из кризиса в контролируемый и предсказуемый операционный процесс**.

Настоящий аудит содержит исчерпывающее исследование архитектуры статусных страниц, декомпозицию состояний и многоуровневых режимов работы, а также готовый архитектурно-технический проект интеграции полноценного модуля **System Status & Health Hub** в экосистему **JF-1C (ZhanFinance)**.

---

## 2. Реверс-инжиниринг и анализ эталонов индустрии (status.claude.com, Atlassian, Stripe, GitHub)

Анализ ведущих мировых статус-центров позволяет выделить 5 базовых архитектурных паттернов:

### 2.1. Иерархия сервисов и гранулярность (Service Matrix)
Система не представляется как неделимый монолит. Она разделена на изолированные функциональные узлы:
- **Core Platform:** Web UI, API Gateway, Authentication & Session Manager.
- **Compute & Business Logic:** Очереди фоновых задач, генераторы тяжелых отчетов, воркеры.
- **Data & Real-time:** Основная СУБД, кэширующие слои, WebSocket-брокеры.
- **Third-Party Gateways:** Платежные шлюзы, почтовые SMTP-провайдеры, внешние интеграции (налоговые/фискальные API, мессенджеры).

### 2.2. Uptime-визуализация за 90 дней (90-Day Reliability Bars)
Каждый компонент сопровождается горизонтальной полосой из 90 вертикальных сегментов (каждый сегмент — 1 календарный день):
- **Зеленый:** 100% аптайм без зафиксированных инцидентов.
- **Желтый:** Незначительное снижение производительности (Degraded Performance / Minor Outage).
- **Оранжевый:** Частичный отказ функционала (Partial Outage).
- **Красный:** Критический сбой (Major Outage).
- **Синий:** Плановое техническое обслуживание (Scheduled Maintenance).
- **Серый:** Нет данных / компонент не отслеживался.

При наведении курсора на конкретный день отображается всплывающая подсказка (Tooltip) с точным процентом доступности, суммарным временем простоя и ссылкой на карточку инцидента.

### 2.3. Машина состояний жизненного цикла инцидента (Incident Lifecycle Machine)
Коммуникация с пользователями во время аварий строго регламентирована и проходит через 5 фиксированных этапов:
1. **Investigating (Исследуем):** Первичное обнаружение аномалии. Инженеры локализуют источник проблемы.
2. **Identified (Причина определена):** Корневая причина сбоя установлена, команда готовит или раскатывает хотфикс / перезапускает ноды.
3. **Monitoring (Мониторинг):** Исправление применено, система наблюдается на предмет стабилизации метрик и снижения задержек.
4. **Resolved (Устранено):** Сервис полностью восстановлен, все компоненты вернулись в статус Operational.
5. **Post-Mortem (Постмортем / RCA):** Публичный или внутренний отчет с детальным анализом причин сбоя, хронологией и мерами по недопущению повторения.

### 2.4. Мультиканальное оповещение (Notification Multicast)
Пользователи и администраторы получают мгновенные обновления через:
- Webhook-подписки;
- Telegram / Slack / Microsoft Teams боты;
- Email-рассылки;
- RSS/Atom фиды.

---

## 3. Статусная модель и математика переходов состояний

### 3.1. Пять уровней состояния компонентов платформы

```text
  ┌────────────────────────────────────────────────────────┐
  │                 5 СТАТУСОВ КОМПОНЕНТОВ                 │
  ├────────────────────────────────────────────────────────┤
  │ [1] OPERATIONAL (В штатном режиме)                     │
  │     Все метрики в норме (Latency < 200ms, Error Rate 0)│
  │                                                        │
  │ [2] DEGRADED PERFORMANCE (Снижение производительности) │
  │     Рост задержек (Latency > 1.5s), очереди задач      │
  │                                                        │
  │ [3] PARTIAL OUTAGE (Частичный сбой)                    │
  │     Отказ вторичной функции (напр. экспорт PDF упал)   │
  │                                                        │
  │ [4] MAJOR OUTAGE (Критический сбой)                    │
  │     Отказ ядра (БД недоступна, 500 ошибки на API)      │
  │                                                        │
  │ [5] UNDER MAINTENANCE (Техническое обслуживание)       │
  │     Плановые работы, миграции, регламентные окна       │
  └────────────────────────────────────────────────────────┘
```

### 3.2. Алгоритм агрегации общего статуса платформы (Global System Status)
Общий статус системы определяется по принципу **Worst-Case Severity (наихудшее состояние среди критических компонентов)**:

$$\text{GlobalStatus} = \max_{c \in C_{\text{critical}}} (\text{Severity}(c))$$

- Если хотя бы один **критический компонент** (PostgreSQL, Auth API) находится в статусе `MAJOR_OUTAGE` $\rightarrow$ общий статус системы: **Major Outage**.
- Если критический компонент в `DEGRADED_PERFORMANCE` или некритический (PDF Export, Email) в `PARTIAL_OUTAGE` $\rightarrow$ общий статус системы: **Degraded Performance / Partial Outage**.
- Если ведутся плановые работы на ключевых узлах $\rightarrow$ общий статус: **Active Maintenance**.
- Если все компоненты зеленые $\rightarrow$ **All Systems Operational**.

---

## 4. Карта подсистем и телеметрии JF-1C (Component Matrix)

Для платформы **JF-1C** выделяется 8 фундаментальных компонентов мониторинга:

| ID | Имя компонента | Критичность | Метод автоматической проверки (Health Probe) | Порог срабатывания аномалии |
|---|---|---|---|---|
| `core_api_auth` | Core API & Security | CRITICAL | Ping `/actuator/health`, валидация выпуска JWT | Время ответа > 1500мс или HTTP $\neq$ 200 |
| `database_postgres` | PostgreSQL Database | CRITICAL | Выполнение `SELECT 1`, состояние HikariCP пула | Активных соединений > 90%, Latency > 800мс |
| `storage_engine` | Document Storage | HIGH | Проверка записи/чтения тестового BLOB в DB/Local | Исключение ввода-вывода или задержка > 2000мс |
| `realtime_websocket`| WebSocket STOMP Broker | MEDIUM | Heartbeat-пинги через SockJS, число активных сессий | Обрыв брокера, отказ STOMP handshake |
| `email_notification`| Gmail SMTP Gateway | MEDIUM | Проверка сокета `localhost:1025` / SMTP connection | Ошибка соединения `MailConnectException` |
| `telegram_alerts` | Telegram Notifier Bot | LOW | Проверка доступности Telegram Bot API | HTTP статус ошибки от `api.telegram.org` |
| `document_generator`| PDF & DOCX Generator | HIGH | Тестовая компиляция Thymeleaf + OpenHtmlToPdf | Превышение времени рендера > 3000мс |
| `billing_gateways` | Payment & Fiscal Gateways| HIGH | Ping эндпоинтов Kaspi Pay / WebKassa (в разработке)| HTTP 5xx от внешнего платежного шлюза |

---

## 5. Двухконтурная архитектура: Internal Ops Hub vs Public Status Hub

Архитектура системы строится на строгом разделении прав доступа и ответственности:

```text
                             ┌───────────────────────────────────┐
                             │     JF-1C SYSTEM HEALTH ENGINE    │
                             └─────────────────┬─────────────────┘
                                               │
                      ┌────────────────────────┴────────────────────────┐
                      ▼                                                 ▼
        ┌───────────────────────────┐                     ┌───────────────────────────┐
        │   ВНУТРЕННИЙ OPS HUB      │                     │  ПУБЛИЧНЫЙ STATUS HUB     │
        │   (Административная панель│                     │  (Клиентский и общий контур│
        │   /admin/system-health)   │                     │  /status и In-App Banner) │
        ├───────────────────────────┤                     ├───────────────────────────┤
        │ - Глубокие метрики пула   │                     │ - Высокоуровневые статусы │
        │ - Ручной override статуса │                     │ - Uptime-бары за 90 дней  │
        │ - Менеджер инцидентов     │                     │ - Инцидентные апдейты     │
        │ - Тумблер Maintenance     │                     │ - График регламентных окон│
        │ - Аудит действий инженеров│                     │ - Глобальный CRM-баннер   │
        └───────────────────────────┘                     └───────────────────────────┘
```

### 5.1. Возможности внутреннего контура (Admin Ops Hub):
1. **Ручное переопределение (Manual Override):** Возможность администратора принудительно перевести компонент в нужный статус, если автоматический чек еще не среагировал или идет запланированная смена конфигурации.
2. **Менеджер инцидентов (Incident Management Flow):**
   - Создание инцидента с указанием заголовка, уровня критичности (Minor, Major, Critical) и списка затронутых компонентов.
   - Публикация апдейтов с автоматической сменой стадии (`Investigating` $\rightarrow$ `Identified` $\rightarrow$ `Monitoring` $\rightarrow$ `Resolved`).
   - Автоматическая отправка уведомления в Telegram-канал дежурных инженеров.
3. **Режим обслуживания (Scheduled Maintenance Switcher):**
   - Планирование окна техработ с указанием точного диапазона времени (начало / конец).
   - Автоматическое включение информационного баннера в клиентском приложении за 1 час до начала работ.

### 5.2. Возможности клиентского контура (Public & Client View):
1. **Страница `/status` (Standalone Public View):**
   - Доступна без авторизации для клиентов, лидов и внешних аудиторов.
   - Отображает глобальный статус, карточки 8 компонентов, 90-дневные Uptime-бары и историю прошлых инцидентов.
2. **In-App Notification Banner (Глобальный баннер внутри CRM):**
   - При наличии активного инцидента со статусом `Major Outage` или `Under Maintenance` в шапке CRM автоматически рендерится информационная плашка:
     *«Внимание: В данный момент наблюдаются задержки в модуле генерации PDF. Инженеры уже занимаются исправлением. Подробнее на странице статуса.»*
   - Баннер поддерживает закрытие (dismiss) в рамках текущей сессии пользователя.

---

## 6. Проектирование схемы базы данных (Flyway Data Model)

Для персистентности статусов, метрик и истории инцидентов проектируется изолированная схема таблиц.

```sql
-- 1. Таблица компонентов платформы
CREATE TABLE system_components (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description VARCHAR(255),
    category VARCHAR(64) NOT NULL, -- 'CORE', 'STORAGE', 'INTEGRATIONS', 'MESSAGING'
    current_status VARCHAR(32) NOT NULL DEFAULT 'OPERATIONAL', -- 'OPERATIONAL', 'DEGRADED', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE', 'MAINTENANCE'
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Таблица инцидентов
CREATE TABLE system_incidents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    impact VARCHAR(32) NOT NULL, -- 'NONE', 'MINOR', 'MAJOR', 'CRITICAL', 'MAINTENANCE'
    current_stage VARCHAR(32) NOT NULL, -- 'INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    created_by_user_id BIGINT REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 3. Связь инцидента с затронутыми компонентами (Many-to-Many)
CREATE TABLE system_incident_components (
    incident_id BIGINT NOT NULL REFERENCES system_incidents(id) ON DELETE CASCADE,
    component_id VARCHAR(64) NOT NULL REFERENCES system_components(id) ON DELETE CASCADE,
    resulting_status VARCHAR(32) NOT NULL,
    PRIMARY KEY (incident_id, component_id)
);

-- 4. Хронологические обновления инцидента
CREATE TABLE system_incident_updates (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES system_incidents(id) ON DELETE CASCADE,
    stage VARCHAR(32) NOT NULL, -- 'INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'
    message TEXT NOT NULL,
    author_user_id BIGINT REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ежедневные агрегированные метрики аптайма (для 90-day баров)
CREATE TABLE system_daily_uptime (
    component_id VARCHAR(64) NOT NULL REFERENCES system_components(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    uptime_percentage NUMERIC(5, 2) NOT NULL DEFAULT 100.00, -- 99.95%
    total_downtime_seconds INT NOT NULL DEFAULT 0,
    incidents_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (component_id, metric_date)
);

-- Индексы для быстрой выборки истории
CREATE INDEX idx_system_incidents_created_at ON system_incidents(created_at DESC);
CREATE INDEX idx_system_incident_updates_incident ON system_incident_updates(incident_id, created_at ASC);
CREATE INDEX idx_system_daily_uptime_date ON system_daily_uptime(metric_date DESC);
```

---

## 7. Архитектура Backend (Spring Boot 3 & Telemetry Probes)

### 7.1. Автоматический фоновый сканер (Scheduled Health Prober)
Служба `SystemHealthProberService` запускается по cron-расписанию (каждые 30 секунд):

```text
[Scheduled Task: Every 30s]
      │
      ├──> Probe PostgreSQL: execute "SELECT 1", check connection pool
      ├──> Probe Storage: verify DB/Local storage readability
      ├──> Probe SMTP: socket timeout test on configured mail host
      ├──> Probe WebSocket: STOMP broker heartbeat check
      │
      ▼
[Evaluate Results]
      │
      ├── Если все ок и нет ручного Override --> status = OPERATIONAL
      ├── Если ошибка или Latency > Threshold --> status = DEGRADED / OUTAGE
      │
      ▼
[Persist & Notify]
      ├── Обновление записи в system_components
      └── Отправка STOMP события в /topic/system-status (для живого обновления UI)
```

### 7.2. Контракт REST API

#### Публичные эндпоинты (Без авторизации):
- `GET /api/v1/public/status` — возвращает глобальный статус, список компонентов с текущими статусами и активные инциденты.
- `GET /api/v1/public/status/history?days=90` — возвращает матрицу ежедневного аптайма за 90 дней по всем компонентам.
- `GET /api/v1/public/status/incidents` — пагинированный список завершенных инцидентов с их таймлайном.

#### Административные эндпоинты (`@PreAuthorize("hasRole('ADMIN')")`):
- `POST /api/v1/admin/system-health/incidents` — создание нового инцидента / начало техработ.
- `POST /api/v1/admin/system-health/incidents/{id}/updates` — добавление нового этапа и сообщения к инциденту.
- `PATCH /api/v1/admin/system-health/components/{id}/override` — ручная фиксация статуса компонента.
- `GET /api/v1/admin/system-health/metrics` — детальные метрики JVM (память, GC паузы, треды, размер пула соединений).

---

## 8. Архитектура Frontend (FSD, React 19, Tailwind v4)

В соответствии с методологией Feature-Sliced Design (FSD) модуль делится на слои:

```text
src/
├── entities/
│   └── system-status/
│       ├── model/
│       │   ├── types.ts              # Интерфейсы ComponentStatus, Incident, DailyUptime
│       │   └── useSystemStatusQuery.ts # React Query хуки для /public/status
│       └── ui/
│           ├── StatusBadge.tsx       # Цветовой бейдж (Зеленый/Желтый/Оранжевый/Красный)
│           └── UptimeBar90Days.tsx   # Интерактивная 90-дневная полоса со слайдером
├── features/
│   └── incident-management/
│       ├── ui/
│       │   ├── CreateIncidentModal.tsx # Форма открытия инцидента для админа
│       │   ├── AddIncidentUpdateModal.tsx
│       │   └── ComponentOverrideToggle.tsx
│       └── model/
│           └── useIncidentMutations.ts
├── widgets/
│   ├── system-status-board/
│   │   └── ui/SystemStatusBoard.tsx  # Полная статусная доска компонентов
│   ├── global-incident-banner/
│   │   └── ui/GlobalIncidentBanner.tsx # Плавающий баннер оповещения в CRM
│   └── admin-health-dashboard/
│       └── ui/AdminHealthDashboard.tsx # Ops-панель администратора
└── pages/
    ├── public-status/
    │   └── ui/PublicStatusPage.tsx   # Публичная страница /status
    └── admin-system-health/
        └── ui/AdminSystemHealthPage.tsx # Страница в админке /admin/system-health
```

### 8.1. Спецификация UI компонента `UptimeBar90Days`:
- 90 микро-колонок с `flex` и `gap-0.5`.
- При ховере на конкретный день всплывает `FloatingTooltip` с датой, аптаймом `99.98%` и перечнем инцидентов за этот день.
- Адаптивность: на мобильных экранах количество отображаемых дней плавно масштабируется (30 / 60 / 90 дней).

---

## 9. Формулы надежности, расчет SLA и метрик доступности

### 9.1. Формула коэффициента доступности (Uptime Percentage)

$$\text{Uptime \%} = \left( 1 - \frac{\sum \text{Downtime (seconds)}}{\text{Total Time Window (seconds)}} \right) \times 100\%$$

*Пример:* За 90 календарных дней ($90 \times 86400 = 7\,776\,000$ секунд) суммарный простой сервиса составил 45 минут ($2700$ секунд):
$$\text{Uptime \%} = \left( 1 - \frac{2700}{7\,776\,000} \right) \times 100\% = 99.965\% \quad (\text{Соответствует стандарту Three Nines — } 99.9\%)$$

### 9.2. Метрики скорости реагирования:
- **MTTD (Mean Time to Detect) — Среднее время обнаружения:**
  $$\text{MTTD} = \frac{\sum (T_{\text{detection}} - T_{\text{outage\_start}})}{N_{\text{incidents}}}$$
  *Целевой показатель JF-1C:* $< 60$ секунд благодаря автоматическим Health Probes.
- **MTTR (Mean Time to Resolve) — Среднее время восстановления:**
  $$\text{MTTR} = \frac{\sum (T_{\text{resolved}} - T_{\text{outage\_start}})}{N_{\text{incidents}}}$$
  *Целевой показатель JF-1C:* $< 30$ минут для инцидентов категории Major.

---

## 10. Дорожная карта внедрения (Implementation Roadmap)

| Фаза | Название этапа | Ключевые результаты |
|---|---|---|
| **Фаза 1** | Data Layer & Backend Prober | Flyway-миграция схемы таблиц `system_*`, фоновый сервис автоматического зондирования `SystemHealthProberService`, базовый публичный REST API. |
| **Фаза 2** | Admin Ops Hub | Страница `/admin/system-health` в панели администратора, модальные окна создания и ведения инцидентов, ручные переопределения статусов. |
| **Фаза 3** | Frontend Visuals & Public View | Разработка FSD-виджетов `UptimeBar90Days`, публичной страницы `/status`, глобального баннера `GlobalIncidentBanner` в клиентской CRM. |
| **Фаза 4** | Multicast Alerts & Realtime | Интеграция WebSocket STOMP топика `/topic/system-status`, автоматические алерты дежурным администраторам в Telegram при смене статуса. |

---

## 11. Заключение

Интеграция подсистемы **System Status & Health Hub** выводит платформу **JF-1C (ZhanFinance)** на высочайший уровень зрелости (Level 4/Level 5), обеспечивая:
1. **Прозрачность и доверие:** Клиенты всегда видят реальное состояние платформы и не перегружают поддержку вопросами.
2. **Управляемость сбоями:** Администраторы получают удобный пульт мониторинга и регламентированный регламент информирования об авариях.
3. **Enterprise-готовность:** Наличие 90-дневной истории аптайма и публичного статуса является обязательным требованием при заключении договоров с крупными корпоративными клиентами.
