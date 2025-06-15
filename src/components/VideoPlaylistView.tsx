import React from 'react';
import { motion } from 'framer-motion';
import { Video, Play, Pause } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useVideoPlaylist } from '../contexts/VideoPlaylistContext';
import VideoPlaylistManager from './VideoPlaylistManager';
import { VideoFile, VideoPlaylist } from '../types/video';
import { useNavigate } from 'react-router-dom';

interface VideoPlaylistViewProps {
  onVideoSelect?: (video: VideoFile) => void;
  currentVideo?: VideoFile;
  isPlaying?: boolean;
  onPlayResume?: () => void;
  onPause?: () => void;
  onPlaylistUpdate?: (videos: VideoFile[]) => void;
  onCurrentVideoPlaylistUpdate?: (playlist: VideoPlaylist | undefined) => void;
}

export const VideoPlaylistView: React.FC<VideoPlaylistViewProps> = ({
  onVideoSelect,
  currentVideo,
  isPlaying,
  onPlayResume,
  onPause,
  onPlaylistUpdate,
  onCurrentVideoPlaylistUpdate,
}) => {
  const { actualTheme } = useTheme();
  const { state, addToHistory } = useVideoPlaylist();
  const navigate = useNavigate();

  // 播放列表统计

  // 统计信息
  const totalPlaylists = state.playlists.length;
  const totalVideos = state.playlists.reduce((sum, playlist) => sum + playlist.items.length, 0);
  const totalDuration = state.playlists.reduce((sum, playlist) => sum + playlist.total_duration, 0);

  // 格式化时长
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理播放列表播放
  const handlePlaylistPlay = async (playlist: VideoPlaylist, startIndex?: number) => {
    try {
      console.log('VideoPlaylistView: Playing playlist:', playlist.name, 'from index:', startIndex);
      
      if (playlist.items.length === 0) {
        console.log('VideoPlaylistView: Playlist is empty');
        return;
      }

      const index = startIndex || 0;
      const videoItem = playlist.items[index];
      
      if (!videoItem) {
        console.log('VideoPlaylistView: No video at index:', index);
        return;
      }

      const video = videoItem.video;
      
      // 设置当前播放列表
      onCurrentVideoPlaylistUpdate?.(playlist);
      
      // 选择当前视频
      onVideoSelect?.(video);
      
      // 记录播放历史
      await addToHistory({
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        video_id: video.id,
        video_title: video.title,
        playlist_id: playlist.id,
        playlist_name: playlist.name,
        played_at: new Date().toISOString(),
        duration_played: 0,
        completion_percentage: 0
      });
      
      // 导航到视频播放页面
      navigate('/video-playback');
      
      console.log('VideoPlaylistView: Successfully started playlist playback');
    } catch (error) {
      console.error('VideoPlaylistView: Failed to play playlist:', error);
    }
  };

  return (
    <div className={`h-full flex flex-col transition-colors duration-200 ${
      actualTheme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`p-6 border-b transition-colors duration-200 ${
          actualTheme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">视频播放列表</h1>
            <div className="flex items-center space-x-4 text-sm">
              <span className={`flex items-center space-x-1 ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <Video size={16} />
                <span>{totalPlaylists} 个播放列表</span>
              </span>
              <span className={`flex items-center space-x-1 ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <Play size={16} />
                <span>{totalVideos} 个视频</span>
              </span>
              <span className={`${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                总时长: {formatDuration(totalDuration)}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <p className={`text-sm ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              管理您的视频播放列表
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <VideoPlaylistManager
          onVideoSelect={onVideoSelect}
          onPlaylistPlay={handlePlaylistPlay}
          currentVideo={currentVideo}
          isPlaying={isPlaying}
          availableVideos={[]}
        />
      </div>

      {/* 当前播放信息 */}
      {currentVideo && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`p-4 border-t transition-colors duration-200 ${
            actualTheme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Video size={24} className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
              </div>
              <div>
                <h3 className="font-medium">{currentVideo.title}</h3>
                <p className={`text-sm ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {formatDuration(currentVideo.duration)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isPlaying ? (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onPause}
                  className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                >
                  <Pause size={20} />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onPlayResume}
                  className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                >
                  <Play size={20} />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VideoPlaylistView;