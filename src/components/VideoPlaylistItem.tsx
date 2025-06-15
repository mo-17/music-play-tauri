import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  GripVertical,
  Clock,
  Video
} from 'lucide-react';
import { motion } from 'framer-motion';
import { VideoPlaylistItem as VideoPlaylistItemType, VideoFile, formatDuration } from '../types/video';

interface VideoPlaylistItemProps {
  item: VideoPlaylistItemType;
  index: number;
  isCurrentVideo?: boolean;
  isPlaying?: boolean;
  onPlay?: (video: VideoFile, index: number) => void;
  onRemove?: (itemId: string) => void;
  onEdit?: (item: VideoPlaylistItemType) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const VideoPlaylistItem: React.FC<VideoPlaylistItemProps> = ({
  item,
  index,
  isCurrentVideo = false,
  isPlaying = false,
  onPlay,
  onRemove,
  onEdit,
  isDragging = false,
  dragHandleProps
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handlePlay = () => {
    onPlay?.(item.video, index);
  };

  const handleRemove = () => {
    if (confirm('确定要从播放列表中移除这个视频吗？')) {
      onRemove?.(item.id);
    }
  };

  const handleEdit = () => {
    onEdit?.(item);
    setShowMenu(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`group flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
        isDragging 
          ? 'bg-gray-600 shadow-lg scale-105' 
          : isCurrentVideo 
            ? 'bg-gray-600/70' 
            : 'hover:bg-gray-700'
      }`}
    >
      {/* 拖拽手柄 */}
      <div
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 transition-colors"
      >
        <GripVertical size={16} />
      </div>

      {/* 索引号 */}
      <div className="w-8 text-center">
        <span className={`text-sm font-medium ${
          isCurrentVideo ? 'text-blue-400' : 'text-gray-400'
        }`}>
          {index + 1}
        </span>
      </div>

      {/* 播放按钮 */}
      <button
        onClick={handlePlay}
        className={`p-2 rounded-full transition-all duration-200 ${
          isCurrentVideo && isPlaying
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-600'
        }`}
      >
        {isCurrentVideo && isPlaying ? (
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-1 h-3 bg-white animate-pulse mr-0.5"></div>
            <div className="w-1 h-2 bg-white animate-pulse mr-0.5"></div>
            <div className="w-1 h-4 bg-white animate-pulse"></div>
          </div>
        ) : (
          <Play size={16} />
        )}
      </button>

      {/* 视频信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start space-x-3">
          {/* 缩略图占位符 */}
          <div className="w-16 h-12 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
            {item.video.thumbnail_path ? (
              <img
                src={item.video.thumbnail_path}
                alt={item.video.title}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <Video size={20} className="text-gray-500" />
            )}
          </div>

          {/* 视频详情 */}
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium truncate ${
              isCurrentVideo ? 'text-blue-400' : 'text-white'
            }`}>
              {item.custom_title || item.video.title}
            </h4>
            
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-400">
                {item.video.format?.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400 flex items-center space-x-1">
                <Clock size={12} />
                <span>{formatDuration(item.video.duration)}</span>
              </span>
              {item.video.resolution && (
                <>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">
                    {item.video.resolution.width}x{item.video.resolution.height}
                  </span>
                </>
              )}
            </div>

            {/* 播放统计 */}
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-gray-500">
                播放 {item.play_count} 次
              </span>
              {item.last_played && (
                <span className="text-xs text-gray-500">
                  上次播放: {new Date(item.last_played).toLocaleDateString('zh-CN')}
                </span>
              )}
            </div>

            {/* 自定义备注 */}
            {item.notes && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                {item.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 操作菜单 */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical size={16} />
        </button>

        {/* 下拉菜单 */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 bg-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
            <button
              onClick={handleEdit}
              className="w-full px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-600 rounded-t-lg transition-colors flex items-center space-x-2"
            >
              <Edit2 size={14} />
              <span>编辑</span>
            </button>
            <button
              onClick={handleRemove}
              className="w-full px-3 py-2 text-left text-gray-300 hover:text-red-400 hover:bg-gray-600 rounded-b-lg transition-colors flex items-center space-x-2"
            >
              <Trash2 size={14} />
              <span>移除</span>
            </button>
          </div>
        )}
      </div>

      {/* 点击外部关闭菜单 */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </motion.div>
  );
};

export default VideoPlaylistItem; 