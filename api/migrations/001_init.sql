-- Initial schema. All DATETIME values are UTC.

CREATE TABLE clients (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email       VARCHAR(254) NOT NULL,
  name        VARCHAR(200) NOT NULL,
  company     VARCHAR(200) NULL,
  timezone    VARCHAR(80)  NULL,
  created_at  DATETIME(3)  NOT NULL,
  updated_at  DATETIME(3)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clients_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Call requests from "Book a call", handled in the admin panel
CREATE TABLE bookings (
  id              CHAR(36)     NOT NULL,
  client_id       INT UNSIGNED NOT NULL,
  status          ENUM('new', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'new',
  interest        VARCHAR(200) NULL,
  project         VARCHAR(200) NULL,
  preferred_days  VARCHAR(300) NULL COMMENT 'As the visitor saw them, e.g. "Thu 9 Oct, Fri 10 Oct"',
  preferred_time  VARCHAR(60)  NULL,
  note            TEXT         NULL COMMENT 'What the visitor wrote',
  scheduled_at    DATETIME(3)  NULL,
  duration_min    SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  meeting_link    VARCHAR(500) NULL,
  notes           TEXT         NULL COMMENT 'Internal notes, admin only',
  sequence        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Calendar invite revision',
  created_at      DATETIME(3)  NOT NULL,
  updated_at      DATETIME(3)  NOT NULL,
  PRIMARY KEY (id),
  KEY ix_bookings_status (status),
  KEY ix_bookings_scheduled_at (scheduled_at),
  KEY ix_bookings_client (client_id),
  CONSTRAINT fk_bookings_client FOREIGN KEY (client_id) REFERENCES clients (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Days the visitor said would suit them (shown on the admin calendar)
CREATE TABLE booking_preferred_dates (
  booking_id  CHAR(36) NOT NULL,
  date        DATE     NOT NULL,
  PRIMARY KEY (booking_id, date),
  CONSTRAINT fk_preferred_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Booking history ("Confirmed for …", "Confirmation emailed to …")
CREATE TABLE booking_events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id  CHAR(36)     NOT NULL,
  text        VARCHAR(500) NOT NULL,
  created_at  DATETIME(3)  NOT NULL,
  PRIMARY KEY (id),
  KEY ix_events_booking (booking_id, created_at),
  CONSTRAINT fk_events_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- "Send a message" submissions
CREATE TABLE enquiries (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_id   INT UNSIGNED NOT NULL,
  interest    VARCHAR(200) NULL,
  project     VARCHAR(200) NULL,
  message     TEXT         NOT NULL,
  created_at  DATETIME(3)  NOT NULL,
  PRIMARY KEY (id),
  KEY ix_enquiries_client (client_id),
  CONSTRAINT fk_enquiries_client FOREIGN KEY (client_id) REFERENCES clients (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_users (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email          VARCHAR(254) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  created_at     DATETIME(3)  NOT NULL,
  last_login_at  DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Only a SHA-256 of each session token is stored, never the token itself
CREATE TABLE admin_sessions (
  token_hash  CHAR(64)     NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  created_at  DATETIME(3)  NOT NULL,
  expires_at  DATETIME(3)  NOT NULL,
  PRIMARY KEY (token_hash),
  KEY ix_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES admin_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
