import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import {
  VideoPlaylist,
  VideoPlaylistItem,
  PlaylistPlaybackState,
  PlaylistStatus,
  RepeatMode,
  PlaybackHistoryItem,
  CreatePlaylistParams,
  UpdatePlaylistParams,
  PlaylistAction,
  VideoFile,
  generatePlaylistId,
  generatePlaylistItemId,
  calculatePlaylistDuration,
  validatePlaylistName
} from '../types/video';

// 播放列表状态接口
interface VideoPlaylistState {
  playlists: VideoPlaylist[];
  currentPlaylist: VideoPlaylist | null;
  playbackState: PlaylistPlaybackState;
  isLoading: boolean;
  error: string | null;
}

// 播放列表操作类型
type VideoPlaylistActionType =
  | { type: 'SET_PLAYLISTS'; payload: VideoPlaylist[] }
  | { type: 'ADD_PLAYLIST'; payload: VideoPlaylist }
  | { type: 'UPDATE_PLAYLIST'; payload: { id: string; updates: Partial<VideoPlaylist> } }
  | { type: 'DELETE_PLAYLIST'; payload: string }
  | { type: 'SET_CURRENT_PLAYLIST'; payload: VideoPlaylist | null }
  | { type: 'ADD_VIDEO_TO_PLAYLIST'; payload: { playlistId: string; video: VideoFile } }
  | { type: 'REMOVE_VIDEO_FROM_PLAYLIST'; payload: { playlistId: string; itemId: string } }
  | { type: 'REORDER_PLAYLIST_ITEMS'; payload: { playlistId: string; items: VideoPlaylistItem[] } }
  | { type: 'UPDATE_PLAYBACK_STATE'; payload: Partial<PlaylistPlaybackState> }
  | { type: 'ADD_TO_HISTORY'; payload: PlaybackHistoryItem }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// 初始状态
const initialState: VideoPlaylistState = {
  playlists: [],
  currentPlaylist: null,
  playbackState: {
    current_playlist_id: null,
    current_item_index: 0,
    status: PlaylistStatus.IDLE,
    shuffle_enabled: false,
    repeat_mode: RepeatMode.OFF,
    playback_history: []
  },
  isLoading: false,
  error: null
};

