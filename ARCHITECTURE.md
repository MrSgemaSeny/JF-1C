# Corporate Portal & CRM — Production-Ready Architecture

## 1. Overview

Это **модульный монолит** на Java Spring Boot с React TypeScript фронтендом. Архитектура разработана для масштабирования с 10 до 50+ сотрудников и поддерживает будущую миграцию отдельных модулей в микросервисы без переписывания кода.

**Ключевые принципы:**
- One JAR, multiple domains (каждый домен = Java-пакет с явными границами)
- Event-driven internal communication (SlowCoupling)
- API-first с OpenAPI/Swagger (фронт генерирует типы из контракта)
- Async by default (внутрипроцессные операции через @Async)
- Row-level security (не просто роли, но проверка владения объектом)
- Fail-fast validation (не давай неправильным запросам зайти в сервис)

---

## 2. Backend Architecture (Java / Spring Boot)

### 2.1 Module Breakdown

```
backend/
├── core/              ← Ядро (Security, Config, Events, Base entities)
├── auth/              ← JWT, Login/Register, User management
├── site/              ← Public site, Courses, QR Payments
├── crm/               ← Clients, Tasks, Reports (главный модуль)
├── employee/          ← Employee profile, Internal email, Training
├── files/             ← S3/MinIO integration, Presigned URLs
└── integration1c/     ← Adapter pattern для 1С (заглушка на MVP)
```

Каждый модуль:
- Имеет свой `package kz.yourcompany.portal.{module}`
- Содержит: controller → service → repository
- Может содержать: domain entities, DTOs, events, mappers, security checks
- **НЕ имеет доступа** напрямую к repository других модулей (нарушение границ)

### 2.2 Communication Patterns

#### Между модулями: Event-Driven (слабосвязное)
```
ReportService.submitReport()
  → eventPublisher.publishEvent(new ReportSubmittedEvent(...))
    ↓
[in-process]
    ↓
EmployeeModule.onReportSubmitted()
  → отправляет уведомление сотруднику
```

**Плюсы:**
- Модули не знают друг о друге
- Легко добавить нового слушателя без изменения издателя
- Future: заменить on RabbitMQ для асинчности между сервисами

#### Внутри модуля: Service-driven
```
Controller → Service → Repository → Database
   ↓           ↓
 @Valid      @Transactional
 RBAC        Бизнес-логика
```

### 2.3 Security Architecture

#### Authentication: JWT
- Access token: 15 минут, содержит роли и username
- Refresh token: 7 дней, хранится в БД (можно инвалидировать на logout)
- Filter: `JwtFilter` перехватывает `Authorization: Bearer <token>` в каждом запросе

#### Authorization: RBAC + Row-level
```java
// Глобальная роль
@PreAuthorize("hasRole('EMPLOYEE')")
public void assignTask(UUID taskId) { ... }

// Row-level проверка
TaskSecurityChecker.checkTaskAccess(task, currentUserId)
  → если task.assignedTo != currentUserId && !isAdmin → throw AccessDeniedException
```

#### Audit & Logging
- `BaseEntity` содержит: `createdBy`, `createdAt`, `updatedBy`, `updatedAt`
- `SecurityUtils.getCurrentUser()` автоматически заполняет audit fields через Spring Data Auditing
- Sensitive события логируются: login, task assignment, report submission

### 2.4 Database Design

#### Ключевые таблицы (Flyway миграции)

```sql
-- Core
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL, -- ROLE_CLIENT, ROLE_EMPLOYEE, ROLE_ADMIN
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- CRM
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  assigned_employee_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(32) NOT NULL DEFAULT 'NEW', -- NEW, IN_PROGRESS, COMPLETED
  due_date TIMESTAMP,
  has_report BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  updated_by VARCHAR(255) NOT NULL
);

-- Индексы для быстрого фильтра
CREATE INDEX idx_task_client ON tasks(client_id);
CREATE INDEX idx_task_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_task_status ON tasks(status);

-- Files
CREATE TABLE file_metadata (
  id UUID PRIMARY KEY,
  original_filename VARCHAR(255) NOT NULL,
  s3_key VARCHAR(255) NOT NULL UNIQUE,
  content_type VARCHAR(100),
  file_size BIGINT,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL
);

-- Таблица для кэширования прав доступа (опционально)
CREATE TABLE file_access_logs (
  id UUID PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES file_metadata(id),
  accessed_by UUID NOT NULL REFERENCES users(id),
  accessed_at TIMESTAMP NOT NULL
);
```

#### Миграции
- **Flyway** управляет версионированием схемы
- Миграции в: `src/main/resources/db/migration/`
- Нэйминг: `V1__init.sql`, `V10__crm_schema.sql`, `V20__files.sql`
- **Никогда** не меняй существующие миграции (только добавляй новые)

### 2.5 Async & Background Jobs

