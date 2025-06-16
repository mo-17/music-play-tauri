import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { VideoPlayer } from './VideoPlayer';
import { VideoFile } from '../types/video';
import { ArrowLeft, List } from 'lucide-react';
import { useDesktopResponsive } from '../hooks/useDesktopResponsive';

interface VideoPlaybackViewProps {
  currentVideo?: VideoFile;
  playlist?: VideoFile[];
  playlistName?: string;
  onBack?: () => void;
  onVideoSelect?: (video: VideoFile) => void;
  onPlaylistToggle?: () => void;
}

export const VideoPlaybackView: React.FC<VideoPlaybackViewProps> = ({
  currentVideo,
  playlist = [],
  playlistName,
  onBack,
  onVideoSelect,
  onPlaylistToggle
}) => {
  const { actualTheme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);


  // 桌面端响应式适配
  const desktopResponsive = useDesktopResponsive();
  // 获取当前视频在播放列表中的索引
  const getCurrentVideoIndex = () => {
    if (!currentVideo || playlist.length === 0) return -1;
    return playlist.findIndex(video => video.id === currentVideo.id);
  };

  // 播放下一个视频
  const playNext = () => {
    const currentIndex = getCurrentVideoIndex();
    if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
      const nextVideo = playlist[currentIndex + 1];
      onVideoSelect?.(nextVideo);
    }
  };

  // 播放上一个视频
  const playPrevious = () => {
    const currentIndex = getCurrentVideoIndex();
    if (currentIndex > 0) {
      const previousVideo = playlist[currentIndex - 1];
      onVideoSelect?.(previousVideo);
    }
  };

  // 处理视频结束
  const handleVideoEnd = () => {
    // 自动播放下一个视频
    playNext();
  };

  // 处理播放状态变化
  const handlePlayStateChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  // 处理时间更新
  const handleTimeUpdate = (current: number, total: number) => {
    setCurrentTime(current);
    setDuration(total);
  };

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 切换播放列表显示
  const togglePlaylist = () => {
    setShowPlaylist(!showPlaylist);
    onPlaylistToggle?.();
  };

  return (
    <div className={`flex h-screen transition-colors ${
      actualTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      {/* 主视频播放区域 */}
      <div className={`flex-1 flex flex-col ${showPlaylist ? 'mr-80' : ''} transition-all duration-300`}>
        {/* 顶部导航栏 */}
        {!desktopResponsive.microWindowConfig.enabled && (
        <div className={`flex items-center justify-between p-4 border-b transition-colors ${
          actualTheme === 'dark' 
            ? 'bg-gray-800 border-gray-700 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                actualTheme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            
            <div>
              <h1 className="text-lg font-semibold">
                {currentVideo?.title || '视频播放器'}
              </h1>
              {currentVideo && (
                <p className={`text-sm ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {currentVideo.resolution && 
                    `${currentVideo.resolution.width}x${currentVideo.resolution.height} • `
                  }
                  {formatTime(duration)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {playlist.length > 0 && (
              <button
                onClick={togglePlaylist}
                className={`p-2 rounded-lg transition-colors ${
                  showPlaylist
                    ? 'bg-blue-600 text-white'
                    : actualTheme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <List size={20} />
              </button>
            )}
          </div>
        </div>)}

        {/* 视频播放器 */}
        <div className="flex-1 flex items-center justify-center bg-black">
          <VideoPlayer
            currentVideo={currentVideo}
            isPlaying={isPlaying}
            onPlayStateChange={handlePlayStateChange}
            onTimeUpdate={handleTimeUpdate}
            onVideoEnd={handleVideoEnd}
            onNext={playlist.length > 1 ? playNext : undefined}
            onPrevious={playlist.length > 1 ? playPrevious : undefined}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* 播放列表侧边栏 */}
      {showPlaylist && (
        <div className={`fixed right-0 top-0 bottom-0 w-80 border-l transition-colors ${
          actualTheme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        } z-50`}>
          <div className={`p-4 border-b transition-colors ${
            actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold transition-colors ${
              actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {playlistName || '播放列表'} ({playlist.length})
            </h2>
          </div>
          
          <div className="overflow-y-auto h-full pb-20">
            {playlist.map((video, index) => {
              const isCurrentVideo = currentVideo?.id === video.id;
              const currentIndex = getCurrentVideoIndex();
              
              return (
                <div
                  key={video.id}
                  onClick={() => onVideoSelect?.(video)}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  } ${
                    isCurrentVideo
                      ? actualTheme === 'dark'
                        ? 'bg-blue-900/50 border-blue-500'
                        : 'bg-blue-50 border-blue-200'
                      : actualTheme === 'dark'
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isCurrentVideo
                        ? 'bg-blue-600 text-white'
                        : actualTheme === 'dark'
                          ? 'bg-gray-600 text-gray-300'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-medium truncate transition-colors ${
                        isCurrentVideo
                          ? 'text-blue-600'
                          : actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {video.title}
                      </h3>
                      
                      <div className={`text-xs mt-1 space-y-1 transition-colors ${
                        actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {video.resolution && (
                          <div>{video.resolution.width}x{video.resolution.height}</div>
                        )}
                        <div>{formatTime(video.duration)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {isCurrentVideo && isPlaying && (
                    <div className="mt-2">
                      <div className={`w-full bg-gray-200 rounded-full h-1 transition-colors ${
                        actualTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                      }`}>
                        <div 
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 