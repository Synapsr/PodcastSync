use chrono::{DateTime, Utc};
use rss::Channel;

use crate::utils::AppResult;

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct ParsedFeed {
    pub title: String,
    pub description: Option<String>,
    pub items: Vec<ParsedItem>,
}

#[derive(Debug, Clone)]
pub struct ParsedItem {
    pub guid: String,
    pub title: String,
    pub description: Option<String>,
    pub pub_date: Option<DateTime<Utc>>,
    pub enclosure: Option<Enclosure>,
    pub image_url: Option<String>,
    pub author: Option<String>,
    pub duration: Option<i32>,
}

#[derive(Debug, Clone)]
pub struct Enclosure {
    pub url: String,
    pub mime_type: Option<String>,
    pub length: Option<i64>,
}

/// Parse RSS feed content with optional quality preference
#[allow(dead_code)]
pub fn parse_rss(xml: &str) -> AppResult<ParsedFeed> {
    parse_rss_with_quality(xml, "enclosure")
}

/// Parse RSS feed content with quality preference
pub fn parse_rss_with_quality(xml: &str, quality: &str) -> AppResult<ParsedFeed> {
    tracing::info!("Parsing RSS feed with quality: {}", quality);

    let channel = Channel::read_from(xml.as_bytes())?;

    let items: Vec<ParsedItem> = channel
        .items()
        .iter()
        .map(|item| ParsedItem {
            guid: extract_guid(item),
            title: item.title().unwrap_or("Untitled").to_string(),
            description: item.description().map(|d| d.to_string()),
            pub_date: extract_pub_date(item),
            enclosure: extract_enclosure_with_quality(item, quality),
            image_url: extract_image_url(item),
            author: extract_author(item),
            duration: extract_duration(item),
        })
        .collect();

    tracing::info!("Parsed {} items from RSS feed", items.len());

    Ok(ParsedFeed {
        title: channel.title().to_string(),
        description: Some(channel.description().to_string()),
        items,
    })
}

/// Extract GUID from item (fallback to link)
fn extract_guid(item: &rss::Item) -> String {
    item.guid()
        .map(|g| g.value().to_string())
        .or_else(|| item.link().map(|l| l.to_string()))
        .unwrap_or_else(|| {
            // If no GUID or link, use title + pub_date as fallback
            let title = item.title().unwrap_or("unknown");
            let date = item
                .pub_date()
                .unwrap_or("unknown");
            format!("{}_{}", title, date)
        })
}

/// Extract publication date
fn extract_pub_date(item: &rss::Item) -> Option<DateTime<Utc>> {
    item.pub_date()
        .and_then(|d| DateTime::parse_from_rfc2822(d).ok())
        .map(|d| d.with_timezone(&Utc))
}

/// Extract enclosure (audio file)
fn extract_enclosure(item: &rss::Item) -> Option<Enclosure> {
    item.enclosure().map(|e| Enclosure {
        url: e.url().to_string(),
        mime_type: Some(e.mime_type().to_string()),
        length: e.length().parse().ok(),
    })
}

/// Extract enclosure with quality preference (supports media:group)
fn extract_enclosure_with_quality(item: &rss::Item, quality: &str) -> Option<Enclosure> {
    // If quality is 'enclosure', use default behavior (best quality available)
    if quality == "enclosure" {
        // Try to get the best quality from media:group first
        if let Some(best) = extract_best_from_media_group(item) {
            return Some(best);
        }
        // Fall back to standard enclosure
        return extract_enclosure(item);
    }

    // For specific quality preferences, try media:group first
    if let Some(enclosure) = extract_from_media_group(item, quality) {
        return Some(enclosure);
    }

    // If not found, try fallback chain: original -> flac -> mp3
    let fallback_order = ["original", "flac", "mp3"];
    for fallback_quality in &fallback_order {
        if *fallback_quality == quality {
            continue; // Skip the one we already tried
        }
        if let Some(enclosure) = extract_from_media_group(item, fallback_quality) {
            tracing::info!("Quality '{}' not found, using fallback '{}'", quality, fallback_quality);
            return Some(enclosure);
        }
    }

    // Fall back to standard enclosure if media:group not available
    extract_enclosure(item)
}

/// Extract best quality from media:group (original > flac > mp3)
fn extract_best_from_media_group(item: &rss::Item) -> Option<Enclosure> {
    // Try in order: original, flac, mp3
    if let Some(enc) = extract_from_media_group(item, "original") {
        return Some(enc);
    }
    if let Some(enc) = extract_from_media_group(item, "flac") {
        return Some(enc);
    }
    extract_from_media_group(item, "mp3")
}

