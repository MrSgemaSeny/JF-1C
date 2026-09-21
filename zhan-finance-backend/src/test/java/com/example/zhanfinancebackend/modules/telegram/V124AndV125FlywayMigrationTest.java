package com.example.zhanfinancebackend.modules.telegram;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class V124AndV125FlywayMigrationTest {

    @Test
    @DisplayName("V124 migration exists and defines telegram_links and telegram_link_tokens")
    void v124Migration_existsAndContainsValidDdl() throws Exception {
        Path path = Path.of("src/main/resources/db/migration/V124__Telegram_Link_Schema.sql");
        assertTrue(Files.exists(path), "V124 migration file must exist");

        String sql = Files.readString(path);
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS telegram_links"), "Must create telegram_links table");
        assertTrue(sql.contains("REFERENCES app_users(id) ON DELETE CASCADE"), "Must reference app_users(id) on delete cascade");
        assertTrue(sql.contains("chat_id"), "Must contain chat_id column");
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS telegram_link_tokens"), "Must create telegram_link_tokens table");
        assertTrue(sql.contains("idx_tg_links_chat_id"), "Must create chat_id index");
    }

    @Test
    @DisplayName("V125 migration exists and defines telegram_notifications outbox table and indexes")
    void v125Migration_existsAndContainsValidDdl() throws Exception {
        Path path = Path.of("src/main/resources/db/migration/V125__Telegram_Outbox.sql");
        assertTrue(Files.exists(path), "V125 migration file must exist");

        String sql = Files.readString(path);
        assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS telegram_notifications"), "Must create telegram_notifications table");
        assertTrue(sql.contains("REFERENCES app_users(id) ON DELETE SET NULL"), "Must reference app_users(id) on delete set null");
        assertTrue(sql.contains("status"), "Must contain status column");
        assertTrue(sql.contains("attempts"), "Must contain attempts column");
        assertTrue(sql.contains("max_attempts"), "Must contain max_attempts column");
        assertTrue(sql.contains("idx_tg_notif_pending"), "Must create pending queue index");
    }
}
