use sqlx::SqlitePool;
use tokio::sync::mpsc;

use crate::download::DownloadRequest;

/// Global application state shared across all Tauri commands
pub struct AppState {
    pub db_pool: SqlitePool,
    pub download_tx: mpsc::Sender<DownloadRequest>,
}

impl AppState {
    pub fn new(db_pool: SqlitePool, download_tx: mpsc::Sender<DownloadRequest>) -> Self {
        Self {
            db_pool,
            download_tx,
        }
    }
}
