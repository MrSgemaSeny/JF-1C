# Архитектурный контракт и обзор: Миграция файлового хранилища на Cloudflare R2 / S3

## 1. Контекст проблемы и цели миграции

### 1.1. Текущее состояние (PostgreSQL BYTEA)
В текущей реализации JF-1C все бинарные данные (документы, договоры, акты, сканы первички и аватары) сохраняются непосредственно в таблицу `stored_files` PostgreSQL в колонку `content BYTEA` либо на локальную файловую систему контейнера.
На этапе MVP это обеспечивало простоту развертывания и атомарность бэкапов базы данных.

### 1.2. Проблемы масштабирования хранения в СУБД:
1. **Раздувание базы данных (Database Bloat):**
   При объеме в 500 организаций и среднем обороте 40 документов в месяц база данных через год вырастает на 200–300 ГБ бинарного мусора.
2. **Деградация резервного копирования:**
   Дампы PostgreSQL (`pg_dump` в ночных GitHub Actions воркфлоу) начинают выполняться часами, нагружают CPU/дисковый ввод-вывод сервера на Fly.io и приводят к исчерпанию дисковой квоты.
3. **Давление на память JVM (GC Pressure):**
   Загрузка файлов размером до 25 МБ в виде массива `byte[]` в оперативную память вызывает всплески в Young/Old Generation Heap и провоцирует частые паузы Stop-The-World сборщика мусора.
4. **Экономика Cloudflare R2 vs AWS S3:**
   Cloudflare R2 обеспечивает 100% совместимость с API AWS S3, но **полностью отменяет плату за исходящий трафик ($0 Egress Fee)**, что снижает TCO (совокупную стоимость владения) инфраструктуры JF-1C в разы по сравнению со стандартным AWS S3.

---

## 2. Анализ предложенного контракта

### 2.1. Шаг 1: SQL-миграция
```sql
ALTER TABLE stored_files ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(32) DEFAULT 'DATABASE';
ALTER TABLE stored_files ADD COLUMN IF NOT EXISTS s3_key VARCHAR(512);

-- Индекс для быстрого поиска объектов в облаке
CREATE INDEX IF NOT EXISTS idx_stored_files_s3_key ON stored_files(s3_key) WHERE storage_provider = 'S3';
```

**Оценка архитектора:**
- **Версионирование:** Актуальная цепочка миграций в проекте достигла `V121__create_password_reset_tokens.sql`. Следующая свободная миграция — именно `V122` (или `V124`, если `V122-V123` займут биллинг и 1С).
- **Частичный индекс (Partial Index):** Использование предикативного условия `WHERE storage_provider = 'S3'` — превосходное решение. Индекс не занимает места для старых записей, которые хранятся в БД, и ускоряет выборку облачных ключей.
- **Поле `storage_provider`:** Добавление явного дискриминатора хранилища со значением по умолчанию `'DATABASE'` позволяет реализовать паттерн параллельного чтения без миграции данных на лету.

---

### 2.2. Шаг 2: Конфигурация S3Client (`S3Config.java`)
```java
@Configuration
public class S3Config {

    @Value("${aws.s3.endpoint}")
    private String endpoint;

    @Value("${aws.s3.access-key}")
    private String accessKey;

    @Value("${aws.s3.secret-key}")
    private String secretKey;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                ))
                .region(Region.US_EAST_1)
                .build();
    }
}
```

**Оценка архитектора:**
- Использование официального **AWS Java SDK v2** (`software.amazon.awssdk:s3`) — стандарт индустрии. Он асинхронен по природе, не блокирует потоки и поддерживает HTTP/2.
- `endpointOverride`: Для Cloudflare R2 эндпоинт имеет формат `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
- `Region.US_EAST_1`: Cloudflare R2 не привязан к регионам AWS, но AWS SDK требует указания региона. `US_EAST_1` — канонический dummy-регион для R2.
- **Рекомендация по надежности:** В продуктивном контуре обязательно настроить таймауты сетевого пула:
  ```java
  ApacheHttpClient.builder()
      .connectionTimeout(Duration.ofSeconds(5))
      .socketTimeout(Duration.ofSeconds(30))
      .maxConnections(50)
      .build()
  ```
  Это исключит зависание рабочих потоков Tomcat при временных сбоях сети между Fly.io и Cloudflare R2.

---

### 2.3. Шаг 3: Гибридный сервис хранения (`StorageService.java`)
Паттерн **Dual-Read / Shadow Write**:
1. **Новые файлы** загружаются в S3/R2, метаданные пишутся в PostgreSQL, поле `content` остается `NULL`.
2. **Старые файлы** прозрачно отдаются из `content` (`DATABASE`), если `storage_provider == 'DATABASE'`.

**Оценка архитектора:**
- **Обратная совместимость: 100%.** Существующие боевые файлы клиентов (27 реальных документов в продакшене) продолжат открываться и скачиваться без необходимости экстренного переноса данных.
- **Безопасность структуры ключа:** Формат `users/{userId}/{UUID}_{fileName}` защищает от коллизий имен файлов и упрощает аудит доступа к бакетам по пользователям.

---

## 3. Необходимые инженерные дополнения к контракту

Чтобы схема стала полностью production-ready под высокие нагрузки, необходимо внедрить 3 дополнения:

### 3.1. Потоковая загрузка без `byte[]` в Heap (Zero-Copy Streaming)
В текущем черновике метод принимает `byte[] data`:
```java
// Черновой вариант:
public StoredFile storeFile(String fileName, String contentType, byte[] data, Long userId)
```
При одновременной загрузке несколькими клиентами 5 файлов по 20 МБ в оперативной памяти аллоцируется 100+ МБ, что вызовет OutOfMemory на сервере с 512 МБ RAM на Fly.io.

**Рекомендуемый контракт:**
Принимать `InputStream` и размер файла `long contentLength`:
```java
public StoredFile storeFileStream(String fileName, String contentType, InputStream inputStream, long contentLength, Long userId) {
    String s3Key = "users/" + userId + "/" + UUID.randomUUID() + "_" + fileName;

    s3Client.putObject(PutObjectRequest.builder()
            .bucket(bucketName)
            .key(s3Key)
            .contentType(contentType)
            .contentLength(contentLength)
            .build(), 
            RequestBody.fromInputStream(inputStream, contentLength));
    // ...
}
```

### 3.2. Фоновый воркер ленивого переноса старых файлов (Data Drain Job)
Чтобы очистить базу данных PostgreSQL от старых BYTEA данных:
1. Создается фоновый шедулер, запускаемый в часы минимальной нагрузки (03:00 ночи).
2. Выбирает пачку из 20 файлов со статусом `'DATABASE'`.
3. Отправляет их в R2, сохраняет `s3_key`, меняет статус на `'S3'` и зануляет `content = NULL`.
4. После завершения миграции всех файлов выполняется однократный `VACUUM FULL stored_files`, возвращающий дисковое пространство операционной системе.

### 3.3. Presigned URLs (Прямое скачивание из CDN без нагрузки на бэкенд)
Для больших файлов (например, видеозаписи уроков LMS или архивы отчетов) можно генерировать временные ссылки **S3 Presigned GET URL** (со сроком жизни 15 минут).
В этом случае клиент скачивает файл напрямую с серверов Cloudflare R2 на максимальной скорости, а бэкенд JF-1C вообще не тратит процессорное время и трафик на проксирование байтов.

---

## 4. Итоговое заключение

Предложенная схема:
1. Архитектурно выверена.
2. Безопасна для существующих данных.
3. Изолирована от других модулей системы.
4. Готова к внедрению в качестве `Epic-15 (Storage R2)`.
