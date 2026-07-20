package com.example.zhanfinancebackend.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class DatabaseInitializer {

    @Bean
    public ApplicationRunner initDatabase(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("CREATE SEQUENCE IF NOT EXISTS doc_number_seq START 1000;");
                log.info("Successfully ensured doc_number_seq exists.");
            } catch (Exception e) {
                log.warn("Failed to create doc_number_seq: {}", e.getMessage());
            }
        };
    }
}
