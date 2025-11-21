// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod download;
mod rss;
mod scheduler;
mod state;
mod updater;
mod utils;

use std::path::PathBuf;
use tauri::Manager;
use tokio::sync::mpsc;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

use commands::*;
use db::init_database;
use download::DownloadManager;
use scheduler::{start_feed_checker, start_update_checker};
use state::AppState;

fn main() {
    // Initialize logging
    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(EnvFilter::from_default_env().add_directive(tracing::Level::INFO.into()))
        .init();

    tracing::info!("Starting RSS Audio Downloader");

    // Build Tauri app
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();

            // Get app data directory
            let app_dir = app
                .path_resolver()
                .app_data_dir()
                .expect("Failed to get app data directory");

            // Create app data directory
            std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");

            let db_path: PathBuf = app_dir.join("app.db");

            tracing::info!("Database path: {}", db_path.display());

            // Clone app_handle for async tasks
            let app_handle_clone = app_handle.clone();

            // Initialize database and spawn background tasks
            tauri::async_runtime::spawn(async move {
                // Initialize database
                let db_pool = match init_database(db_path).await {
                    Ok(pool) => pool,
                    Err(e) => {
                        tracing::error!("Failed to initialize database: {}", e);
                        return;
                    }
                };

                // Create download channel
                let (download_tx, download_rx) = mpsc::channel(100);

                // Get max concurrent downloads from settings (default: 3)
                let max_concurrent = db::settings::get_setting_int(&db_pool, "max_concurrent_downloads", 3)
                    .await
                    .unwrap_or(3) as usize;

                // Create app state
                let app_state = AppState::new(db_pool.clone(), download_tx.clone());

                // Store app state
                app_handle_clone.manage(app_state);

                // Start download manager
                let download_manager = DownloadManager::new(
                    max_concurrent,
                    download_rx,
                    db_pool.clone(),
                    app_handle_clone.clone(),
                );

                tauri::async_runtime::spawn(async move {
                    download_manager.run().await;
                });

                // Start feed checker
                let app_handle_for_checker = app_handle_clone.clone();
                tauri::async_runtime::spawn(async move {
                    start_feed_checker(db_pool, download_tx, app_handle_clone).await;
                });

                // Start update checker (checks on startup and every 6 hours)
                tauri::async_runtime::spawn(async move {
                    start_update_checker(app_handle_for_checker).await;
                });

                tracing::info!("Application initialized successfully");
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Subscription commands
            create_subscription,
            list_subscriptions,
            get_subscription,
            update_subscription,
            delete_subscription,
            toggle_subscription,
            check_subscription_now,
            fetch_rss_title,
            // Episode commands
            list_episodes,
            list_episodes_by_subscription,
            list_episodes_by_status,
            get_episode,
            retry_episode,
            process_pending_episodes,
            verify_episode_file,
            verify_subscription_files,
            get_episode_available_media,
            delete_episode,
            get_episode_stats,
            // Settings commands
            get_all_settings,
            get_setting,
            set_setting,
            // Download commands
            get_queue_size,
            clear_queue,
            select_directory,
            open_in_file_manager,
            // Updater commands
            check_updates,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
