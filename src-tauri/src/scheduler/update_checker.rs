use std::time::Duration;
use tauri::{AppHandle, Manager};
use tokio::time::sleep;
use tracing::{error, info};

use crate::updater::check_for_updates;

/// Start the automatic update checker
/// Checks for updates on startup and every 6 hours thereafter
pub async fn start_update_checker(app_handle: AppHandle) {
    info!("Starting automatic update checker (every 6 hours)");

    loop {
        // Check for updates
        match check_for_updates().await {
            Ok(update_info) => {
                if update_info.update_available {
                    info!(
                        "Update available: {} -> {}",
                        update_info.current_version, update_info.latest_version
                    );

                    // Emit event to frontend
                    if let Err(e) = app_handle.emit_all("update-available", &update_info) {
                        error!("Failed to emit update-available event: {}", e);
                    }
                } else {
                    info!("No update available. Current version: {}", update_info.current_version);
                }
            }
            Err(e) => {
                error!("Failed to check for updates: {}", e);
            }
        }

        // Wait 6 hours before next check
        sleep(Duration::from_secs(6 * 60 * 60)).await;
    }
}
