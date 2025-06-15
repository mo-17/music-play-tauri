import { useState, useEffect, useCallback } from 'react';
import { useMediaType } from '../contexts/MediaTypeContext';
import { MediaType } from '../types/media';
import { invoke } from '@tauri-apps/api/core';

// 统一播放状态接口
export interface UnifiedPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  mediaType: MediaType;
  currentMedia: {
    title: string;
    artist?: string;
    filePath: string;
  } | null;
}

// 播放控制接口
export interface PlaybackControls {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  togglePlayback: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  toggleMute: () => Promise<void>;
  seekTo: (time: number) => Promise<void>;
  skip: (seconds: number) => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
}

// 播放事件回调接口
export interface PlaybackCallbacks {
  onPlayStateChange?: (isPlaying: boolean) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onMediaChange?: (media: any) => void;
  onMediaTypeChange?: (mediaType: MediaType) => void;
  onError?: (error: Error) => void;
}

// 初始状态
const initialState: UnifiedPlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1.0,
  isMuted: false,
  mediaType: MediaType.AUDIO,
  currentMedia: null
};

export const useUnifiedPlayback = (callbacks?: PlaybackCallbacks) => {
  const { state: mediaTypeState, isAudioMode, isVideoMode, switchMediaType } = useMediaType();
  const [playbackState, setPlaybackState] = useState<UnifiedPlaybackState>(initialState);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  // 更新播放状态
  const updatePlaybackState = useCallback((updates: Partial<UnifiedPlaybackState>) => {
    setPlaybackState(prev => {
      const newState = { ...prev, ...updates };
      
      // 触发回调
      if (updates.isPlaying !== undefined) {
        callbacks?.onPlayStateChange?.(newState.isPlaying);
      }
      
      if (updates.currentTime !== undefined || updates.duration !== undefined) {
        callbacks?.onTimeUpdate?.(newState.currentTime, newState.duration);
      }
      
      if (updates.mediaType !== undefined && updates.mediaType !== prev.mediaType) {
        callbacks?.onMediaTypeChange?.(newState.mediaType);
      }
      
      return newState;
    });
  }, [callbacks]);

  // 获取当前活动的媒体元素
  const getCurrentMediaElement = useCallback(() => {
    return isAudioMode ? audioElement : videoElement;
  }, [isAudioMode, audioElement, videoElement]);

  // 播放控制实现
  const play = useCallback(async () => {
    const element = getCurrentMediaElement();
    if (!element) return;

    try {
      if (isAudioMode) {
        await invoke('resume_audio');
      }
      await element.play();
      updatePlaybackState({ isPlaying: true });
    } catch (error) {
      console.error('Failed to play:', error);
      callbacks?.onError?.(error as Error);
    }
  }, [getCurrentMediaElement, isAudioMode, updatePlaybackState, callbacks]);

  const pause = useCallback(async () => {
    const element = getCurrentMediaElement();
    if (!element) return;

    try {
      if (isAudioMode) {
        await invoke('pause_audio');
      }
      element.pause();
      updatePlaybackState({ isPlaying: false });
    } catch (error) {
      console.error('Failed to pause:', error);
      callbacks?.onError?.(error as Error);
    }
  }, [getCurrentMediaElement, isAudioMode, updatePlaybackState, callbacks]);

  const stop = useCallback(async () => {
    const element = getCurrentMediaElement();
    if (!element) return;

    try {
      if (isAudioMode) {
        await invoke('stop_audio');
      }
      element.pause();
      element.currentTime = 0;
      updatePlaybackState({ 
        isPlaying: false, 
        currentTime: 0 
      });
    } catch (error) {
      console.error('Failed to stop:', error);
      callbacks?.onError?.(error as Error);
    }
  }, [getCurrentMediaElement, isAudioMode, updatePlaybackState, callbacks]);

  const togglePlayback = useCallback(async () => {
    if (playbackState.isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [playbackState.isPlaying, play, pause]);

  const setVolume = useCallback(async (volume: number) => {
    const element = getCurrentMediaElement();
    if (!element) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    element.volume = clampedVolume;
    
    if (isAudioMode) {
      try {
        await invoke('set_volume', { volume: clampedVolume });
      } catch (error) {
        console.error('Failed to set backend volume:', error);
      }
    }
    
    updatePlaybackState({ volume: clampedVolume });
  }, [getCurrentMediaElement, isAudioMode, updatePlaybackState]);

  const toggleMute = useCallback(async () => {
    const element = getCurrentMediaElement();
    if (!element) return;

    const newMuted = !playbackState.isMuted;
    element.muted = newMuted;
    updatePlaybackState({ isMuted: newMuted });
  }, [getCurrentMediaElement, playbackState.isMuted, updatePlaybackState]);

  const seekTo = useCallback(async (time: number) => {
    const element = getCurrentMediaElement();
    if (!element) return;

    const clampedTime = Math.max(0, Math.min(playbackState.duration, time));
    element.currentTime = clampedTime;
    
    if (isAudioMode) {
      try {
        await invoke('seek_to', { position: clampedTime });
      } catch (error) {
        console.error('Failed to seek in backend:', error);
      }
    }
    
    updatePlaybackState({ currentTime: clampedTime });
  }, [getCurrentMediaElement, playbackState.duration, isAudioMode, updatePlaybackState]);

  const skip = useCallback(async (seconds: number) => {
    const newTime = playbackState.currentTime + seconds;
    await seekTo(newTime);
  }, [playbackState.currentTime, seekTo]);

  const next = useCallback(async () => {
    // 这里需要与播放列表管理器集成
    console.log('Next track requested');
    // TODO: 实现下一首逻辑
  }, []);

  const previous = useCallback(async () => {
    // 这里需要与播放列表管理器集成
    console.log('Previous track requested');
    // TODO: 实现上一首逻辑
  }, []);

  // 媒体类型切换处理
  const switchToMediaType = useCallback(async (mediaType: MediaType, media?: any) => {
    // 暂停当前播放
    if (playbackState.isPlaying) {
      await pause();
    }

    // 切换媒体类型
    switchMediaType(mediaType);
    
    // 更新播放状态
    updatePlaybackState({
      mediaType,
      currentMedia: media ? {
        title: media.title,
        artist: media.artist,
        filePath: media.file_path
      } : null,
      currentTime: 0,
      duration: 0,
      isPlaying: false
    });

    callbacks?.onMediaChange?.(media);
  }, [playbackState.isPlaying, pause, switchMediaType, updatePlaybackState, callbacks]);

  // 注册媒体元素
  const registerAudioElement = useCallback((element: HTMLAudioElement | null) => {
    setAudioElement(element);
  }, []);

  const registerVideoElement = useCallback((element: HTMLVideoElement | null) => {
    setVideoElement(element);
  }, []);

  // 同步媒体类型状态
  useEffect(() => {
    updatePlaybackState({ mediaType: mediaTypeState.currentType });
  }, [mediaTypeState.currentType, updatePlaybackState]);

  // 播放控制对象
  const controls: PlaybackControls = {
    play,
    pause,
    stop,
    togglePlayback,
    setVolume,
    toggleMute,
    seekTo,
    skip,
    next,
    previous
  };

  return {
    // 状态
    playbackState,
    isAudioMode,
    isVideoMode,
    
    // 控制方法
    controls,
    
    // 媒体类型切换
    switchToMediaType,
    
    // 元素注册
    registerAudioElement,
    registerVideoElement,
    
    // 工具方法
    updatePlaybackState
  };
}; 