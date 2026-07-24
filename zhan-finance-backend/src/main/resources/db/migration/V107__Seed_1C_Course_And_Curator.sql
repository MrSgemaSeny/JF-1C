-- Seed Test Curator and 1C Course
INSERT INTO app_users (full_name, email, password_hash, role, auth_provider, enabled, locale, created_at, updated_at)
SELECT 'Виктор Сергеевич (Куратор 1С)', 'curator1c@zhanfinance.kz', '$2a$10$y1/xsqpoLRTwGMuopoLSROiC4VXrd88lZcvaTD.gz8nFuN7k6kYmy', 'CURATOR', 'LOCAL', true, 'ru', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'curator1c@zhanfinance.kz');

-- Create 1C Course
INSERT INTO courses (title, description, thumbnail, status, created_by, created_at, updated_at)
SELECT 
    '1С:Бухгалтерия 8.3 — Полный практический курс', 
    'Практический обучающий курс по ведению комплексного учета в 1С:Бухгалтерия 8.3. Изучение настройки учетной политики, работы с документами, банка и кассы, расчета зарплаты и формирования налоговой отчетности.', 
    'https://images.unsplash.com/photo-1554200876-56c2f25224fa?q=80&w=800&auto=format&fit=crop', 
    'PUBLISHED', 
    (SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1), 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = '1С:Бухгалтерия 8.3 — Полный практический курс');

-- Assign 1C Course to Curator
INSERT INTO course_curators (course_id, curator_id, assigned_by, created_at, updated_at)
SELECT c.id, u.id, a.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM courses c
CROSS JOIN app_users u
CROSS JOIN (SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1) a
WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс'
  AND u.email = 'curator1c@zhanfinance.kz'
  AND NOT EXISTS (SELECT 1 FROM course_curators WHERE course_id = c.id AND curator_id = u.id);

-- Chapter 1
INSERT INTO chapters (course_id, title, order_index, created_at, updated_at)
SELECT c.id, 'Модуль 1: Настройка системы и учетная политика', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM courses c WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс'
AND NOT EXISTS (SELECT 1 FROM chapters WHERE course_id = c.id AND title = 'Модуль 1: Настройка системы и учетная политика');

-- Lessons for Chapter 1
INSERT INTO lessons (chapter_id, title, description, type, order_index, duration_minutes, is_preview, media_url, content, created_at, updated_at)
SELECT ch.id, '1.1 Обзор интерфейса 1С:Бухгалтерия 8.3 (Такси)', 'Обзор панелей навигации, действий, работа со справочниками и документами', 'VIDEO', 0, 15, true, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 
'# Введение в командный интерфейс 1С:Бухгалтерия 8.3

Программа 1С:Бухгалтерия 8.3 использует современный интерфейс "Такси", который был разработан для максимального удобства пользователей, включая работу на планшетах и мониторах с любым разрешением.

## Основные панели навигации
1. **Панель разделов** (слева или сверху): Основные блоки учета (Главное, Банк и касса, Покупки, Продажи, Склад, Производство, ОС и НМА, Зарплата и кадры, Справочники, Отчеты).
2. **Панель навигации** (внутри раздела): Быстрый доступ к документам и журналам выбранного раздела.
3. **Панель действий**: Создание новых элементов, отчетов, выполнение сервисных функций.

> **Важно!** Вы можете настроить интерфейс под себя: скрыть ненужные разделы или вынести часто используемые документы на начальную страницу. Для этого используйте меню "Вид" -> "Настройка панелей".', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс' AND ch.title = 'Модуль 1: Настройка системы и учетная политика'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = ch.id AND title = '1.1 Обзор интерфейса 1С:Бухгалтерия 8.3 (Такси)');

INSERT INTO lessons (chapter_id, title, description, type, order_index, duration_minutes, is_preview, file_url, content, created_at, updated_at)
SELECT ch.id, '1.2 Настройка учетной политики и ввода остатков', 'Инструкция по заполнению карточки организации, настроек НУ и БУ', 'DOCUMENT', 1, 20, false, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 
'# Настройка учетной политики

Учетная политика — это свод правил, по которым организация ведет бухгалтерский и налоговый учет. В 1С:Бухгалтерия 8.3 она настраивается один раз в год.

## Шаг 1: Реквизиты организации
Перед созданием учетной политики необходимо заполнить карточку организации (раздел **Главное** -> **Организации**).
Укажите:
- ИНН, КПП, ОГРН
- Систему налогообложения (ОСНО, УСН)
- Банковские счета
- Подписантов (Руководитель, Главный бухгалтер, Кассир)

