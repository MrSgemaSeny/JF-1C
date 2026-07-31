# Project State & Context — ZhanFinance (JF-1C)

## 📌 Current Phase & Global Goals
- **Active Phase**: Phase 5 — Стабилизация, исправление багов Auth/2FA и подготовка к полноценному продакшену. 
- **Главная цель**: Запуск стабильной Production-версии (бэкенд на Fly.io, БД Fly Postgres, фронт GitHub Pages).

## ⚠️ Known Issues & Blockers
- **Разница локальной и продовой БД**: На проде используем чистый Flyway (`spring.jpa.hibernate.ddl-auto=none`), чтобы избежать падений Hibernate при несовпадении схем на старте.
- **Интеграции**: Google OAuth требует обязательной проверки 2FA (TOTP) для админов.

## 🏗️ Core Infrastructure State
- **Backend (Fly.io)**: Развернут, миграции проходят автоматически (V110 накатилась). Подключена база PostgreSQL. Секреты хранятся в Fly Secrets.
- **Frontend (GitHub Pages)**: CI/CD настроен (`deploy-backend.yml` и `ci.yml`). В `ci.yml` добавлены дефолтные переменные для корректной сборки Vite, если секреты не прокинулись. Все API пути переведены на `/api/v1/**` (Phase 4 завершена).

## 📝 Recent Major Fixes (Do not regress)
1. **CORS**: Проблема с кросс-доменными запросами решена динамической подгрузкой `CORS_ALLOWED_ORIGINS` из переменных окружения.
2. **2FA Auth**: Исправлен `LazyInitializationException` в сервисе верификации 2FA (`/api/v1/auth/2fa/verify`), добавлен UI для защиты от несанкционированного входа.
3. **2FA Lockout**: Был баг с блокировкой при сбросе аутентификатора. Колонка называется `totp_secret` в таблице `app_users`.

## ⏭️ Next Steps
- Проверить стабильность входа с 2FA в Production окружении.
- Проверить работоспособность WebSockets/STOMP.
- Подключение домена zhanfinance.kz.
