-- Add episode limit and filename format customization to subscriptions table

-- Add max_episodes column (NULL means no limit)
ALTER TABLE subscriptions ADD COLUMN max_episodes INTEGER DEFAULT NULL;

-- Add filename_format column (default: "{show}-{episode}")
-- Available variables: {show}, {episode}
-- Presets: "{show}-{episode}", "{episode}", "{episode}-{show}", or custom
ALTER TABLE subscriptions ADD COLUMN filename_format TEXT NOT NULL DEFAULT '{show}-{episode}';
