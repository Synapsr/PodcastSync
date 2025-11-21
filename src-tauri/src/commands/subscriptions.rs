use tauri::{AppHandle, State};

use crate::db::models::{CreateSubscriptionData, Subscription};
use crate::db::subscriptions;
use crate::rss::{fetch_rss_with_limit, parse_rss_with_quality};
use crate::scheduler::feed_checker;
use crate::state::AppState;

#[tauri::command]
pub async fn create_subscription(
    state: State<'_, AppState>,
    data: CreateSubscriptionData,
) -> Result<Subscription, String> {
    subscriptions::create_subscription(&state.db_pool, data)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_subscriptions(state: State<'_, AppState>) -> Result<Vec<Subscription>, String> {
    subscriptions::list_subscriptions(&state.db_pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_subscription(
    state: State<'_, AppState>,
    id: i64,
) -> Result<Subscription, String> {
    subscriptions::get_subscription(&state.db_pool, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_subscription(
    state: State<'_, AppState>,
    id: i64,
    data: CreateSubscriptionData,
) -> Result<Subscription, String> {
    subscriptions::update_subscription(&state.db_pool, id, data)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_subscription(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    subscriptions::delete_subscription(&state.db_pool, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn toggle_subscription(
    state: State<'_, AppState>,
    id: i64,
    enabled: bool,
) -> Result<(), String> {
    subscriptions::toggle_subscription(&state.db_pool, id, enabled)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_subscription_now(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    id: i64,
) -> Result<(), String> {
    // Trigger immediate check of the subscription
    feed_checker::check_single_subscription_now(
        id,
        state.db_pool.clone(),
        state.download_tx.clone(),
        app_handle,
    )
    .await
}

#[tauri::command]
pub async fn fetch_rss_title(url: String) -> Result<String, String> {
    // Fetch RSS feed with limit=1 for speed
    let xml = fetch_rss_with_limit(&url, Some(1))
        .await
        .map_err(|e| e.to_string())?;

    // Parse the feed to extract title
    let feed = parse_rss_with_quality(&xml, "enclosure")
        .map_err(|e| e.to_string())?;

    Ok(feed.title)
}
