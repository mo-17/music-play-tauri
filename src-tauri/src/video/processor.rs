use super::metadata::{VideoMetadata, VideoMetadataExtractor};
use super::scanner::VideoScanner;
use super::thumbnail::{AsyncThumbnailGenerator, ThumbnailConfig, ThumbnailError};
use super::types::*;
use std::path::{Path, PathBuf};
use std::sync::Once;
use tokio::fs;

// 确保FFmpeg只初始化一次
static FFMPEG_INIT: Once = Once::new();

/// 视频处理器 - 整合扫描和元数据提取功能
pub struct VideoProcessor {
    scanner: VideoScanner,
    config: VideoLibraryConfig,
    thumbnail_generator: AsyncThumbnailGenerator,
}

impl VideoProcessor {
    /// 创建新的视频处理器
    pub fn new(config: VideoLibraryConfig) -> Result<Self, Box<dyn std::error::Error>> {
        // 确保FFmpeg只初始化一次
        let mut init_error = None;
        FFMPEG_INIT.call_once(|| {
            if let Err(e) = VideoMetadataExtractor::init() {
                init_error = Some(e);
            }
        });

        // 检查初始化是否失败
        if let Some(error) = init_error {
            return Err(Box::new(error));
        }

        let scanner = VideoScanner::new(config.clone());

        // 创建缩略图生成器
        let thumbnail_config = ThumbnailConfig {
            size: config.thumbnail_size,
            quality: 85,
            timestamp_percent: 0.1,
            timeout_seconds: 30,
            max_retries: 3,
            fallback_enabled: true,
        };
        let thumbnail_generator = AsyncThumbnailGenerator::new(thumbnail_config);

        Ok(Self {
            scanner,
            config,
            thumbnail_generator,
        })
    }

    /// 扫描并处理视频文件
    pub async fn scan_and_process(
        &self,
        paths: &[PathBuf],
    ) -> Result<VideoScanResult, Box<dyn std::error::Error>> {
        let mut scan_result = self.scanner.scan_paths(paths).await?;

        // 为每个扫描到的视频文件提取元数据
        let mut processed_videos = Vec::new();

        for mut video_file in scan_result.videos {
            match self.process_video_metadata(&mut video_file).await {
                Ok(_) => {
                    processed_videos.push(video_file);
                }
                Err(e) => {
                    scan_result.failed_files += 1;
                    scan_result.processed_files -= 1;
                    scan_result.errors.push(format!(
                        "元数据提取失败 {}: {}",
                        video_file.file_path.display(),
                        e
                    ));
                }
            }
        }

        scan_result.videos = processed_videos;
        Ok(scan_result)
    }

    /// 处理单个视频文件的元数据
    async fn process_video_metadata(
        &self,
        video_file: &mut VideoFile,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // 提取视频元数据
        let metadata = VideoMetadataExtractor::extract_metadata(&video_file.file_path)?;

        // 更新视频文件信息
        video_file.duration = metadata.duration;
        video_file.resolution = metadata.resolution;
        video_file.codec = metadata.codec;
        video_file.frame_rate = metadata.frame_rate;
        video_file.bitrate = metadata.bitrate;

        // 生成缩略图（如果配置启用）
        if self.config.generate_thumbnails {
            if let Ok(thumbnail_path) = self.generate_thumbnail(video_file).await {
                video_file.thumbnail_path = Some(thumbnail_path);
            }
        }

        Ok(())
    }

