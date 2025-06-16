use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 视频文件信息结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFile {
    pub id: String,
    pub title: String,
    pub file_path: PathBuf,
    pub duration: f64,
    pub resolution: VideoResolution,
    pub format: VideoFormat,
    pub codec: VideoCodec,
    pub file_size: u64,
    pub thumbnail_path: Option<PathBuf>,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub bitrate: Option<u64>,
    pub frame_rate: Option<f64>,
}

/// 视频分辨率
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoResolution {
    pub width: u32,
    pub height: u32,
}

impl VideoResolution {
    pub fn new(width: u32, height: u32) -> Self {
        Self { width, height }
    }

    /// 获取分辨率标签 (如 "1080p", "720p")
    pub fn label(&self) -> String {
        match self.height {
            2160 => "4K".to_string(),
            1440 => "1440p".to_string(),
            1080 => "1080p".to_string(),
            720 => "720p".to_string(),
            480 => "480p".to_string(),
            360 => "360p".to_string(),
            _ => format!("{}x{}", self.width, self.height),
        }
    }

    /// 计算宽高比
    pub fn aspect_ratio(&self) -> f64 {
        self.width as f64 / self.height as f64
    }
}

/// 支持的视频格式
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum VideoFormat {
    MP4,
    AVI,
    MKV,
    MOV,
    WMV,
    FLV,
    WEBM,
    M4V,
    Unknown(String),
}

impl VideoFormat {
    pub fn from_extension(ext: &str) -> Self {
        match ext.to_lowercase().as_str() {
            "mp4" => VideoFormat::MP4,
            "avi" => VideoFormat::AVI,
            "mkv" => VideoFormat::MKV,
            "mov" => VideoFormat::MOV,
            "wmv" => VideoFormat::WMV,
            "flv" => VideoFormat::FLV,
            "webm" => VideoFormat::WEBM,
            "m4v" => VideoFormat::M4V,
            _ => VideoFormat::Unknown(ext.to_string()),
        }
    }

    pub fn extensions(&self) -> Vec<&'static str> {
        match self {
            VideoFormat::MP4 => vec!["mp4"],
            VideoFormat::AVI => vec!["avi"],
            VideoFormat::MKV => vec!["mkv"],
            VideoFormat::MOV => vec!["mov"],
            VideoFormat::WMV => vec!["wmv"],
            VideoFormat::FLV => vec!["flv"],
            VideoFormat::WEBM => vec!["webm"],
            VideoFormat::M4V => vec!["m4v"],
            VideoFormat::Unknown(_) => vec![],
        }
    }

    pub fn mime_type(&self) -> &'static str {
        match self {
            VideoFormat::MP4 => "video/mp4",
            VideoFormat::AVI => "video/x-msvideo",
            VideoFormat::MKV => "video/x-matroska",
            VideoFormat::MOV => "video/quicktime",
            VideoFormat::WMV => "video/x-ms-wmv",
            VideoFormat::FLV => "video/x-flv",
            VideoFormat::WEBM => "video/webm",
            VideoFormat::M4V => "video/x-m4v",
            VideoFormat::Unknown(_) => "video/unknown",
        }
    }
}

/// 视频编码格式
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum VideoCodec {
    H264,
    H265,
    VP8,
    VP9,
    AV1,
    XVID,
    Unknown(String),
}

impl VideoCodec {
    pub fn from_string(codec: &str) -> Self {
        match codec.to_lowercase().as_str() {
            "h264" | "avc" | "avc1" => VideoCodec::H264,
            "h265" | "hevc" | "hev1" => VideoCodec::H265,
            "vp8" => VideoCodec::VP8,
            "vp9" => VideoCodec::VP9,
            "av1" | "av01" => VideoCodec::AV1,
            "xvid" => VideoCodec::XVID,
            _ => VideoCodec::Unknown(codec.to_string()),
        }
    }

    pub fn display_name(&self) -> &str {
        match self {
            VideoCodec::H264 => "H.264",
            VideoCodec::H265 => "H.265/HEVC",
            VideoCodec::VP8 => "VP8",
            VideoCodec::VP9 => "VP9",
            VideoCodec::AV1 => "AV1",
            VideoCodec::XVID => "XVID",
            VideoCodec::Unknown(name) => name,
        }
    }
}

/// 视频播放状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoPlaybackState {
    pub media_type: MediaType,
    pub is_playing: bool,
    pub current_media: Option<String>,
    pub position: f64,
    pub duration: f64,
    pub volume: f64,
    pub playback_rate: f64,
    pub is_fullscreen: bool,
    pub is_muted: bool,
}

impl Default for VideoPlaybackState {
    fn default() -> Self {
        Self {
            media_type: MediaType::Audio,
            is_playing: false,
            current_media: None,
            position: 0.0,
            duration: 0.0,
            volume: 1.0,
            playback_rate: 1.0,
            is_fullscreen: false,
            is_muted: false,
        }
    }
}

/// 媒体类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MediaType {
    Audio,
    Video,
}

/// 视频库配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoLibraryConfig {
    pub scan_paths: Vec<PathBuf>,
    pub supported_formats: Vec<VideoFormat>,
    pub generate_thumbnails: bool,
    pub thumbnail_size: (u32, u32),
    pub max_file_size: Option<u64>, // 最大文件大小限制 (字节)
}

impl Default for VideoLibraryConfig {
    fn default() -> Self {
        Self {
            scan_paths: vec![],
            supported_formats: vec![
                VideoFormat::MP4,
                VideoFormat::AVI,
                VideoFormat::MKV,
                VideoFormat::MOV,
                VideoFormat::WMV,
                VideoFormat::FLV,
                VideoFormat::WEBM,
                VideoFormat::M4V,
            ],
            generate_thumbnails: false, // 暂时禁用缩略图生成以避免崩溃
            thumbnail_size: (320, 180), // 16:9 比例
            max_file_size: Some(10 * 1024 * 1024 * 1024), // 10GB
        }
    }
}

/// 视频扫描结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoScanResult {
    pub total_files: usize,
    pub processed_files: usize,
    pub failed_files: usize,
    pub videos: Vec<VideoFile>,
    pub errors: Vec<String>,
}

impl Default for VideoScanResult {
    fn default() -> Self {
        Self {
            total_files: 0,
            processed_files: 0,
            failed_files: 0,
            videos: vec![],
            errors: vec![],
        }
    }
}

/// 视频过滤器
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFilter {
    pub format: Option<VideoFormat>,
    pub min_duration: Option<f64>,
    pub max_duration: Option<f64>,
    pub min_resolution: Option<VideoResolution>,
    pub max_resolution: Option<VideoResolution>,
    pub search_query: Option<String>,
}

impl Default for VideoFilter {
    fn default() -> Self {
        Self {
            format: None,
            min_duration: None,
            max_duration: None,
            min_resolution: None,
            max_resolution: None,
            search_query: None,
        }
    }
}

/// 视频排序选项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoSortBy {
    Title,
    Duration,
    FileSize,
    CreatedAt,
    ModifiedAt,
    Resolution,
}

/// 排序方向
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SortDirection {
    Ascending,
    Descending,
}
