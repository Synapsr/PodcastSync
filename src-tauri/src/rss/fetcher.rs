use crate::utils::AppResult;

/// Fetch RSS feed content from URL
pub async fn fetch_rss(url: &str) -> AppResult<String> {
    tracing::info!("Fetching RSS feed from: {}", url);

    let response = reqwest::get(url).await?;

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
