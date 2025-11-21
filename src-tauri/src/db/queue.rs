use chrono::Utc;
use sqlx::SqlitePool;

use crate::utils::AppResult;

/// Add episode to download queue
pub async fn add_to_queue(pool: &SqlitePool, episode_id: i64, priority: i32) -> AppResult<()> {
    sqlx::query(
        r#"
        INSERT OR IGNORE INTO download_queue (episode_id, priority, added_at)
        VALUES (?, ?, ?)
        "#,
    )
    .bind(episode_id)
    .bind(priority)
    .bind(Utc::now())
    .execute(pool)
    .await?;

    Ok(())
}

/// Remove episode from queue
pub async fn remove_from_queue(pool: &SqlitePool, episode_id: i64) -> AppResult<()> {
    sqlx::query("DELETE FROM download_queue WHERE episode_id = ?")
        .bind(episode_id)
        .execute(pool)
        .await?;

    Ok(())
}

/// Get next episode from queue
#[allow(dead_code)]
pub async fn get_next_from_queue(pool: &SqlitePool) -> AppResult<Option<i64>> {
    let episode_id = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT episode_id FROM download_queue
        ORDER BY priority DESC, added_at ASC
        LIMIT 1
        "#,
    )
    .fetch_optional(pool)
    .await?;

    Ok(episode_id)
}

/// Get queue size
pub async fn get_queue_size(pool: &SqlitePool) -> AppResult<i32> {
    let size = sqlx::query_scalar::<_, i32>("SELECT COUNT(*) FROM download_queue")
        .fetch_one(pool)
        .await?;

    Ok(size)
}

/// Clear entire queue
pub async fn clear_queue(pool: &SqlitePool) -> AppResult<()> {
    sqlx::query("DELETE FROM download_queue")
        .execute(pool)
        .await?;

    Ok(())
}

/// Remove all episodes from a subscription from the queue
pub async fn remove_subscription_from_queue(pool: &SqlitePool, subscription_id: i64) -> AppResult<()> {
    sqlx::query(
        r#"
        DELETE FROM download_queue
        WHERE episode_id IN (
            SELECT id FROM episodes WHERE subscription_id = ?
        )
        "#,
    )
    .bind(subscription_id)
    .execute(pool)
    .await?;

    Ok(())
}
