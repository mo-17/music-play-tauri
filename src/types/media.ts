// 通用媒体文件接口
export interface MediaFile {
  title: string;
  file_path: string;
  duration: number;
  // 音频特有字段（可选）
  artist?: string;
  album?: string;
  // 视频特有字段（可选）
  file_size?: number;
  format?: string;
  resolution?: {
    width: number;
    height: number;
  };
}

// 媒体类型枚举
export enum MediaType {
  AUDIO = 'audio',
  VIDEO = 'video'
}

// 媒体类型信息接口
export interface MediaTypeInfo {
  type: MediaType;
  label: string;
  icon: string;
  description: string;
}

// 媒体类型状态接口
export interface MediaTypeState {
  currentType: MediaType;
  isTransitioning: boolean;
  lastSwitchTime: number;
}

// 媒体类型切换动作类型
export interface MediaTypeSwitchAction {
  type: 'SWITCH_MEDIA_TYPE' | 'SET_TRANSITIONING' | 'RESET_MEDIA_TYPE';
  payload?: {
    mediaType?: MediaType;
    isTransitioning?: boolean;
  };
}

// 播放状态接口
export interface MediaPlaybackState {
  is_playing: boolean;
  current_media: string | null;
  position: number;
  duration: number;
  volume: number;
  media_type?: MediaType;
}

// 类型守卫函数
export const isAudioFile = (media: MediaFile): media is MediaFile & { artist: string; album: string } => {
  return 'artist' in media && 'album' in media;
};

export const isVideoFile = (media: MediaFile): media is MediaFile & { file_size: number; format: string } => {
  return 'file_size' in media && 'format' in media;
};

// 获取媒体类型信息的辅助函数
export const getMediaTypeInfo = (type: MediaType): MediaTypeInfo => {
  switch (type) {
    case MediaType.AUDIO:
      return {
        type: MediaType.AUDIO,
        label: '音频模式',
        icon: '🎵',
        description: '播放音频文件'
      };
    case MediaType.VIDEO:
      return {
        type: MediaType.VIDEO,
        label: '视频模式',
        icon: '🎬',
        description: '播放视频文件'
      };
    default:
      return {
        type: MediaType.AUDIO,
        label: '音频模式',
        icon: '🎵',
        description: '播放音频文件'
      };
  }
};

// 获取下一个媒体类型
export const getNextMediaType = (currentType: MediaType): MediaType => {
  return currentType === MediaType.AUDIO ? MediaType.VIDEO : MediaType.AUDIO;
};

// 媒体类型验证函数
export const isValidMediaType = (type: string): type is MediaType => {
  return Object.values(MediaType).includes(type as MediaType);
};