    /// 生成视频缩略图
    async fn generate_thumbnail(
        &self,
        video_file: &VideoFile,
    ) -> Result<PathBuf, Box<dyn std::error::Error>> {
        // 创建缩略图目录
        let thumbnails_dir = PathBuf::from("thumbnails");
        if !thumbnails_dir.exists() {
            fs::create_dir_all(&thumbnails_dir).await?;
        }

        // 生成缩略图文件名
        let thumbnail_filename = format!("{}.jpg", video_file.id);
        let thumbnail_path = thumbnails_dir.join(thumbnail_filename);

        // 使用新的异步缩略图生成器
        match self
            .thumbnail_generator
            .generate_thumbnail(&video_file.file_path, &thumbnail_path)
            .await
        {
            Ok(path) => Ok(path),
            Err(ThumbnailError::Timeout) => {
                // 超时时生成降级缩略图
                self.thumbnail_generator
                    .generate_fallback_thumbnail(&thumbnail_path)
                    .await
                    .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)
            }
            Err(e) => {
                // 其他错误时也尝试降级处理
                if self.thumbnail_generator.config().fallback_enabled {
                    self.thumbnail_generator
                        .generate_fallback_thumbnail(&thumbnail_path)
                        .await
                        .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)
                } else {
                    Err(Box::new(e) as Box<dyn std::error::Error>)
                }
            }
        }
    }

    /// 验证视频文件
    pub fn validate_video(&self, path: &Path) -> bool {
        self.scanner.is_video_file(path) && VideoMetadataExtractor::is_valid_video(path)
    }

    /// 获取支持的文件扩展名
    pub fn get_supported_extensions(&self) -> Vec<String> {
        self.scanner.get_supported_extensions()
    }

    /// 获取视频文件的MIME类型
    pub fn get_mime_type(&self, path: &Path) -> Option<String> {
        self.scanner.get_mime_type(path)
    }

    /// 重新生成缩略图
    pub async fn regenerate_thumbnail(
        &self,
        video_file: &mut VideoFile,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if let Ok(thumbnail_path) = self.generate_thumbnail(video_file).await {
            video_file.thumbnail_path = Some(thumbnail_path);
        }
        Ok(())
    }

    /// 批量重新生成缩略图
    pub async fn regenerate_thumbnails(
        &self,
        video_files: &mut [VideoFile],
    ) -> Result<usize, Box<dyn std::error::Error>> {
        let mut success_count = 0;

        for video_file in video_files.iter_mut() {
            if self.regenerate_thumbnail(video_file).await.is_ok() {
                success_count += 1;
            }
        }

        Ok(success_count)
    }

    /// 更新视频文件的元数据
    pub async fn refresh_metadata(
        &self,
        video_file: &mut VideoFile,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // 检查文件是否仍然存在
        if !video_file.file_path.exists() {
            return Err("视频文件不存在".into());
        }

        // 重新提取元数据
        self.process_video_metadata(video_file).await?;

        // 更新文件修改时间
        let metadata = fs::metadata(&video_file.file_path).await?;
        video_file.modified_at = metadata
            .modified()
            .map(|time| time.into())
            .unwrap_or_else(|_| chrono::Utc::now());

        Ok(())
    }

    /// 批量刷新元数据
    pub async fn refresh_all_metadata(
        &self,
        video_files: &mut [VideoFile],
    ) -> Result<usize, Box<dyn std::error::Error>> {
        let mut success_count = 0;

        for video_file in video_files.iter_mut() {
            if self.refresh_metadata(video_file).await.is_ok() {
                success_count += 1;
            }
        }

        Ok(success_count)
    }

    /// 过滤视频文件
    pub fn filter_videos(&self, videos: &[VideoFile], filter: &VideoFilter) -> Vec<VideoFile> {
        videos
            .iter()
            .filter(|video| self.matches_filter(video, filter))
            .cloned()
            .collect()
    }

    /// 检查视频是否匹配过滤条件
    fn matches_filter(&self, video: &VideoFile, filter: &VideoFilter) -> bool {
        // 格式过滤
        if let Some(ref format) = filter.format {
            if video.format != *format {
                return false;
            }
        }

        // 时长过滤
        if let Some(min_duration) = filter.min_duration {
            if video.duration < min_duration {
                return false;
            }
        }
        if let Some(max_duration) = filter.max_duration {
            if video.duration > max_duration {
                return false;
            }
        }

        // 分辨率过滤
        if let Some(ref min_res) = filter.min_resolution {
            if video.resolution.width < min_res.width || video.resolution.height < min_res.height {
                return false;
            }
        }
        if let Some(ref max_res) = filter.max_resolution {
            if video.resolution.width > max_res.width || video.resolution.height > max_res.height {
                return false;
            }
        }

        // 搜索查询过滤
        if let Some(ref query) = filter.search_query {
            let query_lower = query.to_lowercase();
            if !video.title.to_lowercase().contains(&query_lower)
                && !video
                    .file_path
                    .to_string_lossy()
                    .to_lowercase()
                    .contains(&query_lower)
            {
                return false;
            }
        }

        true
    }

    /// 排序视频文件
    pub fn sort_videos(
        &self,
        videos: &mut [VideoFile],
        sort_by: VideoSortBy,
        direction: SortDirection,
    ) {
        videos.sort_by(|a, b| {
            let comparison = match sort_by {
                VideoSortBy::Title => a.title.cmp(&b.title),
                VideoSortBy::Duration => a
                    .duration
                    .partial_cmp(&b.duration)
                    .unwrap_or(std::cmp::Ordering::Equal),
                VideoSortBy::FileSize => a.file_size.cmp(&b.file_size),
                VideoSortBy::CreatedAt => a.created_at.cmp(&b.created_at),
                VideoSortBy::ModifiedAt => a.modified_at.cmp(&b.modified_at),
                VideoSortBy::Resolution => {
                    let a_pixels = a.resolution.width * a.resolution.height;
                    let b_pixels = b.resolution.width * b.resolution.height;
                    a_pixels.cmp(&b_pixels)
                }
            };

            match direction {
                SortDirection::Ascending => comparison,
                SortDirection::Descending => comparison.reverse(),
            }
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_video_processor_creation() {
        let config = VideoLibraryConfig::default();
        let processor = VideoProcessor::new(config);
        assert!(processor.is_ok());
    }

    #[test]
    fn test_filter_videos() {
        let config = VideoLibraryConfig::default();
        let processor = VideoProcessor::new(config).unwrap();

        let videos = vec![
            VideoFile {
                id: "1".to_string(),
                title: "Test Video 1".to_string(),
                file_path: PathBuf::from("test1.mp4"),
                duration: 120.0,
                resolution: VideoResolution::new(1920, 1080),
                format: VideoFormat::MP4,
                codec: VideoCodec::H264,
                file_size: 1000000,
                thumbnail_path: None,
                created_at: chrono::Utc::now(),
                modified_at: chrono::Utc::now(),
                bitrate: Some(5000000),
                frame_rate: Some(30.0),
            },
            VideoFile {
                id: "2".to_string(),
                title: "Test Video 2".to_string(),
                file_path: PathBuf::from("test2.avi"),
                duration: 60.0,
                resolution: VideoResolution::new(1280, 720),
                format: VideoFormat::AVI,
                codec: VideoCodec::H264,
                file_size: 500000,
                thumbnail_path: None,
                created_at: chrono::Utc::now(),
                modified_at: chrono::Utc::now(),
                bitrate: Some(2500000),
                frame_rate: Some(24.0),
            },
        ];

        // 测试格式过滤
        let mut filter = VideoFilter::default();
        filter.format = Some(VideoFormat::MP4);
        let filtered = processor.filter_videos(&videos, &filter);
        assert_eq!(filtered.len(), 1);
        assert_eq!(filtered[0].format, VideoFormat::MP4);

        // 测试时长过滤
        let mut filter = VideoFilter::default();
        filter.min_duration = Some(100.0);
        let filtered = processor.filter_videos(&videos, &filter);
        assert_eq!(filtered.len(), 1);
        assert!(filtered[0].duration >= 100.0);
    }

    #[test]
    fn test_sort_videos() {
        let config = VideoLibraryConfig::default();
        let processor = VideoProcessor::new(config).unwrap();

        let mut videos = vec![
            VideoFile {
                id: "1".to_string(),
                title: "B Video".to_string(),
                file_path: PathBuf::from("b.mp4"),
                duration: 120.0,
                resolution: VideoResolution::new(1920, 1080),
                format: VideoFormat::MP4,
                codec: VideoCodec::H264,
                file_size: 1000000,
                thumbnail_path: None,
                created_at: chrono::Utc::now(),
                modified_at: chrono::Utc::now(),
                bitrate: Some(5000000),
                frame_rate: Some(30.0),
            },
            VideoFile {
                id: "2".to_string(),
                title: "A Video".to_string(),
                file_path: PathBuf::from("a.mp4"),
                duration: 60.0,
                resolution: VideoResolution::new(1280, 720),
                format: VideoFormat::MP4,
                codec: VideoCodec::H264,
                file_size: 500000,
                thumbnail_path: None,
                created_at: chrono::Utc::now(),
                modified_at: chrono::Utc::now(),
                bitrate: Some(2500000),
                frame_rate: Some(24.0),
            },
        ];

        // 测试按标题升序排序
        processor.sort_videos(&mut videos, VideoSortBy::Title, SortDirection::Ascending);
        assert_eq!(videos[0].title, "A Video");
        assert_eq!(videos[1].title, "B Video");

        // 测试按时长降序排序
        processor.sort_videos(
            &mut videos,
            VideoSortBy::Duration,
            SortDirection::Descending,
        );
        assert!(videos[0].duration > videos[1].duration);
    }
}
