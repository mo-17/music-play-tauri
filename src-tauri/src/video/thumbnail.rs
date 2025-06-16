use super::types::*;
use ffmpeg_next as ffmpeg;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, Once};
use thiserror::Error;
use tokio::task;

/// 缩略图生成错误类型
#[derive(Error, Debug)]
pub enum ThumbnailError {
    #[error("FFmpeg初始化失败: {0}")]
    FFmpegInit(#[from] ffmpeg::Error),

    #[error("文件不存在或无法访问: {0}")]
    FileAccess(String),

    #[error("没有找到视频流")]
    NoVideoStream,

    #[error("视频解码失败: {0}")]
    DecodingError(String),

    #[error("图像保存失败: {0}")]
    ImageSaveError(#[from] image::ImageError),

    #[error("内存访问错误: {0}")]
    MemoryError(String),

    #[error("IO错误: {0}")]
    IoError(#[from] std::io::Error),

    #[error("任务被取消")]
    TaskCancelled,

    #[error("超时")]
    Timeout,
}

/// 缩略图生成配置
#[derive(Debug, Clone)]
pub struct ThumbnailConfig {
    pub size: (u32, u32),
    pub quality: u8,
    pub timestamp_percent: f64, // 视频的百分比位置 (0.0-1.0)
    pub timeout_seconds: u64,
    pub max_retries: u32,
    pub fallback_enabled: bool,
}

impl Default for ThumbnailConfig {
    fn default() -> Self {
        Self {
            size: (320, 180),
            quality: 85,
            timestamp_percent: 0.1, // 10%位置
            timeout_seconds: 30,
            max_retries: 3,
            fallback_enabled: true,
        }
    }
}

/// 缩略图生成策略
#[derive(Debug, Clone)]
pub enum ThumbnailStrategy {
    FFmpeg,
    SystemApi,
    Fallback,
}

/// 异步缩略图生成器
pub struct AsyncThumbnailGenerator {
    config: ThumbnailConfig,
    strategy: ThumbnailStrategy,
    ffmpeg_initialized: Arc<Mutex<bool>>,
}

static FFMPEG_INIT: Once = Once::new();
static mut FFMPEG_INIT_RESULT: Result<(), ffmpeg::Error> = Ok(());

impl AsyncThumbnailGenerator {
    /// 创建新的缩略图生成器
    pub fn new(config: ThumbnailConfig) -> Self {
        Self {
            config,
            strategy: ThumbnailStrategy::FFmpeg,
            ffmpeg_initialized: Arc::new(Mutex::new(false)),
        }
    }

    /// 安全初始化FFmpeg（只初始化一次）
    fn init_ffmpeg() -> Result<(), ThumbnailError> {
        unsafe {
            FFMPEG_INIT.call_once(|| {
                FFMPEG_INIT_RESULT = ffmpeg::init();
            });
            FFMPEG_INIT_RESULT.map_err(ThumbnailError::FFmpegInit)
        }
    }

    /// 异步生成缩略图
    pub async fn generate_thumbnail(
        &self,
        input_path: &Path,
        output_path: &Path,
    ) -> Result<PathBuf, ThumbnailError> {
        // 检查输入文件
        if !input_path.exists() {
            return Err(ThumbnailError::FileAccess(format!(
                "文件不存在: {}",
                input_path.display()
            )));
        }

        // 创建输出目录
        if let Some(parent) = output_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        // 带超时的生成任务
        let config = self.config.clone();
        let input_path = input_path.to_path_buf();
        let output_path = output_path.to_path_buf();

        let result = tokio::time::timeout(
            std::time::Duration::from_secs(config.timeout_seconds),
            self.generate_with_retry(input_path, output_path, config),
        )
        .await;

        match result {
            Ok(Ok(path)) => Ok(path),
            Ok(Err(e)) => Err(e),
            Err(_) => Err(ThumbnailError::Timeout),
        }
    }

    /// 带重试机制的生成
    async fn generate_with_retry(
        &self,
        input_path: PathBuf,
        output_path: PathBuf,
        config: ThumbnailConfig,
    ) -> Result<PathBuf, ThumbnailError> {
        let mut last_error = None;

        for attempt in 0..=config.max_retries {
            match self.try_generate(&input_path, &output_path, &config).await {
                Ok(path) => return Ok(path),
                Err(e) => {
                    last_error = Some(e);
                    if attempt < config.max_retries {
                        // 等待一段时间后重试
                        tokio::time::sleep(std::time::Duration::from_millis(
                            1000 * (attempt + 1) as u64,
                        ))
                        .await;
                    }
                }
            }
        }

        // 如果启用了降级处理，尝试其他策略
        if config.fallback_enabled {
            if let Ok(path) = self.generate_fallback_thumbnail(&output_path).await {
                return Ok(path);
            }
        }

        Err(last_error.unwrap_or(ThumbnailError::TaskCancelled))
    }

    /// 尝试生成缩略图
    async fn try_generate(
        &self,
        input_path: &Path,
        output_path: &Path,
        config: &ThumbnailConfig,
    ) -> Result<PathBuf, ThumbnailError> {
        match self.strategy {
            ThumbnailStrategy::FFmpeg => {
                self.generate_with_ffmpeg(input_path, output_path, config)
                    .await
            }
            ThumbnailStrategy::SystemApi => {
                self.generate_with_system_api(input_path, output_path, config)
                    .await
            }
            ThumbnailStrategy::Fallback => self.generate_fallback_thumbnail(output_path).await,
        }
    }

    /// 使用FFmpeg生成缩略图
    async fn generate_with_ffmpeg(
        &self,
        input_path: &Path,
        output_path: &Path,
        config: &ThumbnailConfig,
    ) -> Result<PathBuf, ThumbnailError> {
        let input_path = input_path.to_path_buf();
        let output_path = output_path.to_path_buf();
        let config = config.clone();

        // 在独立的线程中运行FFmpeg操作
        let result = task::spawn_blocking(move || {
            Self::ffmpeg_generate_sync(&input_path, &output_path, &config)
        })
        .await;

        match result {
            Ok(Ok(path)) => Ok(path),
            Ok(Err(e)) => Err(e),
            Err(_) => Err(ThumbnailError::TaskCancelled),
        }
    }

    /// 同步FFmpeg缩略图生成（在独立线程中运行）
    fn ffmpeg_generate_sync(
        input_path: &Path,
        output_path: &Path,
        config: &ThumbnailConfig,
    ) -> Result<PathBuf, ThumbnailError> {
        // 安全初始化FFmpeg
        Self::init_ffmpeg()?;

        // 使用panic捕获来防止崩溃
        let result = std::panic::catch_unwind(|| {
            Self::ffmpeg_generate_internal(input_path, output_path, config)
        });

        match result {
            Ok(Ok(path)) => Ok(path),
            Ok(Err(e)) => Err(e),
            Err(_) => Err(ThumbnailError::DecodingError(
                "FFmpeg操作发生panic".to_string(),
            )),
        }
    }

    /// 内部FFmpeg生成逻辑
    fn ffmpeg_generate_internal(
        input_path: &Path,
        output_path: &Path,
        config: &ThumbnailConfig,
    ) -> Result<PathBuf, ThumbnailError> {
        let mut input = ffmpeg::format::input(input_path)
            .map_err(|e| ThumbnailError::DecodingError(format!("打开输入文件失败: {}", e)))?;

        let video_stream_index = input
            .streams()
            .best(ffmpeg::media::Type::Video)
            .ok_or(ThumbnailError::NoVideoStream)?
            .index();

        let video_stream = input.stream(video_stream_index).unwrap();
        let video_context = ffmpeg::codec::context::Context::from_parameters(
            video_stream.parameters(),
        )
        .map_err(|e| ThumbnailError::DecodingError(format!("创建解码器上下文失败: {}", e)))?;
        let mut video_decoder = video_context
            .decoder()
            .video()
            .map_err(|e| ThumbnailError::DecodingError(format!("创建视频解码器失败: {}", e)))?;

        // 计算跳转时间戳
        let duration = input.duration() as f64 / ffmpeg::ffi::AV_TIME_BASE as f64;
        let seek_timestamp = duration * config.timestamp_percent;
        let seek_ts = (seek_timestamp * ffmpeg::ffi::AV_TIME_BASE as f64) as i64;

        // 跳转到指定位置
        if seek_ts > 0 {
            input
                .seek(seek_ts, ..seek_ts)
                .map_err(|e| ThumbnailError::DecodingError(format!("跳转失败: {}", e)))?;
        }

        // 创建缩放器
        let mut scaler = ffmpeg::software::scaling::context::Context::get(
            video_decoder.format(),
            video_decoder.width(),
            video_decoder.height(),
            ffmpeg::format::Pixel::RGB24,
            config.size.0,
            config.size.1,
            ffmpeg::software::scaling::flag::Flags::BILINEAR,
        )
        .map_err(|e| ThumbnailError::DecodingError(format!("创建缩放器失败: {}", e)))?;

        let mut frame = ffmpeg::frame::Video::empty();
        let mut rgb_frame = ffmpeg::frame::Video::empty();

        // 读取并解码帧
        for (stream, packet) in input.packets() {
            if stream.index() == video_stream_index {
                video_decoder
                    .send_packet(&packet)
                    .map_err(|e| ThumbnailError::DecodingError(format!("发送数据包失败: {}", e)))?;

                while video_decoder.receive_frame(&mut frame).is_ok() {
                    scaler
                        .run(&frame, &mut rgb_frame)
                        .map_err(|e| ThumbnailError::DecodingError(format!("缩放失败: {}", e)))?;

                    // 安全地保存RGB帧
                    Self::save_rgb_frame_safely(&rgb_frame, output_path, config.size)?;
                    return Ok(output_path.to_path_buf());
                }
            }
        }

        Err(ThumbnailError::DecodingError(
            "无法找到有效的视频帧".to_string(),
        ))
    }

    /// 安全地保存RGB帧为图片
    fn save_rgb_frame_safely(
        frame: &ffmpeg::frame::Video,
        output_path: &Path,
        size: (u32, u32),
    ) -> Result<(), ThumbnailError> {
        use image::{ImageBuffer, Rgb};

        let data = frame.data(0);
        let linesize = frame.stride(0) as usize;

        // 验证数据完整性
        let expected_size = size.1 as usize * linesize;
        if data.len() < expected_size {
            return Err(ThumbnailError::MemoryError(format!(
                "数据大小不足: {} < {}",
                data.len(),
                expected_size
            )));
        }

        let mut img_buffer = ImageBuffer::new(size.0, size.1);

        for y in 0..size.1 {
            for x in 0..size.0 {
                let offset = (y as usize * linesize) + (x as usize * 3);

                // 安全的边界检查
                if offset + 2 < data.len() {
                    let pixel = Rgb([data[offset], data[offset + 1], data[offset + 2]]);
                    img_buffer.put_pixel(x, y, pixel);
                } else {
                    // 使用黑色像素作为默认值
                    img_buffer.put_pixel(x, y, Rgb([0, 0, 0]));
                }
            }
        }

        img_buffer.save(output_path)?;
        Ok(())
    }

    /// 使用系统API生成缩略图（macOS/Windows）
    async fn generate_with_system_api(
        &self,
        _input_path: &Path,
        _output_path: &Path,
        _config: &ThumbnailConfig,
    ) -> Result<PathBuf, ThumbnailError> {
        // TODO: 实现系统API缩略图生成
        // macOS: AVAssetImageGenerator
        // Windows: Windows.Media.Editing
        Err(ThumbnailError::DecodingError(
            "系统API缩略图生成尚未实现".to_string(),
        ))
    }

    /// 生成降级缩略图（纯色占位符）
    pub async fn generate_fallback_thumbnail(
        &self,
        output_path: &Path,
    ) -> Result<PathBuf, ThumbnailError> {
        use image::{ImageBuffer, Rgb};

        let size = self.config.size;
        let mut img_buffer = ImageBuffer::new(size.0, size.1);

        // 创建渐变背景
        for y in 0..size.1 {
            for x in 0..size.0 {
                let r = (x * 255 / size.0) as u8;
                let g = (y * 255 / size.1) as u8;
                let b = 128;
                img_buffer.put_pixel(x, y, Rgb([r, g, b]));
            }
        }

        img_buffer.save(output_path)?;
        Ok(output_path.to_path_buf())
    }

    /// 批量生成缩略图
    pub async fn generate_batch(
        &self,
        tasks: Vec<(PathBuf, PathBuf)>,
    ) -> Vec<Result<PathBuf, ThumbnailError>> {
        let mut results = Vec::new();

        // 并发生成（限制并发数量）
        let semaphore = Arc::new(tokio::sync::Semaphore::new(4)); // 最多4个并发任务
        let mut handles = Vec::new();

        for (input_path, output_path) in tasks {
            let generator = self.clone();
            let permit = semaphore.clone();

            let handle = tokio::spawn(async move {
                let _permit = permit.acquire().await.unwrap();
                generator
                    .generate_thumbnail(&input_path, &output_path)
                    .await
            });

            handles.push(handle);
        }

        // 等待所有任务完成
        for handle in handles {
            match handle.await {
                Ok(result) => results.push(result),
                Err(_) => results.push(Err(ThumbnailError::TaskCancelled)),
            }
        }

        results
    }

    /// 设置生成策略
    pub fn set_strategy(&mut self, strategy: ThumbnailStrategy) {
        self.strategy = strategy;
    }

    /// 获取当前配置
    pub fn config(&self) -> &ThumbnailConfig {
        &self.config
    }
}

impl Clone for AsyncThumbnailGenerator {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
            strategy: self.strategy.clone(),
            ffmpeg_initialized: Arc::clone(&self.ffmpeg_initialized),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[tokio::test]
    async fn test_fallback_thumbnail() {
        let config = ThumbnailConfig::default();
        let generator = AsyncThumbnailGenerator::new(config);

        let output_path = PathBuf::from("test_fallback.jpg");
        let result = generator.generate_fallback_thumbnail(&output_path).await;

        assert!(result.is_ok());

        // 清理测试文件
        if output_path.exists() {
            std::fs::remove_file(output_path).ok();
        }
    }

    #[test]
    fn test_ffmpeg_init() {
        let result = AsyncThumbnailGenerator::init_ffmpeg();
        assert!(result.is_ok());
    }
}
