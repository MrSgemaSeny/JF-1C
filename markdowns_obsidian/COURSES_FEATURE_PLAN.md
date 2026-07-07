# План разработки: Система курсов + роль LEARNER
> Проект: JF-1C (Zhan Finance)  
> Дата: 2026-06  
> Статус: Planning

---

## 1. Краткое резюме

Добавляем в CRM-систему образовательный модуль. Новая роль `LEARNER` при входе сразу попадает на страницу курсов `/courses`. Администратор управляет контентом через `/admin/courses` — создаёт курсы, разделы, загружает уроки (видео, презентации, документы). Ученики только просматривают материалы без прогресса и комментариев.

**Что выбрано:**
- Структура: Курс → Разделы → Уроки (трёхуровневая иерархия)
- Видео: загрузка файла на сервер (не YouTube)
- Ученик: только просмотр, без прогресса
- Регистрация LEARNER: только через Админа

---

## 2. Структура данных

### Схема БД (3 новые таблицы)

```
┌─────────────────────────────────────────────┐
│                  courses                    │
├─────────────────────────────────────────────┤
│ id              BIGSERIAL PRIMARY KEY        │
│ title           VARCHAR(255) NOT NULL        │
│ description     TEXT                         │
│ thumbnail_path  VARCHAR(512)                 │
│ is_published    BOOLEAN DEFAULT false        │
│ created_by      BIGINT FK → users(id)        │
│ created_at      TIMESTAMP                    │
│ updated_at      TIMESTAMP                    │
└─────────────────────────────────────────────┘
         │ 1
         │
         │ N
┌─────────────────────────────────────────────┐
│              course_sections                │
├─────────────────────────────────────────────┤
│ id              BIGSERIAL PRIMARY KEY        │
│ course_id       BIGINT FK → courses(id)      │
│ title           VARCHAR(255) NOT NULL        │
│ order_index     INTEGER NOT NULL             │
└─────────────────────────────────────────────┘
         │ 1
         │
         │ N
┌─────────────────────────────────────────────┐
│                  lessons                    │
├─────────────────────────────────────────────┤
│ id              BIGSERIAL PRIMARY KEY        │
│ section_id      BIGINT FK → course_sections  │
│ title           VARCHAR(255) NOT NULL        │
│ description     TEXT                         │
│ type            VARCHAR(20)  -- VIDEO/PRESENTATION/DOCUMENT
│ file_path       VARCHAR(512)                 │
│ file_name       VARCHAR(255)                 │
│ content_type    VARCHAR(100)                 │
│ file_size       BIGINT                       │
│ order_index     INTEGER NOT NULL             │
│ created_at      TIMESTAMP                    │
└─────────────────────────────────────────────┘
```

### Enum типов урока

```java
VIDEO        // .mp4, .webm, .mov
PRESENTATION // .pptx, .pdf
DOCUMENT     // .pdf, .docx, .xlsx
```

---

## 3. Страницы приложения

### Маршруты

```
LEARNER:
/courses                              → список всех опубликованных курсов
/courses/:courseId                    → страница курса (разделы + уроки)
/courses/:courseId/lessons/:lessonId  → просмотр урока

ADMIN (новые):
/admin/courses                        → список всех курсов с управлением
/admin/courses/new                    → создать курс
/admin/courses/:id/edit               → редактировать (разделы, уроки, загрузка файлов)
```

### Что видит LEARNER

```
/courses
┌─────────────────────────────────────┐
│  [Карточка курса]  [Карточка курса] │
│  Налоговый учёт    Бухгалтерия      │
│  12 уроков         8 уроков         │
│  [Открыть]         [Открыть]        │
└─────────────────────────────────────┘

/courses/:id
┌────────────────────────────────────────────┐
│  Налоговый учёт                            │
│  ─────────────────────────────────────     │
│  ▼ Раздел 1: Основы                        │
│     📹 Видео: Введение                     │
│     📄 Презентация: Термины                │
│  ▼ Раздел 2: Практика                      │
│     📹 Видео: Разбор кейса                 │
│     📎 Документ: Шпаргалка                 │
└────────────────────────────────────────────┘

/courses/:id/lessons/:lessonId
┌────────────────────────────────────────────┐
│  [Видеоплеер / PDF-вьювер / Документ]      │
│  Название урока                            │
│  Описание                                  │
│  [← Предыдущий]  [Следующий →]             │
└────────────────────────────────────────────┘
```

### Что видит ADMIN (новые страницы)

