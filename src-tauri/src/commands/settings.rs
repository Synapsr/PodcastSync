use tauri::State;

use crate::db::models::Setting;
use crate::db::settings;
use crate::state::AppState;

#[tauri::command]
pub async fn get_all_settings(state: State<'_, AppState>) -> Result<Vec<Setting>, String> {
    settings::get_all_settings(&state.db_pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_setting(state: State<'_, AppState>, key: String) -> Result<Option<String>, String> {
    settings::get_setting(&state.db_pool, &key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_setting(state: State<'_, AppState>, key: String, value: String) -> Result<(), String> {
    settings::set_setting(&state.db_pool, &key, &value)
        .await
        .map_err(|e| e.to_string())
}
