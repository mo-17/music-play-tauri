use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Track {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration: f64,
    pub file_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub description: String,
    pub tracks: Vec<Track>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaylistManager {
    pub playlists: HashMap<String, Playlist>,
}

impl PlaylistManager {
    pub fn new() -> Self {
        Self {
            playlists: HashMap::new(),
        }
    }

    pub fn add_playlist(&mut self, playlist: Playlist) {
        self.playlists.insert(playlist.id.clone(), playlist);
    }

    pub fn remove_playlist(&mut self, id: &str) -> Option<Playlist> {
        self.playlists.remove(id)
    }

    pub fn get_playlist(&self, id: &str) -> Option<&Playlist> {
        self.playlists.get(id)
    }

    pub fn get_all_playlists(&self) -> Vec<&Playlist> {
        self.playlists.values().collect()
    }

    pub fn update_playlist(&mut self, id: &str, updated_playlist: Playlist) -> Result<(), String> {
        if self.playlists.contains_key(id) {
            self.playlists.insert(id.to_string(), updated_playlist);
            Ok(())
        } else {
            Err("Playlist not found".to_string())
        }
    }
}

// Tauri commands
#[tauri::command]
pub async fn create_playlist(
    app: AppHandle,
    name: String,
    description: Option<String>,
) -> Result<Playlist, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let playlist = Playlist {
        id: id.clone(),
        name,
        description: description.unwrap_or_default(),
        tracks: Vec::new(),
        created_at: now.clone(),
        updated_at: now,
    };

    // Save to file (you might want to implement persistent storage)
    save_playlist_to_file(&app, &playlist).await?;

    Ok(playlist)
}

#[tauri::command]
pub async fn get_playlists(app: AppHandle) -> Result<Vec<Playlist>, String> {
    load_playlists_from_file(&app).await
}

#[tauri::command]
pub async fn delete_playlist(app: AppHandle, id: String) -> Result<(), String> {
    let mut playlists = load_playlists_from_file(&app).await?;
    playlists.retain(|p| p.id != id);
    save_playlists_to_file(&app, &playlists).await?;
    Ok(())
}

#[tauri::command]
pub async fn add_track_to_playlist(
    app: AppHandle,
    playlist_id: String,
    track: Track,
) -> Result<(), String> {
    let mut playlists = load_playlists_from_file(&app).await?;

    if let Some(playlist) = playlists.iter_mut().find(|p| p.id == playlist_id) {
        playlist.tracks.push(track);
        playlist.updated_at = chrono::Utc::now().to_rfc3339();
        save_playlists_to_file(&app, &playlists).await?;
        Ok(())
    } else {
        Err("Playlist not found".to_string())
    }
}

#[tauri::command]
pub async fn remove_track_from_playlist(
    app: AppHandle,
    playlist_id: String,
    track_index: usize,
) -> Result<(), String> {
    let mut playlists = load_playlists_from_file(&app).await?;

    if let Some(playlist) = playlists.iter_mut().find(|p| p.id == playlist_id) {
        if track_index < playlist.tracks.len() {
            playlist.tracks.remove(track_index);
            playlist.updated_at = chrono::Utc::now().to_rfc3339();
            save_playlists_to_file(&app, &playlists).await?;
            Ok(())
        } else {
            Err("Track index out of bounds".to_string())
        }
    } else {
        Err("Playlist not found".to_string())
    }
}

#[tauri::command]
pub async fn update_playlist_info(
    app: AppHandle,
    id: String,
    name: Option<String>,
    description: Option<String>,
) -> Result<(), String> {
    let mut playlists = load_playlists_from_file(&app).await?;

    if let Some(playlist) = playlists.iter_mut().find(|p| p.id == id) {
        if let Some(new_name) = name {
            playlist.name = new_name;
        }
        if let Some(new_description) = description {
            playlist.description = new_description;
        }
        playlist.updated_at = chrono::Utc::now().to_rfc3339();
        save_playlists_to_file(&app, &playlists).await?;
        Ok(())
    } else {
        Err("Playlist not found".to_string())
    }
}

// Helper functions for file operations
async fn get_playlists_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Create directory if it doesn't exist
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }

    Ok(app_data_dir.join("playlists.json"))
}

async fn load_playlists_from_file(app: &AppHandle) -> Result<Vec<Playlist>, String> {
    let file_path = get_playlists_file_path(app).await?;

    if !file_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read playlists file: {}", e))?;

    let playlists: Vec<Playlist> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse playlists file: {}", e))?;

    Ok(playlists)
}

async fn save_playlists_to_file(app: &AppHandle, playlists: &[Playlist]) -> Result<(), String> {
    let file_path = get_playlists_file_path(app).await?;

    let content = serde_json::to_string_pretty(playlists)
        .map_err(|e| format!("Failed to serialize playlists: {}", e))?;

    fs::write(&file_path, content).map_err(|e| format!("Failed to write playlists file: {}", e))?;

    Ok(())
}

async fn save_playlist_to_file(app: &AppHandle, playlist: &Playlist) -> Result<(), String> {
    let mut playlists = load_playlists_from_file(app).await?;
    playlists.push(playlist.clone());
    save_playlists_to_file(app, &playlists).await
}
