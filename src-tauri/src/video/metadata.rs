use super::types::*;
use ffmpeg_next as ffmpeg;
use std::path::Path;

/// 视频元数据提取器
pub struct VideoMetadataExtractor;

impl VideoMetadataExtractor {
    /// 初始化FFmpeg
    pub fn init() -> Result<(), ffmpeg::Error> {
        ffmpeg::init()
    }

    /// 提取视频文件的元数据
    pub fn extract_metadata(path: &Path) -> Result<VideoMetadata, Box<dyn std::error::Error>> {
        let input = ffmpeg::format::input(path)?;

        let mut video_metadata = VideoMetadata::default();
        video_metadata.duration = input.duration() as f64 / ffmpeg::ffi::AV_TIME_BASE as f64;

        // 查找视频流
        if let Some(video_stream) = input.streams().best(ffmpeg::media::Type::Video) {
            let video_context =
                ffmpeg::codec::context::Context::from_parameters(video_stream.parameters())?;
            let video_decoder = video_context.decoder().video()?;

            // 提取分辨率
            video_metadata.resolution =
                VideoResolution::new(video_decoder.width(), video_decoder.height());

            // 提取编码信息
            video_metadata.codec = VideoCodec::from_string(video_decoder.codec().unwrap().name());

            // 提取帧率
            let frame_rate = video_stream.rate();
            if frame_rate.numerator() > 0 && frame_rate.denominator() > 0 {
                video_metadata.frame_rate =
                    Some(frame_rate.numerator() as f64 / frame_rate.denominator() as f64);
            }

            // 提取比特率
            if video_decoder.bit_rate() > 0 {
                video_metadata.bitrate = Some(video_decoder.bit_rate() as u64);
            }
        }

        // 查找音频流信息
        if let Some(audio_stream) = input.streams().best(ffmpeg::media::Type::Audio) {
            let audio_context =
                ffmpeg::codec::context::Context::from_parameters(audio_stream.parameters())?;
            let audio_decoder = audio_context.decoder().audio()?;

            video_metadata.has_audio = true;
            video_metadata.audio_codec = Some(audio_decoder.codec().unwrap().name().to_string());

            if audio_decoder.bit_rate() > 0 {
                video_metadata.audio_bitrate = Some(audio_decoder.bit_rate() as u64);
            }
        }

        Ok(video_metadata)
    }

    /// 生成视频缩略图
    pub fn generate_thumbnail(
        path: &Path,
        output_path: &Path,
        size: (u32, u32),
        timestamp: Option<f64>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut input = ffmpeg::format::input(path)?;

        let video_stream_index = input
            .streams()
            .best(ffmpeg::media::Type::Video)
            .ok_or("没有找到视频流")?
            .index();

        let video_stream = input.stream(video_stream_index).unwrap();
        let video_context =
            ffmpeg::codec::context::Context::from_parameters(video_stream.parameters())?;
        let mut video_decoder = video_context.decoder().video()?;

        // 设置跳转时间戳（默认为视频长度的10%）
        let seek_timestamp = timestamp.unwrap_or_else(|| {
            let duration = input.duration() as f64 / ffmpeg::ffi::AV_TIME_BASE as f64;
            duration * 0.1 // 10%位置
        });

        // 跳转到指定时间戳
        let seek_ts = (seek_timestamp * ffmpeg::ffi::AV_TIME_BASE as f64) as i64;
        input.seek(seek_ts, ..seek_ts)?;

        let mut scaler = ffmpeg::software::scaling::context::Context::get(
            video_decoder.format(),
            video_decoder.width(),
            video_decoder.height(),
            ffmpeg::format::Pixel::RGB24,
            size.0,
            size.1,
            ffmpeg::software::scaling::flag::Flags::BILINEAR,
        )?;

        let mut frame = ffmpeg::frame::Video::empty();
        let mut rgb_frame = ffmpeg::frame::Video::empty();

        // 读取数据包直到找到视频帧
        for (stream, packet) in input.packets() {
            if stream.index() == video_stream_index {
                video_decoder.send_packet(&packet)?;

                while video_decoder.receive_frame(&mut frame).is_ok() {
                    scaler.run(&frame, &mut rgb_frame)?;

                    // 将RGB帧保存为图片
                    Self::save_rgb_frame_as_image(&rgb_frame, output_path, size)?;
                    return Ok(());
                }
            }
        }

        Err("无法生成缩略图".into())
    }

