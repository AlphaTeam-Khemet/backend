-- ============================================================
-- Monument Recognition App — PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Languages
CREATE TABLE languages (
  id          SERIAL       PRIMARY KEY,
  code        VARCHAR(10)  NOT NULL UNIQUE,
  name        VARCHAR(50)  NOT NULL,
  is_active   BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- 2. Users
CREATE TABLE users (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  email               VARCHAR(255)  NOT NULL UNIQUE,
  password_hash       TEXT          NOT NULL,
  full_name           VARCHAR(100),
  preferred_language  INTEGER       REFERENCES languages(id) ON DELETE SET NULL,
  email_verified      BOOLEAN       NOT NULL DEFAULT FALSE,
  email_otp_hash      TEXT,
  email_otp_expires_at TIMESTAMPTZ,
  email_otp_attempts  INTEGER       NOT NULL DEFAULT 0,
  reset_password_otp_hash        TEXT,
  reset_password_otp_expires_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   DEFAULT NOW()
);

-- 3. Refresh tokens
CREATE TABLE refresh_tokens (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT          NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ   NOT NULL,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- 4. Monuments
CREATE TABLE monuments (
  id           UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude     DECIMAL(9,6)   NOT NULL,
  longitude    DECIMAL(9,6)   NOT NULL,
  era          VARCHAR(100),
  category     VARCHAR(100),
  cover_image  TEXT,
  ai_label     VARCHAR(150),
  priority     VARCHAR(20) DEFAULT 'mid',
  created_at   TIMESTAMPTZ    DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    DEFAULT NOW()
);

-- 5. Monument translations
CREATE TABLE monument_translations (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  monument_id  UUID          NOT NULL REFERENCES monuments(id) ON DELETE CASCADE,
  language_id  INTEGER       NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  name         VARCHAR(200)  NOT NULL,
  description  TEXT,
  fun_facts    TEXT[],
  created_at   TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(monument_id, language_id)
);
CREATE INDEX idx_mt_monument ON monument_translations(monument_id);
CREATE INDEX idx_mt_language ON monument_translations(language_id);

-- 6. Monument images
CREATE TABLE monument_images (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  monument_id  UUID         NOT NULL REFERENCES monuments(id) ON DELETE CASCADE,
  image_url    TEXT         NOT NULL,
  caption      TEXT,
  sort_order   SMALLINT     DEFAULT 0,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX idx_mi_monument ON monument_images(monument_id);

-- 7. Scan sessions
CREATE TABLE scan_sessions (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  monument_id   UUID          REFERENCES monuments(id) ON DELETE SET NULL,
  scanned_image TEXT,
  confidence    DECIMAL(5,4),
  status        VARCHAR(20)   DEFAULT 'pending',
  scanned_at    TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX idx_ss_user     ON scan_sessions(user_id);
CREATE INDEX idx_ss_monument ON scan_sessions(monument_id);

-- 8. Gallery
CREATE TABLE gallery (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  monument_id  UUID         REFERENCES monuments(id) ON DELETE SET NULL,
  session_id   UUID         REFERENCES scan_sessions(id) ON DELETE SET NULL,
  image_url    TEXT,
  saved_at     TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);
CREATE INDEX idx_gallery_user ON gallery(user_id);

-- 9. Reviews
CREATE TABLE reviews (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  monument_id  UUID         NOT NULL REFERENCES monuments(id) ON DELETE CASCADE,
  rating       SMALLINT     CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(user_id, monument_id)
);
CREATE INDEX idx_reviews_monument ON reviews(monument_id);

-- 10. Voice narration cache
-- Managed by Sequelize via backend/backend/models/ArtifactNarration.js.
-- The table is created/altered automatically by sequelize.sync({ alter: true })
-- on backend startup. Do not define it here to avoid two sources of truth.
