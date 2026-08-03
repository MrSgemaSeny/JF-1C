# CLAUDE.md — ZhanFinance (JF-1C)

Этот файл — единственный источник правды для AI-агентов (Claude Code, Cursor, Codex и др.).
Читай его целиком перед любым действием в репозитории.

---

## 1. Что такое ZhanFinance

SaaS-платформа для казахстанских компаний. Покрывает: CRM, документооборот, обучение сотрудников,
чат, биллинг, уведомления, аудит. Production: https://zhanfinance.fly.dev
Будущий домен: zhanfinance.kz

Владелец/разработчик: один человек (junior → middle). Решения принимаются прагматично:
работающее > идеальное, но security и correctness — не жертвуются.

---

## 2. Стек

### Backend
| Компонент | Версия / Детали |
|---|---|
| Java | 17 |
| Spring Boot | 4.1.0 |
| Spring Framework | 7.0.8 |
| Hibernate | 7.4.1.Final |
| PostgreSQL | 17.6 |
| Flyway | 10+ (flyway-core + flyway-database-postgresql) |
| Build | Gradle |
| Auth | JWT в httpOnly cookie + Google OAuth2 |
| Rate limiting | Bucket4j |
| Cache | Caffeine (per-region) |
| WebSocket | STOMP |
| PDF | openhtmltopdf-pdfbox |
| Word | poi-tl |
| 2FA | totp-spring-boot-starter |
| Tests | 74 теста (JUnit 5 + Mockito) |

### Frontend
| Компонент | Версия / Детали |
|---|---|
| React | 19 |
| TypeScript | latest |
| Build | Vite |
| Deploy | GitHub Pages — https://mrsgemaseny.github.io/JF-1C |
| Стилизация | Tailwind CSS v4 |
| Архитектура | FSD (shared -> entities -> features -> widgets -> pages) |
| Data fetching | React Query |
| i18n | react-i18next |
| Routing | react-router-dom |

### Инфраструктура
- Хостинг: Fly.io (Amsterdam)
- CI/CD: GitHub Actions (auto-deploy on push to main)
- БД бэкап: GitHub Actions + Telegram уведомления
- Инфра управляется агентом "Antigravity" — не трогать вручную

---

## 3. Архитектура

```
zhan-finance-backend/
└── src/main/java/com/example/zhanfinancebackend/
    └── modules/
        ├── auth/          # JWT, OAuth2, 2FA, refresh tokens
        ├── crm/           # Tasks, Pipeline, Kanban, stages
        ├── documents/     # АВР, шаблоны, PDF генерация
        ├── billing/       # Invoices, subscriptions, services
        ├── lms/           # Courses, lessons, chapters, certificates
        ├── chat/          # WebSocket/STOMP сообщения
        ├── notifications/ # Уведомления (in-app + email)
        ├── audit/         # Audit logs, HibernateAuditListener
        ├── search/        # Глобальный поиск
        ├── calendar/      # Календарные события
        └── common/        # Shared utilities, security, config
```

**14 модулей, 231 Java-класс, 29 контроллеров, 37 сервисов, 36 DB entities**
**63 frontend страницы, 179 компонентов** (растёт)

### API
- Context path: `/api`
- Версионирование: `/api/v1/...`
- Frontend VITE_API_URL = origin only (без пути), путь `/api/v1/` в коде

### Роли
`ADMIN` | `EMPLOYEE` | `CLIENT` | `CURATOR` | `LEARNER` | `ADVISOR`

### Security
- JWT в Authorization: Bearer header, stateless
- Refresh token rotation + revocation
- Row-level security через CrmAccessService
- HibernateAuditListener маскирует SENSITIVE_FIELDS (`[PROTECTED]`)
- Bucket4j rate limiting через ApiRateLimitFilter + AuthRateLimitFilter
- IDOR защита на batch-операциях

---

## 4. База данных

### Правила (обязательно)
- Схема ТОЛЬКО через Flyway миграции. `ddl-auto=validate` на проде, `ddl-auto=none` в prod-profile
- Файлы миграций: `src/main/resources/db/migration/V{N}__{description}.sql`
- Два подчёркивания между версией и описанием — обязательно
- Текущая последняя миграция: **V110** (2FA: колонки в app_users + таблица two_factor_pre_auth)
- 36 таблиц в production

### Локальная БД
- `flyway_schema_history` создана после baseline
- `spring.flyway.baseline-version=110` выставлен локально
- Новые миграции (V111+) применяются автоматически

