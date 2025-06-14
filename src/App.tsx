import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import Sidebar from './components/Sidebar';
import MainPlayback from './components/MainPlayback';
import { LibraryView } from './components/LibraryView';
import PlaylistView from './components/PlaylistView';
import { PlaybackControls } from './components/PlaybackControls';
import { AudioTest } from './components/AudioTest';
import { ProgressBarDemo } from './components/ProgressBarDemo';
import { SettingsView } from './components/SettingsView';
import { MobileNav } from './components/MobileNav';
import { PageTransition } from './components/AnimatedComponents';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { usePlaybackMode } from './hooks/usePlaybackMode';
import './App.css';

interface Track {
  title: string;
  artist: string;
  album: string;
  duration: number;
  file_path: string;
}

interface PlaybackState {
  is_playing: boolean;
  current_track: string | null;
  position: number;
  duration: number;
  volume: number;
}

// 动画路由组件
const AnimatedRoutes: React.FC<{
  currentTrack?: Track;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  onPlayResume: () => void;
  onPause: () => void;
  onPlaylistUpdate: (tracks: Track[]) => void;
}> = ({ currentTrack, isPlaying, onTrackSelect, onPlayResume, onPause, onPlaylistUpdate }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <MainPlayback />
          </PageTransition>
        } />
        <Route path="/library" element={
          <PageTransition>
            <LibraryView 
              onTrackSelect={onTrackSelect}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayResume={onPlayResume}
              onPause={onPause}
              onPlaylistUpdate={onPlaylistUpdate}
            />
          </PageTransition>
        } />
        <Route path="/playlists" element={
          <PageTransition>
            <PlaylistView 
              onTrackSelect={onTrackSelect}
              onPlaylistUpdate={onPlaylistUpdate}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />
          </PageTransition>
        } />
        <Route path="/test" element={
          <PageTransition>
            <AudioTest />
          </PageTransition>
        } />
        <Route path="/progress-bar-demo" element={
          <PageTransition>
            <ProgressBarDemo />
          </PageTransition>
        } />
        <Route path="/settings" element={
          <PageTransition>
            <SettingsView />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
};

// 主应用内容组件
const AppContent: React.FC = () => {
  const { actualTheme } = useTheme();
  
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    is_playing: false,
    current_track: null,
    position: 0,
    duration: 0,
    volume: 1.0
  });
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [shouldResume, setShouldResume] = useState(false);
  const [shouldPause, setShouldPause] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 播放模式管理
  const {
    playbackMode,
    playbackModeInfo,
    togglePlaybackMode,
    getNextTrack,
    shouldAutoPlay
  } = usePlaybackMode(playlist);

  // 处理侧边栏切换
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 关闭侧边栏（点击遮罩层时）
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // 处理曲目选择
  const handleTrackSelect = (track: Track) => {
    console.log('App: Track selected:', track.title);
    setCurrentTrack(track);
  };

  // 处理播放列表更新
  const handlePlaylistUpdate = (tracks: Track[]) => {
    console.log('App: Playlist updated with', tracks.length, 'tracks');
    setPlaylist(tracks);
  };

  // 处理播放状态更新（从PlaybackControls传递上来）
  const handlePlaybackStateChange = (state: PlaybackState) => {
    setPlaybackState(state);
  };

  // 处理恢复播放请求（从LibraryView传递上来）
  const handlePlayResume = () => {
    console.log('App: Play resume requested');
    setShouldResume(true);
  };

  // 处理暂停播放请求（从LibraryView传递上来）
  const handlePause = () => {
    console.log('App: Pause requested');
    setShouldPause(true);
  };

  // 处理上一首/下一首
  const handleTrackChange = (direction: 'next' | 'prev') => {
    console.log('App: Track change requested:', direction);
    console.log('App: Current track:', currentTrack?.title);
    console.log('App: Playlist length:', playlist.length);
    console.log('App: Playback mode:', playbackMode);
    
    if (playlist.length === 0) {
      console.log('App: Empty playlist, cannot change track');
      return;
    }

    // 使用播放模式管理器获取下一首歌曲
    const newTrack = getNextTrack(currentTrack, playlist, direction);
    
    if (newTrack) {
      console.log('App: Switching to track:', newTrack.title);
      setCurrentTrack(newTrack);
      // 自动播放新曲目
      invoke('play_audio', { filePath: newTrack.file_path }).catch(console.error);
    } else {
      console.log('App: No next track available in current playback mode');
    }
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-200 ${
      actualTheme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Mobile Navigation */}
      <MobileNav 
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className={`hidden md:block w-64 border-r transition-colors duration-200 ${
          actualTheme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={closeSidebar}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`md:hidden fixed left-0 top-0 bottom-0 w-64 z-50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          actualTheme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        } border-r`}>
          <div className="pt-16"> {/* 为移动端导航栏留出空间 */}
            <Sidebar />
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top content area */}
          <div className="flex-1 overflow-auto">
                         <AnimatedRoutes 
               currentTrack={currentTrack || undefined}
               isPlaying={playbackState.is_playing}
               onTrackSelect={handleTrackSelect}
               onPlayResume={handlePlayResume}
               onPause={handlePause}
               onPlaylistUpdate={handlePlaylistUpdate}
             />
          </div>
        </div>
      </div>
      
      {/* Bottom player controls */}
      <PlaybackControls 
        currentTrack={currentTrack || undefined}
        playlist={playlist}
        onTrackChange={handleTrackChange}
        onPlaybackStateChange={handlePlaybackStateChange}
        shouldResume={shouldResume}
        onResumeComplete={() => setShouldResume(false)}
        shouldPause={shouldPause}
        onPauseComplete={() => setShouldPause(false)}
        playbackModeInfo={playbackModeInfo}
        onTogglePlaybackMode={togglePlaybackMode}
      />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
