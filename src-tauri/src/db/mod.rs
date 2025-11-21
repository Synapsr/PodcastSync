pub mod episodes;
pub mod models;
pub mod queue;
pub mod settings;
pub mod subscriptions;

use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions};
use sqlx::ConnectOptions;
use std::path::PathBuf;
use std::str::FromStr;
use tracing::log::LevelFilter;

use crate::utils::AppResult;

/// Initialize database connection pool
pub async fn init_database(db_path: PathBuf) -> AppResult<SqlitePool> {
    // Ensure parent directory exists
    if let Some(parent) = db_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    let db_url = format!("sqlite:{}", db_path.display());

    let connect_opts = SqliteConnectOptions::from_str(&db_url)?
        .create_if_missing(true)
        .foreign_keys(true)
        .log_statements(LevelFilter::Off);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connect_opts)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    tracing::info!("Database initialized at: {}", db_path.display());

    Ok(pool)
}
