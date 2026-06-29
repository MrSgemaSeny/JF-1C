package com.example.zhanfinancebackend.common.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class RoleConstraintFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public RoleConstraintFixer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check");
            System.out.println("SUCCESSFULLY DROPPED app_users_role_check CONSTRAINT");
        } catch (Exception e) {
            System.err.println("Could not drop constraint: " + e.getMessage());
        }
    }
}
