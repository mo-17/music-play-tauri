use super::processor::VideoProcessor;
use super::types::*;
use std::path::PathBuf;
use std::fs;
use tauri::{command, AppHandle, Manager};
use serde::{Deserialize, Serialize};

/// 视频库数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoLibrary {
    pub videos: Vec<VideoFile>,
    pub last_scanned_paths: Vec<String>,
    pub last_updated: String,
}

impl VideoLibrary {
    pub fn new() -> Self {
        Self {
            videos: Vec::new(),
            last_scanned_paths: Vec::new(),
            last_updated: chrono::Utc::now().to_rfc3339(),
        }
    }
}

/// 扫描视频文件
#[command]
pub async fn scan_video_files(paths: Vec<String>) -> Result<VideoScanResult, String> {
    let config = VideoLibraryConfig::default();
    let processor =
        VideoProcessor::new(config).map_err(|e| format!("创建视频处理器失败: {}", e))?;

    let scan_paths: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();

    processor
        .scan_and_process(&scan_paths)
        .await
        .map_err(|e| format!("扫描视频文件失败: {}", e))
}

/// 获取视频元数据
#[command]
pub async fn get_video_metadata(file_path: String) -> Result<VideoFile, String> {
    let config = VideoLibraryConfig::default();
    let processor =
        VideoProcessor::new(config).map_err(|e| format!("创建视频处理器失败: {}", e))?;

    let path = PathBuf::from(file_path);

    // 创建基础视频文件信息
    let mut video_file = VideoFile {
        id: uuid::Uuid::new_v4().to_string(),
        title: path
            .file_stem()
            .and_then(|name| name.to_str())
            .unwrap_or("Unknown")
            .to_string(),
        file_path: path.clone(),
        duration: 0.0,
        resolution: VideoResolution::new(0, 0),
        format: VideoFormat::from_extension(
            path.extension().and_then(|ext| ext.to_str()).unwrap_or(""),
        ),
        codec: VideoCodec::Unknown("Unknown".to_string()),
        file_size: 0,
        thumbnail_path: None,
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
        bitrate: None,
        frame_rate: None,
    };

    // 提取元数据
    processor
        .refresh_metadata(&mut video_file)
        .await
        .map_err(|e| format!("提取视频元数据失败: {}", e))?;

    Ok(video_file)
}

/// 验证视频文件
#[command]
pub fn validate_video_file(file_path: String) -> Result<bool, String> {
    let config = VideoLibraryConfig::default();
    let processor =
        VideoProcessor::new(config).map_err(|e| format!("创建视频处理器失败: {}", e))?;

    let path = PathBuf::from(file_path);
    Ok(processor.validate_video(&path))
}

/// 获取支持的视频格式
#[command]
pub fn get_supported_video_formats() -> Result<Vec<String>, String> {
    let config = VideoLibraryConfig::default();
    let processor =
        VideoProcessor::new(config).map_err(|e| format!("创建视频处理器失败: {}", e))?;

    Ok(processor.get_supported_extensions())
}

/// 生成视频缩略图
#[command]
pub async fn generate_video_thumbnail(
    file_path: String,
    output_path: String,
    width: u32,
    height: u32,
    timestamp: Option<f64>,
) -> Result<(), String> {
    use super::metadata::VideoMetadataExtractor;

    VideoMetadataExtractor::init().map_err(|e| format!("初始化FFmpeg失败: {}", e))?;

    let input_path = PathBuf::from(file_path);
    let output_path = PathBuf::from(output_path);

    VideoMetadataExtractor::generate_thumbnail(
        &input_path,
        &output_path,
        (width, height),
        timestamp,
    )
    .map_err(|e| format!("生成缩略图失败: {}", e))
}

// 获取视频库文件路径
fn get_video_library_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // 创建目录如果不存在
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }

    Ok(app_data_dir.join("video_library.json"))
}

// 保存视频库到文件
fn save_video_library_to_file(app: &AppHandle, library: &VideoLibrary) -> Result<(), String> {
    let file_path = get_video_library_file_path(app)?;

    let content = serde_json::to_string_pretty(library)
        .map_err(|e| format!("Failed to serialize video library: {}", e))?;

    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write video library file: {}", e))?;

    Ok(())
}

// 从文件加载视频库
fn load_video_library_from_file(app: &AppHandle) -> Result<VideoLibrary, String> {
    let file_path = get_video_library_file_path(app)?;

    if !file_path.exists() {
        return Ok(VideoLibrary::new());
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read video library file: {}", e))?;

    let library: VideoLibrary = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse video library file: {}", e))?;

    Ok(library)
}

/// 获取保存的视频库
#[command]
pub async fn get_saved_video_library(app: AppHandle) -> Result<VideoLibrary, String> {
    load_video_library_from_file(&app)
}

/// 保存视频库
#[command]
pub async fn save_video_library(
    app: AppHandle,
    videos: Vec<VideoFile>,
    scanned_paths: Vec<String>,
) -> Result<(), String> {
    let library = VideoLibrary {
        videos,
        last_scanned_paths: scanned_paths,
        last_updated: chrono::Utc::now().to_rfc3339(),
    };

    save_video_library_to_file(&app, &library)
}

/// 清除视频库
#[command]
pub async fn clear_video_library(app: AppHandle) -> Result<(), String> {
    let file_path = get_video_library_file_path(&app)?;

    if file_path.exists() {
        fs::remove_file(&file_path)
            .map_err(|e| format!("Failed to remove video library file: {}", e))?;
    }

    Ok(())
}