### Никогда
- Не запускать `DROP`, `DELETE` на всю таблицу, `TRUNCATE` без явного подтверждения от владельца
- Не менять существующие миграции — только новые файлы

---

## 5. Структура планирования

```
Plan/
  Epic-{N}-{slug}/
    epic.md              ← цель, домен, роли, список US, статус
    US-{N}.1-{slug}.md
    US-{N}.2-{slug}.md
    ...
```

### Формат epic.md
```markdown
# Epic-{N}: {Название}

**Цель:** одно предложение
**Домен:** CRM | Auth | Documents | Billing | LMS | Chat | Infra | Cross
**Роли:** какие роли затрагивает
**Статус:** Done | In Progress | Planned
**Миграции:** V{от} — V{до} (если применимо)

## User Stories
- [ ] US-{N}.1 — {slug}
- [ ] US-{N}.2 — {slug}

## Acceptance Criteria
- [ ] ...
```

### Формат US-{N}.{M}-{slug}.md
```markdown
# US-{N}.{M}: {Название}

Как **[роль]**, я хочу **[действие]**, чтобы **[результат]**

**Приоритет:** P0 | P1 | P2
**Story Points:** 1–8
**Зависимости:** US-X.Y (если есть)

## Логика / API контракт
\`\`\`
краткое описание алгоритма или endpoint
\`\`\`

## Критерии готовности
- [ ] Backend endpoint реализован
- [ ] Flyway миграция создана (если нужна)
- [ ] Тест написан
- [ ] Frontend страница/компонент готов
```

### Коммиты
```
feat(US-N.M): краткое описание
fix(US-N.M): краткое описание
migration(VN): краткое описание
```

---

## 6. Правила для агентов

### Перед написанием кода
1. Найди или создай соответствующий Epic и US в `Plan/`
2. Проверь существующие паттерны в модуле — не изобретай новые если уже есть
3. Если нужна миграция — создай файл `V{N+1}__{description}.sql` до изменения Entity

### Приоритеты при конфликтах
**Security > Correctness > Performance > Code Cleanliness**

### Секреты
- Только в env vars / Fly.io secrets. Никогда в source
- Локальные credentials не коммитить (урок: application-cleantest.properties был в git — исправлено)

### Тесты
- Deploy pipeline блокируется на упавших тестах
- Текущее покрытие: 56 тестов, все зелёные
- Новая фича = новый тест

### Что не трогать
- Инфраструктуру Fly.io (управляет Antigravity)
- Существующие Flyway миграции V1–V110
- `ddl-auto` на проде (всегда `none`)

---

## 7. Email / SMTP

- Прод: реальный SMTP через Fly.io secrets
- Локально: mock-fallback (письма не отправляются, ошибки не бросает)

---

## 8. Known Issues (открытые)

| Issue | Статус |
|---|---|
| CF-Connecting-IP доверяется до Cloudflare | Закроется автоматически при подключении Cloudflare |
| Refresh token race condition под нагрузкой | Known, не критично для текущего масштаба |
| Caffeine cache без recordStats() | WARN в логах, не влияет на работу |

---

## 9. Эпики — обзор

| # | Slug | Домен | Статус |
|---|---|---|---|
| 01 | auth | Auth | Done |
| 02 | crm | CRM | Done |
| 03 | documents | Documents | Done |
| 04 | lms | LMS | Done |
| 05 | chat | Chat | Done |
| 06 | notifications | Notifications | Partial |
| 07 | billing | Billing | Partial |
| 08 | dashboard | Cross | Partial |
| 09 | 2fa | Auth | Done |
| 10 | monitoring | Infra | Planned |
| 11 | domain-cdn | Infra | Planned |
| 12 | payments | Billing | Planned |
| 13 | 1c-integration | Cross | Planned |

| 15 | storage-r2 | Infra | Planned |
| 16 | lms-quizzes | LMS | Planned |
| 17 | staging | Infra | Planned |
| 18 | landing | Cross | Done |
| 19 | advisor | Cross | Done |

Детали каждого эпика — в `Plan/Epic-{N}-{slug}/epic.md`

---

## 10. Контакты / Репозиторий

- Backend repo: `JF-1C/zhan-finance-backend`
- Frontend repo: `mrsgemaseny/JF-1C` → GitHub Pages
- Production: https://zhanfinance.fly.dev
- CI: GitHub Actions
