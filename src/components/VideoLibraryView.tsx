import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import FileBrowser from './FileBrowser';
import PlaybackHistory from './PlaybackHistory';
import PlaybackStats from './PlaybackStats';
import { 
  Play, 
  Pause, 
  Grid3X3, 
  List, 
  Filter, 
  Video,
  Plus,
  History,
  BarChart3,
  Library
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useVideoPlaylist } from '../contexts/VideoPlaylistContext';
import { 
  VideoFile, 
  VideoSortBy, 
  VideoScanResult,
  VideoPlaylist,
  formatDuration, 
  formatFileSize, 
  formatResolution, 
  getVideoFormatDisplayName 
} from '../types/video';

// 视频过滤器接口
interface VideoFilter {
  format?: string;
  minDuration?: number;
  maxDuration?: number;
  minFileSize?: number;
  maxFileSize?: number;
}

interface VideoLibraryViewProps {
  onVideoSelect?: (video: VideoFile) => void;
  currentVideo?: VideoFile;
  isPlaying?: boolean;
  onPlayResume?: () => void;
  onPause?: () => void;
  onPlaylistUpdate?: (videos: VideoFile[]) => void;
  onCurrentVideoPlaylistUpdate?: (playlist: VideoPlaylist | undefined) => void;
}

export const VideoLibraryView: React.FC<VideoLibraryViewProps> = ({
  onVideoSelect,
  currentVideo,
  isPlaying,
  onPause,
  onPlaylistUpdate,
  onCurrentVideoPlaylistUpdate
}) => {
  const { actualTheme } = useTheme();
  const { state: playlistState, addToHistory, addVideoToPlaylist: addVideoToPlaylistContext } = useVideoPlaylist();
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<VideoSortBy>(VideoSortBy.TITLE);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<VideoFilter>({});
  const [activeTab, setActiveTab] = useState<'library' | 'history' | 'stats'>('library');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedVideoForPlaylist, setSelectedVideoForPlaylist] = useState<VideoFile | null>(null);
  const navigate = useNavigate();

  // 保存视频库到Tauri后端
  const saveVideoLibrary = async (videoList: VideoFile[], scannedPaths: string[] = []) => {
    try {
      await invoke('save_video_library', {
        videos: videoList,
        scannedPaths: scannedPaths
      });
      console.log('视频库已保存到后端:', videoList.length, '个视频');
    } catch (error) {
      console.error('保存视频库失败:', error);
    }
  };

  // 从Tauri后端加载视频库
  const loadSavedVideoLibrary = async () => {
    try {
      const library = await invoke<{videos: VideoFile[], last_scanned_paths: string[], last_updated: string}>('get_saved_video_library');
      if (library && library.videos && Array.isArray(library.videos)) {
        console.log('从后端加载视频库:', library.videos.length, '个视频');
        setVideos(library.videos);
        onPlaylistUpdate?.(library.videos);
        return true;
      }
    } catch (error) {
      console.error('加载保存的视频库失败:', error);
    }
    return false;
  };

  // 清除视频库
  const clearVideoLibraryData = async () => {
    try {
      await invoke('clear_video_library');
      console.log('后端视频库已清除');
    } catch (error) {
      console.error('清除后端视频库失败:', error);
    }
  };

  // 组件加载时自动加载保存的视频库
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        setLoading(true);
        console.log('加载保存的视频库...');
        
        // 从Tauri后端加载视频库
        await loadSavedVideoLibrary();
        
      } catch (err) {
        console.error('加载保存的视频库失败:', err);
        // 不显示错误，因为可能是第一次使用
      } finally {
        setLoading(false);
      }
    };

    loadLibrary();
  }, []);

  // 处理文件夹扫描完成
  const handleScanComplete = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      let newVideos: VideoFile[] = [];
      
      // 检查是否是视频文件数组（从FileBrowser传递过来的扫描结果）
      if (Array.isArray(data) && data.length > 0 && data[0].id) {
        // 直接使用FileBrowser传递的视频文件列表
        console.log('视频扫描完成:', data.length, '个视频文件');
        newVideos = data;
      } else {
        // 如果是路径数组，则调用后端扫描
        const scannedPaths = Array.isArray(data) && typeof data[0] === 'string' ? data : [];
        const scanResult = await invoke<VideoScanResult>('scan_video_files', {
          paths: scannedPaths
        });
        
        console.log('视频扫描完成:', scanResult.videos.length, '个视频文件');
        newVideos = scanResult.videos;
      }
      
      // 合并现有视频和新扫描的视频，避免重复
      const existingVideos = videos;
      const mergedVideos = [...existingVideos];
      
      newVideos.forEach(newVideo => {
        const exists = existingVideos.some(existing => 
          existing.file_path === newVideo.file_path
        );
        if (!exists) {
          mergedVideos.push(newVideo);
        }
      });
      
      console.log('合并后的视频库:', mergedVideos.length, '个视频文件');
      
      // 更新状态
      setVideos(mergedVideos);
      onPlaylistUpdate?.(mergedVideos);
      
      // 持久化保存到Tauri后端
      const scannedPaths = Array.isArray(data) && typeof data[0] === 'string' ? data : [];
      await saveVideoLibrary(mergedVideos, scannedPaths);
      
    } catch (err) {
      console.error('视频扫描失败:', err);
      setError('视频扫描失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 清除视频库
  const clearVideoLibrary = async () => {
    try {
      setLoading(true);
      
      // 清除本地状态
      setVideos([]);
      onPlaylistUpdate?.([]);
      
      // 清除Tauri后端数据
      await clearVideoLibraryData();
      
      console.log('视频库已清除');
    } catch (err) {
      console.error('清除视频库失败:', err);
      setError('清除视频库失败');
    } finally {
      setLoading(false);
    }
  };

  // 播放视频
  const playVideo = async (video: VideoFile) => {
    try {
      console.log('VideoLibraryView: Playing video:', video.title);
      console.log('VideoLibraryView: Video file path:', video.file_path);
      console.log('VideoLibraryView: onVideoSelect callback:', typeof onVideoSelect);
      
      // 清除当前播放列表，因为我们从视频库播放
      console.log('VideoLibraryView: Clearing current video playlist');
      onCurrentVideoPlaylistUpdate?.(undefined);
      
      // 记录播放历史
      try {
        await addToHistory({
          id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          video_id: video.id,
          video_title: video.title,
          playlist_id: 'library', // 从视频库播放
          playlist_name: '视频库',
          played_at: new Date().toISOString(),
          duration_played: 0, // 初始播放时长为0
          completion_percentage: 0 // 初始完成百分比为0
        });
        console.log('VideoLibraryView: History recorded successfully');
      } catch (historyError) {
        console.error('VideoLibraryView: Failed to record history:', historyError);
        // 继续执行，不因为历史记录失败而阻止播放
      }
      
      // 选择当前视频
      if (onVideoSelect) {
        console.log('VideoLibraryView: Calling onVideoSelect with video:', video.title);
        onVideoSelect(video);
        console.log('VideoLibraryView: onVideoSelect called successfully');
      } else {
        console.warn('VideoLibraryView: onVideoSelect callback is not provided');
      }
      
      // 导航到视频播放页面
      console.log('VideoLibraryView: Navigating to /video-playback');
      navigate('/video-playback');
      console.log('VideoLibraryView: Navigation completed');
      
      console.log('VideoLibraryView: Video playback initiated successfully');
    } catch (error) {
      console.error('VideoLibraryView: Failed to play video:', error);
      // 显示用户友好的错误消息
      setError(`播放视频失败: ${(error as Error).message}`);
    }
  };

  // 暂停播放
  const pauseVideo = async () => {
    try {
      console.log('VideoLibraryView: Pausing video via callback');
      onPause?.();
      console.log('VideoLibraryView: Pause callback sent');
    } catch (error) {
      console.error('Failed to pause video:', error);
    }
  };

  // 打开添加到播放列表的模态框
  const openAddToPlaylistModal = (video: VideoFile) => {
    setSelectedVideoForPlaylist(video);
    setShowPlaylistModal(true);
  };

  // 添加视频到播放列表
  const addVideoToPlaylist = async (playlistId: string) => {
    if (!selectedVideoForPlaylist) return;
    
    try {
      console.log('Adding video to playlist:', playlistId, selectedVideoForPlaylist.title);
      
      // 使用VideoPlaylistContext的addVideoToPlaylist方法
      await addVideoToPlaylistContext(playlistId, selectedVideoForPlaylist);
      
      // 显示成功消息
      const playlist = playlistState.playlists.find(p => p.id === playlistId);
      const playlistName = playlist ? playlist.name : '播放列表';
      alert(`视频 "${selectedVideoForPlaylist.title}" 已成功添加到 "${playlistName}"`);
      
      setShowPlaylistModal(false);
      setSelectedVideoForPlaylist(null);
    } catch (error) {
      console.error('Failed to add video to playlist:', error);
      alert('添加到播放列表失败: ' + (error as Error).message);
    }
  };

  // 过滤和排序视频
  const filteredAndSortedVideos = videos
    .filter(video => {
      // 搜索过滤
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           video.file_path.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 格式过滤
      const matchesFormat = !filter.format || video.format === filter.format;
      
      // 时长过滤
            const matchesDuration = (!filter.minDuration || video.duration >= filter.minDuration) &&
                              (!filter.maxDuration || video.duration <= filter.maxDuration);
      
      return matchesSearch && matchesFormat && matchesDuration;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case VideoSortBy.TITLE:
          return a.title.localeCompare(b.title);
        case VideoSortBy.DURATION:
          return b.duration - a.duration;
        case VideoSortBy.FILE_SIZE:
          return b.file_size - a.file_size;
        case VideoSortBy.FORMAT:
          return a.format.localeCompare(b.format);
        case VideoSortBy.RESOLUTION:
          if (!a.resolution && !b.resolution) return 0;
          if (!a.resolution) return 1;
          if (!b.resolution) return -1;
          return (b.resolution.width * b.resolution.height) - (a.resolution.width * a.resolution.height);
        default:
          return 0;
      }
    });

  // 渲染视频卡片（网格模式）
  const renderVideoCard = (video: VideoFile) => {
    const isCurrentVideo = currentVideo?.file_path === video.file_path;
    const isCurrentlyPlaying = isCurrentVideo && isPlaying;

    return (
      <div
        key={video.file_path}
        className={`relative group rounded-lg overflow-hidden transition-all duration-200 ${
          actualTheme === 'dark'
            ? `bg-gray-800 hover:bg-gray-700 ${isCurrentVideo ? 'ring-2 ring-blue-500' : ''}`
            : `bg-white hover:bg-gray-50 border border-gray-200 ${isCurrentVideo ? 'ring-2 ring-blue-500' : ''}`
        }`}
      >
        {/* 视频缩略图 */}
        <div className="aspect-video bg-gray-900 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Video size={48} className="text-gray-500" />
          </div>
          
          {/* 播放按钮覆盖层 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('VideoLibraryView: Play button clicked for video:', video.title);
                if (isCurrentlyPlaying) {
                  console.log('VideoLibraryView: Pausing currently playing video');
                  pauseVideo();
                } else {
                  console.log('VideoLibraryView: Starting video playback');
                  playVideo(video);
                }
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3"
            >
              {isCurrentlyPlaying ? (
                <Pause size={24} className="text-gray-900" />
              ) : (
                <Play size={24} className="text-gray-900 ml-1" />
              )}
            </button>
          </div>
          
          {/* 时长标签 */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        </div>
        
        {/* 视频信息 */}
        <div className="p-4">
          <h3 className={`font-medium text-sm mb-2 line-clamp-2 transition-colors ${
            isCurrentVideo 
              ? 'text-blue-500' 
              : actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {video.title}
          </h3>
          
          <div className={`text-xs space-y-1 transition-colors ${
            actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <div>{getVideoFormatDisplayName(video.format)}</div>
            {video.resolution && (
              <div>{formatResolution(video.resolution)}</div>
            )}
            <div>{formatFileSize(video.file_size)}</div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('VideoLibraryView: Small play button clicked for video:', video.title);
                if (isCurrentlyPlaying) {
                  console.log('VideoLibraryView: Pausing currently playing video');
                  pauseVideo();
                } else {
                  console.log('VideoLibraryView: Starting video playback');
                  playVideo(video);
                }
              }}
              className={`transition-colors ${
                actualTheme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {isCurrentlyPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
            </button>
            
            <button
              onClick={() => openAddToPlaylistModal(video)}
              className={`transition-colors ${
                actualTheme === 'dark'
                  ? 'text-gray-400 hover:text-green-400'
                  : 'text-gray-500 hover:text-green-600'
              }`}
              title="添加到播放列表"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 渲染视频行（列表模式）
  const renderVideoRow = (video: VideoFile, index: number) => {
    const isCurrentVideo = currentVideo?.file_path === video.file_path;
    const isCurrentlyPlaying = isCurrentVideo && isPlaying;

    return (
      <tr 
        key={video.file_path}
        className={`transition-colors ${
          actualTheme === 'dark'
            ? `hover:bg-gray-700 ${isCurrentVideo ? 'bg-gray-700/50' : ''}`
            : `hover:bg-gray-50 ${isCurrentVideo ? 'bg-blue-50' : ''}`
        }`}
      >
        <td className={`px-4 py-3 text-sm transition-colors ${
          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {index + 1}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className={`w-16 h-9 rounded flex items-center justify-center transition-colors ${
              actualTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
            }`}>
              <Video size={16} className={`transition-colors ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
            <div>
              <div className={`text-sm font-medium transition-colors ${
                isCurrentVideo 
                  ? 'text-blue-500' 
                  : actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {video.title}
              </div>
            </div>
          </div>
        </td>
        <td className={`px-4 py-3 text-sm transition-colors ${
          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {getVideoFormatDisplayName(video.format)}
        </td>
        <td className={`px-4 py-3 text-sm transition-colors ${
          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {video.resolution ? formatResolution(video.resolution) : '未知'}
        </td>
        <td className={`px-4 py-3 text-sm transition-colors ${
          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {formatDuration(video.duration)}
        </td>
        <td className={`px-4 py-3 text-sm transition-colors ${
          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {formatFileSize(video.file_size)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('VideoLibraryView: List view play button clicked for video:', video.title);
                if (isCurrentlyPlaying) {
                  console.log('VideoLibraryView: Pausing currently playing video');
                  pauseVideo();
                } else {
                  console.log('VideoLibraryView: Starting video playback');
                  playVideo(video);
                }
              }}
              className={`transition-colors ${
                actualTheme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {isCurrentlyPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
            </button>
            <button
              onClick={() => openAddToPlaylistModal(video)}
              className={`transition-colors ${
                actualTheme === 'dark'
                  ? 'text-gray-400 hover:text-green-400'
                  : 'text-gray-500 hover:text-green-600'
              }`}
              title="添加到播放列表"
            >
              <Plus size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto"> {/* 添加垂直滚动支持 */}
      <div className="p-6 pb-24 min-h-full"> {/* 底部留出播放控制栏空间，确保最小高度 */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className={`text-3xl font-bold transition-colors ${
              actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              视频管理
            </h1>
            {activeTab === 'library' && videos.length > 0 && (
              <button
                onClick={clearVideoLibrary}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? '清除中...' : '清除视频库'}
              </button>
            )}
          </div>

          {/* 标签页导航 */}
          <div className="mb-6">
            <div className={`flex space-x-1 bg-opacity-50 rounded-lg p-1 transition-colors ${
              actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              {[
                { key: 'library', label: '视频库', icon: Library },
                { key: 'history', label: '播放历史', icon: History },
                { key: 'stats', label: '播放统计', icon: BarChart3 }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all duration-200 ${
                    activeTab === key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : actualTheme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 标签页内容 */}
          {activeTab === 'library' && (
            <>
              {/* 文件浏览器 */}
              <div className="mb-6">
                <FileBrowser onScanComplete={handleScanComplete} mediaType="video" />
              </div>

          {/* 搜索、排序和视图控件 */}
          {videos.length > 0 && (
            <div className="mb-6 space-y-4">
              {/* 第一行：搜索和视图模式 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="搜索视频..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:border-blue-500 ${
                      actualTheme === 'dark'
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* 过滤器按钮 */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 border rounded-lg transition-colors focus:outline-none ${
                      showFilters
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : actualTheme === 'dark'
                          ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Filter size={16} />
                  </button>
                  
                  {/* 视图模式切换 */}
                  <div className={`flex border rounded-lg overflow-hidden ${
                    actualTheme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                  }`}>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-600 text-white'
                          : actualTheme === 'dark'
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Grid3X3 size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : actualTheme === 'dark'
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                  
                  {/* 排序选择 */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as VideoSortBy)}
                    className={`px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:border-blue-500 ${
                      actualTheme === 'dark'
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value={VideoSortBy.TITLE}>按标题排序</option>
                    <option value={VideoSortBy.DURATION}>按时长排序</option>
                    <option value={VideoSortBy.FILE_SIZE}>按文件大小排序</option>
                    <option value={VideoSortBy.RESOLUTION}>按分辨率排序</option>
                    <option value={VideoSortBy.FORMAT}>按格式排序</option>
                  </select>
                </div>
              </div>
              
              {/* 过滤器面板 */}
              {showFilters && (
                <div className={`p-4 border rounded-lg transition-colors ${
                  actualTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600'
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 格式过滤 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        格式
                      </label>
                      <select
                        value={filter.format || ''}
                        onChange={(e) => setFilter({...filter, format: e.target.value as any})}
                        className={`w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:border-blue-500 ${
                          actualTheme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">所有格式</option>
                        <option value="mp4">MP4</option>
                        <option value="avi">AVI</option>
                        <option value="mkv">MKV</option>
                        <option value="mov">MOV</option>
                        <option value="wmv">WMV</option>
                        <option value="flv">FLV</option>
                        <option value="webm">WebM</option>
                        <option value="m4v">M4V</option>
                      </select>
                    </div>
                    
                    {/* 最小时长过滤 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        最小时长（分钟）
                      </label>
                      <input
                        type="number"
                        min="0"
                                              value={filter.minDuration ? Math.floor(filter.minDuration / 60) : ''}
                        onChange={(e) => setFilter({
                          ...filter,
                          minDuration: e.target.value ? parseInt(e.target.value) * 60 : undefined
                        })}
                        className={`w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:border-blue-500 ${
                          actualTheme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="0"
                      />
                    </div>
                    
                    {/* 最大时长过滤 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        最大时长（分钟）
                      </label>
                      <input
                        type="number"
                        min="0"
                                              value={filter.maxDuration ? Math.floor(filter.maxDuration / 60) : ''}
                        onChange={(e) => setFilter({
                          ...filter,
                          maxDuration: e.target.value ? parseInt(e.target.value) * 60 : undefined
                        })}
                        className={`w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:border-blue-500 ${
                          actualTheme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="无限制"
                      />
                    </div>
                  </div>
                  
                  {/* 清除过滤器按钮 */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setFilter({})}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        actualTheme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      清除过滤器
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* 视频列表 */}
          {videos.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                /* 网格视图 */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAndSortedVideos.map((video) => renderVideoCard(video))}
                </div>
              ) : (
                /* 列表视图 */
                <div className={`rounded-lg overflow-hidden transition-colors ${
                  actualTheme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`transition-colors ${
                        actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                            actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            #
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                            actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            标题
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                            actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            格式
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                            actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            分辨率
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                            actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            时长
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                            actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            大小
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                            actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`transition-colors ${
                        actualTheme === 'dark' ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'
                      }`}>
                        {filteredAndSortedVideos.map((video, index) => renderVideoRow(video, index))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* 统计信息 */}
              <div className={`mt-4 px-4 py-3 text-sm transition-colors ${
                actualTheme === 'dark' 
                  ? 'bg-gray-800 text-gray-300' 
                  : 'bg-gray-50 text-gray-600'
              } rounded-lg`}>
                显示 {filteredAndSortedVideos.length} 个视频，共 {videos.length} 个
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Video size={48} className={`mx-auto mb-4 transition-colors ${
                actualTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <p className={`text-lg mb-2 transition-colors ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                还没有视频文件
              </p>
              <p className={`transition-colors ${
                actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                请使用上面的文件浏览器选择包含视频文件的文件夹
              </p>
            </div>
          )}
            </>
          )}

          {/* 播放历史标签页 */}
          {activeTab === 'history' && (
            <PlaybackHistory 
              onVideoSelect={onVideoSelect}
              className=""
            />
          )}

          {/* 播放统计标签页 */}
          {activeTab === 'stats' && (
            <PlaybackStats 
              className=""
            />
          )}
        </div>

        {/* 添加到播放列表模态框 */}
        {showPlaylistModal && selectedVideoForPlaylist && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 w-full max-w-md mx-4 transition-colors ${
              actualTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold transition-colors ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  添加到播放列表
                </h3>
                <button
                  onClick={() => {
                    setShowPlaylistModal(false);
                    setSelectedVideoForPlaylist(null);
                  }}
                  className={`transition-colors ${
                    actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <p className={`text-sm mb-3 transition-colors ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  选择要添加 "{selectedVideoForPlaylist.title}" 的播放列表：
                </p>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {playlistState.playlists.length > 0 ? (
                    playlistState.playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => addVideoToPlaylist(playlist.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          actualTheme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="font-medium">{playlist.name}</div>
                        {playlist.description && (
                          <div className={`text-sm transition-colors ${
                            actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {playlist.description}
                          </div>
                        )}
                        <div className={`text-xs transition-colors ${
                          actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {playlist.items.length} 个视频
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className={`text-center py-8 transition-colors ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <Video size={32} className="mx-auto mb-2 opacity-50" />
                      <p>还没有播放列表</p>
                      <p className="text-sm">请先创建一个播放列表</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPlaylistModal(false);
                    setSelectedVideoForPlaylist(null);
                  }}
                  className={`px-4 py-2 transition-colors ${
                    actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};