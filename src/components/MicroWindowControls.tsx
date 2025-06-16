import React, { memo, useMemo } from 'react';
import { Play, Pause, Maximize2, Volume2, VolumeX } from 'lucide-react';
import type { WindowSizeType, MicroWindowConfig } from '../hooks/useDesktopResponsive';

interface MicroWindowControlsProps {
  // 播放状态
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  
  // 窗口信息
  sizeType: WindowSizeType;
  microConfig: MicroWindowConfig;
  windowSize: { width: number; height: number };
  
  // 控制回调
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  
  // 样式配置
  className?: string;
  showControls?: boolean;
}

// 极简进度条组件
const MicroProgressBar = memo<{
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  width: number;
}>(({ currentTime, duration, onSeek, width }) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  return (
    <div 
      className="relative bg-gray-600 rounded-full cursor-pointer"
      style={{ height: '2px', width: `${width}px` }}
      onClick={handleClick}
    >
      <div 
        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
      {/* 悬停时显示的拖拽点 */}
      <div 
        className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"
        style={{ left: `${progress}%`, marginLeft: '-6px' }}
      />
    </div>
  );
});

MicroProgressBar.displayName = 'MicroProgressBar';

// 极简音量控制组件
const MicroVolumeControl = memo<{
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  size: number;
}>(({ volume, isMuted, onVolumeChange, onMuteToggle, size }) => {
  const handleVolumeClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const percentage = 1 - (clickY / rect.height); // 反转Y轴
    const newVolume = Math.max(0, Math.min(1, percentage));
    onVolumeChange(newVolume);
  };

  return (
    <div className="relative group">
      <button
        onClick={onMuteToggle}
        className="p-1 rounded hover:bg-white/20 transition-colors duration-150"
        title={isMuted ? '取消静音' : '静音'}
      >
        {isMuted ? (
          <VolumeX size={size} className="text-white" />
        ) : (
          <Volume2 size={size} className="text-white" />
        )}
      </button>
      
      {/* 悬停时显示的音量条 */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
        <div 
          className="w-1 bg-gray-600 rounded-full cursor-pointer relative"
          style={{ height: '40px' }}
          onClick={handleVolumeClick}
        >
          <div 
            className="absolute bottom-0 left-0 w-full bg-blue-500 rounded-full transition-all duration-150"
            style={{ height: `${volume * 100}%` }}
          />
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full"
            style={{ bottom: `${volume * 100}%`, marginBottom: '-6px' }}
          />
        </div>
      </div>
    </div>
  );
});

MicroVolumeControl.displayName = 'MicroVolumeControl';

