# Руководство по онбордингу (ONBOARDING.md)

Документ содержит пошаговую инструкцию для быстрого разворачивания и запуска проекта JF-1C на локальном компьютере нового разработчика.

---

## 1. Требования к окружению

Перед началом убедитесь, что в системе установлены:
* **Java Development Kit (JDK)**: версия 17 (Eclipse Temurin или OpenJDK).
* **Node.js**: версия 20 LTS или 22+.
* **PostgreSQL**: версия 15+.
* **Git**: версия 2.30+.

---

## 2. Клонирование репозитория

```bash
git clone https://github.com/MrSgemaSeny/JF-1C.git
cd JF-1C
```

---

## 3. Настройка и запуск бэкенда

### Шаг 3.1: Настройка базы данных
Создайте локальную базу данных PostgreSQL:
```sql
CREATE DATABASE zhan_finance_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE zhan_finance_db TO postgres;
```

### Шаг 3.2: Переменные окружения бэкенда
В директории `zhan-finance-backend` переименуйте `.env.example` (или создайте `.env`):
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/zhan_finance_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
JWT_SECRET=super-secret-jwt-key-minimum-256-bits-length-for-security
JWT_EXPIRATION_MS=86400000
JWT_REFRESH_EXPIRATION_MS=604800000
```

### Шаг 3.3: Запуск и сидинг бэкенда
Перейдите в директорию бэкенда и запустите приложение:
```bash
cd zhan-finance-backend
./gradlew bootRun
```
* При первом запуске Flyway автоматически применит все SQL-миграции `V1`..`V110+`.
* Сидеры (`@EventListener(ApplicationReadyEvent.class)`) подготовят стартовые пайплайны, роли (включая ADVISOR), тестовые учетные записи и справочники.

### Шаг 3.4: Запуск проверочных тестов
```bash
./gradlew test
```

---

## 4. Настройка и запуск фронтенда

### Шаг 4.1: Установка зависимостей
Перейдите в директорию фронтенда:
```bash
cd ../zhan-finance-frontend
npm install
```

### Шаг 4.2: Переменные окружения фронтенда
Создайте файл `.env.development`:
```env
VITE_API_URL=http://localhost:8080/api/v1
```

### Шаг 4.3: Запуск dev-сервера
```bash
npm run dev
```
Приложение откроется по адресу `http://localhost:5173`.

### Шаг 4.4: Запуск юнит-тестов фронтенда
```bash
npx vitest run
```

---

## 5. Стартовые учетные записи для тестирования

После запуска сидеров доступны тестовые аккаунты:
* **Admin**: `admin@zhanfinance.kz` / `admin123`
* **Employee**: `employee@zhanfinance.kz` / `employee123`
* **Client**: `client@zhanfinance.kz` / `client123`
