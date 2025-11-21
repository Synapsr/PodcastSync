use futures::StreamExt;
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use tokio::sync::{mpsc, Mutex};
use tokio_util::sync::CancellationToken;

use crate::db::episodes::{
    mark_episode_completed, mark_episode_downloading, mark_episode_failed, update_episode_progress,
};
use crate::db::models::{DownloadCompletedPayload, DownloadFailedPayload, DownloadProgressPayload, DownloadStartedPayload};
use crate::db::queue::remove_from_queue;
use crate::db::subscriptions::increment_download_count;
use crate::utils::AppResult;

#[derive(Debug, Clone)]
pub struct DownloadRequest {
    pub episode_id: i64,
    pub subscription_id: i64,
    pub url: String,
    pub output_path: PathBuf,
}

pub struct DownloadManager {
    max_concurrent: usize,
    active_downloads: Arc<Mutex<HashMap<i64, DownloadTask>>>,
    request_rx: mpsc::Receiver<DownloadRequest>,
    db_pool: SqlitePool,
    app_handle: AppHandle,
}

impl DownloadManager {
    pub fn new(
        max_concurrent: usize,
        request_rx: mpsc::Receiver<DownloadRequest>,
        db_pool: SqlitePool,
        app_handle: AppHandle,
    ) -> Self {
        Self {
            max_concurrent,
            active_downloads: Arc::new(Mutex::new(HashMap::new())),
            request_rx,
            db_pool,
            app_handle,
        }
    }

    pub async fn run(mut self) {
        tracing::info!("Download manager started with max_concurrent={}", self.max_concurrent);

        while let Some(request) = self.request_rx.recv().await {
            // Wait if max concurrent limit reached
            while self.active_downloads.lock().await.len() >= self.max_concurrent {
                tokio::time::sleep(Duration::from_secs(1)).await;
            }

            tracing::info!("Starting download for episode {}", request.episode_id);

            // Spawn download worker
            let task = DownloadTask::spawn(
                request.clone(),
                self.db_pool.clone(),
                self.app_handle.clone(),
                self.active_downloads.clone(),
            );

            self.active_downloads
                .lock()
                .await
                .insert(request.episode_id, task);
        }

        tracing::info!("Download manager stopped");
    }
}

#[allow(dead_code)]
pub struct DownloadTask {
    pub episode_id: i64,
    pub cancel_token: CancellationToken,
    pub handle: tokio::task::JoinHandle<()>,
}

impl DownloadTask {
    fn spawn(
        request: DownloadRequest,
        db_pool: SqlitePool,
        app_handle: AppHandle,
        active_downloads: Arc<Mutex<HashMap<i64, DownloadTask>>>,
    ) -> Self {
        let cancel_token = CancellationToken::new();
        let token_clone = cancel_token.clone();

        let handle = tokio::spawn(async move {
            // Mark as downloading in DB
            if let Err(e) = mark_episode_downloading(&db_pool, request.episode_id).await {
                tracing::error!("Failed to mark episode as downloading: {}", e);
                return;
            }

            // Emit started event
            let _ = app_handle.emit_all(
                "download-started",
                DownloadStartedPayload {
                    episode_id: request.episode_id,
                    subscription_id: request.subscription_id,
                },
            );

            // Remove from queue
            let _ = remove_from_queue(&db_pool, request.episode_id).await;

            // Perform download
            match download_file(
                &request.url,
                &request.output_path,
                request.episode_id,
                &db_pool,
                &app_handle,
                token_clone,
            )
            .await
            {
                Ok(_) => {
                    tracing::info!("Download completed for episode {}", request.episode_id);

                    // Mark as completed
                    if let Err(e) = mark_episode_completed(
                        &db_pool,
                        request.episode_id,
                        request.output_path.display().to_string(),
                    )
                    .await
                    {
                        tracing::error!("Failed to mark episode as completed: {}", e);
                    }

                    // Increment download count
                    let _ = increment_download_count(&db_pool, request.subscription_id).await;

                    // Cleanup old episodes if max_episodes is set
                    let _ = crate::db::subscriptions::cleanup_old_episodes(&db_pool, request.subscription_id).await;

                    // Emit completed event
                    let _ = app_handle.emit_all(
                        "download-completed",
                        DownloadCompletedPayload {
                            episode_id: request.episode_id,
                            subscription_id: request.subscription_id,
                            file_path: request.output_path.display().to_string(),
                        },
                    );
                }
                Err(e) => {
                    tracing::error!("Download failed for episode {}: {}", request.episode_id, e);

                    // Mark as failed
                    if let Err(e) =
                        mark_episode_failed(&db_pool, request.episode_id, e.to_string()).await
                    {
                        tracing::error!("Failed to mark episode as failed: {}", e);
                    }

                    // Emit failed event
                    let _ = app_handle.emit_all(
                        "download-failed",
                        DownloadFailedPayload {
                            episode_id: request.episode_id,
                            error: e.to_string(),
                        },
                    );
                }
            }

            // Remove from active downloads
            active_downloads.lock().await.remove(&request.episode_id);
        });

        Self {
            episode_id: request.episode_id,
            cancel_token,
            handle,
        }
    }

    #[allow(dead_code)]
    pub fn cancel(&self) {
        self.cancel_token.cancel();
    }
}

async fn download_file(
    url: &str,
    output_path: &PathBuf,
    episode_id: i64,
    db_pool: &SqlitePool,
    app_handle: &AppHandle,
    cancel_token: CancellationToken,
) -> AppResult<()> {
    // Ensure output directory exists
    if let Some(parent) = output_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    // Start HTTP request
    let response = reqwest::get(url).await?;

    let status = response.status();
    if !status.is_success() {
        return Err(crate::utils::AppError::Other(format!(
            "HTTP error {}: Failed to download file",
            status
        )));
    }

    let total_size = response.content_length();

    // Create output file
    let mut file = File::create(output_path).await?;
    let mut stream = response.bytes_stream();

    let mut downloaded: u64 = 0;
    let mut last_progress_update = Instant::now();
    let mut last_downloaded = 0u64;

    while let Some(chunk_result) = stream.next().await {
        // Check cancellation
        if cancel_token.is_cancelled() {
            // Delete partial file
            let _ = tokio::fs::remove_file(output_path).await;
            return Err(crate::utils::AppError::DownloadCancelled);
        }

        let chunk = chunk_result?;
        file.write_all(&chunk).await?;
        downloaded += chunk.len() as u64;

        // Emit progress event every 500ms
        let now = Instant::now();
        if now.duration_since(last_progress_update) >= Duration::from_millis(500) {
            let progress = if let Some(total) = total_size {
                (downloaded as f64 / total as f64 * 100.0) as i32
            } else {
                0
            };

            // Calculate speed (bytes per second)
            let elapsed = now.duration_since(last_progress_update).as_secs_f64();
            let bytes_diff = downloaded - last_downloaded;
            let speed = if elapsed > 0.0 {
                Some(bytes_diff as f64 / elapsed)
            } else {
                None
            };

            // Update DB
            let _ = update_episode_progress(db_pool, episode_id, progress).await;

            // Emit event
            let _ = app_handle.emit_all(
                "download-progress",
                DownloadProgressPayload {
                    episode_id,
                    downloaded,
                    total: total_size,
                    progress,
                    speed,
                },
            );

            last_progress_update = now;
            last_downloaded = downloaded;
        }
    }

    file.flush().await?;

    tracing::info!(
        "Downloaded {} bytes to {}",
        downloaded,
        output_path.display()
    );

    Ok(())
}
