use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};
use tokio::sync::mpsc;
use tokio::time::{interval, Duration};

use crate::db::episodes::{episode_exists, insert_episode};
use crate::db::models::{EpisodeDiscoveredPayload, SubscriptionCheckedPayload};
use crate::db::queue::add_to_queue;
use crate::db::subscriptions::{get_subscriptions_to_check, update_subscription_checked};
use crate::download::DownloadRequest;
use crate::rss::{fetch_rss, parse_rss_with_quality};
use crate::utils::{build_output_path, extension_from_mime};

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
                    subscription.preferred_quality.clone(),
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
    preferred_quality: String,
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

    // Process items (limited by max_items_to_check)
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

        if exists {
            continue;
        }

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

        // Build output path
        let extension = enclosure
            .mime_type
            .as_ref()
            .map(|mime| extension_from_mime(mime))
            .or_else(|| {
                crate::utils::extract_extension(&enclosure.url)
            })
            .unwrap_or_else(|| "mp3".to_string());

        let output_path = build_output_path(
            &output_directory,
            &subscription_name,
            &item.title,
            item.pub_date,
            &format!("{}.{}", item.title, extension),
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
