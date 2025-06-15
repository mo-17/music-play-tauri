import { MediaType, MediaTypeState, isValidMediaType } from '../types/media';

// 存储键名常量
export const STORAGE_KEYS = {
  MEDIA_TYPE: 'preferredMediaType',
  MEDIA_TYPE_STATE: 'mediaTypeState',
  PLAYBACK_PREFERENCES: 'playbackPreferences',
  USER_SETTINGS: 'userSettings'
} as const;

// 播放偏好设置接口
export interface PlaybackPreferences {
  mediaType: MediaType;
  autoSwitchOnFileType: boolean;
  rememberLastPosition: boolean;
  continuousPlayback: boolean;
  lastSwitchTime: number;
}

// 用户设置接口
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
  mediaTypePreferences: PlaybackPreferences;
}

// 默认播放偏好
const DEFAULT_PLAYBACK_PREFERENCES: PlaybackPreferences = {
  mediaType: MediaType.AUDIO,
  autoSwitchOnFileType: false,
  rememberLastPosition: true,
  continuousPlayback: true,
  lastSwitchTime: 0
};

// 默认用户设置
const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'auto',
  language: 'zh-CN',
  notifications: true,
  mediaTypePreferences: DEFAULT_PLAYBACK_PREFERENCES
};

// 存储工具类
export class MediaTypeStorage {
  private static instance: MediaTypeStorage;
  private storageAvailable: boolean;

  private constructor() {
    this.storageAvailable = this.checkStorageAvailability();
  }

  public static getInstance(): MediaTypeStorage {
    if (!MediaTypeStorage.instance) {
      MediaTypeStorage.instance = new MediaTypeStorage();
    }
    return MediaTypeStorage.instance;
  }

