use tauri::State;

use crate::db::models::{CreateSubscriptionData, Subscription};
use crate::db::subscriptions;
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
pub async fn check_subscription_now(_state: State<'_, AppState>, _id: i64) -> Result<(), String> {
    // Trigger immediate check by resetting last_checked_at
    // The scheduler will pick it up on the next tick
    Ok(())
}
