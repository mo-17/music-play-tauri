import { useState, useCallback, useEffect } from 'react';
import { PlaybackMode, getNextPlaybackMode, getPlaybackModeInfo } from '../types/playback';

interface Track {
  title: string;
  artist: string;
  album: string;
  duration: number;
  file_path: string;
}

interface UsePlaybackModeReturn {
  playbackMode: PlaybackMode;
  playbackModeInfo: ReturnType<typeof getPlaybackModeInfo>;
  togglePlaybackMode: () => void;
  getNextTrack: (currentTrack: Track | null, playlist: Track[], direction: 'next' | 'prev') => Track | null;
  shouldAutoPlay: (currentTrack: Track | null) => boolean;
  shuffledPlaylist: Track[];
}

export const usePlaybackMode = (playlist: Track[]): UsePlaybackModeReturn => {
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(PlaybackMode.SEQUENCE);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Track[]>([]);

  // 切换播放模式
  const togglePlaybackMode = useCallback(() => {
    setPlaybackMode(current => getNextPlaybackMode(current));
  }, []);

  // 生成随机播放列表
  const generateShuffledPlaylist = useCallback((tracks: Track[]) => {
    const shuffled = [...tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // 当播放模式切换到随机播放时，生成新的随机列表
  useEffect(() => {
    if (playbackMode === PlaybackMode.SHUFFLE && playlist.length > 0) {
      setShuffledPlaylist(generateShuffledPlaylist(playlist));
    }
  }, [playbackMode, playlist, generateShuffledPlaylist]);

  // 获取下一首歌曲
  const getNextTrack = useCallback((
    currentTrack: Track | null, 
    trackList: Track[], 
    direction: 'next' | 'prev'
  ): Track | null => {
    if (!currentTrack || trackList.length === 0) {
      return trackList.length > 0 ? trackList[0] : null;
    }

    // 根据播放模式选择使用的播放列表
    const activePlaylist = playbackMode === PlaybackMode.SHUFFLE ? shuffledPlaylist : trackList;
    
    if (activePlaylist.length === 0) {
      return null;
    }

    const currentIndex = activePlaylist.findIndex(track => track.file_path === currentTrack.file_path);
    
    if (currentIndex === -1) {
      return activePlaylist[0];
    }

    let newIndex: number;

    switch (playbackMode) {
      case PlaybackMode.LOOP_SINGLE:
        // 单曲循环：始终返回当前歌曲
        return currentTrack;

      case PlaybackMode.SEQUENCE:
        // 顺序播放：到末尾停止
        if (direction === 'next') {
          newIndex = currentIndex + 1;
          return newIndex < activePlaylist.length ? activePlaylist[newIndex] : null;
        } else {
          newIndex = currentIndex - 1;
          return newIndex >= 0 ? activePlaylist[newIndex] : null;
        }

      case PlaybackMode.LOOP_LIST:
      case PlaybackMode.SHUFFLE:
        // 列表循环和随机播放：循环播放
        if (direction === 'next') {
          newIndex = (currentIndex + 1) % activePlaylist.length;
        } else {
          newIndex = currentIndex - 1 < 0 ? activePlaylist.length - 1 : currentIndex - 1;
        }
        return activePlaylist[newIndex];

      default:
        return null;
    }
  }, [playbackMode, shuffledPlaylist]);

  // 判断是否应该自动播放下一首
  const shouldAutoPlay = useCallback((currentTrack: Track | null): boolean => {
    // 单曲循环模式下总是自动播放
    if (playbackMode === PlaybackMode.LOOP_SINGLE) {
      return true;
    }
    
    // 其他模式下，如果有下一首歌曲就自动播放
    const nextTrack = getNextTrack(currentTrack, playlist, 'next');
    return nextTrack !== null;
  }, [playbackMode, getNextTrack, playlist]);

  // 从localStorage加载播放模式
  useEffect(() => {
    const savedMode = localStorage.getItem('playbackMode') as PlaybackMode;
    if (savedMode && Object.values(PlaybackMode).includes(savedMode)) {
      setPlaybackMode(savedMode);
    }
  }, []);

  // 保存播放模式到localStorage
  useEffect(() => {
    localStorage.setItem('playbackMode', playbackMode);
  }, [playbackMode]);

  return {
    playbackMode,
    playbackModeInfo: getPlaybackModeInfo(playbackMode),
    togglePlaybackMode,
    getNextTrack,
    shouldAutoPlay,
    shuffledPlaylist
  };
}; 