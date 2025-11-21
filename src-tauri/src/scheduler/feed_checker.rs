use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};
use tokio::sync::mpsc;
use tokio::time::{interval, Duration};

use crate::db::episodes::{count_all_episodes, episode_exists, insert_episode};
use crate::db::models::{EpisodeDiscoveredPayload, SubscriptionCheckedPayload};
use crate::db::queue::add_to_queue;
use crate::db::subscriptions::{get_subscription, get_subscriptions_to_check, update_subscription_checked};
use crate::download::DownloadRequest;
use crate::rss::{fetch_rss, parse_rss_with_quality};
use crate::utils::{build_output_path_with_format, extension_from_mime};

/// Check a single subscription immediately (called from commands)
pub async fn check_single_subscription_now(
    subscription_id: i64,
    db_pool: SqlitePool,
    download_tx: mpsc::Sender<DownloadRequest>,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Get subscription details
    let subscription = get_subscription(&db_pool, subscription_id)
        .await
        .map_err(|e| e.to_string())?;

    tracing::info!("Manual check triggered for subscription: {}", subscription.name);

    // Spawn task to check subscription
    tokio::spawn(async move {
        check_subscription(
            subscription.id,
            subscription.name,
            subscription.rss_url,
            subscription.output_directory,
            subscription.max_items_to_check,
            subscription.max_episodes,
            subscription.preferred_quality,
            subscription.filename_format,
            db_pool,
            download_tx,
            app_handle,
        )
        .await;
    });

    Ok(())
}

pub async fn start_feed_checker(
    db_pool: SqlitePool,
    download_tx: mpsc::Sender<DownloadRequest>,
    app_handle: AppHandle,
) {
    let mut ticker = interval(Duration::from_secs(60)); // Check every minute

    tracing::info!("Feed checker started");

    loop {
        ticker.tick().await;

        // Get subscriptions that need checking
        let subscriptions = match get_subscriptions_to_check(&db_pool).await {
            Ok(subs) => subs,
            Err(e) => {
                tracing::error!("Failed to get subscriptions to check: {}", e);
                continue;
            }
        };

        if !subscriptions.is_empty() {
            tracing::info!("Checking {} subscriptions for updates", subscriptions.len());
        }

        for subscription in subscriptions {
            let db_pool_clone = db_pool.clone();
            let download_tx_clone = download_tx.clone();
            let app_handle_clone = app_handle.clone();

            // Spawn task for each subscription check
            tokio::spawn(async move {
                check_subscription(
                    subscription.id,
                    subscription.name.clone(),
                    subscription.rss_url.clone(),
                    subscription.output_directory.clone(),
                    subscription.max_items_to_check,
                    subscription.max_episodes,
                    subscription.preferred_quality.clone(),
                    subscription.filename_format.clone(),
                    db_pool_clone,
                    download_tx_clone,
                    app_handle_clone,
                )
                .await;
            });
        }
    }
}

