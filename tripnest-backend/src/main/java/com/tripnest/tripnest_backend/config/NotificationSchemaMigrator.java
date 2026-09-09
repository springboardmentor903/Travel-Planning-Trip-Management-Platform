package com.tripnest.tripnest_backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class NotificationSchemaMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            // 1. Create notifications table with user_id if not present
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INT REFERENCES users(id),
                    title VARCHAR(200) NOT NULL DEFAULT 'Notification',
                    message VARCHAR(500) NOT NULL,
                    type VARCHAR(255) NOT NULL,
                    is_read BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
            """);

            // 2. Ensure user_id column exists
            jdbcTemplate.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id);");
            jdbcTemplate.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(200);");
            jdbcTemplate.execute("UPDATE notifications SET title = 'Notification' WHERE title IS NULL;");
            jdbcTemplate.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message VARCHAR(500);");
            jdbcTemplate.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;");
            jdbcTemplate.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
            jdbcTemplate.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dedupe_key VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS trip_id INT REFERENCES trips(id) ON DELETE CASCADE;");
            jdbcTemplate.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS activity_id INT REFERENCES activities(id) ON DELETE SET NULL;");

            // 3. Create attractions table if not present
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS attractions (
                    id SERIAL PRIMARY KEY,
                    destination_id INT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
                    name VARCHAR(200) NOT NULL,
                    short_description VARCHAR(1000) NOT NULL
                );
            """);

            // 4. Migrate recipient_id data to user_id if recipient_id column exists
            jdbcTemplate.execute("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='recipient_id') THEN
                        UPDATE notifications SET user_id = recipient_id WHERE user_id IS NULL;
                    END IF;
                END $$;
            """);

            // 5. Ensure preferred_currency column exists on users table
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(20) DEFAULT 'USD';");

            log.info("Notifications and attractions database schema safely verified and updated.");
        } catch (Exception e) {
            log.error("Notice during notifications table schema migration: {}", e.getMessage());
        }
    }
}
