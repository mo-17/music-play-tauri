import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ChevronUp
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { VideoFile } from '../types/video';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { convertFileSrc } from '@tauri-apps/api/core';
import { NeonProgressBar } from './progress-bars';
import { 
  useResponsiveSize, 
  getResponsiveButtonClasses, 
  getResponsiveProgressBarHeight, 
  getResponsiveSpacing,
  useDeviceInfo,
  useGracefulDegradation,
  getGracefulDegradationClasses
} from '../hooks/useResponsiveSize';
import { useTouchOptimization } from '../hooks/useTouchOptimization';
import { VideoControls } from './VideoControls';
import { FullscreenUI } from './FullscreenUI';
import { VolumeWaveIndicator } from './VolumeWaveIndicator';
import { LoadingSpinner } from './LoadingSpinner';
import { useTauriWindow } from '../hooks/useTauriWindow';
import { ContextMenu, useVideoContextMenu } from './ContextMenu';
import { useVideoPlayerShortcuts } from '../hooks/useKeyboardShortcuts';
import { useControlBarHover } from '../hooks/useHoverEffects';
import { useDesktopResponsive, useMultiDisplaySupport } from '../hooks/useDesktopResponsive';
import { MicroWindowControls, MicroWindowInfo } from './MicroWindowControls';
import { useTauriFullscreen } from '../hooks/useTauriFullscreen';
import { useCrossPlatform } from '../hooks/useCrossPlatform';
import { useTauriCommunication } from '../hooks/useTauriCommunication';
import '../styles/fullscreen.css';
import '../styles/animations.css';

interface VideoPlayerProps {
  currentVideo?: VideoFile;
  isPlaying?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onVideoEnd?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
}

interface VideoPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
}

