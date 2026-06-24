надо внедрить систему загрузки документов и скачать документы из сайта.
пока что без миниО и с3.
но пути должны быть защищены. Нужна идеальная система.

## Часть 1: Как работает upload файлов в Claude.ai — полная теория

### Жизненный цикл файла в этом чате

```
Ты нажимаешь "прикрепить файл" → браузер отправляет на серверы Anthropic
                                          ↓
                          /mnt/user-data/uploads/src_b.zip  ← read-only, только чтение
                          /mnt/user-data/uploads/src_f.zip
                                          ↓
                    Я (Claude) распаковываю в рабочую зону:
                          /home/claude/backend/    ← writeable, мой "рабочий стол"
                          /home/claude/frontend/
                                          ↓
                    Я работаю: читаю, изменяю, запускаю скрипты
                                          ↓
                    Готовый результат → /mnt/user-data/outputs/result.zip
                                          ↓
                    present_files → у тебя в чате появляется кнопка "скачать"
```

### Ключевые правила которые надо запомнить

| Зона | Путь | Кто пишет | Когда живёт |
|---|---|---|---|
| Твои загрузки | `/mnt/user-data/uploads/` | только ты | пока открыт чат |
| Мой рабочий стол | `/home/claude/` | только я | пока открыт чат |
| Твои скачивания | `/mnt/user-data/outputs/` | только я | пока открыт чат |

**Главная боль:** всё умирает когда ты закрываешь чат. Никакого постоянного хранилища нет. Файл нельзя "сохранить на будущее" — только скачать себе.

### Что я умею делать с твоими ZIP

```bash
# Читать любые текстовые файлы
cat /home/claude/backend/src/main/.../SomeFile.java

# Запускать bash команды
unzip, grep, find, diff, wc, ...

# Запускать Python/Node
python3 script.py
node analyze.js

# Устанавливать пакеты
pip install --break-system-packages pandas
npm install

# Создавать новые файлы и отдавать тебе
cp modified_file.java /mnt/user-data/outputs/
```

Что я **не могу**: запустить Spring Boot сервер и дать тебе URL, сохранить файл между сессиями, подключиться к твоей БД напрямую.

---

## Часть 2: Как это связано с JF-1C — реальная картина

Я прочитал твой код. Вот что я вижу:

**Проект:** CRM + биллинг для бухгалтерской/финансовой компании (Zhan Finance, Шымкент). Роли: ADMIN, EMPLOYEE, CLIENT. Уже есть: задачи, инвойсы, подписки, профили, JWT-авторизация.

**Критически важная деталь:** у тебя есть страница `ClientDocumentsPage.tsx` и она **полностью пустая**:

```tsx
// Это всё что там сейчас есть:
export function ClientDocumentsPage() {
  return (
    <div>
      <h1>My Documents</h1>
      <p>Documents and invoices will appear here.</p>
    </div>
  );
}
```

Это именно то место, куда нужно добавить upload файлов. И это логично — клиент должен загружать документы (акты, договора, выписки из 1С), а сотрудники/админ их скачивать и обрабатывать.

---

## Часть 3: Что нужно построить — полная архитектура upload'а для JF-1C

### Что будет храниться и откуда берётся

```
Клиент загружает:
  - Выгрузки из 1С (.xml, .xlsx, .csv)
  - Сканы договоров (.pdf)
  - Акты выполненных работ (.pdf, .docx)

Сотрудник/Админ загружает клиенту:
  - Готовые инвойсы (.pdf)
  - Отчёты (.xlsx)
  - Закрывающие документы
```

### Где хранить файлы — три варианта для тебя

```
MVP (сейчас):
  Локальная папка на сервере
  /var/app/uploads/<userId>/<uuid>_filename.pdf
  
  Плюс: просто, ноль зависимостей
  Минус: при рестарте/переносе сервера — всё пропадает
  Когда ок: разработка + первые 10-20 клиентов

Prod (скоро):
  MinIO — self-hosted S3-совместимый объектный стор
  Запускается как Docker-контейнер рядом с твоим бэком
  
  Плюс: S3-совместимый API → потом 1 строка замены на AWS S3 / Yandex Object Storage
  Минус: ещё один сервис в docker-compose
  Когда ок: как только проект идёт в прод

Prod+ (потом):
  Yandex Object Storage (казахстанский контекст, данные в РФ/КЗ зоне)
  или AWS S3
```

**Мой совет для тебя прямо сейчас:** реализуй через интерфейс `StorageService`, чтобы легко переключаться между локальным и MinIO без переписывания логики.

### Схема модуля documents для твоего бэка

