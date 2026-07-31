# Project State & Context — ZhanFinance (JF-1C)

## 📌 Current Phase & Global Goals
- **Active Phase**: Phase 4 — Перевод всего фронтенда на новые пути API (префикс `/api/v1/**`). Бэкенд уже переведен, фронт сейчас частично работает по старым путям, нужно обновить все запросы.
- **Главная цель**: Запуск стабильной Production-версии (бэкенд на Fly.io, БД Fly Postgres, фронт GitHub Pages).

## ⚠️ Known Issues & Blockers
- **Разница локальной и продовой БД**: На проде используем чистый Flyway (`spring.jpa.hibernate.ddl-auto=none`), чтобы избежать падений Hibernate при несовпадении схем на старте.
- **Интеграции**: Google OAuth требует обязательной проверки 2FA (TOTP) для админов, что уже реализовано на бэкенде и фронте.

## 🏗️ Core Infrastructure State
- **Backend (Fly.io)**: Развернут, миграции проходят автоматически (V110 накатилась). Подключена база PostgreSQL. Секреты хранятся в Fly Secrets.
- **Frontend (GitHub Pages)**: CI/CD настроен (`deploy-backend.yml` и `ci.yml`). В `ci.yml` добавлены дефолтные переменные для корректной сборки Vite, если секреты не прокинулись.

## 📝 Recent Major Fixes (Do not regress)
1. **CORS**: Проблема с кросс-доменными запросами решена динамической подгрузкой `CORS_ALLOWED_ORIGINS` из переменных окружения.
2. **2FA Lockout**: Был баг с блокировкой при сбросе аутентификатора. Колонка называется `totp_secret` в таблице `app_users`.

## ⏭️ Next Steps
- Продолжить рефакторинг фронтенда под `/api/v1/`.
- Проверить работоспособность WebSockets/STOMP после обновления путей API.
