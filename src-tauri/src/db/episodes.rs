use chrono::{DateTime, Utc};
use sqlx::SqlitePool;

use crate::db::models::Episode;
use crate::utils::{AppError, AppResult};

/// Check if episode exists by GUID
pub async fn episode_exists(pool: &SqlitePool, subscription_id: i64, guid: &str) -> AppResult<bool> {
    let exists = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS(SELECT 1 FROM episodes WHERE subscription_id = ? AND guid = ?)
        "#,
    )
    .bind(subscription_id)
    .bind(guid)
    .fetch_one(pool)
    .await?;

    Ok(exists)
}

/// Insert new episode
pub async fn insert_episode(
    pool: &SqlitePool,
    subscription_id: i64,
    guid: String,
    title: String,
    description: Option<String>,
    pub_date: Option<DateTime<Utc>>,
    audio_url: String,
    audio_type: Option<String>,
    audio_size_bytes: Option<i64>,
    duration_seconds: Option<i32>,
    image_url: Option<String>,
    program_name: Option<String>,
) -> AppResult<Episode> {
    let now = Utc::now();

    let episode = sqlx::query_as::<_, Episode>(
        r#"
        INSERT INTO episodes (
            subscription_id, guid, title, description, pub_date,
            audio_url, audio_type, audio_size_bytes, duration_seconds,
            image_url, program_name, download_status, discovered_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        RETURNING *
        "#,
    )
    .bind(subscription_id)
    .bind(guid)
    .bind(title)
    .bind(description)
    .bind(pub_date)
    .bind(audio_url)
    .bind(audio_type)
    .bind(audio_size_bytes)
    .bind(duration_seconds)
    .bind(image_url)
    .bind(program_name)
    .bind(now)
    .fetch_one(pool)
    .await?;

    Ok(episode)
}

/// List all episodes
pub async fn list_episodes(pool: &SqlitePool) -> AppResult<Vec<Episode>> {
    let episodes = sqlx::query_as::<_, Episode>(
        r#"
        SELECT * FROM episodes
        ORDER BY pub_date DESC NULLS LAST, discovered_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(episodes)
}

/// List episodes by subscription
pub async fn list_episodes_by_subscription(
    pool: &SqlitePool,
    subscription_id: i64,
) -> AppResult<Vec<Episode>> {
    let episodes = sqlx::query_as::<_, Episode>(
        r#"
        SELECT * FROM episodes
        WHERE subscription_id = ?
        ORDER BY pub_date DESC NULLS LAST, discovered_at DESC
        "#,
    )
    .bind(subscription_id)
    .fetch_all(pool)
    .await?;

    Ok(episodes)
}

/// List episodes by status
pub async fn list_episodes_by_status(pool: &SqlitePool, status: &str) -> AppResult<Vec<Episode>> {
    let episodes = sqlx::query_as::<_, Episode>(
        r#"
        SELECT * FROM episodes
        WHERE download_status = ?
        ORDER BY pub_date DESC NULLS LAST, discovered_at DESC
        "#,
    )
    .bind(status)
    .fetch_all(pool)
    .await?;

    Ok(episodes)
}

/// Get episode by ID
pub async fn get_episode(pool: &SqlitePool, id: i64) -> AppResult<Episode> {
    let episode = sqlx::query_as::<_, Episode>(
        r#"
        SELECT * FROM episodes WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Episode with id {} not found", id)))?;

    Ok(episode)
}

/// Update episode download status
#[allow(dead_code)]
pub async fn update_episode_status(
    pool: &SqlitePool,
    id: i64,
    status: &str,
    progress: Option<i32>,
    error: Option<String>,
) -> AppResult<()> {
    let mut query = String::from("UPDATE episodes SET download_status = ?");
    let mut bindings: Vec<String> = vec![status.to_string()];

    if let Some(p) = progress {
        query.push_str(", download_progress = ?");
        bindings.push(p.to_string());
    }

    if let Some(e) = error {
        query.push_str(", download_error = ?");
        bindings.push(e);
    }

    if status == "downloading" {
        query.push_str(", download_started_at = ?");
        bindings.push(Utc::now().to_rfc3339());
    } else if status == "completed" {
        query.push_str(", download_completed_at = ?");
        bindings.push(Utc::now().to_rfc3339());
    }

    query.push_str(" WHERE id = ?");
    bindings.push(id.to_string());

    // Note: This is a simplified version. In production, use proper parameter binding
    sqlx::query(&query).bind(status).bind(id).execute(pool).await?;

    Ok(())
}

/// Update episode download status to downloading
pub async fn mark_episode_downloading(pool: &SqlitePool, id: i64) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE episodes
        SET download_status = 'downloading',
            download_started_at = ?,
            download_attempts = download_attempts + 1
        WHERE id = ?
        "#,
    )
    .bind(Utc::now())
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Update episode download progress
pub async fn update_episode_progress(pool: &SqlitePool, id: i64, progress: i32) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE episodes
        SET download_progress = ?
        WHERE id = ?
        "#,
    )
    .bind(progress)
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Mark episode as completed
pub async fn mark_episode_completed(pool: &SqlitePool, id: i64, file_path: String) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE episodes
        SET download_status = 'completed',
            download_path = ?,
            download_progress = 100,
            download_completed_at = ?,
            download_error = NULL
        WHERE id = ?
        "#,
    )
    .bind(file_path)
    .bind(Utc::now())
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Mark episode as failed
pub async fn mark_episode_failed(pool: &SqlitePool, id: i64, error: String) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE episodes
        SET download_status = 'failed',
            download_error = ?
        WHERE id = ?
        "#,
    )
    .bind(error)
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Reset episode for retry
pub async fn reset_episode_for_retry(pool: &SqlitePool, id: i64) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE episodes
        SET download_status = 'pending',
            download_progress = 0,
            download_error = NULL
        WHERE id = ?
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Delete episode
pub async fn delete_episode(pool: &SqlitePool, id: i64) -> AppResult<()> {
    let result = sqlx::query("DELETE FROM episodes WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Episode with id {} not found", id)));
    }

    Ok(())
}

