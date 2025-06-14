import React from 'react';
import { Repeat, Repeat1, Shuffle, List } from 'lucide-react';
import { PlaybackMode, PlaybackModeInfo } from '../types/playback';
import { useTheme } from '../contexts/ThemeContext';

interface PlaybackModeButtonProps {
  playbackModeInfo: PlaybackModeInfo;
  onToggle: () => void;
  className?: string;
}

const PlaybackModeButton: React.FC<PlaybackModeButtonProps> = ({
  playbackModeInfo,
  onToggle,
  className = ''
}) => {
  const { actualTheme } = useTheme();

  // 根据播放模式选择图标
  const getIcon = (mode: PlaybackMode) => {
    switch (mode) {
      case PlaybackMode.SEQUENCE:
        return <List size={18} />;
      case PlaybackMode.LOOP_LIST:
        return <Repeat size={18} />;
      case PlaybackMode.LOOP_SINGLE:
        return <Repeat1 size={18} />;
      case PlaybackMode.SHUFFLE:
        return <Shuffle size={18} />;
      default:
        return <List size={18} />;
    }
  };

  // 根据播放模式选择颜色
  const getButtonColor = (mode: PlaybackMode) => {
    switch (mode) {
      case PlaybackMode.SEQUENCE:
        return actualTheme === 'dark' 
          ? 'text-gray-400 hover:text-white' 
          : 'text-gray-600 hover:text-gray-900';
      case PlaybackMode.LOOP_LIST:
        return 'text-blue-400 hover:text-blue-300';
      case PlaybackMode.LOOP_SINGLE:
        return 'text-green-400 hover:text-green-300';
      case PlaybackMode.SHUFFLE:
        return 'text-purple-400 hover:text-purple-300';
      default:
        return actualTheme === 'dark' 
          ? 'text-gray-400 hover:text-white' 
          : 'text-gray-600 hover:text-gray-900';
    }
  };

  return (
    <button
      onClick={onToggle}
      className={`p-2 transition-colors duration-200 rounded-lg hover:bg-gray-600/50 group relative ${getButtonColor(playbackModeInfo.mode)} ${className}`}
      title={`${playbackModeInfo.label}: ${playbackModeInfo.description}`}
    >
      {getIcon(playbackModeInfo.mode)}
      
      {/* 工具提示 */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {playbackModeInfo.label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </div>
    </button>
  );
};

export default PlaybackModeButton; 