mod audio;
mod library;
mod playlist;
mod video;

use audio::{AudioState, PlaybackState};
use std::sync::{Arc, Mutex};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let audio_state: AudioState = Arc::new(Mutex::new(PlaybackState::default()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .manage(audio_state)
        .invoke_handler(tauri::generate_handler![
            greet,
            library::scan_music_files,
            library::get_metadata_for_files,
            library::get_saved_library,
            library::save_library,
            library::clear_library,
            audio::play_audio,
            audio::pause_audio,
            audio::resume_audio,
            audio::stop_audio,
            audio::get_playback_state,
            audio::set_volume,
            audio::seek_to,
            audio::update_duration,
            playlist::create_playlist,
            playlist::get_playlists,
            playlist::delete_playlist,
            playlist::add_track_to_playlist,
            playlist::remove_track_from_playlist,
            playlist::update_playlist_info,
            video::scan_video_files,
            video::get_video_metadata,
            video::validate_video_file,
            video::get_supported_video_formats,
            video::generate_video_thumbnail,
            video::test_thumbnail_generation,
            video::get_saved_video_library,
            video::save_video_library,
            video::clear_video_library
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