#### In-Process Async
```java
@Service
public class ReportService {
  @Async("taskExecutor")
  public CompletableFuture<Void> generateReportPdf(UUID reportId) {
    // Генерируем PDF в фоне
    // После завершения публикуем event
    return CompletableFuture.completedFuture(null);
  }
}
```

**Когда используется:**
- Генерация тяжёлых файлов (PDF, Excel)
- Отправка email-уведомлений
- Синхронизация с 1С (по расписанию @Scheduled)

#### Future: RabbitMQ/Kafka
Если в V1.1 понадобится async между микросервисами, добавим очередь, но сейчас это overhead.

### 2.6 API Design

#### Endpoints Structure
```
GET    /api/public/company       ← Публичная инфо (гость)
GET    /api/courses              ← Курсы (гость)
POST   /api/auth/login           ← Логин
POST   /api/auth/register        ← Регистрация
POST   /api/auth/refresh         ← Обновление access token

GET    /api/crm/clients          ← Список клиентов (ROLE_EMPLOYEE)
GET    /api/crm/tasks            ← Задачи с фильтром (статус, дата, etc)
POST   /api/crm/tasks/{id}/assign-to-me  ← Взять задачу (сотрудник)
POST   /api/crm/tasks/{id}/reports       ← Сдать отчёт

GET    /api/employee/profile     ← Профиль (ROLE_EMPLOYEE)
GET    /api/employee/tasks       ← Мои задачи (ROLE_EMPLOYEE)
GET    /api/employee/training    ← Обучение

POST   /api/files/upload         ← Загрузить файл (multipart)
GET    /api/files/{id}/download  ← Скачать с presigned URL

POST   /api/internal/1c/sync     ← 1С webhook (ROLE_SYSTEM)
```

#### Response Format
```json
// Success
{
  "status": "success",
  "data": { ... },
  "timestamp": "2024-06-16T10:30:00Z"
}

// Paged
{
  "status": "success",
  "data": {
    "content": [ ... ],
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
  }
}

// Error
{
  "status": "error",
  "error_code": "TASK_NOT_FOUND",
  "message": "Task with ID ... not found",
  "timestamp": "2024-06-16T10:30:00Z"
}
```

#### OpenAPI / Swagger
- Документация автогенерируется: `GET /v3/api-docs`
- UI: `GET /swagger-ui.html`
- Фронт использует `openapi-typescript` для генерации типов

---

## 3. Frontend Architecture (React / Vite / TypeScript)

### 3.1 Folder Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── public/        ← Landing, Courses, Client Portal
│   │   ├── employee/      ← CRM Dashboard, Tasks, Reports
│   │   └── auth/          ← Login, Register
│   ├── components/
│   │   ├── common/        ← Header, Button, Modal
│   │   ├── crm/           ← TaskCard, TaskForm, DashboardMetrics
│   │   └── site/          ← CourseCard, EnrollmentForm
│   ├── hooks/
│   │   ├── useAuth.ts     ← getCurrentUser(), logout()
│   │   ├── useTasks.ts    ← getTasks(), assignTask()
│   │   └── useFileUpload.ts
│   ├── api/
│   │   ├── generated/     ← Сгенерировано из OpenAPI
│   │   │   ├── models/    ← TaskDto, UserDto, ClientDto
│   │   │   ├── apis/      ← CrmApi, AuthApi, FilesApi
│   │   │   └── index.ts
│   │   ├── apiClient.ts   ← Axios с JWT inject
│   │   └── auth.ts        ← refreshToken() logic
│   ├── state/
│   │   ├── authStore.ts   ← Zustand: currentUser, token
│   │   └── userStore.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   └── validators.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

### 3.2 Key Patterns

#### API Generation from OpenAPI
```bash
# После build backend:
npm run generate-api

# Генерирует frontend/src/api/generated/ из http://localhost:8080/v3/api-docs
# Теперь ты можешь типизировано вызывать API:
```

```typescript
import { TasksApi, TaskDto } from '@/api/generated';

const tasksApi = new TasksApi(apiClient);
const tasks: TaskDto[] = await tasksApi.getTasks({ status: 'IN_PROGRESS' });
// TS автоматически знает, что getTasks возвращает TaskDto[]
```

#### Auth Store (Zustand)
```typescript
export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  user: null,
  
  login: async (username, password) => {
    const response = await authApi.login({ username, password });
    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
    set({ token: response.accessToken, user: response.user });
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ token: null, user: null });
  }
}));
```

#### JWT Injection in Axios
```typescript
// apiClient.ts
const apiClient = axios.create({ baseURL: 'http://localhost:8080/api' });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// На 401 → refresh token → retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Пытаемся обновить token
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await axios.post('/api/auth/refresh', { refreshToken });
      localStorage.setItem('access_token', response.data.accessToken);
      return apiClient.request(error.config); // retry
    }
    return Promise.reject(error);
  }
);
```

---

## 4. Deployment & DevOps

### 4.1 Local Development