// 优化：使用memo包装组件，避免不必要的重渲染
export const VideoPlayer: React.FC<VideoPlayerProps> = memo(({
  currentVideo,
  isPlaying = false,
  onPlayStateChange,
  onTimeUpdate,
  onVideoEnd,
  onNext,
  onPrevious,
  className = ''
}) => {
  const { actualTheme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 响应式尺寸Hook - 仅用于视频信息显示
  const responsiveSizes = useResponsiveSize();
  const deviceInfo = useDeviceInfo();
  const gracefulConfig = useGracefulDegradation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // 优化：使用useCallback缓存resize处理函数
  const handleResize = useCallback(() => {
    setWindowWidth(window.innerWidth);
  }, []);
  
  // 监听窗口尺寸变化
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);
  
  const [playbackState, setPlaybackState] = useState<VideoPlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    isMuted: false,
    playbackRate: 1.0,
    isFullscreen: false
  });
  
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [gestureIndicator, setGestureIndicator] = useState<{
    type: string;
    message: string;
    visible: boolean;
  }>({ type: '', message: '', visible: false });
  
  const [volumeIndicator, setVolumeIndicator] = useState<{
    visible: boolean;
    timeout: NodeJS.Timeout | null;
  }>({ visible: false, timeout: null });
  
  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean;
    isBuffering: boolean;
    message: string;
  }>({ isLoading: false, isBuffering: false, message: '' });

  // 优化：使用useCallback缓存Tauri窗口回调函数
  const onFullscreenChange = useCallback((isFullscreen: boolean) => {
    console.log('Tauri window fullscreen changed:', isFullscreen);
    // 使用setTimeout延迟状态更新，避免在渲染期间调用setState
    setTimeout(() => {
      setPlaybackState(prev => {
        if (prev.isFullscreen !== isFullscreen) {
          const newState = { ...prev, isFullscreen };
          return newState;
        }
        return prev;
      });
    }, 0);
  }, []);

  const onSizeChange = useCallback((size: { width: number; height: number }) => {
    console.log('Tauri window size changed:', size);
    // 使用setTimeout延迟状态更新，避免在渲染期间调用setState
    setTimeout(() => {
      setWindowWidth(size.width);
    }, 0);
  }, []);

  const onFocusChange = useCallback((isFocused: boolean) => {
    console.log('Tauri window focus changed:', isFocused);
    // 窗口失去焦点时可以暂停视频（可选）
    if (!isFocused && playbackState.isPlaying) {
      // 可以在这里添加自动暂停逻辑
      console.log('Window lost focus, video still playing');
    }
  }, [playbackState.isPlaying]);

  // Tauri窗口状态管理
  const { windowState, windowControls, error: windowError } = useTauriWindow({
    onFullscreenChange,
    onSizeChange,
    onFocusChange,
    enableAutoSync: true,
    syncInterval: 2000 // 每2秒同步一次状态
  });

  // 桌面端响应式适配
  const desktopResponsive = useDesktopResponsive();
  const multiDisplayInfo = useMultiDisplaySupport();

  // Tauri全屏管理
  const tauriFullscreen = useTauriFullscreen(containerRef, {
    preferredMode: 'window', // 只使用窗口全屏，避免元素全屏API兼容性问题
    enableAutoSync: true,
    transitionDelay: 150,
    fallbackToElement: false, // 禁用元素全屏回退
    enableKeyboardShortcuts: true
  });

  // 跨平台兼容性适配
  const crossPlatform = useCrossPlatform();

  // Tauri通信优化
  const { 
    retryApiCall, 
    batchedEmit, 
    isConnected: tauriConnected,
    apiStats
  } = useTauriCommunication({
    apiThrottleDelay: 100,
    apiDebounceDelay: 300,
    enableEventBatching: true,
    batchSize: 5,
    enableCaching: true,
    cacheExpiry: 3000,
    enablePerformanceMonitoring: false // 在生产环境中禁用
  });

  // 桌面交互增强功能将在toggleFullscreen定义后初始化

  // 优化：使用useCallback缓存更新播放状态函数
  const updatePlaybackState = useCallback((updates: Partial<VideoPlaybackState>) => {
    setPlaybackState(prev => {
      const newState = { ...prev, ...updates };
      
      // 通知父组件播放状态变化
      if (updates.isPlaying !== undefined && onPlayStateChange) {
        onPlayStateChange(updates.isPlaying);
      }
      
      // 通知父组件时间更新
      if ((updates.currentTime !== undefined || updates.duration !== undefined) && onTimeUpdate) {
        onTimeUpdate(newState.currentTime, newState.duration);
      }
      
      return newState;
    });
  }, [onPlayStateChange, onTimeUpdate]);

  // 优化：使用useCallback缓存播放控制函数
  const togglePlayback = useCallback(async () => {
    if (!videoRef.current) return;
    console.log('togglePlayback called, current state:', playbackState.isPlaying);
    try {
      if (playbackState.isPlaying) {
        await videoRef.current.pause();
      } else {
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('播放控制失败:', error);
    }
  }, [playbackState.isPlaying]);

  const stopPlayback = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      updatePlaybackState({ isPlaying: false, currentTime: 0 });
    } catch (error) {
      console.error('停止播放失败:', error);
    }
  }, [updatePlaybackState]);

  const setVolume = useCallback((volume: number) => {
    if (!videoRef.current) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    videoRef.current.volume = clampedVolume;
    updatePlaybackState({ volume: clampedVolume });
    
    // 显示音量指示器
    setVolumeIndicator(prev => {
      if (prev.timeout) {
        clearTimeout(prev.timeout);
      }
      
      const timeout = setTimeout(() => {
        setVolumeIndicator(prev => ({ ...prev, visible: false }));
      }, 2000);
      
      return { visible: true, timeout };
    });
  }, [updatePlaybackState]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    const newMuted = !playbackState.isMuted;
    videoRef.current.muted = newMuted;
    updatePlaybackState({ isMuted: newMuted });
  }, [playbackState.isMuted, updatePlaybackState]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.playbackRate = rate;
    updatePlaybackState({ playbackRate: rate });
  }, [updatePlaybackState]);

  const seekTo = useCallback((time: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = time;
    updatePlaybackState({ currentTime: time });
  }, [updatePlaybackState]);

  const skip = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    
    const newTime = Math.max(0, Math.min(playbackState.duration, playbackState.currentTime + seconds));
    seekTo(newTime);
  }, [playbackState.currentTime, playbackState.duration, seekTo]);

  // 使用新的Tauri全屏管理功能（带通信优化）
  const toggleFullscreen = useCallback(async () => {
    try {
      // 使用优化的API调用，带重试机制
      await retryApiCall(async () => {
        await tauriFullscreen.toggleFullscreen();
      });
      
      // 发送批量事件通知
      batchedEmit('video_fullscreen_toggle', {
        isFullscreen: !tauriFullscreen.isFullscreen,
        timestamp: Date.now(),
        videoId: currentVideo?.id
      });
    } catch (error) {
      console.error('全屏切换失败:', error);
    }
  }, [tauriFullscreen, retryApiCall, batchedEmit, currentVideo?.id]);

  // 同步Tauri全屏状态到播放状态
  useEffect(() => {
    updatePlaybackState({ isFullscreen: tauriFullscreen.isFullscreen });
  }, [tauriFullscreen.isFullscreen, updatePlaybackState]);

  // 桌面交互增强 - 右键菜单
  const {
    contextMenu,
    menuItems,
    showContextMenu,
    hideContextMenu
  } = useVideoContextMenu(
    playbackState.isPlaying,
    playbackState.isMuted,
    playbackState.isFullscreen,
    togglePlayback, // 使用统一的播放控制函数
    togglePlayback, // 使用统一的播放控制函数
    toggleMute, // 使用统一的静音控制函数
    toggleMute, // 使用统一的静音控制函数
    toggleFullscreen,
    toggleFullscreen,
    () => {
      if (currentVideo) {
        navigator.clipboard.writeText(currentVideo.file_path);
        console.log('视频路径已复制到剪贴板');
      }
    },
    () => console.log('下载功能待实现'),
    () => console.log('显示视频信息')
  );

  // 桌面交互增强 - 键盘快捷键
  useVideoPlayerShortcuts(
    playbackState.isPlaying,
    playbackState.isMuted,
    playbackState.isFullscreen,
    playbackState.volume,
    playbackState.currentTime,
    playbackState.duration,
    togglePlayback, // 使用统一的播放控制函数
    togglePlayback, // 使用统一的播放控制函数
    toggleMute, // 使用统一的静音控制函数
    toggleMute, // 使用统一的静音控制函数
    setVolume, // 使用统一的音量控制函数
    seekTo, // 使用统一的跳转控制函数
    toggleFullscreen,
    toggleFullscreen,
    setPlaybackRate, // 使用统一的播放速度控制函数
    true // 启用快捷键
  );

  // 桌面交互增强 - 控制栏悬停效果
  const {
    showControls: showControlsHover
  } = useControlBarHover(3000, playbackState.isFullscreen);

  // 桌面交互增强 - 按钮悬停效果（暂时注释掉未使用的）
  // const playButtonHover = useButtonHover(1.1, 150);
  // const volumeButtonHover = useButtonHover(1.05, 150);
  // const fullscreenButtonHover = useButtonHover(1.05, 150);

  // 桌面交互增强 - 进度条悬停效果（暂时注释掉未使用的）
  // const {
  //   isHovered: progressHovered,
  //   hoverPosition,
  //   previewTime,
  //   progressBarProps
  // } = useProgressBarHover(
  //   (progress) => {
  //     if (videoRef.current) {
  //       const time = progress * playbackState.duration;
  //       videoRef.current.currentTime = time;
  //       updatePlaybackState({ currentTime: time });
  //     }
  //   },
  //   false
  // );

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  const showGestureIndicator = useCallback((type: string, message: string) => {
    setGestureIndicator({ type, message, visible: true });
    setTimeout(() => {
      setGestureIndicator(prev => ({ ...prev, visible: false }));
    }, 1500);
  }, []);

  // 优化：使用useMemo缓存格式化时间函数
  const formatTime = useMemo(() => {
    return (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };
  }, []);

  // 优化：使用useCallback缓存手势回调函数
  const gestureCallbacks = useMemo(() => ({
    onDoubleTap: () => {
      // 双击播放/暂停
      togglePlayback();
      showGestureIndicator('play-pause', playbackState.isPlaying ? '暂停' : '播放');
    },
    onSwipeLeft: () => {
      // 左滑快退10秒
      skip(-10);
      showGestureIndicator('rewind', '快退 10秒');
    },
    onSwipeRight: () => {
      // 右滑快进10秒
      skip(10);
      showGestureIndicator('forward', '快进 10秒');
    },
    onSwipeUp: (gesture: any) => {
      // 向上滑动增加音量
      const volumeIncrease = Math.abs(gesture.deltaY) / 200;
      const newVolume = Math.min(1, playbackState.volume + volumeIncrease);
      setVolume(newVolume);
      showGestureIndicator('volume-up', `音量 ${Math.round(newVolume * 100)}%`);
    },
    onSwipeDown: (gesture: any) => {
      // 向下滑动减少音量
      const volumeDecrease = Math.abs(gesture.deltaY) / 200;
      const newVolume = Math.max(0, playbackState.volume - volumeDecrease);
      setVolume(newVolume);
      showGestureIndicator('volume-down', `音量 ${Math.round(newVolume * 100)}%`);
    },
    onLongPress: () => {
      // 长按显示/隐藏控制栏
      setShowControls(!showControls);
      showGestureIndicator('controls', showControls ? '隐藏控制栏' : '显示控制栏');
    },
    onTap: () => {
      // 单击显示控制栏
      showControlsTemporarily();
    }
  }), [togglePlayback, showGestureIndicator, playbackState.isPlaying, skip, playbackState.volume, setVolume, showControls, showControlsTemporarily]);

  // 视频区域触控手势支持
  const videoAreaGestures = useTouchOptimization(
    {
      longPressDelay: 500,
      doubleTapDelay: 300,
      swipeThreshold: 50,
      enableHapticFeedback: true,
      preventDefaultTouch: false // 不阻止默认行为，保持视频播放器的原生行为
    },
    gestureCallbacks
  );

  // 优化：使用useMemo缓存视频事件处理器
  const videoEventHandlers = useMemo(() => {
    const handleLoadStart = () => {
      setLoadingState({ isLoading: true, isBuffering: false, message: '正在加载视频...' });
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        updatePlaybackState({ duration: videoRef.current.duration });
      }
    };

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        updatePlaybackState({ currentTime: videoRef.current.currentTime });
      }
    };

    const handlePlay = () => {
      updatePlaybackState({ isPlaying: true });
      setLoadingState({ isLoading: false, isBuffering: false, message: '' });
    };

    const handlePause = () => {
      updatePlaybackState({ isPlaying: false });
    };

    const handleEnded = () => {
      updatePlaybackState({ isPlaying: false, currentTime: 0 });
      onVideoEnd?.();
    };

    const handleVolumeChange = () => {
      if (videoRef.current) {
        updatePlaybackState({ 
          volume: videoRef.current.volume,
          isMuted: videoRef.current.muted
        });
      }
    };

    const handleRateChange = () => {
      if (videoRef.current) {
        updatePlaybackState({ playbackRate: videoRef.current.playbackRate });
      }
    };

    const handleWaiting = () => {
      setLoadingState({ isLoading: false, isBuffering: true, message: '正在缓冲...' });
    };

    const handleCanPlay = () => {
      setLoadingState({ isLoading: false, isBuffering: false, message: '' });
    };

    const handleError = () => {
      setLoadingState({ isLoading: false, isBuffering: false, message: '视频加载失败' });
      console.error('视频播放错误');
    };

    return {
      handleLoadStart,
      handleLoadedMetadata,
      handleTimeUpdate,
      handlePlay,
      handlePause,
      handleEnded,
      handleVolumeChange,
      handleRateChange,
      handleWaiting,
      handleCanPlay,
      handleError
    };
  }, [updatePlaybackState, onVideoEnd]);

  // 视频事件监听
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    const {
      handleLoadStart,
      handleLoadedMetadata,
      handleTimeUpdate,
      handlePlay,
      handlePause,
      handleEnded,
      handleVolumeChange,
      handleRateChange,
      handleWaiting,
      handleCanPlay,
      handleError
    } = videoEventHandlers;

    // 设置视频源
    const videoSrc = convertFileSrc(currentVideo.file_path);
    video.src = videoSrc;
    
    // 添加事件监听器
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    // 清理函数
    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [currentVideo]);

  // 清理控制栏超时
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // 优化：使用useCallback缓存键盘事件处理器
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && playbackState.isFullscreen) {
      console.log('ESC key pressed, exiting fullscreen');
      toggleFullscreen();
    }
  }, [playbackState.isFullscreen, toggleFullscreen]);

  // ESC键监听
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 窗口状态监听 - 简化版本，减少API调用
  useEffect(() => {
    // 暂时禁用窗口状态监听，避免渲染问题
    // 全屏状态将通过useTauriFullscreen hook管理
    return () => {};
  }, []);

  // 优化：使用useMemo缓存样式计算
  const containerClasses = useMemo(() => {
    const baseClasses = `relative w-full h-full bg-black rounded-lg overflow-hidden group ${
      playbackState.isFullscreen ? 'video-fullscreen' : ''
    }`;
    
    const responsiveClasses = desktopResponsive.containerClasses;
    const platformClasses = crossPlatform.platformClasses;
    
    return getGracefulDegradationClasses(
      gracefulConfig,
      `${baseClasses} ${responsiveClasses} ${platformClasses}`
    );
  }, [gracefulConfig, playbackState.isFullscreen, desktopResponsive.containerClasses, crossPlatform.platformClasses]);

  const videoInfoClasses = useMemo(() => {
    return `absolute top-2 left-2 text-white transition-opacity duration-300 ${
      showControls ? 'opacity-100' : 'opacity-0'
    } ${windowWidth < 400 ? 'hidden' : 'block'}`;
  }, [showControls, windowWidth]);

  const gestureIndicatorClasses = useMemo(() => {
    return getGracefulDegradationClasses(
      gracefulConfig,
      `absolute top-1/2 left-1/2 pointer-events-none ${
        gestureIndicator.visible ? 'gesture-indicator' : 'opacity-0'
      }`
    );
  }, [gracefulConfig, gestureIndicator.visible]);

  const volumeIndicatorClasses = useMemo(() => {
    return getGracefulDegradationClasses(
      gracefulConfig,
      `absolute top-1/4 right-8 pointer-events-none transition-opacity duration-300 ${
        volumeIndicator.visible ? 'opacity-100' : 'opacity-0'
      }`
    );
  }, [gracefulConfig, volumeIndicator.visible]);

  if (!currentVideo) {
    return (
      <div className={`flex items-center justify-center h-64 ${
        actualTheme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
      } rounded-lg ${className}`}>
        <div className="text-center">
          <Play size={48} className="mx-auto mb-4 opacity-50" />
          <p>选择一个视频开始播放</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 全屏样式 - 简化版本 */}
      {playbackState.isFullscreen && (
        <style>{`
          .video-fullscreen {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
          }
          
          .video-fullscreen video {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
          }
        `}</style>
      )}
      
      <div 
        ref={containerRef}
        className={containerClasses}
        onMouseMove={() => {
          showControlsTemporarily();
          showControlsHover();
        }}
        onMouseLeave={() => setShowControls(false)}
        onDoubleClick={toggleFullscreen}
        onContextMenu={showContextMenu}
        // 可访问性增强
        role="application"
        aria-label="视频播放器"
        tabIndex={0}
      >
        {/* 视频元素 */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          onClick={togglePlayback}
          onDoubleClick={toggleFullscreen}
          {...videoAreaGestures.touchHandlers}
          style={{
            touchAction: 'manipulation', // 优化触控响应
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
        />

        {/* 加载和缓冲指示器 */}
        {(loadingState.isLoading || loadingState.isBuffering) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <LoadingSpinner
              size="large"
              type={loadingState.isBuffering ? 'dots' : 'spinner'}
              message={loadingState.message}
            />
          </div>
        )}

        {/* 控制栏 - 根据窗口大小和全屏状态选择不同的UI */}
        {playbackState.isFullscreen ? (
          <FullscreenUI
            isPlaying={playbackState.isPlaying}
            currentTime={playbackState.currentTime}
            duration={playbackState.duration}
            volume={playbackState.volume}
            isMuted={playbackState.isMuted}
            playbackRate={playbackState.playbackRate}
            videoTitle={currentVideo?.title || ''}
            videoResolution={currentVideo?.resolution}
            showControls={showControls}
            onPlayPause={togglePlayback}
            onSeek={seekTo}
            onVolumeChange={setVolume}
            onMuteToggle={toggleMute}
            onPlaybackRateChange={setPlaybackRate}
            onFullscreenExit={toggleFullscreen}
            onSkip={skip}
            onPrevious={onPrevious}
            onNext={onNext}
          />
        ) : desktopResponsive.microWindowConfig.enabled ? (
          // 极小窗口使用专用控制组件
          <MicroWindowControls
            isPlaying={playbackState.isPlaying}
            currentTime={playbackState.currentTime}
            duration={playbackState.duration}
            volume={playbackState.volume}
            isMuted={playbackState.isMuted}
            sizeType={desktopResponsive.sizeType}
            microConfig={desktopResponsive.microWindowConfig}
            windowSize={desktopResponsive.windowSize}
            onPlayPause={togglePlayback}
            onSeek={seekTo}
            onVolumeChange={setVolume}
            onMuteToggle={toggleMute}
            onFullscreenToggle={toggleFullscreen}
            showControls={showControls}
          />
        ) : (
          // 正常窗口使用标准控制组件
          <VideoControls
            isPlaying={playbackState.isPlaying}
            currentTime={playbackState.currentTime}
            duration={playbackState.duration}
            volume={playbackState.volume}
            isMuted={playbackState.isMuted}
            playbackRate={playbackState.playbackRate}
            isFullscreen={playbackState.isFullscreen}
            onPlayPause={togglePlayback}
            onStop={stopPlayback}
            onSeek={seekTo}
            onVolumeChange={setVolume}
            onMuteToggle={toggleMute}
            onPlaybackRateChange={setPlaybackRate}
            onFullscreenToggle={toggleFullscreen}
            onSkip={skip}
            onPrevious={onPrevious}
            onNext={onNext}
            showControls={showControls}
          />
        )}

        {/* 视频信息覆盖层 - 根据窗口大小选择不同的显示方式 */}
        {!playbackState.isFullscreen && (
          desktopResponsive.microWindowConfig.enabled ? (
            // 极小窗口使用专用信息组件
            <MicroWindowInfo
              title={currentVideo.title}
              windowSize={desktopResponsive.windowSize}
              sizeType={desktopResponsive.sizeType}
            />
          ) : (
            // 正常窗口使用标准信息显示
            <div className={videoInfoClasses}>
              <h3 className={`${responsiveSizes.fontSize} font-semibold truncate max-w-xs`}>{currentVideo.title}</h3>
              {currentVideo.resolution && windowWidth >= 600 && (
                <p className={`${responsiveSizes.fontSize === 'text-xs' ? 'text-xs' : 'text-sm'} opacity-75`}>
                  {currentVideo.resolution.width}x{currentVideo.resolution.height}
                </p>
              )}
              {/* 窗口状态信息 - 开发调试用 */}
              {windowWidth >= 800 && (
                <div className={`${responsiveSizes.fontSize === 'text-xs' ? 'text-xs' : 'text-sm'} opacity-50 mt-1`}>
                  窗口: {windowState.size.width}x{windowState.size.height}
                  {windowState.isMaximized && ' (最大化)'}
                  {windowState.isMinimized && ' (最小化)'}
                  {!windowState.isFocused && ' (失焦)'}
                  {/* 显示桌面响应式信息 */}
                  <br />
                  响应式: {desktopResponsive.sizeType} ({desktopResponsive.orientation})
                  {multiDisplayInfo.scaleFactor !== 1 && ` 缩放: ${multiDisplayInfo.scaleFactor}x`}
                </div>
              )}
            </div>
          )
        )}

        {/* 窗口错误提示 */}
        {windowError && (
          <div className="absolute top-2 right-2 bg-red-500/80 text-white px-3 py-2 rounded-lg backdrop-blur-sm text-sm">
            窗口控制错误: {windowError}
          </div>
        )}

        {/* Tauri全屏状态指示器 */}
        {tauriFullscreen.error && (
          <div className="absolute top-12 right-2 bg-orange-500/80 text-white px-3 py-2 rounded-lg backdrop-blur-sm text-sm">
            全屏错误: {tauriFullscreen.error}
          </div>
        )}

        {/* 全屏过渡指示器 */}
        {tauriFullscreen.isTransitioning && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>切换全屏模式...</span>
            </div>
          </div>
        )}

        {/* 全屏模式指示器 - 开发调试用 */}
        {windowWidth >= 800 && tauriFullscreen.mode !== 'none' && (
          <div className="absolute bottom-16 right-2 bg-blue-500/80 text-white px-2 py-1 rounded text-xs">
            全屏模式: {tauriFullscreen.mode}
            {tauriFullscreen.isElementFullscreen && ' 📺'}
            {tauriFullscreen.isWindowFullscreen && ' 🖥️'}
          </div>
        )}

        {/* 平台信息指示器 - 开发调试用 */}
        {windowWidth >= 800 && crossPlatform.isDetected && (
          <div className="absolute bottom-8 right-2 bg-green-500/80 text-white px-2 py-1 rounded text-xs">
            平台: {crossPlatform.platform}
            {crossPlatform.isWindows && ' 🪟'}
            {crossPlatform.isMacOS && ' 🍎'}
            {crossPlatform.isLinux && ' 🐧'}
            {crossPlatform.hasCapability('supportsTouchInput') && ' 👆'}
          </div>
        )}

        {/* Tauri通信状态指示器 - 开发调试用 */}
        {windowWidth >= 800 && (
          <div className="absolute bottom-0 right-2 bg-purple-500/80 text-white px-2 py-1 rounded text-xs">
            通信: {tauriConnected ? '✅' : '❌'} 
            API: {apiStats.totalCalls}次
            {apiStats.cachedCalls > 0 && ` 缓存: ${apiStats.cachedCalls}`}
            {apiStats.throttledCalls > 0 && ` 节流: ${apiStats.throttledCalls}`}
          </div>
        )}

        {/* 手势反馈指示器 */}
        <div className={gestureIndicatorClasses}>
          <div className={getGracefulDegradationClasses(
            gracefulConfig,
            "bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20 gpu-accelerated"
          )}>
            <div className="flex items-center space-x-2">
              {/* 手势图标 */}
              <div className="text-cyan-400">
                {gestureIndicator.type === 'play-pause' && (
                  playbackState.isPlaying ? <Pause size={20} /> : <Play size={20} />
                )}
                {gestureIndicator.type === 'rewind' && <RotateCcw size={20} />}
                {gestureIndicator.type === 'forward' && <RotateCw size={20} />}
                {gestureIndicator.type === 'volume-up' && <Volume2 size={20} />}
                {gestureIndicator.type === 'volume-down' && <VolumeX size={20} />}
                {gestureIndicator.type === 'controls' && <ChevronUp size={20} />}
              </div>
              
              {/* 手势文本 */}
              <span className="text-sm font-medium">{gestureIndicator.message}</span>
            </div>
          </div>
        </div>

        {/* 音量波形指示器 */}
        <div className={volumeIndicatorClasses}>
          <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 gpu-accelerated">
            <div className="flex items-center space-x-3">
              <VolumeWaveIndicator
                volume={playbackState.volume}
                isMuted={playbackState.isMuted}
                isVisible={volumeIndicator.visible}
              />
              <span className="text-white text-sm font-mono min-w-[3rem]">
                {Math.round(playbackState.volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 右键菜单 */}
      <ContextMenu
        items={menuItems}
        visible={contextMenu.visible}
        position={contextMenu.position}
        onClose={hideContextMenu}
      />
    </>
  );
}); 