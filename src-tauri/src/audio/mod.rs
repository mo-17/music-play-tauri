use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaybackState {
    pub is_playing: bool,
    pub current_track: Option<String>,
    pub position: f64,
    pub duration: f64,
    pub volume: f64,
}

impl Default for PlaybackState {
    fn default() -> Self {
        Self {
            is_playing: false,
            current_track: None,
            position: 0.0,
            duration: 0.0,
            volume: 1.0,
        }
    }
}

pub type AudioState = Arc<Mutex<PlaybackState>>;

#[tauri::command]
pub async fn play_audio(file_path: String, state: State<'_, AudioState>) -> Result<(), String> {
    let mut playback_state = state.lock().map_err(|e| e.to_string())?;
    
    // 更新播放状态
    playback_state.current_track = Some(file_path.clone());
    playback_state.is_playing = true;
    playback_state.position = 0.0;
    
    // 尝试获取音频文件的时长（这里使用默认值，实际时长由前端HTML5 Audio提供）
    playback_state.duration = 0.0; // 将由前端更新

    println!("Playing: {}", file_path);
    Ok(())
}

#[tauri::command]
pub async fn pause_audio(state: State<'_, AudioState>) -> Result<(), String> {
    let mut playback_state = state.lock().map_err(|e| e.to_string())?;
    playback_state.is_playing = false;
    println!("Audio paused");
    Ok(())
}

#[tauri::command]
pub async fn resume_audio(state: State<'_, AudioState>) -> Result<(), String> {
    let mut playback_state = state.lock().map_err(|e| e.to_string())?;
    playback_state.is_playing = true;
    println!("Audio resumed");
    Ok(())
}

#[tauri::command]
pub async fn stop_audio(state: State<'_, AudioState>) -> Result<(), String> {
    let mut playback_state = state.lock().map_err(|e| e.to_string())?;
    playback_state.is_playing = false;
    playback_state.current_track = None;
    playback_state.position = 0.0;
    playback_state.duration = 0.0;
    println!("Audio stopped");
    Ok(())
}

#[tauri::command]
pub async fn get_playback_state(state: State<'_, AudioState>) -> Result<PlaybackState, String> {
    let playback_state = state.lock().map_err(|e| e.to_string())?;
    Ok(playback_state.clone())
}

#[tauri::command]
pub async fn set_volume(volume: f64, state: State<'_, AudioState>) -> Result<(), String> {
    let mut playback_state = state.lock().map_err(|e| e.to_string())?;
    playback_state.volume = volume.clamp(0.0, 1.0);
    println!("Volume set to: {}", playback_state.volume);
    Ok(())
}

#[tauri::command]
pub async fn seek_to(position: f64, state: State<'_, AudioState>) -> Result<(), String> {
    let mut playback_state = state.lock().map_err(|e| e.to_string())?;
    playback_state.position = position.max(0.0);
    // 不打印太多日志，避免刷屏
    // println!("Seeking to: {}", playback_state.position);
    Ok(())
}

#[tauri::command]
pub async fn update_duration(duration: f64, state: State<'_, AudioState>) -> Result<(), String> {
    let mut playback_state = state.lock().map_err(|e| e.to_string())?;
    playback_state.duration = duration;
    println!("Duration updated to: {}", duration);
    Ok(())
}