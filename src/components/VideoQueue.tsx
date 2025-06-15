import React, { useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  List, 
  X, 
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Video,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useVideoPlaylist } from '../contexts/VideoPlaylistContext';
import { 
  VideoFile, 
  VideoPlaylistItem, 
  RepeatMode, 
  PlaylistStatus,
  formatDuration 
} from '../types/video';

interface VideoQueueProps {
  currentVideo?: VideoFile | null;
  isPlaying?: boolean;
  onVideoSelect?: (video: VideoFile, index: number) => void;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  availableVideos?: VideoFile[];
  className?: string;
}

const VideoQueue: React.FC<VideoQueueProps> = ({
  currentVideo,
  isPlaying = false,
  onVideoSelect,
  onPlayPause,
  onNext,
  onPrevious,
  availableVideos = [],
  className = ''
}) => {
  const {
    state,
    toggleShuffle,
    setRepeatMode,
    nextVideo,
    previousVideo,
    seekToVideo,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    reorderPlaylistItems
  } = useVideoPlaylist();

  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // 获取当前播放列表
  const currentPlaylist = state.playlists.find(
    p => p.id === state.playbackState.current_playlist_id
  );

  // 获取当前播放队列
  const queueItems = currentPlaylist?.items || [];
  const currentIndex = state.playbackState.current_item_index;

  // 处理播放/暂停
  const handlePlayPause = useCallback(() => {
    onPlayPause?.();
  }, [onPlayPause]);

  // 处理下一首
  const handleNext = useCallback(async () => {
    try {
      await nextVideo();
      onNext?.();
    } catch (error) {
      console.error('Failed to play next video:', error);
    }
  }, [nextVideo, onNext]);

  // 处理上一首
  const handlePrevious = useCallback(async () => {
    try {
      await previousVideo();
      onPrevious?.();
    } catch (error) {
      console.error('Failed to play previous video:', error);
    }
  }, [previousVideo, onPrevious]);

  // 跳转到指定视频
  const handleSeekToVideo = useCallback(async (index: number) => {
    try {
      await seekToVideo(index);
      if (queueItems[index]) {
        onVideoSelect?.(queueItems[index].video, index);
      }
    } catch (error) {
      console.error('Failed to seek to video:', error);
    }
  }, [seekToVideo, onVideoSelect, queueItems]);

  // 切换随机播放
  const handleToggleShuffle = useCallback(() => {
    toggleShuffle();
  }, [toggleShuffle]);

  // 切换重复模式
  const handleToggleRepeat = useCallback(() => {
    const modes = [RepeatMode.OFF, RepeatMode.ALL, RepeatMode.ONE];
    const currentIndex = modes.indexOf(state.playbackState.repeat_mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  }, [setRepeatMode, state.playbackState.repeat_mode]);

  // 从队列移除视频
  const handleRemoveFromQueue = useCallback(async (itemId: string) => {
    if (!currentPlaylist) return;
    
    try {
      await removeVideoFromPlaylist(currentPlaylist.id, itemId);
    } catch (error) {
      console.error('Failed to remove video from queue:', error);
    }
  }, [currentPlaylist, removeVideoFromPlaylist]);

  // 添加视频到队列
  const handleAddToQueue = useCallback(async (video: VideoFile) => {
    if (!currentPlaylist) return;

    try {
      await addVideoToPlaylist(currentPlaylist.id, video);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add video to queue:', error);
    }
  }, [currentPlaylist, addVideoToPlaylist]);

  // 重新排序队列
  const handleReorderQueue = useCallback(async (newItems: VideoPlaylistItem[]) => {
    if (!currentPlaylist) return;

    try {
      await reorderPlaylistItems(currentPlaylist.id, newItems);
    } catch (error) {
      console.error('Failed to reorder queue:', error);
    }
  }, [currentPlaylist, reorderPlaylistItems]);

  // 获取重复模式图标
  const getRepeatIcon = () => {
    switch (state.playbackState.repeat_mode) {
      case RepeatMode.ONE:
        return <Repeat1 size={16} />;
      case RepeatMode.ALL:
        return <Repeat size={16} />;
      default:
        return <Repeat size={16} />;
    }
  };

  // 获取可添加的视频（排除已在队列中的）
  const availableToAdd = availableVideos.filter(
    video => !queueItems.some(item => item.video.id === video.id)
  );

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* 队列头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <List size={20} className="text-gray-400" />
            <h3 className="text-lg font-semibold text-white">播放队列</h3>
            {currentPlaylist && (
              <span className="text-sm text-gray-400">
                ({currentPlaylist.name})
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="添加视频"
            >
              <Plus size={16} />
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* 播放控制 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              disabled={queueItems.length === 0}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 rounded-lg transition-colors"
            >
              <SkipBack size={16} />
            </button>
            
            <button
              onClick={handlePlayPause}
              disabled={queueItems.length === 0}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full transition-colors"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <button
              onClick={handleNext}
              disabled={queueItems.length === 0}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 rounded-lg transition-colors"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleShuffle}
              className={`p-2 rounded-lg transition-colors ${
                state.playbackState.shuffle_enabled
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title="随机播放"
            >
              <Shuffle size={16} />
            </button>
            
            <button
              onClick={handleToggleRepeat}
              className={`p-2 rounded-lg transition-colors ${
                state.playbackState.repeat_mode !== RepeatMode.OFF
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title="重复播放"
            >
              {getRepeatIcon()}
            </button>
          </div>
        </div>

        {/* 队列信息 */}
        {queueItems.length > 0 && (
          <div className="mt-3 text-sm text-gray-400">
            {queueItems.length} 个视频 • 
            总时长 {formatDuration(queueItems.reduce((total, item) => total + item.video.duration, 0))}
            {currentIndex >= 0 && currentIndex < queueItems.length && (
              <> • 当前: {currentIndex + 1}/{queueItems.length}</>
            )}
          </div>
        )}
      </div>

      {/* 队列列表 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {queueItems.length > 0 ? (
              <Reorder.Group
                axis="y"
                values={queueItems}
                onReorder={handleReorderQueue}
                className="max-h-96 overflow-y-auto"
              >
                {queueItems.map((item, index) => {
                  const isCurrentItem = index === currentIndex;
                  
                  return (
                    <Reorder.Item
                      key={item.id}
                      value={item}
                      className={`group flex items-center space-x-3 p-3 border-b border-gray-700 last:border-b-0 cursor-pointer transition-colors ${
                        isCurrentItem 
                          ? 'bg-gray-700/50' 
                          : 'hover:bg-gray-700/30'
                      }`}
                      onClick={() => handleSeekToVideo(index)}
                    >
                      {/* 拖拽手柄 */}
                      <div className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 transition-colors">
                        <GripVertical size={16} />
                      </div>

                      {/* 索引 */}
                      <div className="w-8 text-center">
                        <span className={`text-sm font-medium ${
                          isCurrentItem ? 'text-blue-400' : 'text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      </div>

                      {/* 播放状态指示器 */}
                      <div className="w-6 flex justify-center">
                        {isCurrentItem && isPlaying ? (
                          <div className="flex items-center space-x-0.5">
                            <div className="w-1 h-3 bg-blue-400 animate-pulse"></div>
                            <div className="w-1 h-2 bg-blue-400 animate-pulse"></div>
                            <div className="w-1 h-4 bg-blue-400 animate-pulse"></div>
                          </div>
                        ) : isCurrentItem ? (
                          <Play size={12} className="text-blue-400" />
                        ) : null}
                      </div>

                      {/* 缩略图 */}
                      <div className="w-12 h-8 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        {item.video.thumbnail_path ? (
                          <img
                            src={item.video.thumbnail_path}
                            alt={item.video.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Video size={14} className="text-gray-500" />
                        )}
                      </div>

                      {/* 视频信息 */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${
                          isCurrentItem ? 'text-blue-400' : 'text-white'
                        }`}>
                          {item.custom_title || item.video.title}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span>{item.video.format?.toUpperCase()}</span>
                          <span>•</span>
                          <Clock size={10} />
                          <span>{formatDuration(item.video.duration)}</span>
                        </div>
                      </div>

                      {/* 移除按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromQueue(item.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Video size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">队列为空</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  添加视频到队列
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 添加视频模态框 */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">添加视频到队列</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-96">
                {availableToAdd.length > 0 ? (
                  <div className="space-y-2">
                    {availableToAdd.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <div className="w-16 h-12 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                          {video.thumbnail_path ? (
                            <img
                              src={video.thumbnail_path}
                              alt={video.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Video size={20} className="text-gray-500" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate">{video.title}</div>
                          <div className="text-gray-400 text-sm">
                            {video.format?.toUpperCase()} • {formatDuration(video.duration)}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleAddToQueue(video)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <Plus size={14} />
                          <span>添加</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Video size={48} className="mx-auto mb-4 opacity-50" />
                    <p>没有可添加的视频</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoQueue; 