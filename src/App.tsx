import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { MediaTypeProvider, useMediaType } from './contexts/MediaTypeContext';
import { VideoPlaylistProvider } from './contexts/VideoPlaylistContext';
import { usePlaybackMode } from './hooks/usePlaybackMode';
import { MediaType } from './types/media';
import Sidebar from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { LibraryView } from './components/LibraryView';
import PlaylistView from './components/PlaylistView';
import { PlaybackControls } from './components/PlaybackControls';
import { VideoLibraryView } from './components/VideoLibraryView';
import VideoPlaylistView from './components/VideoPlaylistView';
import { VideoPlaybackView } from './components/VideoPlaybackView';
import { AudioTest } from './components/AudioTest';
import { ProgressBarDemo } from './components/progress-bars';
import { SettingsView } from './components/SettingsView';
import { VideoFile, VideoPlaylist } from './types/video';
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

// 页面过渡动画组件
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      {children}
    </motion.div>
  );
};

// 路由动画组件
const AnimatedRoutes: React.FC<{
  currentTrack?: Track;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  onPlayResume: () => void;
  onPause: () => void;
  onPlaylistUpdate: (tracks: Track[]) => void;
  currentVideo?: VideoFile;
  videoPlaylist: VideoFile[];
  currentVideoPlaylist?: VideoPlaylist;
  onVideoSelect: (video: VideoFile) => void;
  onVideoPlaylistUpdate: (videos: VideoFile[]) => void;
  onCurrentVideoPlaylistUpdate: (playlist: VideoPlaylist | undefined) => void;
}> = ({ 
  currentTrack, 
  isPlaying, 
  onTrackSelect, 
  onPlayResume, 
  onPause, 
  onPlaylistUpdate,
  currentVideo,
  videoPlaylist,
  currentVideoPlaylist,
  onVideoSelect,
  onVideoPlaylistUpdate,
  onCurrentVideoPlaylistUpdate
}) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
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
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlaylistUpdate={onPlaylistUpdate}
            />
          </PageTransition>
        } />
        <Route path="/video-playlists" element={
          <PageTransition>
            <VideoPlaylistView 
              onVideoSelect={onVideoSelect}
              currentVideo={currentVideo || undefined}
              isPlaying={isPlaying}
              onPlayResume={onPlayResume}
              onPause={onPause}
              onPlaylistUpdate={onVideoPlaylistUpdate}
              onCurrentVideoPlaylistUpdate={onCurrentVideoPlaylistUpdate}
            />
          </PageTransition>
        } />
        <Route path="/videos" element={
          <PageTransition>
            <VideoLibraryView 
              onVideoSelect={onVideoSelect}
              currentVideo={currentVideo || undefined}
              isPlaying={isPlaying}
              onPlayResume={onPlayResume}
              onPause={onPause}
              onPlaylistUpdate={onVideoPlaylistUpdate}
              onCurrentVideoPlaylistUpdate={onCurrentVideoPlaylistUpdate}
            />
          </PageTransition>
        } />
        <Route path="/video-playback" element={
          <PageTransition>
            <VideoPlaybackView 
              currentVideo={currentVideo}
              playlist={currentVideoPlaylist ? currentVideoPlaylist.items.map(item => item.video) : videoPlaylist}
              playlistName={currentVideoPlaylist?.name}
              onVideoSelect={onVideoSelect}
              onBack={() => window.history.back()}
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
  const { isAudioMode, isVideoMode, switchMediaType } = useMediaType();
  
  const [currentTrack, setCurrentTrack] = useState<Track | undefined>(undefined);
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

  // 视频播放状态
  const [currentVideo, setCurrentVideo] = useState<VideoFile | undefined>(undefined);
  const [videoPlaylist, setVideoPlaylist] = useState<VideoFile[]>([]);
  const [currentVideoPlaylist, setCurrentVideoPlaylist] = useState<VideoPlaylist | undefined>(undefined);

  // 播放模式管理
  const {
    playbackMode,
    playbackModeInfo,
    togglePlaybackMode,
    getNextTrack
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
    switchMediaType(MediaType.AUDIO); // 切换到音频模式
  };

  // 处理视频选择
  const handleVideoSelect = (video: VideoFile) => {
    console.log('App: Video selected:', video.title);
    setCurrentVideo(video);
    switchMediaType(MediaType.VIDEO); // 切换到视频模式
  };

  // 处理播放列表更新
  const handlePlaylistUpdate = (tracks: Track[]) => {
    console.log('App: Playlist updated with', tracks.length, 'tracks');
    setPlaylist(tracks);
  };

  // 处理视频播放列表更新
  const handleVideoPlaylistUpdate = (videos: VideoFile[]) => {
    console.log('App: Video playlist updated with', videos.length, 'videos');
    setVideoPlaylist(videos);
  };

  // 处理当前视频播放列表更新
  const handleCurrentVideoPlaylistUpdate = (playlist: VideoPlaylist | undefined) => {
    console.log('App: Current video playlist updated:', playlist?.name || 'none');
    setCurrentVideoPlaylist(playlist);
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
          {/* Media Type Status Bar */}
          <div className={`px-4 py-2 border-b transition-colors duration-200 ${
            actualTheme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  当前模式:
                </span>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                  isVideoMode 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    isVideoMode ? 'bg-purple-500' : 'bg-blue-500'
                  }`}></span>
                  <span>{isVideoMode ? '视频模式' : '音频模式'}</span>
                </div>
              </div>
              
              {/* 当前播放信息 */}
              <div className="flex items-center space-x-4">
                {isVideoMode && currentVideo && (
                  <div className={`text-sm ${
                    actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    正在播放: {currentVideo.title}
                  </div>
                )}
                {isAudioMode && currentTrack && (
                  <div className={`text-sm ${
                    actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    正在播放: {currentTrack.title} - {currentTrack.artist}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Routes */}
          <div className="flex-1 overflow-hidden">
            <AnimatedRoutes
              currentTrack={currentTrack}
              isPlaying={playbackState.is_playing}
              onTrackSelect={handleTrackSelect}
              onPlayResume={handlePlayResume}
              onPause={handlePause}
              onPlaylistUpdate={handlePlaylistUpdate}
              currentVideo={currentVideo}
              videoPlaylist={videoPlaylist}
              currentVideoPlaylist={currentVideoPlaylist}
              onVideoSelect={handleVideoSelect}
              onVideoPlaylistUpdate={handleVideoPlaylistUpdate}
              onCurrentVideoPlaylistUpdate={handleCurrentVideoPlaylistUpdate}
            />
          </div>
        </div>
      </div>

      {/* Playback Controls - 只在音频模式下显示 */}
      {isAudioMode && (
        <PlaybackControls
          currentTrack={currentTrack ? {
            title: currentTrack.title,
            artist: currentTrack.artist,
            file_path: currentTrack.file_path
          } : undefined}
          onPlaybackStateChange={handlePlaybackStateChange}
          shouldResume={shouldResume}
          shouldPause={shouldPause}
          onResumeComplete={() => setShouldResume(false)}
          onPauseComplete={() => setShouldPause(false)}
          onTrackChange={handleTrackChange}
          playbackModeInfo={playbackModeInfo}
          onTogglePlaybackMode={togglePlaybackMode}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <MediaTypeProvider>
        <VideoPlaylistProvider>
          <Router>
            <AppContent />
          </Router>
        </VideoPlaylistProvider>
      </MediaTypeProvider>
    </ThemeProvider>
  );
}

export default App;
