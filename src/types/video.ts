// 视频文件接口
export interface VideoFile {
  id: string;
  title: string;
  file_path: string;
  duration: number;
  file_size: number;
  format: string;
  resolution?: VideoResolution;
  codec?: string;
  bitrate?: number;
  frame_rate?: number;
  created_at?: string;
  modified_at?: string;
  thumbnail_path?: string;
}

// 视频分辨率接口
export interface VideoResolution {
  width: number;
  height: number;
}

// 视频格式枚举
export enum VideoFormat {
  MP4 = 'mp4',
  AVI = 'avi',
  MKV = 'mkv',
  MOV = 'mov',
  WMV = 'wmv',
  FLV = 'flv',
  WEBM = 'webm',
  M4V = 'm4v'
}

// 视频播放列表项接口
export interface VideoPlaylistItem {
  id: string;
  video: VideoFile;
  added_at: string;
  play_count: number;
  last_played?: string;
  position_in_playlist: number;
  custom_title?: string; // 用户可以为播放列表中的视频设置自定义标题
  notes?: string; // 用户备注
}

// 视频播放列表接口
export interface VideoPlaylist {
  id: string;
  name: string;
  description?: string;
  items: VideoPlaylistItem[];
  created_at: string;
  updated_at: string;
  thumbnail_path?: string; // 播放列表封面图
  is_favorite: boolean;
  total_duration: number; // 总时长（秒）
  play_count: number; // 播放次数
  last_played?: string;
  tags: string[]; // 标签
  is_public: boolean; // 是否公开（为将来的分享功能预留）
}

// 播放列表创建参数
export interface CreatePlaylistParams {
  name: string;
  description?: string;
  thumbnail_path?: string;
  tags?: string[];
  is_public?: boolean;
}

// 播放列表更新参数
export interface UpdatePlaylistParams {
  name?: string;
  description?: string;
  thumbnail_path?: string;
  tags?: string[];
  is_public?: boolean;
  is_favorite?: boolean;
}

// 播放列表状态枚举
export enum PlaylistStatus {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  LOADING = 'loading',
  ERROR = 'error'
}

// 播放列表播放状态
export interface PlaylistPlaybackState {
  current_playlist_id: string | null;
  current_item_index: number;
  status: PlaylistStatus;
  shuffle_enabled: boolean;
  repeat_mode: RepeatMode;
  playback_history: PlaybackHistoryItem[];
}

// 重复模式枚举
export enum RepeatMode {
  OFF = 'off',
  ONE = 'one', // 单曲循环
  ALL = 'all'  // 列表循环
}

// 播放历史项
export interface PlaybackHistoryItem {
  id: string;
  playlist_id: string;
  playlist_name?: string; // 播放列表名称
  video_id: string;
  video_title: string; // 视频标题
  played_at: string;
  duration_played: number; // 实际播放时长（秒）
  completion_percentage: number; // 播放完成百分比
  device_info?: string; // 设备信息
}

// 播放列表统计信息
export interface PlaylistStats {
  total_playlists: number;
  total_videos: number;
  total_duration: number;
  most_played_playlist?: VideoPlaylist;
  recently_played: VideoPlaylist[];
  favorite_playlists: VideoPlaylist[];
}

// 播放列表操作类型
export enum PlaylistAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ADD_VIDEO = 'add_video',
  REMOVE_VIDEO = 'remove_video',
  REORDER = 'reorder',
  PLAY = 'play',
  PAUSE = 'pause',
  NEXT = 'next',
  PREVIOUS = 'previous',
  SHUFFLE = 'shuffle',
  REPEAT = 'repeat'
}

// 播放列表事件
export interface PlaylistEvent {
  type: PlaylistAction;
  playlist_id: string;
  timestamp: string;
  data?: any;
}

// 视频库接口
export interface VideoLibrary {
  videos: VideoFile[];
  last_scanned_paths: string[];
  last_updated: string;
}

// 视频扫描结果接口
export interface VideoScanResult {
  videos: VideoFile[];
  total_files: number;
  scanned_paths: string[];
  scan_duration: number;
}

// 视频过滤选项
export interface VideoFilter {
  format?: VideoFormat;
  min_duration?: number;
  max_duration?: number;
  min_resolution?: VideoResolution;
  max_resolution?: VideoResolution;
  search_term?: string;
}

// 视频排序选项
export enum VideoSortBy {
  TITLE = 'title',
  DURATION = 'duration',
  FILE_SIZE = 'file_size',
  RESOLUTION = 'resolution',
  FORMAT = 'format',
  CREATED_AT = 'created_at',
  MODIFIED_AT = 'modified_at'
}

// 视频播放状态
export interface VideoPlaybackState {
  is_playing: boolean;
  current_video: string | null;
  position: number;
  duration: number;
  volume: number;
  is_fullscreen: boolean;
  playback_speed: number;
}

// 视频缩略图接口
export interface VideoThumbnail {
  file_path: string;
  thumbnail_path: string;
  timestamp: number; // 缩略图时间戳（秒）
}

// 媒体类型枚举
export enum MediaType {
  AUDIO = 'audio',
  VIDEO = 'video'
}

// 播放列表辅助函数

// 计算播放列表总时长
export const calculatePlaylistDuration = (items: VideoPlaylistItem[]): number => {
  return items.reduce((total, item) => total + item.video.duration, 0);
};

// 生成播放列表ID
export const generatePlaylistId = (): string => {
  return `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 生成播放列表项ID
export const generatePlaylistItemId = (): string => {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 验证播放列表名称
export const validatePlaylistName = (name: string): boolean => {
  return name.trim().length > 0 && name.trim().length <= 100;
};

// 获取播放列表显示信息
export const getPlaylistDisplayInfo = (playlist: VideoPlaylist): string => {
  const itemCount = playlist.items.length;
  const duration = formatDuration(playlist.total_duration);
  return `${itemCount} 个视频 • ${duration}`;
};

// 格式化文件大小的辅助函数
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化分辨率的辅助函数
export const formatResolution = (resolution?: VideoResolution): string => {
  if (!resolution) return '未知';
  return `${resolution.width}x${resolution.height}`;
};

// 格式化时长的辅助函数
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// 获取视频格式显示名称
export const getVideoFormatDisplayName = (format: string): string => {
  const formatMap: Record<string, string> = {
    mp4: 'MP4',
    avi: 'AVI',
    mkv: 'MKV',
    mov: 'MOV',
    wmv: 'WMV',
    flv: 'FLV',
    webm: 'WebM',
    m4v: 'M4V'
  };
  
  return formatMap[format.toLowerCase()] || format.toUpperCase();
};