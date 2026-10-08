-- Initial schema (PostgreSQL). Times are timestamptz: absolute instants, shown in UTC.

CREATE TABLE clients (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       varchar(254) NOT NULL UNIQUE,
  name        varchar(200) NOT NULL,
  company     varchar(200),
  timezone    varchar(80),
  created_at  timestamptz  NOT NULL,
  updated_at  timestamptz  NOT NULL
);

-- Call requests from "Book a call", handled in the admin panel
CREATE TABLE bookings (
  id              varchar(36)  PRIMARY KEY,
  client_id       integer      NOT NULL REFERENCES clients (id),
  status          varchar(16)  NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'completed', 'cancelled')),
  interest        varchar(200),
  project         varchar(200),
  preferred_days  varchar(300),   -- as the visitor saw them, e.g. "Thu 9 Oct, Fri 10 Oct"
  preferred_time  varchar(60),
  note            text,           -- what the visitor wrote
  scheduled_at    timestamptz,
  duration_min    smallint     NOT NULL DEFAULT 30,
  meeting_link    varchar(500),
  notes           text,           -- internal notes, admin only
  sequence        integer      NOT NULL DEFAULT 0,  -- calendar invite revision
  created_at      timestamptz  NOT NULL,
  updated_at      timestamptz  NOT NULL
);
CREATE INDEX ix_bookings_status ON bookings (status);
CREATE INDEX ix_bookings_scheduled_at ON bookings (scheduled_at);
CREATE INDEX ix_bookings_client ON bookings (client_id);

-- Days the visitor said would suit them (shown on the admin calendar)
CREATE TABLE booking_preferred_dates (
  booking_id  varchar(36) NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  date        date        NOT NULL,
  PRIMARY KEY (booking_id, date)
);

-- Booking history ("Confirmed for …", "Confirmation emailed to …")
CREATE TABLE booking_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id  varchar(36)  NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  text        varchar(500) NOT NULL,
  created_at  timestamptz  NOT NULL
);
CREATE INDEX ix_events_booking ON booking_events (booking_id, created_at);

-- "Send a message" submissions
CREATE TABLE enquiries (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_id   integer      NOT NULL REFERENCES clients (id),
  interest    varchar(200),
  project     varchar(200),
  message     text         NOT NULL,
  created_at  timestamptz  NOT NULL
);
CREATE INDEX ix_enquiries_client ON enquiries (client_id);

CREATE TABLE admin_users (
  id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email          varchar(254) NOT NULL UNIQUE,
  password_hash  varchar(255) NOT NULL,
  created_at     timestamptz  NOT NULL,
  last_login_at  timestamptz
);

-- Only a SHA-256 of each session token is stored, never the token itself
CREATE TABLE admin_sessions (
  token_hash  char(64)     PRIMARY KEY,
  user_id     integer      NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
  created_at  timestamptz  NOT NULL,
  expires_at  timestamptz  NOT NULL
);
CREATE INDEX ix_sessions_expires ON admin_sessions (expires_at);
