import { useState, useEffect, useCallback } from 'react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

interface Track {
  title: string;
  artist: string;
  album: string;
  duration: number;
  file_path: string;
}

interface NotificationSettings {
  enabled: boolean;
  showOnTrackChange: boolean;
  showOnPlayPause: boolean;
}

export const useNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    showOnTrackChange: true,
    showOnPlayPause: false
  });

  // 检查通知权限
  const checkPermission = useCallback(async () => {
    try {
      const granted = await isPermissionGranted();
      setPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('检查通知权限失败:', error);
      return false;
    }
  }, []);

  // 请求通知权限
  const requestNotificationPermission = useCallback(async () => {
    try {
      const permission = await requestPermission();
      const granted = permission === 'granted';
      setPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  }, []);

  // 发送音乐播放通知
  const sendTrackNotification = useCallback(async (track: Track, isPlaying: boolean = true) => {
    if (!settings.enabled || !permissionGranted) return;

    if (!settings.showOnTrackChange && isPlaying) return;
    if (!settings.showOnPlayPause && !isPlaying) return;

    try {
      const action = isPlaying ? '正在播放' : '已暂停';
      await sendNotification({
        title: `🎵 ${action}`,
        body: `${track.title}\n${track.artist} - ${track.album}`,
        icon: 'icons/32x32.png'
      });
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }, [settings, permissionGranted]);

  // 发送简单通知
  const sendSimpleNotification = useCallback(async (title: string, body: string) => {
    if (!settings.enabled || !permissionGranted) return;

    try {
      await sendNotification({
        title,
        body,
        icon: 'icons/32x32.png'
      });
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }, [settings, permissionGranted]);

  // 更新通知设置
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    // 保存到本地存储
    const updatedSettings = { ...settings, ...newSettings };
    localStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
  }, [settings]);

  // 从本地存储加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('加载通知设置失败:', error);
      }
    }
  }, []);

  // 初始化时检查权限
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    permissionGranted,
    settings,
    checkPermission,
    requestNotificationPermission,
    sendTrackNotification,
    sendSimpleNotification,
    updateSettings
  };
}; 