async fn check_subscription(
    subscription_id: i64,
    subscription_name: String,
    rss_url: String,
    output_directory: String,
    max_items_to_check: i32,
    max_episodes: Option<i32>,
    preferred_quality: String,
    filename_format: String,
    db_pool: SqlitePool,
    download_tx: mpsc::Sender<DownloadRequest>,
    app_handle: AppHandle,
) {
    tracing::info!("Checking subscription: {} ({})", subscription_name, rss_url);

    // Fetch RSS feed
    let xml = match fetch_rss(&rss_url).await {
        Ok(xml) => xml,
        Err(e) => {
            tracing::error!("Failed to fetch RSS for {}: {}", subscription_name, e);
            let _ = update_subscription_checked(&db_pool, subscription_id, 0, Some(e.to_string()))
                .await;

            // Emit error event
            let _ = app_handle.emit_all(
                "subscription-checked",
                SubscriptionCheckedPayload {
                    subscription_id,
                    new_episodes_count: 0,
                    error: Some(e.to_string()),
                },
            );

            return;
        }
    };

    // Parse RSS with quality preference
    let feed = match parse_rss_with_quality(&xml, &preferred_quality) {
        Ok(feed) => feed,
        Err(e) => {
            tracing::error!("Failed to parse RSS for {}: {}", subscription_name, e);
            let _ = update_subscription_checked(&db_pool, subscription_id, 0, Some(e.to_string()))
                .await;

            let _ = app_handle.emit_all(
                "subscription-checked",
                SubscriptionCheckedPayload {
                    subscription_id,
                    new_episodes_count: 0,
                    error: Some(e.to_string()),
                },
            );

            return;
        }
    };

    let mut new_episodes_count = 0;

    // Calculate available download slots based on max_episodes limit
    let available_slots = if let Some(max_eps) = max_episodes {
        let current_total = match count_all_episodes(&db_pool, subscription_id).await {
            Ok(count) => count,
            Err(e) => {
                tracing::error!("Failed to count episodes: {}", e);
                0
            }
        };

        let slots = max_eps as i64 - current_total;
        if slots <= 0 {
            tracing::info!(
                "Subscription {} has reached max episodes limit ({}/{}). No new downloads will be queued.",
                subscription_name,
                current_total,
                max_eps
            );
            0
        } else {
            tracing::info!(
                "Subscription {} has {} available slots ({} episodes, limit {})",
                subscription_name,
                slots,
                current_total,
                max_eps
            );
            slots as usize
        }
    } else {
        usize::MAX // No limit
    };

    // First pass: collect all new episodes
    let mut new_items = Vec::new();
    for item in feed
        .items
        .into_iter()
        .take(max_items_to_check as usize)
    {
        // Check if episode already exists
        let exists = match episode_exists(&db_pool, subscription_id, &item.guid).await {
            Ok(exists) => exists,
            Err(e) => {
                tracing::error!("Failed to check episode existence: {}", e);
                continue;
            }
        };

        if !exists {
            new_items.push(item);
        }
    }

    // Sort by pub_date DESC (most recent first), items without date go last
    new_items.sort_by(|a, b| {
        match (&b.pub_date, &a.pub_date) {
            (Some(date_b), Some(date_a)) => date_b.cmp(date_a),
            (Some(_), None) => std::cmp::Ordering::Less,
            (None, Some(_)) => std::cmp::Ordering::Greater,
            (None, None) => std::cmp::Ordering::Equal,
        }
    });

    // Take only available_slots episodes
    let items_to_process: Vec<_> = new_items.into_iter().take(available_slots).collect();

    if available_slots > 0 && items_to_process.is_empty() {
        tracing::info!("No new episodes found for subscription {}", subscription_name);
    } else if available_slots == 0 && items_to_process.is_empty() {
        // Already logged above
    } else {
        tracing::info!(
            "Processing {} new episode(s) for subscription {}",
            items_to_process.len(),
            subscription_name
        );
    }

    // Second pass: process selected episodes
    for item in items_to_process {

        // Extract enclosure (audio URL)
        let Some(enclosure) = item.enclosure else {
            tracing::warn!("Item '{}' has no enclosure, skipping", item.title);
            continue;
        };

        // Insert episode into database
        let episode = match insert_episode(
            &db_pool,
            subscription_id,
            item.guid.clone(),
            item.title.clone(),
            item.description.clone(),
            item.pub_date,
            enclosure.url.clone(),
            enclosure.mime_type.clone(),
            enclosure.length,
            item.duration,
            item.image_url.clone(),
            item.author.clone(),
        )
        .await
        {
            Ok(ep) => ep,
            Err(e) => {
                tracing::error!("Failed to insert episode: {}", e);
                continue;
            }
        };

        new_episodes_count += 1;

        tracing::info!(
            "New episode discovered: {} - {}",
            subscription_name,
            item.title
        );

        // Emit discovered event
        let _ = app_handle.emit_all(
            "episode-discovered",
            EpisodeDiscoveredPayload {
                subscription_id,
                episode: episode.clone(),
            },
        );

        // Build output path with custom filename format
        let extension = enclosure
            .mime_type
            .as_ref()
            .map(|mime| extension_from_mime(mime))
            .or_else(|| {
                crate::utils::extract_extension(&enclosure.url)
            })
            .unwrap_or_else(|| "mp3".to_string());

        let output_path = build_output_path_with_format(
            &output_directory,
            &subscription_name,
            &item.title,
            item.pub_date,
            &format!("{}.{}", item.title, extension),
            &filename_format,
        );

        // Add to download queue
        if let Err(e) = add_to_queue(&db_pool, episode.id, 0).await {
            tracing::error!("Failed to add episode to queue: {}", e);
            continue;
        }

        // Send download request
        if let Err(e) = download_tx
            .send(DownloadRequest {
                episode_id: episode.id,
                subscription_id,
                url: enclosure.url.clone(),
                output_path,
            })
            .await
        {
            tracing::error!("Failed to send download request: {}", e);
        }
    }

    // Update subscription
    let _ = update_subscription_checked(&db_pool, subscription_id, new_episodes_count, None).await;

    // Emit checked event
    let _ = app_handle.emit_all(
        "subscription-checked",
        SubscriptionCheckedPayload {
            subscription_id,
            new_episodes_count,
            error: None,
        },
    );

    tracing::info!(
        "Checked subscription {}: {} new episodes",
        subscription_name,
        new_episodes_count
    );
}