```
/admin/courses
┌──────────────────────────────────────────────┐
│  Курсы                    [+ Создать курс]   │
│  ────────────────────────────────────────    │
│  Налоговый учёт  Опубликован  [✏️] [🗑️]      │
│  Бухгалтерия     Черновик     [✏️] [🗑️]      │
└──────────────────────────────────────────────┘

/admin/courses/:id/edit
┌──────────────────────────────────────────────┐
│  Редактировать курс                          │
│  Название: [________________]                │
│  Описание: [________________]                │
│  Обложка:  [Загрузить файл]                  │
│  Опубликован: [toggle]                       │
│                                              │
│  Разделы:                                    │
│  ▼ Раздел 1: Основы          [✏️] [🗑️] [↕]  │
│     + Добавить урок                          │
│     📹 Введение               [✏️] [🗑️] [↕]  │
│  + Добавить раздел                           │
└──────────────────────────────────────────────┘
```

---

## 4. Backend — что нужно создать

### 4.1 Flyway миграция

**Файл:** `src/main/resources/db/migration/V{N}__add_courses.sql`

```sql
CREATE TABLE courses (
  id            BIGSERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  thumbnail_path VARCHAR(512),
  is_published  BOOLEAN NOT NULL DEFAULT false,
  created_by    BIGINT REFERENCES users(id),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE course_sections (
  id           BIGSERIAL PRIMARY KEY,
  course_id    BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  order_index  INTEGER NOT NULL
);

CREATE TABLE lessons (
  id           BIGSERIAL PRIMARY KEY,
  section_id   BIGINT NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  type         VARCHAR(20) NOT NULL,
  file_path    VARCHAR(512),
  file_name    VARCHAR(255),
  content_type VARCHAR(100),
  file_size    BIGINT,
  order_index  INTEGER NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 4.2 Java структура (новые файлы)

```
src/main/java/com/example/
└── courses/
    ├── domain/
    │   ├── Course.java           -- @Entity
    │   ├── CourseSection.java    -- @Entity
    │   └── Lesson.java           -- @Entity + LessonType enum
    ├── repository/
    │   ├── CourseRepository.java
    │   ├── CourseSectionRepository.java
    │   └── LessonRepository.java
    ├── dto/
    │   ├── CourseDto.java        -- для ответов (с разделами и уроками)
    │   ├── CourseSummaryDto.java -- для списка (без вложенностей)
    │   ├── CourseSectionDto.java
    │   ├── LessonDto.java
    │   └── requests/
    │       ├── CreateCourseRequest.java
    │       ├── CreateSectionRequest.java
    │       └── CreateLessonRequest.java
    ├── service/
    │   └── CourseService.java
    └── controller/
        ├── AdminCourseController.java   -- /api/admin/courses/**
        └── LearnerCourseController.java -- /api/courses/**
```

### 4.3 REST API

#### Admin endpoints (`/api/admin/courses/**`)
Доступ: только `ADMIN`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/admin/courses` | Список всех курсов (включая черновики) |
| `POST` | `/api/admin/courses` | Создать курс |
| `PUT` | `/api/admin/courses/:id` | Обновить курс (название, описание, публикация) |
| `DELETE` | `/api/admin/courses/:id` | Удалить курс |
| `POST` | `/api/admin/courses/:id/sections` | Добавить раздел |
| `PUT` | `/api/admin/sections/:id` | Обновить раздел |
| `DELETE` | `/api/admin/sections/:id` | Удалить раздел |
| `POST` | `/api/admin/sections/:id/lessons` | Добавить урок (multipart: файл + метаданные) |
| `PUT` | `/api/admin/lessons/:id` | Обновить метаданные урока |
| `DELETE` | `/api/admin/lessons/:id` | Удалить урок |

#### Learner endpoints (`/api/courses/**`)
Доступ: `LEARNER` + `ADMIN`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/courses` | Список опубликованных курсов |
| `GET` | `/api/courses/:id` | Курс с разделами и уроками |
| `GET` | `/api/lessons/:id/file` | Стриминг файла урока (с Range поддержкой) |

### 4.4 Обновления Spring Security

```java
// В SecurityConfig добавить:
.requestMatchers("/api/admin/courses/**", "/api/admin/sections/**", "/api/admin/lessons/**")
    .hasRole("ADMIN")
.requestMatchers("/api/courses/**", "/api/lessons/**")
    .hasAnyRole("LEARNER", "ADMIN")
```

Также добавить `LEARNER` в enum `Role` (или String-роль в users таблице, если так сделано).

### 4.5 Видеостриминг — важный момент

Обычный `ResponseEntity<byte[]>` не поддерживает перемотку видео. Нужен контроллер с `Range` заголовками:

```java
// Упрощённая схема:
@GetMapping("/api/lessons/{id}/file")
public ResponseEntity<ResourceRegion> streamFile(
    @PathVariable Long id,
    @RequestHeader HttpHeaders headers) {
    
    Resource resource = // загружаем файл
    ResourceRegion region = HttpRange.toResourceRegion(
        headers.getRange(), resource
    );
    return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
        .contentType(MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM))
        .body(region);
}
```

Без этого: видео загружается полностью при открытии, перемотка не работает.

---

## 5. Frontend — что нужно создать/изменить

### 5.1 Изменения в существующих файлах

| Файл | Что меняем |
|------|------------|
| `src/features/auth/authApi.ts` | `UserRole` → добавить `'LEARNER'` |
| `src/shared/config/routes.ts` | Добавить маршруты `/courses/*` и `/admin/courses/*` |
| `src/app/App.tsx` | Добавить блоки `<Route>` для LEARNER и Admin courses |
| `src/pages/dashboard/DashboardRedirect.tsx` | `case 'LEARNER': return ROUTES.COURSES` |
| `src/entities/task/model/types.ts` | `UserRole` → добавить `'LEARNER'` |
| `src/entities/chat/api/chatApi.ts` | `role` тип → добавить `'LEARNER'` |
| `src/widgets/dashboard-shell/DashboardLayout.tsx` | Навигация для LEARNER (только /courses) |

### 5.2 Новые файлы

```
src/
├── entities/
│   └── course/
│       ├── model/
│       │   └── types.ts         -- CourseDto, SectionDto, LessonDto, LessonType
│       └── api/
│           ├── courseApi.ts     -- GET /api/courses, GET /api/courses/:id
│           └── lessonApi.ts     -- GET /api/lessons/:id/file (blob/stream)
│
├── pages/
│   └── dashboard/
│       ├── learner/
│       │   ├── LearnerCoursesPage.tsx      -- /courses
│       │   ├── LearnerCourseDetailPage.tsx -- /courses/:courseId
│       │   └── LearnerLessonPage.tsx       -- /courses/:courseId/lessons/:lessonId
│       └── admin/
│           ├── AdminCoursesPage.tsx         -- /admin/courses
│           └── AdminCourseEditPage.tsx      -- /admin/courses/new + /:id/edit
```

### 5.3 Типы (entities/course/model/types.ts)

```typescript
export type LessonType = 'VIDEO' | 'PRESENTATION' | 'DOCUMENT';

export interface LessonDto {
  id: number;
  title: string;
  description?: string;
  type: LessonType;
  fileName: string;
  fileSize: number;
  contentType: string;
  orderIndex: number;
}

export interface CourseSectionDto {
  id: number;
  title: string;
  orderIndex: number;
  lessons: LessonDto[];
}

export interface CourseDto {
  id: number;
  title: string;
  description?: string;
  thumbnailPath?: string;
  isPublished: boolean;
  sections: CourseSectionDto[];
  createdAt: string;
}

export interface CourseSummaryDto {
  id: number;
  title: string;
  description?: string;
  thumbnailPath?: string;
  isPublished: boolean;
  lessonCount: number;
}
```

---

## 6. Подводные камни

### 🔴 Критические (решить до запуска)

**1. Хранилище файлов на Fly.io**

Текущий `app.storage.type=local` пишет файлы в `./uploads` внутри контейнера. При рестарте Fly.io машины все файлы теряются. Видео — это сотни МБ, потеря недопустима.

Решения (выбери одно):
- **Fly.io Volumes** — persistent disk, подключается к контейнеру. Просто, но платно и не масштабируется на несколько инстансов.
- **MinIO** (уже есть в docker-compose, но не подключён) — развернуть как отдельный сервис, подключить MinIO Java SDK. Правильный путь, но требует доп. работы.

**2. Размер файлов**

Текущий лимит: `spring.servlet.multipart.max-file-size=20MB`. Для видео нужно минимум 500MB–2GB. Также на Fly.io есть таймаут HTTP-запросов — большие загрузки могут обрываться.

Нужно:
```properties
spring.servlet.multipart.max-file-size=2GB
spring.servlet.multipart.max-request-size=2GB
```
И настроить таймауты на Fly.io через `fly.toml`.

**3. Range-запросы для видео**

Без поддержки HTTP Range браузерный `<video>` тег не сможет перематывать видео. Стандартный Spring endpoint это не поддерживает. Нужен специальный контроллер (см. раздел 4.5).

### 🟡 Важные (решить в процессе)

**4. Создание LEARNER аккаунтов**

Текущая форма регистрации предлагает только `CLIENT` и `EMPLOYEE`. LEARNER должен создаваться только Админом. Варианты:
- Добавить в `/admin/employees` кнопку "Создать ученика"
- Или отдельная страница `/admin/learners`

**5. Порядок разделов и уроков**

Поле `order_index` в БД есть, но нужен UI для drag-and-drop сортировки. Без этого Админ не сможет менять порядок уроков. Можно сделать кнопками ↑/↓ для MVP, drag-and-drop — в следующей итерации.

**6. LEARNER в DashboardLayout**

Текущий `DashboardLayout` показывает навигацию с Task, Chat, Documents — LEARNER это всё не нужно. Нужно либо создать отдельный `LearnerLayout`, либо условно скрывать пункты меню по роли.

### 🟢 Можно отложить

**7. Прогресс прохождения** — не запрашивался, но пользователи будут ожидать. Добавить в следующей итерации.

**8. Поиск по курсам** — когда курсов станет больше 5-10.

**9. Загрузка обложки курса** — thumbnail_path в схеме есть, но в MVP можно пропустить.

---

## 7. Порядок разработки (Roadmap)

### Фаза 1 — Backend (делаем первым)

```
[ ] 1. Добавить LEARNER в Role enum / таблицу пользователей
[ ] 2. Flyway миграция: таблицы courses, course_sections, lessons
[ ] 3. JPA Entities: Course, CourseSection, Lesson
[ ] 4. Repositories
[ ] 5. DTO классы (запросы и ответы)
[ ] 6. CourseService (бизнес-логика)
[ ] 7. AdminCourseController (CRUD + upload)
[ ] 8. LearnerCourseController (GET + streaming)
[ ] 9. Обновить SecurityConfig (права доступа)
[ ] 10. Решить вопрос хранилища (Fly.io Volume или MinIO)
```

### Фаза 2 — Frontend типы и роутинг

```
[ ] 1. Добавить 'LEARNER' в UserRole (authApi.ts + types)
[ ] 2. Добавить маршруты в routes.ts
[ ] 3. Обновить DashboardRedirect
[ ] 4. Создать entities/course/model/types.ts
[ ] 5. Создать entities/course/api/courseApi.ts
```

### Фаза 3 — Admin UI

```
[ ] 1. AdminCoursesPage (список + публикация/снятие)
[ ] 2. AdminCourseEditPage (форма курса + разделы + уроки)
[ ] 3. Компонент загрузки файла урока (с progress bar)
[ ] 4. Добавить в App.tsx + навигацию Админа
```

### Фаза 4 — Learner UI

```
[ ] 1. LearnerCoursesPage (грид карточек)
[ ] 2. LearnerCourseDetailPage (аккордеон разделов + список уроков)
[ ] 3. LearnerLessonPage (видеоплеер / PDF-вьювер / скачивание)
[ ] 4. LearnerLayout или адаптация DashboardLayout
[ ] 5. Добавить в App.tsx
```

### Фаза 5 — Создание LEARNER пользователей

```
[ ] 1. Backend: endpoint создания пользователя с ролью LEARNER
[ ] 2. Frontend: UI для Админа (форма или страница)
```

---

## 8. Итоговые цифры

| | Backend | Frontend |
|--|---------|----------|
| Новых файлов | ~12 | ~10 |
| Изменённых файлов | ~3 | ~7 |
| Новых таблиц БД | 3 | — |
| Новых API endpoints | 11 | — |
| Новых страниц | — | 5 |
| Сложность | Средняя | Средняя |

**Ориентировочное время:** 3–5 рабочих дней при фокусной разработке.

---

## 9. Вопросы, требующие решения до старта

1. **Хранилище файлов** — Fly.io Volume или MinIO? Это блокирует всю загрузку файлов.
2. **Создание LEARNER** — отдельная страница в /admin или добавить к существующему управлению пользователями?
3. **Лимит размера файлов** — какой максимальный размер видео ожидается?
4. **LearnerLayout** — создать отдельный layout или адаптировать существующий DashboardLayout?
