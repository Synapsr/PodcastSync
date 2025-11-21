use crate::utils::AppResult;

/// Fetch RSS feed content from URL
pub async fn fetch_rss(url: &str) -> AppResult<String> {
    fetch_rss_with_limit(url, None).await
}

/// Fetch RSS feed content from URL with optional limit parameter
pub async fn fetch_rss_with_limit(url: &str, limit: Option<i32>) -> AppResult<String> {
    let final_url = if let Some(limit_value) = limit {
        if url.contains('?') {
            format!("{}&limit={}", url, limit_value)
        } else {
            format!("{}?limit={}", url, limit_value)
        }
    } else {
        url.to_string()
    };

    tracing::info!("Fetching RSS feed from: {}", final_url);

    let response = reqwest::get(&final_url).await?;

    let status = response.status();
    if !status.is_success() {
        return Err(crate::utils::AppError::Other(format!(
            "HTTP error {}: Failed to fetch RSS feed",
            status
        )));
    }

    let content = response.text().await?;

    tracing::debug!("Fetched {} bytes from RSS feed", content.len());

    Ok(content)
}
