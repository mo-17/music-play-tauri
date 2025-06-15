use super::types::*;
use chrono::Utc;
use std::path::{Path, PathBuf};
use tokio::fs;
use uuid::Uuid;
use walkdir::WalkDir;

/// 视频文件扫描器
pub struct VideoScanner {
    config: VideoLibraryConfig,
}

impl VideoScanner {
    pub fn new(config: VideoLibraryConfig) -> Self {
        Self { config }
    }

    /// 扫描指定路径中的视频文件
    pub async fn scan_paths(
        &self,
        paths: &[PathBuf],
    ) -> Result<VideoScanResult, Box<dyn std::error::Error>> {
        let mut result = VideoScanResult::default();

        for path in paths {
            if !path.exists() {
                result
                    .errors
                    .push(format!("路径不存在: {}", path.display()));
                continue;
            }

            let scan_result = self.scan_directory(path).await?;
            result.total_files += scan_result.total_files;
            result.processed_files += scan_result.processed_files;
            result.failed_files += scan_result.failed_files;
            result.videos.extend(scan_result.videos);
            result.errors.extend(scan_result.errors);
        }

        Ok(result)
    }

    /// 扫描单个目录
    async fn scan_directory(
        &self,
        path: &Path,
    ) -> Result<VideoScanResult, Box<dyn std::error::Error>> {
        let mut result = VideoScanResult::default();

        for entry in WalkDir::new(path)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();

            if !path.is_file() {
                continue;
            }

            if let Some(extension) = path.extension() {
                let ext = extension.to_string_lossy().to_lowercase();
                let format = VideoFormat::from_extension(&ext);

                if self.is_supported_format(&format) {
                    result.total_files += 1;

                    match self.process_video_file(path).await {
                        Ok(video_file) => {
                            result.videos.push(video_file);
                            result.processed_files += 1;
                        }
                        Err(e) => {
                            result.failed_files += 1;
                            result
                                .errors
                                .push(format!("处理文件失败 {}: {}", path.display(), e));
                        }
                    }
                }
            }
        }

        Ok(result)
    }

    /// 处理单个视频文件
    async fn process_video_file(
        &self,
        path: &Path,
    ) -> Result<VideoFile, Box<dyn std::error::Error>> {
        let metadata = fs::metadata(path).await?;
        let file_size = metadata.len();

        // 检查文件大小限制
        if let Some(max_size) = self.config.max_file_size {
            if file_size > max_size {
                return Err(format!("文件过大: {} bytes", file_size).into());
            }
        }

        let extension = path
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();

        let format = VideoFormat::from_extension(&extension);
        let title = path
            .file_stem()
            .and_then(|name| name.to_str())
            .unwrap_or("Unknown")
            .to_string();

        let created_at = metadata
            .created()
            .map(|time| time.into())
            .unwrap_or_else(|_| Utc::now());

        let modified_at = metadata
            .modified()
            .map(|time| time.into())
            .unwrap_or_else(|_| Utc::now());

        // 创建基础视频文件信息
        let video_file = VideoFile {
            id: Uuid::new_v4().to_string(),
            title,
            file_path: path.to_path_buf(),
            duration: 0.0,                          // 将在元数据提取时填充
            resolution: VideoResolution::new(0, 0), // 将在元数据提取时填充
            format,
            codec: VideoCodec::Unknown("Unknown".to_string()), // 将在元数据提取时填充
            file_size,
            thumbnail_path: None,
            created_at,
            modified_at,
            bitrate: None,
            frame_rate: None,
        };

        Ok(video_file)
    }

    /// 检查是否为支持的格式
    fn is_supported_format(&self, format: &VideoFormat) -> bool {
        self.config.supported_formats.contains(format)
    }

    /// 获取所有支持的视频文件扩展名
    pub fn get_supported_extensions(&self) -> Vec<String> {
        let mut extensions = Vec::new();
        for format in &self.config.supported_formats {
            extensions.extend(format.extensions().iter().map(|ext| ext.to_string()));
        }
        extensions.sort();
        extensions.dedup();
        extensions
    }

    /// 检查文件是否为视频文件
    pub fn is_video_file(&self, path: &Path) -> bool {
        if let Some(extension) = path.extension() {
            let ext = extension.to_string_lossy().to_lowercase();
            let format = VideoFormat::from_extension(&ext);
            self.is_supported_format(&format)
        } else {
            false
        }
    }

    /// 获取视频文件的MIME类型
    pub fn get_mime_type(&self, path: &Path) -> Option<String> {
        if let Some(extension) = path.extension() {
            let ext = extension.to_string_lossy().to_lowercase();
            let format = VideoFormat::from_extension(&ext);
            if self.is_supported_format(&format) {
                Some(format.mime_type().to_string())
            } else {
                None
            }
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_supported_extensions() {
        let config = VideoLibraryConfig::default();
        let scanner = VideoScanner::new(config);
        let extensions = scanner.get_supported_extensions();

        assert!(extensions.contains(&"mp4".to_string()));
        assert!(extensions.contains(&"avi".to_string()));
        assert!(extensions.contains(&"mkv".to_string()));
    }

    #[test]
    fn test_is_video_file() {
        let config = VideoLibraryConfig::default();
        let scanner = VideoScanner::new(config);

        assert!(scanner.is_video_file(&PathBuf::from("test.mp4")));
        assert!(scanner.is_video_file(&PathBuf::from("test.avi")));
        assert!(!scanner.is_video_file(&PathBuf::from("test.txt")));
        assert!(!scanner.is_video_file(&PathBuf::from("test.mp3")));
    }

    #[test]
    fn test_get_mime_type() {
        let config = VideoLibraryConfig::default();
        let scanner = VideoScanner::new(config);

        assert_eq!(
            scanner.get_mime_type(&PathBuf::from("test.mp4")),
            Some("video/mp4".to_string())
        );
        assert_eq!(
            scanner.get_mime_type(&PathBuf::from("test.avi")),
            Some("video/x-msvideo".to_string())
        );
        assert_eq!(scanner.get_mime_type(&PathBuf::from("test.txt")), None);
    }
}
