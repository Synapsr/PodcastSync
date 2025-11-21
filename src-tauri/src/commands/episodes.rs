use tauri::State;
use std::path::{Path, PathBuf};
use serde::Serialize;

use crate::db::episodes::{self, EpisodeStats};
use crate::db::models::Episode;
use crate::db::subscriptions;
use crate::download::DownloadRequest;
use crate::state::AppState;
use crate::utils::{build_output_path, extension_from_mime, extract_extension};
use crate::rss::fetch_rss;

#[derive(Debug, Serialize)]
pub struct AvailableMedia {
    pub standard_url: Option<String>,
    pub original_url: Option<String>,
    pub flac_url: Option<String>,
    pub mp3_url: Option<String>,
}

#[tauri::command]
pub async fn list_episodes(state: State<'_, AppState>) -> Result<Vec<Episode>, String> {
    episodes::list_episodes(&state.db_pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_episodes_by_subscription(
    state: State<'_, AppState>,
    subscription_id: i64,
) -> Result<Vec<Episode>, String> {
    episodes::list_episodes_by_subscription(&state.db_pool, subscription_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_episodes_by_status(
    state: State<'_, AppState>,
    status: String,
) -> Result<Vec<Episode>, String> {
    episodes::list_episodes_by_status(&state.db_pool, &status)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_episode(state: State<'_, AppState>, id: i64) -> Result<Episode, String> {
    episodes::get_episode(&state.db_pool, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn retry_episode(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    // Get episode details
    let episode = episodes::get_episode(&state.db_pool, id)
        .await
        .map_err(|e| e.to_string())?;

    // Get subscription details for output path
    let subscription = subscriptions::get_subscription(&state.db_pool, episode.subscription_id)
        .await
        .map_err(|e| e.to_string())?;

    // Reset episode for retry
    episodes::reset_episode_for_retry(&state.db_pool, id)
        .await
        .map_err(|e| e.to_string())?;

    // Add back to queue
    crate::db::queue::add_to_queue(&state.db_pool, id, 0)
        .await
        .map_err(|e| e.to_string())?;

    // Build output path
    let extension = episode
        .audio_type
        .as_ref()
        .map(|mime| extension_from_mime(mime))
        .or_else(|| extract_extension(&episode.audio_url))
        .unwrap_or_else(|| "mp3".to_string());

    let output_path = build_output_path(
        &subscription.output_directory,
        &subscription.name,
        &episode.title,
        episode.pub_date,
        &format!("{}.{}", episode.title, extension),
    );

    // Send download request
    state
        .download_tx
        .send(DownloadRequest {
            episode_id: episode.id,
            subscription_id: episode.subscription_id,
            url: episode.audio_url.clone(),
            output_path: PathBuf::from(output_path),
        })
        .await
        .map_err(|e| format!("Failed to send download request: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn process_pending_episodes(state: State<'_, AppState>) -> Result<u32, String> {
    // Get all pending episodes
    let pending_episodes = episodes::list_episodes_by_status(&state.db_pool, "pending")
        .await
        .map_err(|e| e.to_string())?;

    let mut count = 0;

    for episode in pending_episodes {
        // Get subscription details
        let subscription = match subscriptions::get_subscription(&state.db_pool, episode.subscription_id).await {
            Ok(sub) => sub,
            Err(e) => {
                tracing::error!("Failed to get subscription for episode {}: {}", episode.id, e);
                continue;
            }
        };

        // Build output path
        let extension = episode
            .audio_type
            .as_ref()
            .map(|mime| extension_from_mime(mime))
            .or_else(|| extract_extension(&episode.audio_url))
            .unwrap_or_else(|| "mp3".to_string());

        let output_path = build_output_path(
            &subscription.output_directory,
            &subscription.name,
            &episode.title,
            episode.pub_date,
            &format!("{}.{}", episode.title, extension),
        );

        // Send download request
        if let Err(e) = state
            .download_tx
            .send(DownloadRequest {
                episode_id: episode.id,
                subscription_id: episode.subscription_id,
                url: episode.audio_url.clone(),
                output_path: PathBuf::from(output_path),
            })
            .await
        {
            tracing::error!("Failed to send download request for episode {}: {}", episode.id, e);
            continue;
        }

        count += 1;
    }

    Ok(count)
}

#[tauri::command]
pub async fn delete_episode(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    episodes::delete_episode(&state.db_pool, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_episode_stats(state: State<'_, AppState>) -> Result<EpisodeStats, String> {
    episodes::get_episode_stats(&state.db_pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn verify_episode_file(state: State<'_, AppState>, id: i64) -> Result<bool, String> {
    let episode = episodes::get_episode(&state.db_pool, id)
        .await
        .map_err(|e| e.to_string())?;

    // If episode is marked as completed, check if file actually exists
    if episode.download_status == "completed" {
        if let Some(path) = &episode.download_path {
            let file_exists = Path::new(path).exists();

            // If file doesn't exist, update status to pending
            if !file_exists {
                episodes::update_episode_status_simple(&state.db_pool, id, "pending")
                    .await
                    .map_err(|e| e.to_string())?;

                episodes::clear_episode_download_info(&state.db_pool, id)
                    .await
                    .map_err(|e| e.to_string())?;

                return Ok(false);
            }

            Ok(true)
        } else {
            // No path but marked as completed - this is inconsistent
            episodes::update_episode_status_simple(&state.db_pool, id, "pending")
                .await
                .map_err(|e| e.to_string())?;
            Ok(false)
        }
    } else {
        Ok(true)
    }
}

#[tauri::command]
pub async fn verify_subscription_files(
    state: State<'_, AppState>,
    subscription_id: i64,
) -> Result<Vec<i64>, String> {
    let episodes = episodes::list_episodes_by_subscription(&state.db_pool, subscription_id)
        .await
        .map_err(|e| e.to_string())?;

    let mut invalid_episodes = Vec::new();

    for episode in episodes {
        if episode.download_status == "completed" {
            if let Some(path) = &episode.download_path {
                if !Path::new(path).exists() {
                    // File doesn't exist, update status
                    episodes::update_episode_status_simple(&state.db_pool, episode.id, "pending")
                        .await
                        .map_err(|e| e.to_string())?;

                    episodes::clear_episode_download_info(&state.db_pool, episode.id)
                        .await
                        .map_err(|e| e.to_string())?;

                    invalid_episodes.push(episode.id);
                }
            }
        }
    }

    Ok(invalid_episodes)
}

#[tauri::command]
pub async fn get_episode_available_media(
    state: State<'_, AppState>,
    subscription_id: i64,
    guid: String,
) -> Result<AvailableMedia, String> {
    // Get subscription to fetch RSS URL
    let subscription = subscriptions::get_subscription(&state.db_pool, subscription_id)
        .await
        .map_err(|e| format!("Failed to get subscription: {}", e))?;

    // Fetch RSS feed
    let xml = fetch_rss(&subscription.rss_url)
        .await
        .map_err(|e| format!("Failed to fetch RSS: {}", e))?;

    // Parse RSS to get the raw channel
    let channel = rss::Channel::read_from(xml.as_bytes())
        .map_err(|e| format!("Failed to parse RSS: {}", e))?;

    // Find the item with matching GUID
    let rss_item = channel.items().iter()
        .find(|item| {
            item.guid()
                .map(|g| g.value() == guid)
                .unwrap_or(false)
        })
        .ok_or_else(|| format!("Episode with GUID '{}' not found in RSS", guid))?;

    // Extract all available media URLs
    let (standard_url, original_url, flac_url, mp3_url) =
        crate::rss::parser::extract_all_media_urls(rss_item);

    Ok(AvailableMedia {
        standard_url,
        original_url,
        flac_url,
        mp3_url,
    })
}
