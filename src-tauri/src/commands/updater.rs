use tauri::State;

use crate::state::AppState;
use crate::updater::{check_for_updates, UpdateInfo};

#[tauri::command]
pub async fn check_updates(_state: State<'_, AppState>) -> Result<UpdateInfo, String> {
    check_for_updates().await
}
