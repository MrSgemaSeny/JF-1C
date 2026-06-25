CREATE TABLE calendar_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_time TIME,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(32) NOT NULL DEFAULT 'BLUE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(event_date);
