# Epic-03: Documents

**Цель:** Генерация, хранение и управление бизнес-документами (АВР, шаблоны)
**Домен:** Documents
**Роли:** ADMIN, EMPLOYEE, CLIENT, ADVISOR
**Статус:** Done
**Миграции:** V61 — V80 (примерно)

## Реализовано
- [x] Генерация PDF через openhtmltopdf + Thymeleaf
- [x] Word-шаблоны через poi-tl
- [x] АВР документы
- [x] Document templates (DOCX)
- [x] OfficialDocumentTemplateSeeder
- [x] DocumentDataLoader (выделен отдельно)
- [x] Хранение файлов в БД (app.storage.type=db)
- [x] stored_files таблица
- [x] Multipart upload (20MB файл, 25MB запрос)
- [x] ZIP-архив скачивание (клиентские + сотрудничьи документы)
- [x] Folder pills (категоризация по папкам: Личные, Корпоративные, и т.д.)
- [x] Source filters (фильтрация по uploadedByRole: сотрудник / клиент / компания)
- [x] Metrics cards (счётчики документов по категориям)
- [x] Employee Documents Page -- полный редизайн с метриками и фильтрами
- [x] Client Documents Page -- редизайн с per-file try/catch при загрузке
- [x] ADVISOR имеет полный доступ к документам всех клиентов и сотрудников
- [x] Блокировка опасных расширений (.exe, .sh, .js) на уровне загрузки

## Acceptance Criteria
- [x] PDF генерируется корректно с кириллицей
- [x] Шаблоны не перегенерируются при каждом старте
