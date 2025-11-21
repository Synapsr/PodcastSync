use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Subscription {
    pub id: i64,
    pub name: String,
    pub rss_url: String,
    pub radio_slug: Option<String>,
    pub automation_name: Option<String>,
    pub check_frequency_minutes: i32,
    pub output_directory: String,
    pub max_items_to_check: i32,
    pub enabled: bool,
    pub preferred_quality: String,
    pub last_checked_at: Option<DateTime<Utc>>,
    pub last_success_at: Option<DateTime<Utc>>,
    pub last_error: Option<String>,
    pub total_episodes_found: i32,
    pub total_downloads: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSubscriptionData {
    pub name: String,
    pub rss_url: String,
    pub radio_slug: Option<String>,
    pub automation_name: Option<String>,
    pub check_frequency_minutes: i32,
    pub output_directory: String,
    pub max_items_to_check: i32,
    pub preferred_quality: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Episode {
    pub id: i64,
    pub subscription_id: i64,
    pub guid: String,
    pub title: String,
    pub description: Option<String>,
    pub pub_date: Option<DateTime<Utc>>,
    pub audio_url: String,
    pub audio_type: Option<String>,
    pub audio_size_bytes: Option<i64>,
    pub duration_seconds: Option<i32>,
    pub image_url: Option<String>,
    pub program_name: Option<String>,
    pub download_status: String,
    pub download_path: Option<String>,
    pub download_progress: i32,
    pub download_started_at: Option<DateTime<Utc>>,
    pub download_completed_at: Option<DateTime<Utc>>,
    pub download_error: Option<String>,
    pub download_attempts: i32,
    pub discovered_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct DownloadQueueItem {
    pub id: i64,
    pub episode_id: i64,
    pub priority: i32,
    pub added_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Setting {
    pub key: String,
    pub value: String,
    pub updated_at: DateTime<Utc>,
}

// Event payloads for frontend communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgressPayload {
    pub episode_id: i64,
    pub downloaded: u64,
    pub total: Option<u64>,
    pub progress: i32,
    pub speed: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadCompletedPayload {
    pub episode_id: i64,
    pub file_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadFailedPayload {
    pub episode_id: i64,
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpisodeDiscoveredPayload {
    pub subscription_id: i64,
    pub episode: Episode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionCheckedPayload {
    pub subscription_id: i64,
    pub new_episodes_count: i32,
    pub error: Option<String>,
}
