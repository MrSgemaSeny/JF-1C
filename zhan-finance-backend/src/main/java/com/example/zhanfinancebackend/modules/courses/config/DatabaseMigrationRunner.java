package com.example.zhanfinancebackend.modules.courses.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void runMigration() {
        try {
            // Ensure course_curators table exists
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS course_curators (
                    id BIGSERIAL PRIMARY KEY,
                    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    curator_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
                    assigned_by BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uk_course_curator UNIQUE (course_id, curator_id)
                );
            """);

            // 1. Seed Curator
            jdbcTemplate.execute("""
                INSERT INTO app_users (full_name, email, password_hash, role, auth_provider, enabled, locale, created_at, updated_at)
                SELECT 'Виктор Сергеевич (Куратор 1С)', 'curator1c@zhanfinance.kz', '$2a$10$y1/xsqpoLRTwGMuopoLSROiC4VXrd88lZcvaTD.gz8nFuN7k6kYmy', 'CURATOR', 'LOCAL', true, 'ru', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'curator1c@zhanfinance.kz');
            """);

            // 2. Seed 1C Course
            jdbcTemplate.execute("""
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
            """);

            // 3. Assign Course to Curator
            jdbcTemplate.execute("""
                INSERT INTO course_curators (course_id, curator_id, assigned_by, created_at, updated_at)
                SELECT c.id, u.id, a.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM courses c
                CROSS JOIN app_users u
                CROSS JOIN (SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1) a
                WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс'
                  AND u.email = 'curator1c@zhanfinance.kz'
                  AND NOT EXISTS (SELECT 1 FROM course_curators WHERE course_id = c.id AND curator_id = u.id);
            """);

            // 4. Chapter 1
            jdbcTemplate.execute("""
                INSERT INTO chapters (course_id, title, order_index, created_at, updated_at)
                SELECT c.id, 'Модуль 1: Настройка системы и учетная политика', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM courses c WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс'
                AND NOT EXISTS (SELECT 1 FROM chapters WHERE course_id = c.id AND title = 'Модуль 1: Настройка системы и учетная политика');
            """);

            jdbcTemplate.execute("""
                INSERT INTO lessons (chapter_id, title, description, type, order_index, duration_minutes, is_preview, media_url, content, created_at, updated_at)
                SELECT ch.id, '1.1 Обзор интерфейса 1С:Бухгалтерия 8.3 (Такси)', 'Обзор панелей навигации, действий, работа со справочниками и документами', 'VIDEO', 0, 15, true, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Подробное руководство по настройке командного интерфейса 1С.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс' AND ch.title = 'Модуль 1: Настройка системы и учетная политика'
                AND NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = ch.id AND title = '1.1 Обзор интерфейса 1С:Бухгалтерия 8.3 (Такси)');
            """);

            jdbcTemplate.execute("""
                INSERT INTO lessons (chapter_id, title, description, type, order_index, duration_minutes, is_preview, file_url, content, created_at, updated_at)
                SELECT ch.id, '1.2 Настройка учетной политики и ввода остатков', 'Инструкция по заполнению карточки организации, настроек НУ и БУ', 'DOCUMENT', 1, 20, false, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Пошаговый чек-лист ввода начальных остатков по счетам 01, 10, 41, 60, 62.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс' AND ch.title = 'Модуль 1: Настройка системы и учетная политика'
                AND NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = ch.id AND title = '1.2 Настройка учетной политики и ввода остатков');
            """);

            // 5. Chapter 2
            jdbcTemplate.execute("""
                INSERT INTO chapters (course_id, title, order_index, created_at, updated_at)
                SELECT c.id, 'Модуль 2: Учет денежных средств (Касса и Банк)', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM courses c WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс'
                AND NOT EXISTS (SELECT 1 FROM chapters WHERE course_id = c.id AND title = 'Модуль 2: Учет денежных средств (Касса и Банк)');
            """);

            jdbcTemplate.execute("""
                INSERT INTO lessons (chapter_id, title, description, type, order_index, duration_minutes, is_preview, media_url, content, created_at, updated_at)
                SELECT ch.id, '2.1 Оформление кассовых операций (ПКО/РКО)', 'Порядок проведения приходных и расходных кассовых ордеров, формирование Кассовой книги', 'VIDEO', 0, 25, false, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'Разбор распространенных ошибок при оформлении кассовых документов.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс' AND ch.title = 'Модуль 2: Учет денежных средств (Касса и Банк)'
                AND NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = ch.id AND title = '2.1 Оформление кассовых операций (ПКО/РКО)');
            """);

            jdbcTemplate.execute("""
                INSERT INTO lessons (chapter_id, title, description, type, order_index, duration_minutes, is_preview, file_url, content, created_at, updated_at)
                SELECT ch.id, '2.2 Работа с банковскими выписками и Клиент-Банком', 'Автоматическая загрузка выписок из Клиент-Банка и разноска платежей', 'DOCUMENT', 1, 30, false, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Методика сверки расчетов с банком и автоматического распределения по договорам.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс' AND ch.title = 'Модуль 2: Учет денежных средств (Касса и Банк)'
                AND NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = ch.id AND title = '2.2 Работа с банковскими выписками и Клиент-Банком');
            """);

            // 6. Chapter 3
            jdbcTemplate.execute("""
                INSERT INTO chapters (course_id, title, order_index, created_at, updated_at)
                SELECT c.id, 'Модуль 3: Покупки, продажи и закрытие месяца', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM courses c WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс'
                AND NOT EXISTS (SELECT 1 FROM chapters WHERE course_id = c.id AND title = 'Модуль 3: Покупки, продажи и закрытие месяца');
            """);

            jdbcTemplate.execute("""
                INSERT INTO lessons (chapter_id, title, description, type, order_index, duration_minutes, is_preview, media_url, content, created_at, updated_at)
                SELECT ch.id, '3.1 Поступление и реализация ТМЦ / Услуг (УПД, ЭСФ)', 'Проведение первичных документов реализации товаров и выписка счетов-фактур', 'VIDEO', 0, 35, false, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'Пошаговый разбор оформления сделок купли-продажи и оказания услуг.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс' AND ch.title = 'Модуль 3: Покупки, продажи и закрытие месяца'
                AND NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = ch.id AND title = '3.1 Поступление и реализация ТМЦ / Услуг (УПД, ЭСФ)');
            """);

            jdbcTemplate.execute("""
                INSERT INTO lessons (chapter_id, title, description, type, order_index, duration_minutes, is_preview, media_url, content, created_at, updated_at)
                SELECT ch.id, '3.2 Помощник закрытия месяца и регламентные операции', 'Экспресс-проверка ведения учета, закрытие счетов 20, 26, 44, 90 и расчет налога', 'VIDEO', 1, 40, false, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoybacks.mp4', 'Порядок выполнения регламентных операций закрытия месяца и исправление ошибок.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс' AND ch.title = 'Модуль 3: Покупки, продажи и закрытие месяца'
                AND NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = ch.id AND title = '3.2 Помощник закрытия месяца и регламентные операции');
            """);

            System.out.println("Courses 1C & Curator seed completed successfully!");

        } catch (Exception e) {
            System.err.println("DatabaseMigrationRunner error: " + e.getMessage());
        }
    }
}