  // 检查localStorage是否可用
  private checkStorageAvailability(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      console.warn('localStorage is not available, using memory storage');
      return false;
    }
  }

  // 安全的JSON解析
  private safeJsonParse<T>(value: string | null, defaultValue: T): T {
    if (!value) return defaultValue;
    
    try {
      const parsed = JSON.parse(value);
      return parsed !== null ? parsed : defaultValue;
    } catch (error) {
      console.warn('Failed to parse JSON from localStorage:', error);
      return defaultValue;
    }
  }

  // 安全的JSON字符串化
  private safeJsonStringify(value: any): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.warn('Failed to stringify JSON for localStorage:', error);
      return '{}';
    }
  }

  // 获取媒体类型偏好
  public getMediaType(): MediaType {
    if (!this.storageAvailable) return MediaType.AUDIO;

    const stored = localStorage.getItem(STORAGE_KEYS.MEDIA_TYPE);
    if (stored && isValidMediaType(stored)) {
      return stored as MediaType;
    }
    return MediaType.AUDIO;
  }

  // 保存媒体类型偏好
  public setMediaType(mediaType: MediaType): void {
    if (!this.storageAvailable) return;

    try {
      localStorage.setItem(STORAGE_KEYS.MEDIA_TYPE, mediaType);
      
      // 同时更新播放偏好中的媒体类型
      const preferences = this.getPlaybackPreferences();
      preferences.mediaType = mediaType;
      preferences.lastSwitchTime = Date.now();
      this.setPlaybackPreferences(preferences);
    } catch (error) {
      console.warn('Failed to save media type to localStorage:', error);
    }
  }

  // 获取媒体类型状态
  public getMediaTypeState(): Partial<MediaTypeState> {
    if (!this.storageAvailable) return {};

    const stored = localStorage.getItem(STORAGE_KEYS.MEDIA_TYPE_STATE);
    return this.safeJsonParse(stored, {});
  }

  // 保存媒体类型状态
  public setMediaTypeState(state: Partial<MediaTypeState>): void {
    if (!this.storageAvailable) return;

    try {
      const stateToSave = {
        currentType: state.currentType,
        lastSwitchTime: state.lastSwitchTime || Date.now()
        // 不保存 isTransitioning 状态，因为它是临时的
      };
      localStorage.setItem(STORAGE_KEYS.MEDIA_TYPE_STATE, this.safeJsonStringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save media type state to localStorage:', error);
    }
  }

  // 获取播放偏好
  public getPlaybackPreferences(): PlaybackPreferences {
    if (!this.storageAvailable) return DEFAULT_PLAYBACK_PREFERENCES;

    const stored = localStorage.getItem(STORAGE_KEYS.PLAYBACK_PREFERENCES);
    const preferences = this.safeJsonParse(stored, DEFAULT_PLAYBACK_PREFERENCES);
    
    // 验证媒体类型
    if (!isValidMediaType(preferences.mediaType)) {
      preferences.mediaType = MediaType.AUDIO;
    }
    
    return preferences;
  }

  // 保存播放偏好
  public setPlaybackPreferences(preferences: PlaybackPreferences): void {
    if (!this.storageAvailable) return;

    try {
      localStorage.setItem(STORAGE_KEYS.PLAYBACK_PREFERENCES, this.safeJsonStringify(preferences));
    } catch (error) {
      console.warn('Failed to save playback preferences to localStorage:', error);
    }
  }

  // 获取用户设置
  public getUserSettings(): UserSettings {
    if (!this.storageAvailable) return DEFAULT_USER_SETTINGS;

    const stored = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    const settings = this.safeJsonParse(stored, DEFAULT_USER_SETTINGS);
    
    // 确保媒体类型偏好存在且有效
    if (!settings.mediaTypePreferences) {
      settings.mediaTypePreferences = DEFAULT_PLAYBACK_PREFERENCES;
    }
    
    return settings;
  }

  // 保存用户设置
  public setUserSettings(settings: UserSettings): void {
    if (!this.storageAvailable) return;

    try {
      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, this.safeJsonStringify(settings));
    } catch (error) {
      console.warn('Failed to save user settings to localStorage:', error);
    }
  }

  // 清除所有存储数据
  public clearAll(): void {
    if (!this.storageAvailable) return;

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  // 导出设置（用于备份）
  public exportSettings(): string {
    const settings = {
      mediaType: this.getMediaType(),
      mediaTypeState: this.getMediaTypeState(),
      playbackPreferences: this.getPlaybackPreferences(),
      userSettings: this.getUserSettings(),
      exportTime: new Date().toISOString()
    };
    
    return this.safeJsonStringify(settings);
  }

  // 导入设置（用于恢复）
  public importSettings(settingsJson: string): boolean {
    try {
      const settings = JSON.parse(settingsJson);
      
      if (settings.mediaType && isValidMediaType(settings.mediaType)) {
        this.setMediaType(settings.mediaType);
      }
      
      if (settings.mediaTypeState) {
        this.setMediaTypeState(settings.mediaTypeState);
      }
      
      if (settings.playbackPreferences) {
        this.setPlaybackPreferences(settings.playbackPreferences);
      }
      
      if (settings.userSettings) {
        this.setUserSettings(settings.userSettings);
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to import settings:', error);
      return false;
    }
  }

  // 获取存储使用情况
  public getStorageInfo(): { available: boolean; used: number; total: number } {
    if (!this.storageAvailable) {
      return { available: false, used: 0, total: 0 };
    }

    try {
      let used = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          used += value.length;
        }
      });

      // 估算localStorage总容量（通常为5-10MB）
      const total = 5 * 1024 * 1024; // 5MB

      return { available: true, used, total };
    } catch {
      return { available: false, used: 0, total: 0 };
    }
  }
}

// 导出单例实例
export const mediaTypeStorage = MediaTypeStorage.getInstance();

// 便捷函数
export const getStoredMediaType = () => mediaTypeStorage.getMediaType();
export const setStoredMediaType = (type: MediaType) => mediaTypeStorage.setMediaType(type);
export const getStoredPlaybackPreferences = () => mediaTypeStorage.getPlaybackPreferences();
export const setStoredPlaybackPreferences = (prefs: PlaybackPreferences) => mediaTypeStorage.setPlaybackPreferences(prefs); 