// 时间显示组件
const MicroTimeDisplay = memo<{
  currentTime: number;
  duration: number;
  fontSize: string;
}>(({ currentTime, duration, fontSize }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${fontSize} text-white font-mono opacity-90 select-none`}>
      {formatTime(currentTime)}
      {duration > 0 && (
        <span className="opacity-60">/{formatTime(duration)}</span>
      )}
    </div>
  );
});

MicroTimeDisplay.displayName = 'MicroTimeDisplay';

// 主要的极小窗口控制组件
export const MicroWindowControls = memo<MicroWindowControlsProps>(({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  sizeType,
  microConfig,
  windowSize,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  className = '',
  showControls = true
}) => {
  // 根据窗口大小计算控件尺寸
  const controlSizes = useMemo(() => {
    const { width, height } = windowSize;
    
    if (width < 250 || height < 150) {
      // 极小窗口
      return {
        iconSize: 12,
        fontSize: 'text-xs',
        padding: 'p-0.5',
        gap: 'gap-1',
        progressWidth: Math.max(60, width - 80),
        controlHeight: 24
      };
    } else if (width < 350 || height < 200) {
      // 小窗口
      return {
        iconSize: 14,
        fontSize: 'text-xs',
        padding: 'p-1',
        gap: 'gap-1.5',
        progressWidth: Math.max(80, width - 100),
        controlHeight: 28
      };
    } else {
      // 正常小窗口
      return {
        iconSize: 16,
        fontSize: 'text-sm',
        padding: 'p-1.5',
        gap: 'gap-2',
        progressWidth: Math.max(100, width - 120),
        controlHeight: 32
      };
    }
  }, [windowSize]);

  // 根据配置决定显示哪些控件
  const visibleControls = useMemo(() => {
    const { hideElements } = microConfig;
    
    return {
      showTime: !hideElements.includes('time'),
      showVolume: !hideElements.includes('volume'),
      showProgress: !hideElements.includes('progress'),
      showInfo: !hideElements.includes('info')
    };
  }, [microConfig]);

  // 控制栏样式
  const controlsClasses = useMemo(() => {
    const baseClasses = `
      absolute bottom-0 left-0 right-0 
      bg-gradient-to-t from-black/80 via-black/60 to-transparent
      backdrop-blur-sm
      flex items-center justify-between
      transition-all duration-300
      ${controlSizes.padding}
      ${controlSizes.gap}
    `;
    
    const heightClass = microConfig.overlayControls 
      ? `h-${Math.ceil(controlSizes.controlHeight / 4)}` 
      : 'h-auto';
    
    const visibilityClass = showControls 
      ? 'opacity-100 translate-y-0' 
      : 'opacity-0 translate-y-2';
    
    return `${baseClasses} ${heightClass} ${visibilityClass} ${className}`;
  }, [controlSizes, microConfig.overlayControls, showControls, className]);

  if (!showControls && microConfig.overlayControls) {
    return null;
  }

  return (
    <div className={controlsClasses}>
      {/* 左侧：播放控制 */}
      <div className={`flex items-center ${controlSizes.gap}`}>
        <button
          onClick={onPlayPause}
          className={`${controlSizes.padding} rounded hover:bg-white/20 transition-colors duration-150 flex-shrink-0`}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <Pause size={controlSizes.iconSize} className="text-white" />
          ) : (
            <Play size={controlSizes.iconSize} className="text-white" />
          )}
        </button>
        
        {/* 时间显示 - 仅在非极小窗口显示 */}
        {visibleControls.showTime && windowSize.width > 200 && (
          <MicroTimeDisplay
            currentTime={currentTime}
            duration={duration}
            fontSize={controlSizes.fontSize}
          />
        )}
      </div>

      {/* 中间：进度条 */}
      {visibleControls.showProgress && (
        <div className="flex-1 mx-2 flex items-center justify-center">
          <MicroProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
            width={controlSizes.progressWidth}
          />
        </div>
      )}

      {/* 右侧：音量和全屏控制 */}
      <div className={`flex items-center ${controlSizes.gap}`}>
        {/* 音量控制 - 仅在非极小窗口显示 */}
        {visibleControls.showVolume && windowSize.width > 250 && (
          <MicroVolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={onVolumeChange}
            onMuteToggle={onMuteToggle}
            size={controlSizes.iconSize}
          />
        )}
        
        {/* 全屏按钮 */}
        <button
          onClick={onFullscreenToggle}
          className={`${controlSizes.padding} rounded hover:bg-white/20 transition-colors duration-150 flex-shrink-0`}
          title="全屏"
        >
          <Maximize2 size={controlSizes.iconSize} className="text-white" />
        </button>
      </div>
    </div>
  );
});

MicroWindowControls.displayName = 'MicroWindowControls';

// 极小窗口信息显示组件
export const MicroWindowInfo = memo<{
  title: string;
  windowSize: { width: number; height: number };
  sizeType: WindowSizeType;
  className?: string;
}>(({ title, windowSize, sizeType, className = '' }) => {
  const shouldShow = windowSize.width > 300 && windowSize.height > 180;
  
  if (!shouldShow) return null;

  return (
    <div className={`absolute top-2 left-2 right-2 ${className}`}>
      <div className="bg-black/60 backdrop-blur-sm rounded px-2 py-1">
        <h3 className="text-xs text-white font-medium truncate">
          {title}
        </h3>
        <div className="text-xs text-gray-300 opacity-75">
          {windowSize.width}×{windowSize.height} ({sizeType})
        </div>
      </div>
    </div>
  );
});

MicroWindowInfo.displayName = 'MicroWindowInfo'; 