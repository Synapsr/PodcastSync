use chrono::Utc;
use sqlx::SqlitePool;

use crate::db::models::Setting;
use crate::utils::AppResult;

/// Get setting by key
pub async fn get_setting(pool: &SqlitePool, key: &str) -> AppResult<Option<String>> {
    let value = sqlx::query_scalar::<_, String>(
        r#"
        SELECT value FROM settings WHERE key = ?
        "#,
    )
    .bind(key)
    .fetch_optional(pool)
    .await?;

    Ok(value)
}

/// Get all settings
pub async fn get_all_settings(pool: &SqlitePool) -> AppResult<Vec<Setting>> {
    let settings = sqlx::query_as::<_, Setting>(
        r#"
        SELECT * FROM settings
        ORDER BY key
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(settings)
}

/// Set setting
pub async fn set_setting(pool: &SqlitePool, key: &str, value: &str) -> AppResult<()> {
    sqlx::query(
        r#"
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = excluded.updated_at
        "#,
    )
    .bind(key)
    .bind(value)
    .bind(Utc::now())
    .execute(pool)
    .await?;

    Ok(())
}

/// Get setting as integer
pub async fn get_setting_int(pool: &SqlitePool, key: &str, default: i32) -> AppResult<i32> {
    match get_setting(pool, key).await? {
        Some(value) => Ok(value.parse().unwrap_or(default)),
        None => Ok(default),
    }
}

/// Get setting as boolean
#[allow(dead_code)]
pub async fn get_setting_bool(pool: &SqlitePool, key: &str, default: bool) -> AppResult<bool> {
    match get_setting(pool, key).await? {
        Some(value) => Ok(value == "true"),
        None => Ok(default),
    }
}
