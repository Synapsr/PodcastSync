-- Initial database schema for RSS Audio Downloader

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rss_url TEXT NOT NULL UNIQUE,
  radio_slug TEXT,
  automation_name TEXT,

  -- Configuration
  check_frequency_minutes INTEGER NOT NULL DEFAULT 15,
  output_directory TEXT NOT NULL,
  max_items_to_check INTEGER NOT NULL DEFAULT 100,

  -- Status
  enabled BOOLEAN NOT NULL DEFAULT 1,
  last_checked_at DATETIME,
  last_success_at DATETIME,
  last_error TEXT,

  -- Statistics
  total_episodes_found INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,

  -- Metadata
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_enabled ON subscriptions(enabled);
CREATE INDEX idx_subscriptions_last_checked ON subscriptions(last_checked_at);

-- Episodes table
CREATE TABLE IF NOT EXISTS episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL,

  -- RSS Data
  guid TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  pub_date DATETIME,

  -- Audio File
  audio_url TEXT NOT NULL,
  audio_type TEXT,
  audio_size_bytes INTEGER,
  duration_seconds INTEGER,

  -- Metadata
  image_url TEXT,
  program_name TEXT,

  -- Download Status
  download_status TEXT NOT NULL DEFAULT 'pending',
  download_path TEXT,
  download_progress INTEGER DEFAULT 0,
  download_started_at DATETIME,
  download_completed_at DATETIME,
  download_error TEXT,
  download_attempts INTEGER DEFAULT 0,

  discovered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  UNIQUE(subscription_id, guid)
);

CREATE INDEX idx_episodes_subscription ON episodes(subscription_id);
CREATE INDEX idx_episodes_status ON episodes(download_status);
CREATE INDEX idx_episodes_pub_date ON episodes(pub_date DESC);
CREATE UNIQUE INDEX idx_episodes_guid ON episodes(subscription_id, guid);

-- Download queue table
CREATE TABLE IF NOT EXISTS download_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  episode_id INTEGER NOT NULL UNIQUE,
  priority INTEGER NOT NULL DEFAULT 0,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_queue_priority ON download_queue(priority DESC, added_at ASC);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('max_concurrent_downloads', '3'),
  ('auto_start_on_boot', 'false'),
  ('notifications_enabled', 'true'),
  ('notify_new_episodes', 'true'),
  ('notify_completed_downloads', 'true'),
  ('notify_errors', 'true'),
  ('default_output_directory', ''),
  ('theme', 'system'),
  ('language', 'fr');