/// Update episode status (simple version)
pub async fn update_episode_status_simple(pool: &SqlitePool, id: i64, status: &str) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE episodes
        SET download_status = ?
        WHERE id = ?
        "#,
    )
    .bind(status)
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Clear episode download information
pub async fn clear_episode_download_info(pool: &SqlitePool, id: i64) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE episodes
        SET download_path = NULL,
            download_progress = 0,
            download_started_at = NULL,
            download_completed_at = NULL,
            download_error = NULL
        WHERE id = ?
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Cancel pending and downloading episodes for a subscription
pub async fn cancel_subscription_episodes(pool: &SqlitePool, subscription_id: i64) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE episodes
        SET download_status = 'paused',
            download_error = 'Cancelled: subscription disabled'
        WHERE subscription_id = ?
          AND download_status IN ('pending', 'downloading')
        "#,
    )
    .bind(subscription_id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Count completed episodes for a subscription
pub async fn count_completed_episodes(pool: &SqlitePool, subscription_id: i64) -> AppResult<i64> {
    let count = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM episodes
        WHERE subscription_id = ? AND download_status = 'completed'
        "#,
    )
    .bind(subscription_id)
    .fetch_one(pool)
    .await?;

    Ok(count)
}

/// Count all episodes for a subscription (all statuses)
pub async fn count_all_episodes(pool: &SqlitePool, subscription_id: i64) -> AppResult<i64> {
    let count = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM episodes
        WHERE subscription_id = ?
        "#,
    )
    .bind(subscription_id)
    .fetch_one(pool)
    .await?;

    Ok(count)
}

/// Get episode statistics
pub async fn get_episode_stats(pool: &SqlitePool) -> AppResult<EpisodeStats> {
    let stats = sqlx::query_as::<_, EpisodeStats>(
        r#"
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN download_status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN download_status = 'downloading' THEN 1 ELSE 0 END) as downloading,
            SUM(CASE WHEN download_status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN download_status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM episodes
        "#,
    )
    .fetch_one(pool)
    .await?;

    Ok(stats)
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct EpisodeStats {
    pub total: i32,
    pub pending: i32,
    pub downloading: i32,
    pub completed: i32,
    pub failed: i32,
}
