import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { SkipBack, SkipForward, Volume2, VolumeX, BarChart3 } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { NeonProgressBar } from './NeonProgressBar';
import { AnimatedPlayButton } from './AnimatedPlayButton';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { PlaybackModeInfo } from '../types/playback';
import PlaybackModeButton from './PlaybackModeButton';

interface PlaybackState {
  is_playing: boolean;
  current_track: string | null;
  position: number;
  duration: number;
  volume: number;
}

interface PlaybackControlsProps {
  currentTrack?: {
    title: string;
    artist: string;
    file_path: string;
  };
  playlist?: Array<{
    title: string;
    artist: string;
    album: string;
    duration: number;
    file_path: string;
  }>;
  onTrackChange?: (direction: 'next' | 'prev') => void;
  onPlaybackStateChange?: (state: PlaybackState) => void;
  shouldResume?: boolean;
  onResumeComplete?: () => void;
  shouldPause?: boolean;
  onPauseComplete?: () => void;
  playbackModeInfo?: PlaybackModeInfo;
  onTogglePlaybackMode?: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentTrack,
  playlist,
  onTrackChange,
  onPlaybackStateChange,
  shouldResume,
  onResumeComplete,
  shouldPause,
  onPauseComplete,
  playbackModeInfo,
  onTogglePlaybackMode
}) => {
  const { actualTheme } = useTheme();
  
  // 调试信息
  console.log('PlaybackControls: currentTrack:', currentTrack?.title);
  console.log('PlaybackControls: playlist length:', playlist?.length || 0);
  const { sendTrackNotification } = useNotifications();
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    is_playing: false,
    current_track: null,
    position: 0,
    duration: 0,
    volume: 1.0
  });
  const [isMuted, setIsMuted] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 获取播放状态
  const fetchPlaybackState = async () => {
    try {
      const state = await invoke<PlaybackState>('get_playback_state');
      setPlaybackState(state);
      // 通知父组件状态变化
      onPlaybackStateChange?.(state);
    } catch (error) {
      console.error('Failed to get playback state:', error);
    }
  };

  // 播放/暂停切换
  const togglePlayback = async () => {
    try {
      if (playbackState.is_playing) {
        // 暂停音频
        console.log('Pausing audio...');
        if (audioRef.current) {
          audioRef.current.pause();
        }
        await invoke('pause_audio');
        console.log('Audio paused');
      } else if (playbackState.current_track) {
        // 恢复播放
        console.log('Resuming audio...');
        if (audioRef.current) {
          // 确保音频源正确
          if (!audioRef.current.src || audioRef.current.src === '') {
            const audioSrc = convertFileSrc(playbackState.current_track);
            console.log('Setting audio src for resume:', audioSrc);
            audioRef.current.src = audioSrc;
            audioRef.current.load();
          }
          
          try {
            await audioRef.current.play();
            console.log('Audio resumed successfully');
          } catch (playError) {
            console.error('Failed to resume audio:', playError);
            // 如果播放失败，尝试重新加载
            const audioSrc = convertFileSrc(playbackState.current_track);
            audioRef.current.src = audioSrc;
            audioRef.current.load();
            await audioRef.current.play();
          }
        }
        await invoke('resume_audio');
        console.log('Backend resume called');
      } else if (currentTrack) {
        // 开始播放新曲目
        console.log('Starting new track...');
        await playNewTrack(currentTrack.file_path);
      }
      await fetchPlaybackState();
    } catch (error) {
      console.error('Failed to toggle playback:', error);
    }
  };

  // 播放新曲目
  const playNewTrack = async (filePath: string) => {
    try {
      if (audioRef.current) {
        // 转换文件路径为可访问的URL
        const audioSrc = convertFileSrc(filePath);
        console.log('Original file path:', filePath);
        console.log('Converted audio src:', audioSrc);
        
        audioRef.current.src = audioSrc;
        audioRef.current.load();
        
        // 等待音频加载完成后播放
        audioRef.current.onloadedmetadata = async () => {
          if (audioRef.current) {
            console.log('Audio metadata loaded, duration:', audioRef.current.duration);
            // 更新后端状态
            await invoke('play_audio', { filePath });
            await invoke('update_duration', { duration: audioRef.current.duration });
            
            try {
              await audioRef.current.play();
              console.log('Audio play() called successfully');
              
              // 发送播放通知
              if (currentTrack) {
                const trackForNotification = {
                  title: currentTrack.title,
                  artist: currentTrack.artist || 'Unknown Artist',
                  album: 'Unknown Album',
                  duration: 0,
                  file_path: currentTrack.file_path
                };
                await sendTrackNotification(trackForNotification, true);
              }
            } catch (playError) {
              console.error('Failed to play audio:', playError);
            }
          }
        };
        
        // 添加错误处理
        audioRef.current.onerror = (error) => {
          console.error('Audio error:', error);
        };
        
        audioRef.current.oncanplay = () => {
          console.log('Audio can play');
        };
      }
    } catch (error) {
      console.error('Failed to play new track:', error);
    }
  };

  // 停止播放
  const stopPlayback = async () => {
    try {
      await invoke('stop_audio');
      await fetchPlaybackState();
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  };

  // 设置音量
  const setVolume = async (volume: number) => {
    try {
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
      await invoke('set_volume', { volume });
      await fetchPlaybackState();
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  };

  // 切换静音
  const toggleMute = async () => {
    if (isMuted) {
      await setVolume(1.0);
      setIsMuted(false);
    } else {
      await setVolume(0.0);
      setIsMuted(true);
    }
  };

  // 跳转到指定位置
  const seekTo = async (position: number) => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = position;
      }
      await invoke('seek_to', { position });
      await fetchPlaybackState();
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  };

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio) {
        invoke('seek_to', { position: audio.currentTime });
      }
    };

    const handleLoadedMetadata = () => {
      if (audio) {
        invoke('seek_to', { position: 0 });
        invoke('update_duration', { duration: audio.duration });
      }
    };

    const handleEnded = () => {
      console.log('Audio ended, current mode:', playbackModeInfo?.mode);
      invoke('stop_audio');
      
      // 根据播放模式决定下一步行为
      if (playbackModeInfo?.mode === 'loop_single' && currentTrack) {
        // 单曲循环：重新播放当前歌曲
        console.log('Single loop: replaying current track');
        setTimeout(() => {
          playNewTrack(currentTrack.file_path);
        }, 100);
      } else if (playbackModeInfo?.mode === 'sequence') {
        // 顺序播放：只有在不是最后一首时才播放下一首
        if (playlist && currentTrack) {
          const currentIndex = playlist.findIndex(track => track.file_path === currentTrack.file_path);
          if (currentIndex < playlist.length - 1) {
            onTrackChange?.('next');
          } else {
            console.log('Sequence mode: reached end of playlist, stopping');
          }
        }
      } else {
        // 列表循环和随机播放：继续播放下一首
        onTrackChange?.('next');
      }
    };

    const handlePlay = () => {
      console.log('Audio play event triggered');
      fetchPlaybackState();
    };

    const handlePause = () => {
      console.log('Audio pause event triggered');
      fetchPlaybackState();
    };

    const handleError = (error: Event) => {
      console.error('Audio error event:', error);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [onTrackChange, playbackModeInfo, currentTrack, playlist]);

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 定期更新播放状态
  useEffect(() => {
    const interval = setInterval(fetchPlaybackState, 1000);
    return () => clearInterval(interval);
  }, []);

  // 初始化时获取状态
  useEffect(() => {
    fetchPlaybackState();
  }, []);

  // 当currentTrack变化时，自动播放新曲目
  useEffect(() => {
    if (currentTrack && currentTrack.file_path !== playbackState.current_track) {
      console.log('PlaybackControls: currentTrack changed, playing new track:', currentTrack.title);
      playNewTrack(currentTrack.file_path);
    }
  }, [currentTrack, playbackState.current_track]);

  // 处理恢复播放请求
  useEffect(() => {
    if (shouldResume && !playbackState.is_playing && playbackState.current_track) {
      console.log('PlaybackControls: Resume requested, calling togglePlayback');
      togglePlayback();
      onResumeComplete?.();
    }
  }, [shouldResume]);

  // 处理暂停播放请求
  useEffect(() => {
    if (shouldPause && playbackState.is_playing) {
      console.log('PlaybackControls: Pause requested, calling togglePlayback');
      togglePlayback();
      onPauseComplete?.();
    }
  }, [shouldPause]);

  const currentTrackInfo = currentTrack || (playbackState.current_track ? {
    title: playbackState.current_track.split('/').pop() || 'Unknown',
    artist: 'Unknown Artist',
    file_path: playbackState.current_track
  } : null);

  // 调试信息
  console.log('PlaybackControls: currentTrack:', currentTrack?.title);
  console.log('PlaybackControls: onTrackChange available:', !!onTrackChange);

  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t transition-colors ${
      actualTheme === 'dark'
        ? 'bg-gray-900 border-gray-700'
        : 'bg-white border-gray-200'
    } p-3 md:p-4`}>
      {/* 音频可视化器 */}
      {showVisualizer && (
        <div className="mb-4">
          <AudioVisualizer 
            audioRef={audioRef} 
            isPlaying={playbackState.is_playing}
            className="h-16 md:h-24"
          />
        </div>
      )}
      
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between max-w-screen-xl mx-auto">
          {/* 当前播放信息 */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-md flex items-center justify-center transition-colors ${
              actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <span className={`text-xs transition-colors ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>♪</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-medium truncate transition-colors ${
                actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {currentTrackInfo?.title || 'No track selected'}
              </div>
              <div className={`text-xs truncate transition-colors ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {currentTrackInfo?.artist || ''}
              </div>
            </div>
          </div>

          {/* 播放控制按钮 */}
          <div className="flex items-center space-x-4">
            {/* 播放模式按钮 */}
            {playbackModeInfo && onTogglePlaybackMode && (
              <PlaybackModeButton
                playbackModeInfo={playbackModeInfo}
                onToggle={onTogglePlaybackMode}
              />
            )}
            
            <button
              onClick={() => onTrackChange?.('prev')}
              className={`transition-colors ${
                actualTheme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={!currentTrackInfo || !playlist || playlist.length <= 1}
            >
              <SkipBack size={20} />
            </button>
            
            <AnimatedPlayButton
              isPlaying={playbackState.is_playing}
              onClick={togglePlayback}
              disabled={!currentTrackInfo}
              size="medium"
              variant="primary"
            />
            
            <button
              onClick={() => onTrackChange?.('next')}
              className={`transition-colors ${
                actualTheme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={!currentTrackInfo || !playlist || playlist.length <= 1}
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* 进度条和时间 */}
          <div className="flex items-center space-x-3 flex-1 justify-center max-w-lg">
            <span className={`text-xs min-w-[40px] text-right transition-colors ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {formatTime(playbackState.position)}
            </span>
            <div className="flex-1 relative">
              <NeonProgressBar
                value={playbackState.position}
                max={playbackState.duration || 100}
                onChange={seekTo}
                variant="primary"
                disabled={!currentTrackInfo}
                className="w-full"
              />
            </div>
            <span className={`text-xs min-w-[40px] text-left transition-colors ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {formatTime(playbackState.duration)}
            </span>
          </div>

          {/* 音量控制 */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            <button
              onClick={() => setShowVisualizer(!showVisualizer)}
              className={`transition-colors ${
                showVisualizer 
                  ? 'text-blue-400' 
                  : actualTheme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
              title="切换音频可视化"
            >
              <BarChart3 size={20} />
            </button>
            <button
              onClick={toggleMute}
              className={`transition-colors ${
                actualTheme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {isMuted || playbackState.volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="w-24">
              <NeonProgressBar
                value={playbackState.volume}
                max={1}
                onChange={setVolume}
                variant="volume"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Top Row: Track Info and Controls */}
          <div className="flex items-center justify-between mb-3">
            {/* Track Info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <span className={`text-xs transition-colors ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>♪</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium truncate transition-colors ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {currentTrackInfo?.title || 'No track selected'}
                </div>
                <div className={`text-xs truncate transition-colors ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {currentTrackInfo?.artist || ''}
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center space-x-2">
              {/* 播放模式按钮 */}
              {playbackModeInfo && onTogglePlaybackMode && (
                <PlaybackModeButton
                  playbackModeInfo={playbackModeInfo}
                  onToggle={onTogglePlaybackMode}
                  className="p-1"
                />
              )}
              
              <button
                onClick={() => onTrackChange?.('prev')}
                className={`p-2 transition-colors ${
                  actualTheme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={!currentTrackInfo || !playlist || playlist.length <= 1}
              >
                <SkipBack size={18} />
              </button>
              
              <AnimatedPlayButton
                isPlaying={playbackState.is_playing}
                onClick={togglePlayback}
                disabled={!currentTrackInfo}
                size="small"
                variant="primary"
              />
              
              <button
                onClick={() => onTrackChange?.('next')}
                className={`p-2 transition-colors ${
                  actualTheme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={!currentTrackInfo || !playlist || playlist.length <= 1}
              >
                <SkipForward size={18} />
              </button>

              <button
                onClick={() => setShowVisualizer(!showVisualizer)}
                className={`p-2 transition-colors ${
                  showVisualizer 
                    ? 'text-blue-400' 
                    : actualTheme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
                title="切换音频可视化"
              >
                <BarChart3 size={18} />
              </button>
            </div>
          </div>

          {/* Bottom Row: Progress Bar */}
          <div className="flex items-center space-x-2">
            <span className={`text-xs min-w-[35px] text-right transition-colors ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {formatTime(playbackState.position)}
            </span>
            <div className="flex-1">
              <NeonProgressBar
                value={playbackState.position}
                max={playbackState.duration || 100}
                onChange={seekTo}
                variant="primary"
                disabled={!currentTrackInfo}
                className="w-full"
              />
            </div>
            <span className={`text-xs min-w-[35px] text-left transition-colors ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {formatTime(playbackState.duration)}
            </span>
            <button
              onClick={toggleMute}
              className={`p-1 transition-colors ${
                actualTheme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {isMuted || playbackState.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      
      {/* 隐藏的音频元素 */}
      <audio
        ref={audioRef}
        preload="metadata"
        controls={false}
        style={{ display: 'none' }}
      />
    </div>
  );
}; 