```bash
# 1. Запусти инфра (БД, MinIO, Redis)
docker-compose up -d

# 2. Backend в IDE с hot reload (Gradle Build)
# 3. Frontend с dev server
cd frontend && npm run dev

# 4. Доступ:
# Backend API: http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
# Frontend: http://localhost:5173
# MinIO console: http://localhost:9001
```

### 4.2 Production Deployment

#### Docker Build
```bash
# Build both backend и frontend
docker-compose -f docker-compose.prod.yml build

# Run
docker-compose -f docker-compose.prod.yml up -d
```

#### .env.production (example)
```
DB_PASSWORD=very-secure-password-here
JWT_SECRET=another-very-secure-secret-at-least-64-chars
MINIO_ROOT_USER=production-user
MINIO_ROOT_PASSWORD=production-password
REDIS_PASSWORD=redis-secure-password
```

#### Health Checks
```yaml
# docker-compose.prod.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

#### Monitoring & Logging
```
# Metrics доступны на:
GET /actuator/metrics
GET /actuator/prometheus

# Логи:
docker logs portal-backend
docker logs portal-frontend
```

---

## 5. Масштабируемость & Future Improvements

### 5.1 На MVP (сейчас)
- Монолит в одном контейнере ✓
- PostgreSQL с индексами ✓
- MinIO для файлов ✓
- JWT для auth ✓
- Event-driven internal comm ✓

### 5.2 При росте (V1.1+)

#### Микросервисы
Если какой-то модуль станет узким местом:

```
CRM Service (отдельный сервис)
  ├── Database: PostgreSQL (своя copy)
  ├── API: same REST endpoints
  └── Async Comm: RabbitMQ с Monolith

Files Service (future)
  ├── MinIO abstraction
  ├── Video streaming
  └── Presigned URL generation
```

Миграция: модуль `crm` → отдельный Spring Boot app, общение через RabbitMQ events.

#### Caching
```
Redis для:
- Session tokens (вместо БД)
- Кэш списка клиентов (invalidate на update)
- Rate limiting (API throttling)
```

#### Database
```
Read replicas для:
- Отчёты (BI запросы)
- Аналитика (dashboard)

Sharding по client_id если:
- > 1 млн клиентов
- > 100GB данных
```

#### Async Jobs
```
Celery/RQ если нужна:
- Периодическая синхронизация с 1С
- Генерация больших отчётов
- Email рассылки
```

---

## 6. Key Design Decisions & Trade-offs

| Решение | Почему | Trade-off |
|---------|--------|-----------|
| **Монолит vs Микросервисы** | На MVP проще, меньше DevOps | Масштабирование одного модуля требует масштабирования всего |
| **Event-driven internal** | Слабая связанность модулей | Сложнее отчитаться о транзакционности |
| **In-process async** | Простая настройка, нет очередей | Если упадёт процесс, задача потеряется (пока не критично) |
| **JWT без session DB** | Stateless масштабирование | На logout приходится хранить refresh token в БД |
| **Flyway миграции** | Версионирование схемы | Нельзя менять прошлые миграции (only forward) |
| **Row-level security в коде** | Гибкость, понятность | Нельзя забыть, требует code review |
| **TypeScript на фронте** | Type safety, инвестиция в future | Медленнее разработка первые недели |

---

## 7. Security Checklist

- [ ] JWT secret ≥ 64 символа (в .env)
- [ ] Пароли хэшируются BCrypt($2a$12)
- [ ] CORS настроен на конкретные origins
- [ ] CSRF отключен (используем JWT, не cookies)
- [ ] X-Frame-Options: DENY (в Nginx)
- [ ] Content-Security-Policy заголовки
- [ ] HTTPS в production
- [ ] Rate limiting на `/api/auth/login` (future)
- [ ] Audit logging для sensitive операций
- [ ] Secrets в .env, не в коде

---

## 8. Troubleshooting

### Backend не поднимается
```
docker logs portal-postgres
docker logs portal-backend

# Проверь:
- Postgres жив (docker exec portal-postgres pg_isready)
- DB user существует
- Миграции прошли (Flyway)
```

### Фронт не коннектится к backend
```
# Проверь CORS в SecurityConfig
# Убедись, что фронт на правильном порту (5173 on dev)
```

### JWT token истёк
```
# Фронт автоматически обновляет через refresh token
# Если всё упало:
- localStorage.clear()
- Перезагрузись
```

---

## Резюме

Это архитектура, которая:
1. **Работает сейчас** на 50 сотрудников и 50+ клиентов
2. **Масштабируется** до микросервисов без переписывания
3. **Безопасна** (JWT, RBAC, row-level security)
4. **Типизирована** (Java + TypeScript)
5. **Тестируемая** (DI, слои, интерфейсы)
6. **Легко расширяется** (event-driven, новые модули независимо)

Начинаем с MVP, по мере роста добавляем кэш, микросервисы, очереди — но стартовая архитектура это поддержит.
