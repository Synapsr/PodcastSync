-- Add quality preference to subscriptions table
ALTER TABLE subscriptions ADD COLUMN preferred_quality TEXT NOT NULL DEFAULT 'enclosure';