## Шаг 2: Ввод начальных остатков
Если вы переходите из другой программы или начинаете вести учет не с начала года, воспользуйтесь **Помощником ввода остатков** (раздел **Главное**).
Остатки вводятся в корреспонденции со вспомогательным счетом `000`.

*Совет:* Обязательно сверьте оборотно-сальдовую ведомость (ОСВ) после ввода остатков. Сальдо по счету 000 должно быть равно нулю!', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс' AND ch.title = 'Модуль 1: Настройка системы и учетная политика'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = ch.id AND title = '1.2 Настройка учетной политики и ввода остатков');

-- Chapter 2
INSERT INTO chapters (course_id, title, order_index, created_at, updated_at)
SELECT c.id, 'Модуль 2: Учет денежных средств (Касса и Банк)', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM courses c WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс'
AND NOT EXISTS (SELECT 1 FROM chapters WHERE course_id = c.id AND title = 'Модуль 2: Учет денежных средств (Касса и Банк)');

-- Lessons for Chapter 2
INSERT INTO lessons (chapter_id, title, description, type, order_index, duration_minutes, is_preview, media_url, content, created_at, updated_at)
SELECT ch.id, '2.1 Оформление кассовых операций (ПКО/РКО)', 'Порядок проведения приходных и расходных кассовых ордеров, формирование Кассовой книги', 'VIDEO', 0, 25, false, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 
'# Работа с кассой

В этом уроке мы разберем оформление кассовых операций.

## Основные документы
- Приходный кассовый ордер (ПКО)
- Расходный кассовый ордер (РКО)

Перейдите в раздел **Банк и касса** -> **Кассовые документы**.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс' AND ch.title = 'Модуль 2: Учет денежных средств (Касса и Банк)'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = ch.id AND title = '2.1 Оформление кассовых операций (ПКО/РКО)');

INSERT INTO lessons (chapter_id, title, description, type, order_index, duration_minutes, is_preview, file_url, content, created_at, updated_at)
SELECT ch.id, '2.2 Работа с банковскими выписками и Клиент-Банком', 'Автоматическая загрузка выписок из Клиент-Банка и разноска платежей', 'DOCUMENT', 1, 30, false, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 
'# Банковские выписки

Загрузка выписок производится из файла `1c_to_kl.txt`. Убедитесь, что настройка обмена с банком включена.
Проверяйте заполнение счетов расчетов (60.01/60.02 для поставщиков, 62.01/62.02 для покупателей).', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс' AND ch.title = 'Модуль 2: Учет денежных средств (Касса и Банк)'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = ch.id AND title = '2.2 Работа с банковскими выписками и Клиент-Банком');

-- Chapter 3
INSERT INTO chapters (course_id, title, order_index, created_at, updated_at)
SELECT c.id, 'Модуль 3: Покупки, продажи и закрытие месяца', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM courses c WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс'
AND NOT EXISTS (SELECT 1 FROM chapters WHERE course_id = c.id AND title = 'Модуль 3: Покупки, продажи и закрытие месяца');

-- Lessons for Chapter 3
INSERT INTO lessons (chapter_id, title, description, type, order_index, duration_minutes, is_preview, media_url, content, created_at, updated_at)
SELECT ch.id, '3.1 Поступление и реализация ТМЦ / Услуг (УПД, ЭСФ)', 'Проведение первичных документов реализации товаров и выписка счетов-фактур', 'VIDEO', 0, 35, false, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 
'# Покупки и продажи

Счета фактуры обязательны для учета НДС. Создавайте счет-фактуру на основании документов Поступления и Реализации.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс' AND ch.title = 'Модуль 3: Покупки, продажи и закрытие месяца'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = ch.id AND title = '3.1 Поступление и реализация ТМЦ / Услуг (УПД, ЭСФ)');

INSERT INTO lessons (chapter_id, title, description, type, order_index, duration_minutes, is_preview, media_url, content, created_at, updated_at)
SELECT ch.id, '3.2 Помощник закрытия месяца и регламентные операции', 'Экспресс-проверка ведения учета, закрытие счетов 20, 26, 44, 90 и расчет налога', 'VIDEO', 1, 40, false, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoybacks.mp4', 
'# Закрытие месяца

Выполняйте операции последовательно, сверху вниз. При наличии ошибок помощник выделит проблемную операцию красным цветом.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс' AND ch.title = 'Модуль 3: Покупки, продажи и закрытие месяца'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = ch.id AND title = '3.2 Помощник закрытия месяца и регламентные операции');