// Reducer函数
const videoPlaylistReducer = (state: VideoPlaylistState, action: VideoPlaylistActionType): VideoPlaylistState => {
  switch (action.type) {
    case 'SET_PLAYLISTS':
      return {
        ...state,
        playlists: action.payload,
        error: null
      };

    case 'ADD_PLAYLIST':
      return {
        ...state,
        playlists: [...state.playlists, action.payload],
        error: null
      };

    case 'UPDATE_PLAYLIST': {
      const updatedPlaylists = state.playlists.map(playlist =>
        playlist.id === action.payload.id
          ? { ...playlist, ...action.payload.updates, updated_at: new Date().toISOString() }
          : playlist
      );
      return {
        ...state,
        playlists: updatedPlaylists,
        currentPlaylist: state.currentPlaylist?.id === action.payload.id
          ? { ...state.currentPlaylist, ...action.payload.updates, updated_at: new Date().toISOString() }
          : state.currentPlaylist,
        error: null
      };
    }

    case 'DELETE_PLAYLIST': {
      const filteredPlaylists = state.playlists.filter(playlist => playlist.id !== action.payload);
      return {
        ...state,
        playlists: filteredPlaylists,
        currentPlaylist: state.currentPlaylist?.id === action.payload ? null : state.currentPlaylist,
        playbackState: state.playbackState.current_playlist_id === action.payload
          ? { ...state.playbackState, current_playlist_id: null, status: PlaylistStatus.IDLE }
          : state.playbackState,
        error: null
      };
    }

    case 'SET_CURRENT_PLAYLIST':
      return {
        ...state,
        currentPlaylist: action.payload,
        error: null
      };

    case 'ADD_VIDEO_TO_PLAYLIST': {
      const { playlistId, video } = action.payload;
      const newItem: VideoPlaylistItem = {
        id: generatePlaylistItemId(),
        video,
        added_at: new Date().toISOString(),
        play_count: 0,
        position_in_playlist: 0, // 将在下面计算
        notes: ''
      };

      const updatedPlaylists = state.playlists.map(playlist => {
        if (playlist.id === playlistId) {
          const newItems = [...playlist.items, { ...newItem, position_in_playlist: playlist.items.length }];
          return {
            ...playlist,
            items: newItems,
            total_duration: calculatePlaylistDuration(newItems),
            updated_at: new Date().toISOString()
          };
        }
        return playlist;
      });

      return {
        ...state,
        playlists: updatedPlaylists,
        currentPlaylist: state.currentPlaylist?.id === playlistId
          ? updatedPlaylists.find(p => p.id === playlistId) || state.currentPlaylist
          : state.currentPlaylist,
        error: null
      };
    }

    case 'REMOVE_VIDEO_FROM_PLAYLIST': {
      const { playlistId, itemId } = action.payload;
      const updatedPlaylists = state.playlists.map(playlist => {
        if (playlist.id === playlistId) {
          const newItems = playlist.items
            .filter(item => item.id !== itemId)
            .map((item, index) => ({ ...item, position_in_playlist: index }));
          return {
            ...playlist,
            items: newItems,
            total_duration: calculatePlaylistDuration(newItems),
            updated_at: new Date().toISOString()
          };
        }
        return playlist;
      });

      return {
        ...state,
        playlists: updatedPlaylists,
        currentPlaylist: state.currentPlaylist?.id === playlistId
          ? updatedPlaylists.find(p => p.id === playlistId) || state.currentPlaylist
          : state.currentPlaylist,
        error: null
      };
    }

    case 'REORDER_PLAYLIST_ITEMS': {
      const { playlistId, items } = action.payload;
      const reorderedItems = items.map((item, index) => ({
        ...item,
        position_in_playlist: index
      }));

      const updatedPlaylists = state.playlists.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            items: reorderedItems,
            updated_at: new Date().toISOString()
          };
        }
        return playlist;
      });

      return {
        ...state,
        playlists: updatedPlaylists,
        currentPlaylist: state.currentPlaylist?.id === playlistId
          ? updatedPlaylists.find(p => p.id === playlistId) || state.currentPlaylist
          : state.currentPlaylist,
        error: null
      };
    }

    case 'UPDATE_PLAYBACK_STATE':
      return {
        ...state,
        playbackState: { ...state.playbackState, ...action.payload },
        error: null
      };

    case 'ADD_TO_HISTORY':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          playback_history: [action.payload, ...state.playbackState.playback_history.slice(0, 99)] // 保留最近100条记录
        },
        error: null
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    default:
      return state;
  }
};

// Context类型定义
interface VideoPlaylistContextType {
  state: VideoPlaylistState;
  
  // 播放列表管理
  createPlaylist: (params: CreatePlaylistParams) => Promise<VideoPlaylist>;
  updatePlaylist: (id: string, updates: UpdatePlaylistParams) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  duplicatePlaylist: (id: string, newName?: string) => Promise<VideoPlaylist>;
  
  // 播放列表项管理
  addVideoToPlaylist: (playlistId: string, video: VideoFile) => Promise<void>;
  removeVideoFromPlaylist: (playlistId: string, itemId: string) => Promise<void>;
  reorderPlaylistItems: (playlistId: string, items: VideoPlaylistItem[]) => Promise<void>;
  
  // 播放控制
  playPlaylist: (playlist: VideoPlaylist, startIndex?: number) => Promise<void>;
  pausePlaylist: () => void;
  resumePlaylist: () => void;
  stopPlaylist: () => void;
  nextVideo: () => Promise<void>;
  previousVideo: () => Promise<void>;
  seekToVideo: (index: number) => Promise<void>;
  
  // 播放模式
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  
  // 工具函数
  getPlaylistById: (id: string) => VideoPlaylist | undefined;
  getCurrentVideo: () => VideoFile | null;
  getNextVideoIndex: () => number;
  getPreviousVideoIndex: () => number;
  
  // 历史记录
  addToHistory: (item: PlaybackHistoryItem) => void;
  getPlaybackHistory: (limit?: number) => PlaybackHistoryItem[];
  
  // 状态管理
  setCurrentPlaylist: (playlist: VideoPlaylist | null) => void;
  loadPlaylists: () => Promise<void>;
  savePlaylists: () => Promise<void>;
}