```
modules/
  documents/
    controller/
      DocumentController.java       ← POST /api/documents/upload
                                       GET  /api/documents
                                       GET  /api/documents/{id}/download
                                       DELETE /api/documents/{id}
    dto/
      DocumentDto.java
      DocumentUploadResponse.java
    entity/
      Document.java                 ← хранит метаданные, НЕ сам файл
    repository/
      DocumentRepository.java
    service/
      DocumentService.java          ← бизнес-логика
      StorageService.java           ← интерфейс
      LocalStorageService.java      ← реализация для dev
      MinioStorageService.java      ← реализация для prod
```

### Схема таблицы в БД (новая миграция V6)

```sql
-- V6__Documents_Schema.sql
CREATE TABLE documents (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,              -- чей документ (клиент)
    uploaded_by BIGINT NOT NULL,              -- кто загрузил (клиент сам или сотрудник)
    file_name   VARCHAR(255) NOT NULL,        -- оригинальное имя файла
    storage_key VARCHAR(512) NOT NULL UNIQUE, -- путь/ключ в хранилище
    content_type VARCHAR(100) NOT NULL,       -- application/pdf, etc.
    file_size   BIGINT NOT NULL,              -- в байтах
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_documents_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_documents_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_documents_user ON documents(user_id);
```

**Важно:** в БД хранишь только метаданные. Сам файл — в хранилище (папка или MinIO). `storage_key` — это путь к файлу.

### Эндпоинты

```
POST   /api/documents/upload          — загрузить файл (multipart/form-data)
GET    /api/documents                 — список документов текущего пользователя
GET    /api/documents/{id}/download   — скачать файл (отдаёт binary)
DELETE /api/documents/{id}            — удалить (только свой или ADMIN)
```

### Что поставить в `application.properties`

```properties
# Хранилище
app.storage.type=local          # local | minio
app.storage.local.path=/var/app/uploads

# Ограничения
spring.servlet.multipart.max-file-size=20MB
spring.servlet.multipart.max-request-size=20MB
```

### Как скачивание работает технически

Самая частая ошибка джунов — делать `/api/documents/{id}/url` и отдавать путь к файлу на диске. Это не работает в проде.

Правильно — стриминг через контроллер:

```java
@GetMapping("/{id}/download")
public ResponseEntity<Resource> download(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal) {
    
    Document doc = documentService.getWithAccessCheck(id, principal.getUser());
    Resource resource = storageService.load(doc.getStorageKey());
    
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + doc.getFileName() + "\"")
        .contentType(MediaType.parseMediaType(doc.getContentType()))
        .body(resource);
    // Spring сам стримит файл, не загружая весь в память
}
```

### Что добавить во фронтенд (TypeScript)

В `ClientDocumentsPage.tsx` нужно:

```tsx
// 1. Компонент загрузки
<input type="file" accept=".pdf,.xlsx,.xml,.csv" onChange={handleFileSelect} />
<button onClick={handleUpload}>Загрузить</button>

// 2. Список документов
// GET /api/documents → массив DocumentDto

// 3. Кнопка скачать
// GET /api/documents/{id}/download → браузер скачивает файл
```

Для скачивания в TypeScript:

```ts
// Нельзя просто открыть URL — нужен Authorization header
const response = await http.get(`/api/documents/${id}/download`, {
  responseType: 'blob'  // говорим axios/fetch что ждём бинарный ответ
});

// Создаём временную ссылку и кликаем
const url = URL.createObjectURL(response.data);
const a = document.createElement('a');
a.href = url;
a.download = fileName;
a.click();
URL.revokeObjectURL(url);  // чистим память
```

---

## Часть 4: Подводные камни которые ты не знаешь

**1. Не храни файлы в БД как BYTEA/BLOB.** Это убьёт производительность при любом запросе к таблице — PostgreSQL будет тащить мегабайты туда-сюда.

**2. Проверяй Content-Type на бэке, не только расширение.** Юзер может переименовать `virus.exe` в `report.pdf`. Используй Apache Tika для реальной проверки типа файла.

**3. UUID в имени файла — обязательно.** Без него двое клиентов загрузят `report.xlsx` и один перезапишет другого.

**4. Проверяй права доступа при скачивании.** Клиент А не должен скачать документ клиента Б зная его `id`. У тебя уже есть `InvoiceAccessService` — делай по той же модели `DocumentAccessService`.

**5. `spring.jpa.hibernate.ddl-auto=update` в проде — опасно.** У тебя в `application.properties` стоит `update` как дефолт. Для продакшена обязательно переключи на `validate` — иначе Hibernate может "помочь" изменить схему БД не так как ты ожидаешь. У тебя уже есть Flyway-миграции — это правильно, доверяй им, не Hibernate.

---

## Итог: что делать дальше

1. Создать `V6__Documents_Schema.sql`
2. Написать `Document` entity + repository
3. Написать `StorageService` интерфейс + `LocalStorageService`
4. Написать `DocumentService` + `DocumentController`
5. Оживить `ClientDocumentsPage.tsx` — upload + список + скачать
