use chrono::{DateTime, Utc};
use std::path::PathBuf;

/// Sanitize a filename by removing/replacing invalid characters
pub fn sanitize_filename(name: &str) -> String {
    let invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];

    let sanitized: String = name
        .chars()
        .map(|c| if invalid_chars.contains(&c) { '_' } else { c })
        .collect();

    // Collapse multiple spaces
    let sanitized = sanitized
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");

    // Truncate to 200 chars
    sanitized.chars().take(200).collect()
}

/// Apply filename format with variables: {show}, {episode}, {date}
pub fn apply_filename_format(
    format: &str,
    subscription_name: &str,
    episode_title: &str,
    pub_date: Option<DateTime<Utc>>,
) -> String {
    let sanitized_show = sanitize_filename(subscription_name);
    let sanitized_episode = sanitize_filename(episode_title);
    let date_str = pub_date
        .map(|d| d.format("%Y-%m-%d").to_string())
        .unwrap_or_else(|| "unknown-date".to_string());

    format
        .replace("{show}", &sanitized_show)
        .replace("{episode}", &sanitized_episode)
        .replace("{date}", &date_str)
}

/// Build output path for an episode with custom filename format
/// Format can use: {show}, {episode}, {date}
/// Examples: "{show}-{episode}", "{episode}", "{date}_{episode}", etc.
pub fn build_output_path_with_format(
    base_directory: &str,
    subscription_name: &str,
    episode_title: &str,
    pub_date: Option<DateTime<Utc>>,
    audio_url: &str,
    filename_format: &str,
) -> PathBuf {
    let sanitized_sub_name = sanitize_filename(subscription_name);

    // Apply custom format
    let filename_base = apply_filename_format(
        filename_format,
        subscription_name,
        episode_title,
        pub_date,
    );

    let extension = extract_extension(audio_url).unwrap_or("mp3".to_string());
    let filename = format!("{}.{}", filename_base, extension);

    let mut path = PathBuf::from(base_directory);
    path.push(&sanitized_sub_name);
    path.push(&filename);

    // Handle duplicates
    if path.exists() {
        path = handle_duplicate(path);
    }

    path
}

/// Build output path for an episode (legacy, uses default format)
pub fn build_output_path(
    base_directory: &str,
    subscription_name: &str,
    episode_title: &str,
    pub_date: Option<DateTime<Utc>>,
    audio_url: &str,
) -> PathBuf {
    // Use default format: {show}-{episode}
    build_output_path_with_format(
        base_directory,
        subscription_name,
        episode_title,
        pub_date,
        audio_url,
        "{show}-{episode}",
    )
}

/// Extract file extension from URL or MIME type
pub fn extract_extension(url: &str) -> Option<String> {
    // Try to extract from URL
    if let Some(path) = url.split('?').next() {
        if let Some(ext) = path.rsplit('.').next() {
            if ext.len() <= 5 && ext.chars().all(|c| c.is_alphanumeric()) {
                return Some(ext.to_lowercase());
            }
        }
    }
    None
}

/// Get extension from MIME type
pub fn extension_from_mime(mime_type: &str) -> String {
    match mime_type {
        "audio/mpeg" => "mp3",
        "audio/mp4" => "m4a",
        "audio/ogg" => "ogg",
        "audio/wav" => "wav",
        "audio/flac" => "flac",
        "audio/aac" => "aac",
        _ => "mp3", // default
    }
    .to_string()
}

/// Handle duplicate filenames by appending a number
fn handle_duplicate(path: PathBuf) -> PathBuf {
    let parent = path.parent().unwrap();
    let stem = path.file_stem().unwrap().to_str().unwrap();
    let extension = path.extension().and_then(|e| e.to_str()).unwrap_or("");

    let mut counter = 2;
    loop {
        let new_filename = if extension.is_empty() {
            format!("{}_{}", stem, counter)
        } else {
            format!("{}_{}.{}", stem, counter, extension)
        };

        let new_path = parent.join(new_filename);
        if !new_path.exists() {
            return new_path;
        }
        counter += 1;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(
            sanitize_filename("Hello/World:Test"),
            "Hello_World_Test"
        );
        assert_eq!(
            sanitize_filename("Episode*1<New>"),
            "Episode_1_New_"
        );
    }

    #[test]
    fn test_extract_extension() {
        assert_eq!(
            extract_extension("https://example.com/audio.mp3?token=123"),
            Some("mp3".to_string())
        );
        assert_eq!(
            extract_extension("https://example.com/audio.m4a"),
            Some("m4a".to_string())
        );
    }

    #[test]
    fn test_extension_from_mime() {
        assert_eq!(extension_from_mime("audio/mpeg"), "mp3");
        assert_eq!(extension_from_mime("audio/mp4"), "m4a");
        assert_eq!(extension_from_mime("audio/unknown"), "mp3");
    }
}