// 创建Context
const VideoPlaylistContext = createContext<VideoPlaylistContextType | undefined>(undefined);

// 存储键名
const STORAGE_KEY = 'video_playlists';
const PLAYBACK_STATE_KEY = 'video_playback_state';

// Provider组件属性
interface VideoPlaylistProviderProps {
  children: ReactNode;
}

// Provider组件
export const VideoPlaylistProvider: React.FC<VideoPlaylistProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(videoPlaylistReducer, initialState);

  // 从localStorage加载播放列表
  const loadPlaylists = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const savedPlaylists = localStorage.getItem(STORAGE_KEY);
      const savedPlaybackState = localStorage.getItem(PLAYBACK_STATE_KEY);
      
      if (savedPlaylists) {
        const playlists: VideoPlaylist[] = JSON.parse(savedPlaylists);
        dispatch({ type: 'SET_PLAYLISTS', payload: playlists });
      }
      
      if (savedPlaybackState) {
        const playbackState: PlaylistPlaybackState = JSON.parse(savedPlaybackState);
        dispatch({ type: 'UPDATE_PLAYBACK_STATE', payload: playbackState });
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
      dispatch({ type: 'SET_ERROR', payload: '加载播放列表失败' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // 保存播放列表到localStorage
  const savePlaylists = useCallback(async () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.playlists));
      localStorage.setItem(PLAYBACK_STATE_KEY, JSON.stringify(state.playbackState));
    } catch (error) {
      console.error('Failed to save playlists:', error);
      dispatch({ type: 'SET_ERROR', payload: '保存播放列表失败' });
    }
  }, [state.playlists, state.playbackState]);

  // 初始化时加载数据
  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  // 自动保存
  useEffect(() => {
    if (state.playlists.length > 0) {
      savePlaylists();
    }
  }, [state.playlists, state.playbackState, savePlaylists]);

  // 创建播放列表
  const createPlaylist = useCallback(async (params: CreatePlaylistParams): Promise<VideoPlaylist> => {
    if (!validatePlaylistName(params.name)) {
      throw new Error('播放列表名称无效');
    }

    const newPlaylist: VideoPlaylist = {
      id: generatePlaylistId(),
      name: params.name.trim(),
      description: params.description || '',
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      thumbnail_path: params.thumbnail_path,
      is_favorite: false,
      total_duration: 0,
      play_count: 0,
      tags: params.tags || [],
      is_public: params.is_public || false
    };

    dispatch({ type: 'ADD_PLAYLIST', payload: newPlaylist });
    return newPlaylist;
  }, []);

  // 更新播放列表
  const updatePlaylist = useCallback(async (id: string, updates: UpdatePlaylistParams): Promise<void> => {
    if (updates.name && !validatePlaylistName(updates.name)) {
      throw new Error('播放列表名称无效');
    }

    dispatch({ type: 'UPDATE_PLAYLIST', payload: { id, updates } });
  }, []);

  // 删除播放列表
  const deletePlaylist = useCallback(async (id: string): Promise<void> => {
    dispatch({ type: 'DELETE_PLAYLIST', payload: id });
  }, []);

  // 复制播放列表
  const duplicatePlaylist = useCallback(async (id: string, newName?: string): Promise<VideoPlaylist> => {
    const originalPlaylist = state.playlists.find(p => p.id === id);
    if (!originalPlaylist) {
      throw new Error('播放列表不存在');
    }

    const duplicatedPlaylist: VideoPlaylist = {
      ...originalPlaylist,
      id: generatePlaylistId(),
      name: newName || `${originalPlaylist.name} (副本)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      play_count: 0,
      last_played: undefined,
      items: originalPlaylist.items.map(item => ({
        ...item,
        id: generatePlaylistItemId(),
        added_at: new Date().toISOString(),
        play_count: 0,
        last_played: undefined
      }))
    };

    dispatch({ type: 'ADD_PLAYLIST', payload: duplicatedPlaylist });
    return duplicatedPlaylist;
  }, [state.playlists]);

  // 添加视频到播放列表
  const addVideoToPlaylist = useCallback(async (playlistId: string, video: VideoFile): Promise<void> => {
    dispatch({ type: 'ADD_VIDEO_TO_PLAYLIST', payload: { playlistId, video } });
  }, []);

  // 从播放列表移除视频
  const removeVideoFromPlaylist = useCallback(async (playlistId: string, itemId: string): Promise<void> => {
    dispatch({ type: 'REMOVE_VIDEO_FROM_PLAYLIST', payload: { playlistId, itemId } });
  }, []);

  // 重新排序播放列表项
  const reorderPlaylistItems = useCallback(async (playlistId: string, items: VideoPlaylistItem[]): Promise<void> => {
    dispatch({ type: 'REORDER_PLAYLIST_ITEMS', payload: { playlistId, items } });
  }, []);

  // 播放播放列表
  const playPlaylist = useCallback(async (playlist: VideoPlaylist, startIndex: number = 0): Promise<void> => {
    if (playlist.items.length === 0) {
      throw new Error('播放列表为空');
    }

    dispatch({ type: 'SET_CURRENT_PLAYLIST', payload: playlist });
    dispatch({
      type: 'UPDATE_PLAYBACK_STATE',
      payload: {
        current_playlist_id: playlist.id,
        current_item_index: Math.max(0, Math.min(startIndex, playlist.items.length - 1)),
        status: PlaylistStatus.PLAYING
      }
    });

    // 更新播放列表播放次数
    dispatch({
      type: 'UPDATE_PLAYLIST',
      payload: {
        id: playlist.id,
        updates: {
          play_count: playlist.play_count + 1,
          last_played: new Date().toISOString()
        }
      }
    });
  }, []);

  // 暂停播放
  const pausePlaylist = useCallback(() => {
    dispatch({
      type: 'UPDATE_PLAYBACK_STATE',
      payload: { status: PlaylistStatus.PAUSED }
    });
  }, []);

  // 恢复播放
  const resumePlaylist = useCallback(() => {
    dispatch({
      type: 'UPDATE_PLAYBACK_STATE',
      payload: { status: PlaylistStatus.PLAYING }
    });
  }, []);

  // 停止播放
  const stopPlaylist = useCallback(() => {
    dispatch({
      type: 'UPDATE_PLAYBACK_STATE',
      payload: {
        status: PlaylistStatus.IDLE,
        current_item_index: 0
      }
    });
  }, []);

  // 获取下一个视频索引
  const getNextVideoIndex = useCallback((): number => {
    const { current_playlist_id, current_item_index, shuffle_enabled, repeat_mode } = state.playbackState;
    const currentPlaylist = state.playlists.find(p => p.id === current_playlist_id);
    
    if (!currentPlaylist || currentPlaylist.items.length === 0) {
      return 0;
    }

    const itemCount = currentPlaylist.items.length;

    if (shuffle_enabled) {
      // 随机播放：生成一个不同于当前索引的随机索引
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * itemCount);
      } while (nextIndex === current_item_index && itemCount > 1);
      return nextIndex;
    }

    // 顺序播放
    const nextIndex = current_item_index + 1;
    
    if (nextIndex >= itemCount) {
      // 到达列表末尾
      if (repeat_mode === RepeatMode.ALL) {
        return 0; // 循环到开头
      }
      return current_item_index; // 停留在最后一个
    }

    return nextIndex;
  }, [state.playbackState, state.playlists]);

  // 获取上一个视频索引
  const getPreviousVideoIndex = useCallback((): number => {
    const { current_playlist_id, current_item_index, shuffle_enabled, repeat_mode } = state.playbackState;
    const currentPlaylist = state.playlists.find(p => p.id === current_playlist_id);
    
    if (!currentPlaylist || currentPlaylist.items.length === 0) {
      return 0;
    }

    const itemCount = currentPlaylist.items.length;

    if (shuffle_enabled) {
      // 随机播放：生成一个不同于当前索引的随机索引
      let prevIndex;
      do {
        prevIndex = Math.floor(Math.random() * itemCount);
      } while (prevIndex === current_item_index && itemCount > 1);
      return prevIndex;
    }

    // 顺序播放
    const prevIndex = current_item_index - 1;
    
    if (prevIndex < 0) {
      // 到达列表开头
      if (repeat_mode === RepeatMode.ALL) {
        return itemCount - 1; // 循环到末尾
      }
      return 0; // 停留在第一个
    }

    return prevIndex;
  }, [state.playbackState, state.playlists]);

  // 下一个视频
  const nextVideo = useCallback(async (): Promise<void> => {
    const nextIndex = getNextVideoIndex();
    dispatch({
      type: 'UPDATE_PLAYBACK_STATE',
      payload: { current_item_index: nextIndex }
    });
  }, [getNextVideoIndex]);

  // 上一个视频
  const previousVideo = useCallback(async (): Promise<void> => {
    const prevIndex = getPreviousVideoIndex();
    dispatch({
      type: 'UPDATE_PLAYBACK_STATE',
      payload: { current_item_index: prevIndex }
    });
  }, [getPreviousVideoIndex]);

  // 跳转到指定视频
  const seekToVideo = useCallback(async (index: number): Promise<void> => {
    const { current_playlist_id } = state.playbackState;
    const currentPlaylist = state.playlists.find(p => p.id === current_playlist_id);
    
    if (!currentPlaylist || index < 0 || index >= currentPlaylist.items.length) {
      throw new Error('无效的视频索引');
    }

    dispatch({
      type: 'UPDATE_PLAYBACK_STATE',
      payload: { current_item_index: index }
    });
  }, [state.playbackState, state.playlists]);

  // 切换随机播放
  const toggleShuffle = useCallback(() => {
    dispatch({
      type: 'UPDATE_PLAYBACK_STATE',
      payload: { shuffle_enabled: !state.playbackState.shuffle_enabled }
    });
  }, [state.playbackState.shuffle_enabled]);

  // 设置重复模式
  const setRepeatMode = useCallback((mode: RepeatMode) => {
    dispatch({
      type: 'UPDATE_PLAYBACK_STATE',
      payload: { repeat_mode: mode }
    });
  }, []);

  // 获取播放列表
  const getPlaylistById = useCallback((id: string): VideoPlaylist | undefined => {
    return state.playlists.find(playlist => playlist.id === id);
  }, [state.playlists]);

  // 获取当前播放的视频
  const getCurrentVideo = useCallback((): VideoFile | null => {
    const { current_playlist_id, current_item_index } = state.playbackState;
    const currentPlaylist = state.playlists.find(p => p.id === current_playlist_id);
    
    if (!currentPlaylist || !currentPlaylist.items[current_item_index]) {
      return null;
    }

    return currentPlaylist.items[current_item_index].video;
  }, [state.playbackState, state.playlists]);

  // 设置当前播放列表
  const setCurrentPlaylist = useCallback((playlist: VideoPlaylist | null) => {
    dispatch({ type: 'SET_CURRENT_PLAYLIST', payload: playlist });
  }, []);

  // 添加到历史记录
  const addToHistory = useCallback((item: PlaybackHistoryItem) => {
    dispatch({ type: 'ADD_TO_HISTORY', payload: item });
  }, []);

  // 获取播放历史
  const getPlaybackHistory = useCallback((limit: number = 50): PlaybackHistoryItem[] => {
    return state.playbackState.playback_history.slice(0, limit);
  }, [state.playbackState.playback_history]);

  const contextValue: VideoPlaylistContextType = {
    state,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    duplicatePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    reorderPlaylistItems,
    playPlaylist,
    pausePlaylist,
    resumePlaylist,
    stopPlaylist,
    nextVideo,
    previousVideo,
    seekToVideo,
    toggleShuffle,
    setRepeatMode,
    getPlaylistById,
    getCurrentVideo,
    getNextVideoIndex,
    getPreviousVideoIndex,
    addToHistory,
    getPlaybackHistory,
    setCurrentPlaylist,
    loadPlaylists,
    savePlaylists
  };

  return (
    <VideoPlaylistContext.Provider value={contextValue}>
      {children}
    </VideoPlaylistContext.Provider>
  );
};

// Hook for using the context
export const useVideoPlaylist = (): VideoPlaylistContextType => {
  const context = useContext(VideoPlaylistContext);
  if (context === undefined) {
    throw new Error('useVideoPlaylist must be used within a VideoPlaylistProvider');
  }
  return context;
};

// 导出Context以供测试使用
export { VideoPlaylistContext }; 