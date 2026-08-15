-- Single-row table that holds the shared Google OAuth token for the whole app
CREATE TABLE IF NOT EXISTS google_settings (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  refresh_token  TEXT,
  access_token   TEXT,
  token_expiry   DATETIME,
  channel_id     VARCHAR(255),
  resource_id    VARCHAR(255),
  channel_expiry DATETIME,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Meetings table (also stores events created outside the app and synced in)
CREATE TABLE IF NOT EXISTS meetings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255)                  NOT NULL,
  description     TEXT,
  start_datetime  DATETIME                      NOT NULL,
  end_datetime    DATETIME                      NOT NULL,
  attendees       JSON,
  google_event_id VARCHAR(255),
  meet_link       VARCHAR(500),
  status          ENUM('scheduled','cancelled') NOT NULL DEFAULT 'scheduled',
  created_by      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_google_event (google_event_id),
  FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL
);
