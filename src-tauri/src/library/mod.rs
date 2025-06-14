use futures::future::{BoxFuture, FutureExt};
use lofty::prelude::*;
use lofty::probe::Probe;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use tokio_stream::{wrappers::ReadDirStream, StreamExt};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Track {
    pub path: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub genre: Option<String>,
    pub year: Option<u32>,
    pub duration: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryTrack {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration: f64,
    pub file_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicLibrary {
    pub tracks: Vec<LibraryTrack>,
    pub last_scanned_paths: Vec<String>,
    pub last_updated: String,
}

impl MusicLibrary {
    pub fn new() -> Self {
        Self {
            tracks: Vec::new(),
            last_scanned_paths: Vec::new(),
            last_updated: chrono::Utc::now().to_rfc3339(),
        }
    }
}

#[tauri::command]
pub async fn scan_music_files(path: String) -> Result<Vec<PathBuf>, String> {
    scan_directory_recursive(path).await
}

#[tauri::command]
pub async fn get_metadata_for_files(files: Vec<String>) -> Result<Vec<Track>, String> {
    let mut tracks = Vec::new();
    let mut errors = Vec::new();

    for path_str in files {
        match extract_metadata(&path_str).await {
            Ok(track) => tracks.push(track),
            Err(e) => {
                eprintln!("Error processing file {}: {}", path_str, e);
                errors.push(format!("{}: {}", path_str, e));
                // 创建一个基本的Track条目，即使元数据提取失败
                tracks.push(Track {
                    path: path_str.clone(),
                    title: Some(
                        Path::new(&path_str)
                            .file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or("Unknown")
                            .to_string(),
                    ),
                    artist: Some("Unknown Artist".to_string()),
                    album: Some("Unknown Album".to_string()),
                    genre: Some("Unknown".to_string()),
                    year: None,
                    duration: 0,
                });
            }
        }
    }

    // 如果有错误但仍有成功的文件，返回成功的结果
    if !tracks.is_empty() {
        if !errors.is_empty() {
            eprintln!("Some files had errors but continuing: {:?}", errors);
        }
        Ok(tracks)
    } else {
        Err(format!("All files failed to process: {:?}", errors))
    }
}

async fn extract_metadata(path_str: &str) -> Result<Track, String> {
    let path = PathBuf::from(path_str);

    let tagged_file = Probe::open(&path)
        .map_err(|e| format!("Failed to open file: {}", e))?
        .read()
        .map_err(|e| format!("Failed to read metadata: {}", e))?;

    let properties = tagged_file.properties();
    let duration = properties.duration().as_secs();

    let tag = tagged_file.primary_tag();
    let (title, artist, album, genre, year) = if let Some(t) = tag {
        (
            t.title().map(|s| s.to_string()),
            t.artist().map(|s| s.to_string()),
            t.album().map(|s| s.to_string()),
            t.get_string(&ItemKey::Genre).map(|s| s.to_string()),
            t.year(),
        )
    } else {
        (None, None, None, None, None)
    };

    Ok(Track {
        path: path_str.to_string(),
        title,
        artist,
        album,
        genre,
        year,
        duration,
    })
}

fn scan_directory_recursive(path: String) -> BoxFuture<'static, Result<Vec<PathBuf>, String>> {
    async move {
        let mut files = Vec::new();
        let read_dir = tokio::fs::read_dir(path).await.map_err(|e| e.to_string())?;
        let mut stream = ReadDirStream::new(read_dir);

        while let Some(entry) = stream.next().await {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();

            if path.is_dir() {
                if let Ok(mut sub_files) =
                    scan_directory_recursive(path.to_str().unwrap().to_string()).await
                {
                    files.append(&mut sub_files);
                }
            } else if is_audio_file(&path) {
                files.push(path);
            }
        }
        Ok(files)
    }
    .boxed()
}

fn is_audio_file(path: &Path) -> bool {
    const AUDIO_EXTENSIONS: &[&str] = &[
        "mp3", "flac", "wav", "aac", "ogg", "m4a", "wma", "opus", "ape", "alac", "aiff", "au",
        "ra", "3gp", "amr", "ac3", "dts", "mka", "mpc", "tta", "wv", "webm",
    ];
    path.extension()
        .and_then(|s| s.to_str())
        .map(|s| AUDIO_EXTENSIONS.contains(&s.to_lowercase().as_str()))
        .unwrap_or(false)
}

// 获取音乐库文件路径
fn get_library_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // 创建目录如果不存在
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }

    Ok(app_data_dir.join("music_library.json"))
}

// 保存音乐库到文件
fn save_library_to_file(app: &AppHandle, library: &MusicLibrary) -> Result<(), String> {
    let file_path = get_library_file_path(app)?;

    let content = serde_json::to_string_pretty(library)
        .map_err(|e| format!("Failed to serialize library: {}", e))?;

    fs::write(&file_path, content).map_err(|e| format!("Failed to write library file: {}", e))?;

    Ok(())
}

// 从文件加载音乐库
fn load_library_from_file(app: &AppHandle) -> Result<MusicLibrary, String> {
    let file_path = get_library_file_path(app)?;

    if !file_path.exists() {
        return Ok(MusicLibrary::new());
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read library file: {}", e))?;

    let library: MusicLibrary = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse library file: {}", e))?;

    Ok(library)
}

// 新增：获取保存的音乐库
#[tauri::command]
pub async fn get_saved_library(app: AppHandle) -> Result<MusicLibrary, String> {
    load_library_from_file(&app)
}

// 新增：保存音乐库
#[tauri::command]
pub async fn save_library(
    app: AppHandle,
    tracks: Vec<LibraryTrack>,
    scanned_paths: Vec<String>,
) -> Result<(), String> {
    let library = MusicLibrary {
        tracks,
        last_scanned_paths: scanned_paths,
        last_updated: chrono::Utc::now().to_rfc3339(),
    };

    save_library_to_file(&app, &library)
}

// 新增：清除音乐库
#[tauri::command]
pub async fn clear_library(app: AppHandle) -> Result<(), String> {
    let file_path = get_library_file_path(&app)?;

    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| format!("Failed to remove library file: {}", e))?;
    }

    Ok(())
}