    /// 将RGB帧保存为图片文件
    fn save_rgb_frame_as_image(
        frame: &ffmpeg::frame::Video,
        output_path: &Path,
        size: (u32, u32),
    ) -> Result<(), Box<dyn std::error::Error>> {
        use image::{ImageBuffer, Rgb};

        let data = frame.data(0);
        let linesize = frame.stride(0);

        let mut img_buffer = ImageBuffer::new(size.0, size.1);

        for y in 0..size.1 {
            for x in 0..size.0 {
                let offset = (y * linesize as u32 + x * 3) as usize;
                if offset + 2 < data.len() {
                    let pixel = Rgb([data[offset], data[offset + 1], data[offset + 2]]);
                    img_buffer.put_pixel(x, y, pixel);
                }
            }
        }

        img_buffer.save(output_path)?;
        Ok(())
    }

    /// 检查视频文件是否有效
    pub fn is_valid_video(path: &Path) -> bool {
        match ffmpeg::format::input(path) {
            Ok(input) => input
                .streams()
                .any(|stream| stream.parameters().medium() == ffmpeg::media::Type::Video),
            Err(_) => false,
        }
    }

    /// 获取视频文件的详细信息
    pub fn get_video_info(path: &Path) -> Result<VideoInfo, Box<dyn std::error::Error>> {
        let input = ffmpeg::format::input(path)?;

        let mut info = VideoInfo {
            format_name: input.format().name().to_string(),
            format_long_name: input.format().description().to_string(),
            duration: input.duration() as f64 / ffmpeg::ffi::AV_TIME_BASE as f64,
            bitrate: input.bit_rate() as u64,
            streams: Vec::new(),
        };

        // 收集所有流信息
        for stream in input.streams() {
            let stream_info = StreamInfo {
                index: stream.index(),
                codec_type: match stream.parameters().medium() {
                    ffmpeg::media::Type::Video => "video".to_string(),
                    ffmpeg::media::Type::Audio => "audio".to_string(),
                    ffmpeg::media::Type::Subtitle => "subtitle".to_string(),
                    _ => "unknown".to_string(),
                },
                codec_name: stream.parameters().id().name().to_string(),
                duration: stream.duration() as f64 * stream.time_base().numerator() as f64
                    / stream.time_base().denominator() as f64,
            };
            info.streams.push(stream_info);
        }

        Ok(info)
    }
}

/// 视频元数据结构
#[derive(Debug, Clone)]
pub struct VideoMetadata {
    pub duration: f64,
    pub resolution: VideoResolution,
    pub codec: VideoCodec,
    pub frame_rate: Option<f64>,
    pub bitrate: Option<u64>,
    pub has_audio: bool,
    pub audio_codec: Option<String>,
    pub audio_bitrate: Option<u64>,
}

impl Default for VideoMetadata {
    fn default() -> Self {
        Self {
            duration: 0.0,
            resolution: VideoResolution::new(0, 0),
            codec: VideoCodec::Unknown("Unknown".to_string()),
            frame_rate: None,
            bitrate: None,
            has_audio: false,
            audio_codec: None,
            audio_bitrate: None,
        }
    }
}

/// 视频详细信息
#[derive(Debug, Clone)]
pub struct VideoInfo {
    pub format_name: String,
    pub format_long_name: String,
    pub duration: f64,
    pub bitrate: u64,
    pub streams: Vec<StreamInfo>,
}

/// 流信息
#[derive(Debug, Clone)]
pub struct StreamInfo {
    pub index: usize,
    pub codec_type: String,
    pub codec_name: String,
    pub duration: f64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_ffmpeg_init() {
        assert!(VideoMetadataExtractor::init().is_ok());
    }

    // 注意：这些测试需要实际的视频文件才能运行
    #[ignore]
    #[test]
    fn test_extract_metadata() {
        VideoMetadataExtractor::init().unwrap();
        let test_video = PathBuf::from("test_video.mp4");

        if test_video.exists() {
            let metadata = VideoMetadataExtractor::extract_metadata(&test_video);
            assert!(metadata.is_ok());
        }
    }

    #[ignore]
    #[test]
    fn test_generate_thumbnail() {
        VideoMetadataExtractor::init().unwrap();
        let test_video = PathBuf::from("test_video.mp4");
        let output_path = PathBuf::from("thumbnail.jpg");

        if test_video.exists() {
            let result = VideoMetadataExtractor::generate_thumbnail(
                &test_video,
                &output_path,
                (320, 180),
                None,
            );
            assert!(result.is_ok());
        }
    }
}