/// Extract specific quality from media:group
fn extract_from_media_group(item: &rss::Item, quality: &str) -> Option<Enclosure> {
    let media_ext = item.extensions().get("media")?;
    let group = media_ext.get("group")?;

    // Get all media:content elements
    for group_elem in group {
        if let Some(contents) = group_elem.children.get("content") {
            for content in contents.iter() {
                if let Some(url) = content.attrs.get("url") {
                    let mime_type = content.attrs.get("type");

                    // Extract media:title from children
                    let media_title = content.children.get("title")
                        .and_then(|titles| titles.first())
                        .and_then(|title_elem| title_elem.value.as_ref())
                        .map(|s| s.to_lowercase());

                    // Match quality based on MIME type, media:title, or URL pattern
                    let matches = match quality {
                        "original" => {
                            // Original: check media:title for "originale" or "original"
                            // OR check MIME type for uncompressed formats (WAV, AIFF, etc.)
                            // OR check URL pattern
                            media_title.as_ref().map_or(false, |t| t.contains("originale") || t.contains("original"))
                                || mime_type.map_or(false, |t| t.contains("wav") || t.contains("aiff"))
                                || url.contains("-original")
                        }
                        "flac" => {
                            // FLAC: check media:title for "brute" or MIME type for flac
                            media_title.as_ref().map_or(false, |t| t.contains("brute"))
                                || mime_type.map_or(false, |t| t.contains("flac"))
                                || url.contains("-raw")
                        }
                        "mp3" => {
                            // MP3: check media:title for "standard" or "optimisée" or MIME type for mpeg
                            media_title.as_ref().map_or(false, |t| t.contains("standard") || t.contains("optimis"))
                                || mime_type.map_or(false, |t| t.contains("mpeg") || t.contains("mp3"))
                                || url.contains("-std")
                        }
                        _ => false,
                    };

                    if matches {
                        tracing::debug!(
                            "Found media:content for quality '{}': url={}, type={:?}, title={:?}",
                            quality,
                            url,
                            mime_type,
                            media_title
                        );
                        return Some(Enclosure {
                            url: url.to_string(),
                            mime_type: mime_type.map(|t| t.to_string()),
                            length: content.attrs.get("fileSize")
                                .and_then(|l| l.parse().ok()),
                        });
                    }
                }
            }
        }
    }

    None
}

/// Extract all available media URLs from an item
pub fn extract_all_media_urls(item: &rss::Item) -> (Option<String>, Option<String>, Option<String>, Option<String>) {
    // Standard enclosure
    let standard_url = extract_enclosure(item).map(|e| e.url);

    // Media group qualities
    let original_url = extract_from_media_group(item, "original").map(|e| e.url);
    let flac_url = extract_from_media_group(item, "flac").map(|e| e.url);
    let mp3_url = extract_from_media_group(item, "mp3").map(|e| e.url);

    (standard_url, original_url, flac_url, mp3_url)
}

/// Extract image URL (try iTunes image, then media thumbnail)
fn extract_image_url(item: &rss::Item) -> Option<String> {
    // Try iTunes extension
    if let Some(itunes_ext) = item.itunes_ext() {
        if let Some(image) = itunes_ext.image() {
            return Some(image.to_string());
        }
    }

    // Try media extensions
    if let Some(media_ext) = item.extensions().get("media") {
        if let Some(thumbnails) = media_ext.get("thumbnail") {
            if let Some(thumbnail) = thumbnails.first() {
                if let Some(url) = thumbnail.attrs.get("url") {
                    return Some(url.to_string());
                }
            }
        }
    }

    None
}

/// Extract author (iTunes author)
fn extract_author(item: &rss::Item) -> Option<String> {
    item.itunes_ext()
        .and_then(|ext| ext.author())
        .map(|a| a.to_string())
        .or_else(|| item.author().map(|a| a.to_string()))
}

/// Extract duration (iTunes duration in seconds)
fn extract_duration(item: &rss::Item) -> Option<i32> {
    item.itunes_ext()
        .and_then(|ext| ext.duration())
        .and_then(|d| parse_duration(d))
}

/// Parse duration from iTunes format (can be seconds or HH:MM:SS)
fn parse_duration(duration_str: &str) -> Option<i32> {
    // Try parsing as pure seconds first
    if let Ok(seconds) = duration_str.parse::<i32>() {
        return Some(seconds);
    }

    // Try parsing as HH:MM:SS or MM:SS
    let parts: Vec<&str> = duration_str.split(':').collect();
    match parts.len() {
        3 => {
            // HH:MM:SS
            let hours: i32 = parts[0].parse().ok()?;
            let minutes: i32 = parts[1].parse().ok()?;
            let seconds: i32 = parts[2].parse().ok()?;
            Some(hours * 3600 + minutes * 60 + seconds)
        }
        2 => {
            // MM:SS
            let minutes: i32 = parts[0].parse().ok()?;
            let seconds: i32 = parts[1].parse().ok()?;
            Some(minutes * 60 + seconds)
        }
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_duration() {
        assert_eq!(parse_duration("1785"), Some(1785));
        assert_eq!(parse_duration("29:45"), Some(1785));
        assert_eq!(parse_duration("01:29:45"), Some(5385));
        assert_eq!(parse_duration("invalid"), None);
    }
}
