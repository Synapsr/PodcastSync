use chrono::Utc;
use sqlx::SqlitePool;

use crate::db::models::{CreateSubscriptionData, Subscription};
use crate::utils::{AppError, AppResult};

/// Create a new subscription
pub async fn create_subscription(
    pool: &SqlitePool,
    data: CreateSubscriptionData,
) -> AppResult<Subscription> {
    let now = Utc::now();

    let result = sqlx::query_as::<_, Subscription>(
        r#"
        INSERT INTO subscriptions (
            name, rss_url, radio_slug, automation_name,
            check_frequency_minutes, output_directory, max_items_to_check,
            preferred_quality, max_episodes, filename_format, enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        RETURNING *
        "#,
    )
    .bind(&data.name)
    .bind(&data.rss_url)
    .bind(&data.radio_slug)
    .bind(&data.automation_name)
    .bind(data.check_frequency_minutes)
    .bind(&data.output_directory)
    .bind(data.max_items_to_check)
    .bind(&data.preferred_quality)
    .bind(data.max_episodes)
    .bind(&data.filename_format)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await?;

    Ok(result)
}

/// List all subscriptions
pub async fn list_subscriptions(pool: &SqlitePool) -> AppResult<Vec<Subscription>> {
    let subscriptions = sqlx::query_as::<_, Subscription>(
        r#"
        SELECT * FROM subscriptions
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(subscriptions)
}

/// Get subscription by ID
pub async fn get_subscription(pool: &SqlitePool, id: i64) -> AppResult<Subscription> {
    let subscription = sqlx::query_as::<_, Subscription>(
        r#"
        SELECT * FROM subscriptions WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Subscription with id {} not found", id)))?;

    Ok(subscription)
}

/// Update subscription
pub async fn update_subscription(
    pool: &SqlitePool,
    id: i64,
    data: CreateSubscriptionData,
) -> AppResult<Subscription> {
    let now = Utc::now();

    sqlx::query(
        r#"
        UPDATE subscriptions
        SET name = ?, rss_url = ?, radio_slug = ?, automation_name = ?,
            check_frequency_minutes = ?, output_directory = ?, max_items_to_check = ?,
            preferred_quality = ?, max_episodes = ?, filename_format = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&data.name)
    .bind(&data.rss_url)
    .bind(&data.radio_slug)
    .bind(&data.automation_name)
    .bind(data.check_frequency_minutes)
    .bind(&data.output_directory)
    .bind(data.max_items_to_check)
    .bind(&data.preferred_quality)
    .bind(data.max_episodes)
    .bind(&data.filename_format)
    .bind(now)
    .bind(id)
    .execute(pool)
    .await?;

    get_subscription(pool, id).await
}

/// Delete subscription
pub async fn delete_subscription(pool: &SqlitePool, id: i64) -> AppResult<()> {
    let result = sqlx::query("DELETE FROM subscriptions WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!(
            "Subscription with id {} not found",
            id
        )));
    }

    Ok(())
}

/// Toggle subscription enabled status
pub async fn toggle_subscription(pool: &SqlitePool, id: i64, enabled: bool) -> AppResult<()> {
    // If disabling subscription, cancel all pending/downloading episodes
    if !enabled {
        // Cancel episodes
        crate::db::episodes::cancel_subscription_episodes(pool, id).await?;
        // Remove from download queue
        crate::db::queue::remove_subscription_from_queue(pool, id).await?;
    }

    let result = sqlx::query(
        r#"
        UPDATE subscriptions
        SET enabled = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(enabled)
    .bind(Utc::now())
    .bind(id)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!(
            "Subscription with id {} not found",
            id
        )));
    }

    Ok(())
}

/// Get active subscriptions that need checking
pub async fn get_subscriptions_to_check(pool: &SqlitePool) -> AppResult<Vec<Subscription>> {
    let subscriptions = sqlx::query_as::<_, Subscription>(
        r#"
        SELECT * FROM subscriptions
        WHERE enabled = 1
          AND (last_checked_at IS NULL
               OR (julianday('now') - julianday(last_checked_at)) * 24 * 60 >= check_frequency_minutes)
        ORDER BY last_checked_at ASC NULLS FIRST
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(subscriptions)
}

/// Update subscription after checking
pub async fn update_subscription_checked(
    pool: &SqlitePool,
    id: i64,
    new_episodes_count: i32,
    error: Option<String>,
) -> AppResult<()> {
    let now = Utc::now();

    if error.is_none() {
        sqlx::query(
            r#"
            UPDATE subscriptions
            SET last_checked_at = ?,
                last_success_at = ?,
                last_error = NULL,
                total_episodes_found = total_episodes_found + ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(now)
        .bind(now)
        .bind(new_episodes_count)
        .bind(now)
        .bind(id)
        .execute(pool)
        .await?;
    } else {
        sqlx::query(
            r#"
            UPDATE subscriptions
            SET last_checked_at = ?,
                last_error = ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(now)
        .bind(error)
        .bind(now)
        .bind(id)
        .execute(pool)
        .await?;
    }

    Ok(())
}

/// Increment download count for subscription
pub async fn increment_download_count(pool: &SqlitePool, id: i64) -> AppResult<()> {
    sqlx::query(
        r#"
        UPDATE subscriptions
        SET total_downloads = total_downloads + 1,
            updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(Utc::now())
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Cleanup old episodes for a subscription if max_episodes is set
/// Deletes the oldest episodes (both files and DB records) to stay within the limit
pub async fn cleanup_old_episodes(pool: &SqlitePool, subscription_id: i64) -> AppResult<()> {
    // Get subscription to check max_episodes
    let subscription = get_subscription(pool, subscription_id).await?;

    if let Some(max_episodes) = subscription.max_episodes {
        if max_episodes <= 0 {
            return Ok(());
        }

        // Get count of completed episodes
        let count_result = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*) FROM episodes
            WHERE subscription_id = ? AND download_status = 'completed'
            "#,
        )
        .bind(subscription_id)
        .fetch_one(pool)
        .await?;

        let episodes_to_delete = count_result - max_episodes as i64;

        if episodes_to_delete > 0 {
            // Get the oldest episodes to delete
            let episodes_to_remove = sqlx::query_as::<_, (i64, Option<String>)>(
                r#"
                SELECT id, download_path FROM episodes
                WHERE subscription_id = ? AND download_status = 'completed'
                ORDER BY pub_date ASC, discovered_at ASC
                LIMIT ?
                "#,
            )
            .bind(subscription_id)
            .bind(episodes_to_delete)
            .fetch_all(pool)
            .await?;

            // Delete files and database records
            for (episode_id, download_path) in episodes_to_remove {
                // Delete file if it exists
                if let Some(path) = download_path {
                    if let Err(e) = tokio::fs::remove_file(&path).await {
                        tracing::warn!("Failed to delete old episode file {}: {}", path, e);
                    } else {
                        tracing::info!("Deleted old episode file: {}", path);
                    }
                }

                // Delete from database
                sqlx::query("DELETE FROM episodes WHERE id = ?")
                    .bind(episode_id)
                    .execute(pool)
                    .await?;
            }

            tracing::info!(
                "Cleaned up {} old episodes for subscription {}",
                episodes_to_delete,
                subscription_id
            );
        }
    }

    Ok(())
}
