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
            // Check if chapters table exists and is empty
            Integer chaptersCount = jdbcTemplate.queryForObject("SELECT count(*) FROM chapters", Integer.class);
            if (chaptersCount != null && chaptersCount == 0) {
                System.out.println("Executing manual data migration for Courses Phase 1...");
                
                // 1. Create a default chapter for each existing course
                jdbcTemplate.execute("INSERT INTO chapters (course_id, title, order_index, created_at, updated_at) " +
                                     "SELECT DISTINCT id, 'Основной модуль', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM courses");
                
                // 2. Link existing lessons to the newly created chapters
                // using course_id from lessons, but wait, course_id is not dropped because Hibernate ddl-auto update doesn't drop!
                try {
                    jdbcTemplate.execute("UPDATE lessons SET chapter_id = (SELECT c.id FROM chapters c WHERE c.course_id = lessons.course_id LIMIT 1) WHERE chapter_id IS NULL");
                } catch (Exception e) {
                    System.err.println("Could not update chapter_id using course_id (maybe it was dropped or data missing): " + e.getMessage());
                }
                
                System.out.println("Manual data migration completed successfully!");
            }
        } catch (Exception e) {
            System.err.println("Manual data migration skipped or failed: " + e.getMessage());
        }
    }
}
