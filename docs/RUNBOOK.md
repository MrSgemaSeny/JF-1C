# Регламент эксплуатации и ликвидации инцидентов (RUNBOOK.md)

Настоящий документ описывает порядок деплоя, проверки работоспособности, резервного копирования и действия при возникновении сбоев в продакшн-среде.

---

## 1. Продакшн-окружение и URL

* **Backend API**: `https://zhanfinance.fly.dev/api`
* **Health Check**: `https://zhanfinance.fly.dev/api/actuator/health`
* **Frontend SPA**: `https://mrsgemaseny.github.io/JF-1C` (или кастомный домен `zhanfinance.kz`)
* **База данных**: Managed PostgreSQL на Fly.io / Self-hosted PostgreSQL.

---

## 2. Процесс релиза и деплоя (CI/CD)

Деплой выполняется **строго автоматически** через GitHub Actions.

### Фронтенд (GitHub Pages):
* Пайплайн `.github/workflows/ci.yml` запускается автоматически при пуше в ветку `main`.
* Выполняется установка зависимостей, запуск Vitest, сборка Vite bundle (`npm run build`) и выгрузка артефактов на GitHub Pages.

### Бэкенд (Fly.io):
* Пайплайн `.github/workflows/deploy-backend.yml` запускается при изменении файлов в `zhan-finance-backend/**`.
* Выполняется компиляция, прогон Gradle-тестов, сборка Docker-образа и обновление контейнера на Fly.io.

---

## 3. Резервное копирование и восстановление БД

### Автоматические бэкапы:
* Ночной пайплайн `.github/workflows/db-backup.yml` каждые сутки снимает дампы PostgreSQL (`pg_dump`) и отправляет уведомление в Telegram-канал.

### Ручное восстановление из бэкапа:
1. Загрузить нужный `.sql.gz` файл из артефактов GitHub Actions или хранилища бэкапов.
2. Поднять туннель к БД Fly.io на локальный порт 5432:
   ```bash
   flyctl proxy 5432:5432 -a zhan-finance-db
   ```
3. В другом терминале распаковать и восстановить на PostgreSQL:
   ```bash
   gunzip -c backup_2026-07-30.sql.gz | psql -h localhost -p 5432 -U postgres -d zhan_finance_db
   ```
   *(Если бэкап в кастомном формате `pg_dump -Fc`, используй: `pg_restore -h localhost -p 5432 -U postgres -d zhan_finance_db --clean backup.dump`)*

---

## 4. Дерево ликвидации инцидентов (Incident Response)

### Сценарий A: Ошибка CORS / 404 на эндпоинтах WebSocket (`/ws/info`)
* **Симптом**: В консоли браузера красные ошибки `CORS policy` и `404 Not Found` на `/ws/info`.
* **Причина**: Фронтенд обращается мимо контекста `/api`.
* **Действие**: Проверить `getWsEndpointUrl` в `src/shared/api/http.ts`. Эндпоинт должен быть `https://zhanfinance.fly.dev/api/ws`.

### Сценарий B: `ChunkLoadError` при клике по страницам SPA (404 на JS-чанки)
* **Симптом**: При переходе по меню в браузере вылетает ошибка загрузки модуля `NotificationsPage-[hash].js`.
* **Причина**: Браузер закэшировал старый `index.html` после деплоя новой версии на GitHub Pages.
* **Действие**: Очистить кэш браузера (`Ctrl + F5`). Убедиться в наличии обработки ретрая lazy-компонентов в кодбазе.

### Сценарий C: Бэкенд возвращает 429 Too Many Requests
* **Симптом**: Клиент получает HTTP 429 с сообщением `Too many requests`.
* **Причина**: Сработал фильтр ограничений вызовов `ApiRateLimitFilter` или `AuthRateLimitFilter`.
* **Действие**: Проверить частоту запросов с конкретного IP. Ограничение для `/api/v1/auth/login` составляет 5 попыток в минуту.

### Сценарий D: Отказ соединения с БД или ошибками Flyway Checksum
* **Симптом**: Контейнер бэкенда на Fly.io непрерывно перезапускается при старте.
* **Причина**: Несовпадение контрольных сумм Flyway из-за ручного изменения ранее примененных миграций.
* **Действие**: **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО** запускать `flywayClean` на прод-базе! Откатить некорректные правки миграций и выпустить компенсирующую миграцию (например, `V111__...sql`).

### Сценарий E: Бэкенд упал на Fly.io (OOM, зависание)
* **Симптом**: Бэкенд не отвечает, Health Check возвращает 502 Bad Gateway или таймаут.
* **Причина**: OutOfMemoryError, зависание потоков или падение ВМ на инфраструктуре Fly.io.
* **Действие**:
  1. Посмотреть живые логи: `flyctl logs --app zhan-finance-backend`
  2. Если завис наглухо — жесткий рестарт: `flyctl apps restart zhan-finance-backend`
  3. Если релиз сломал прод — откат к стабильной версии:
     - `flyctl releases list --app zhan-finance-backend`
     - `flyctl releases rollback v<НОМЕР> --app zhan-finance-backend`

### Сценарий F: Алерт `metaspace-near-limit` в Grafana
* **Симптом**: Grafana генерирует алерт `JVM Metaspace близок к лимиту на zhan-finance-backend` (потребление > 120MB).
* **Причина**: Прогрев рефлексии (Jackson, Thymeleaf, Spring AOP/CGLIB) и загрузка классов всех модулей при интенсивных прогонах.
* **Действие**:
  1. Проверить реальное состояние через Actuator: `/actuator/metrics/jvm.memory.used?tag=id:Metaspace` и `jvm.memory.max`.
  2. Убедиться, что в конфигурации машины Fly.io установлен флаг `JAVA_TOOL_OPTIONS = "-XX:MaxMetaspaceSize=256m"`.
  3. Если потребление стабилизировалось на плато (~126MB), скорректировать порог алерта в Grafana до 220MB.

---

## 5. Регламент верификации и запуска тестов

Перед любым релизом или после внесения правок в логику безопасности обязателен полный прогон верификационного контура:

1. **Юнит и интеграционные тесты бэкенда**:
   ```bash
   cd zhan-finance-backend
   ./gradlew test --rerun-tasks
   ```
2. **Тесты компонентов фронтенда**:
   ```bash
   cd zhan-finance-frontend
   npm test -- --run
   ```
3. **Сквозные E2E-сьюты на боевом контуре**:
   ```bash
   cd tests
   node run-all-e2e.mjs
   ```
   *Примечание:* скрипты автоматически используют дисковое кеширование токенов (`tests/e2e/.auth-cache.json`) и бэкофф при получении HTTP 429 от Bucket4j.
