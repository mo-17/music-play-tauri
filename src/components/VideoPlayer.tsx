import React, { useState, useRef, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { VideoFile } from '../types/video';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { convertFileSrc } from '@tauri-apps/api/core';
import { NeonProgressBar } from './NeonProgressBar';

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

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
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

  // 更新播放状态
  const updatePlaybackState = (updates: Partial<VideoPlaybackState>) => {
    setPlaybackState(prev => {
      const newState = { ...prev, ...updates };
      
      // 通知父组件播放状态变化
      if (updates.isPlaying !== undefined) {
        onPlayStateChange?.(newState.isPlaying);
      }
      
      // 通知父组件时间更新
      if (updates.currentTime !== undefined || updates.duration !== undefined) {
        onTimeUpdate?.(newState.currentTime, newState.duration);
      }
      
      return newState;
    });
  };

  // 播放/暂停切换
  const togglePlayback = async () => {
    if (!videoRef.current || !currentVideo) return;

    try {
      if (playbackState.isPlaying) {
        videoRef.current.pause();
      } else {
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Failed to toggle video playback:', error);
    }
  };

  // 停止播放
  const stopPlayback = async () => {
    if (!videoRef.current) return;

    try {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      updatePlaybackState({ isPlaying: false, currentTime: 0 });
    } catch (error) {
      console.error('Failed to stop video playback:', error);
    }
  };

  // 设置音量
  const setVolume = (volume: number) => {
    if (!videoRef.current) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    videoRef.current.volume = clampedVolume;
    updatePlaybackState({ volume: clampedVolume });
  };

  // 切换静音
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newMuted = !playbackState.isMuted;
    videoRef.current.muted = newMuted;
    updatePlaybackState({ isMuted: newMuted });
  };

  // 设置播放速度
  const setPlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    
    const clampedRate = Math.max(0.25, Math.min(2, rate));
    videoRef.current.playbackRate = clampedRate;
    updatePlaybackState({ playbackRate: clampedRate });
  };

  // 跳转到指定时间
  const seekTo = (time: number) => {
    if (!videoRef.current) return;
    
    const clampedTime = Math.max(0, Math.min(playbackState.duration, time));
    videoRef.current.currentTime = clampedTime;
    updatePlaybackState({ currentTime: clampedTime });
  };

  // 快进/快退
  const skip = (seconds: number) => {
    const newTime = playbackState.currentTime + seconds;
    seekTo(newTime);
  };

  // 切换全屏
  const toggleFullscreen = async () => {
    console.log('toggleFullscreen called, current state:', playbackState.isFullscreen);
    
    try {
      const window = getCurrentWindow();
      const newFullscreenState = !playbackState.isFullscreen;
      
      if (newFullscreenState) {
        console.log('Entering dual fullscreen mode...');
        // 1. 先设置窗口全屏
        await window.setFullscreen(true);
        console.log('Window fullscreen enabled');
        
        // 2. 然后设置视频元素全屏（通过CSS）
        updatePlaybackState({ isFullscreen: true });
        console.log('Video element fullscreen enabled');
      } else {
        console.log('Exiting dual fullscreen mode...');
        // 1. 先取消视频元素全屏
        updatePlaybackState({ isFullscreen: false });
        console.log('Video element fullscreen disabled');
        
        // 2. 然后取消窗口全屏
        await window.setFullscreen(false);
        console.log('Window fullscreen disabled');
      }
      
      console.log('Dual fullscreen toggled to:', newFullscreenState);
      
    } catch (error: any) {
      console.error('Failed to toggle dual fullscreen:', error);
      // 如果Tauri API失败，至少保持CSS全屏功能
      const newFullscreenState = !playbackState.isFullscreen;
      updatePlaybackState({ isFullscreen: newFullscreenState });
      console.log('Fallback to CSS-only fullscreen:', newFullscreenState);
    }
  };

  // 显示/隐藏控制栏
  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (playbackState.isPlaying) {
        setShowControls(false);
      }
    }, 3000);
    
    setControlsTimeout(timeout);
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

  // 视频事件处理
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      updatePlaybackState({ duration: video.duration });
    };

    const handleTimeUpdate = () => {
      updatePlaybackState({ currentTime: video.currentTime });
    };

    const handlePlay = () => {
      updatePlaybackState({ isPlaying: true });
    };

    const handlePause = () => {
      updatePlaybackState({ isPlaying: false });
    };

    const handleEnded = () => {
      updatePlaybackState({ isPlaying: false });
      onVideoEnd?.();
    };

    const handleVolumeChange = () => {
      updatePlaybackState({ 
        volume: video.volume,
        isMuted: video.muted 
      });
    };

    const handleRateChange = () => {
      updatePlaybackState({ playbackRate: video.playbackRate });
    };

    // 添加事件监听器
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
    };
  }, []);

  // 当前视频变化时更新视频源
  useEffect(() => {
    if (!videoRef.current || !currentVideo) return;

    const videoSrc = convertFileSrc(currentVideo.file_path);
    console.log('Loading video:', currentVideo.title, 'from:', videoSrc);
    
    videoRef.current.src = videoSrc;
    videoRef.current.load();
    
    // 如果应该播放，则自动播放
    if (isPlaying) {
      videoRef.current.play().catch(console.error);
    }
  }, [currentVideo]);

  // 外部播放状态变化时同步
  useEffect(() => {
    if (!videoRef.current) return;

    if (isPlaying && !playbackState.isPlaying) {
      videoRef.current.play().catch(console.error);
    } else if (!isPlaying && playbackState.isPlaying) {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // ESC键监听
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && playbackState.isFullscreen) {
        console.log('ESC key pressed, exiting fullscreen');
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [playbackState.isFullscreen]);

  // 窗口状态监听
  useEffect(() => {
    const setupWindowListener = async () => {
      try {
        const window = getCurrentWindow();
        
        // 监听窗口状态变化
        const unlisten = await window.listen('tauri://resize', async () => {
          const isWindowFullscreen = await window.isFullscreen();
          console.log('Window state changed - Fullscreen:', isWindowFullscreen);
          
          // 如果窗口退出全屏但视频状态还是全屏，同步状态
          if (!isWindowFullscreen && playbackState.isFullscreen) {
            console.log('Window exited fullscreen, syncing video state');
            updatePlaybackState({ isFullscreen: false });
          }
        });
        
        return unlisten;
      } catch (error) {
        console.error('Failed to setup window listener:', error);
      }
    };
    
    let unlisten: (() => void) | undefined;
    
    setupWindowListener().then((unlistenFn) => {
      unlisten = unlistenFn;
    });
    
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [playbackState.isFullscreen]);

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
      {/* 全屏样式 */}
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
      
      <div 
        ref={containerRef}
        className={`relative w-full h-full bg-black rounded-lg overflow-hidden group ${
          playbackState.isFullscreen ? 'video-fullscreen' : ''
        }`}
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => setShowControls(false)}
        onDoubleClick={toggleFullscreen}
      >
        {/* 视频元素 */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          onClick={togglePlayback}
          onDoubleClick={toggleFullscreen}
        />

        {/* 控制栏 */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* 进度条 */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-white text-sm">
              <span>{formatTime(playbackState.currentTime)}</span>
              <div className="flex-1 relative">
                <NeonProgressBar
                  value={playbackState.currentTime}
                  max={playbackState.duration || 0}
                  onChange={seekTo}
                  height="thin"
                  color="cyan"
                  className="mx-1"
                />
              </div>
              <span>{formatTime(playbackState.duration)}</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* 上一个/下一个 */}
              <button
                onClick={onPrevious}
                disabled={!onPrevious}
                className="text-white hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SkipBack size={20} />
              </button>

              {/* 快退 */}
              <button
                onClick={() => skip(-10)}
                className="text-white hover:text-blue-400 transition-colors"
              >
                <RotateCcw size={20} />
              </button>

              {/* 播放/暂停 */}
              <button
                onClick={togglePlayback}
                className="text-white hover:text-blue-400 transition-colors p-2"
              >
                {playbackState.isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>

              {/* 停止 */}
              <button
                onClick={stopPlayback}
                className="text-white hover:text-blue-400 transition-colors"
              >
                <Square size={20} />
              </button>

              {/* 快进 */}
              <button
                onClick={() => skip(10)}
                className="text-white hover:text-blue-400 transition-colors"
              >
                <RotateCw size={20} />
              </button>

              {/* 下一个 */}
              <button
                onClick={onNext}
                disabled={!onNext}
                className="text-white hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward size={20} />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* 播放速度 */}
              <select
                value={playbackState.playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                className="bg-black/50 text-white text-sm rounded px-2 py-1 border border-white/30"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              {/* 音量控制 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {playbackState.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div className="w-20">
                  <NeonProgressBar
                    value={playbackState.isMuted ? 0 : playbackState.volume}
                    max={1}
                    onChange={setVolume}
                    height="thin"
                    color="cyan"
                  />
                </div>
              </div>

              {/* 全屏 */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {playbackState.isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* 视频信息覆盖层 */}
        <div className={`absolute top-4 left-4 text-white transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          <h3 className="text-lg font-semibold">{currentVideo.title}</h3>
          {currentVideo.resolution && (
            <p className="text-sm opacity-75">
              {currentVideo.resolution.width}x{currentVideo.resolution.height}
            </p>
          )}
        </div>
      </div>
    </>
  );
}; 