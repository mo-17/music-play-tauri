import React from 'react';
import { Bell, BellOff, Music, Play, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { FadeIn, HoverScale } from './AnimatedComponents';

export const NotificationSettings: React.FC = () => {
  const { actualTheme } = useTheme();
  const {
    permissionGranted,
    settings,
    requestNotificationPermission,
    updateSettings,
    sendSimpleNotification
  } = useNotifications();

  const handlePermissionRequest = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      await sendSimpleNotification('通知已启用', '您现在可以接收音乐播放通知了！');
    }
  };

  const handleTestNotification = async () => {
    await sendSimpleNotification('测试通知', '这是一个测试通知，确认通知功能正常工作。');
  };

  return (
    <FadeIn>
      <div className={`rounded-lg p-6 ${
        actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <div className="flex items-center space-x-3 mb-6">
          <Bell size={24} className={actualTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
          <h2 className={`text-xl font-bold ${
            actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            通知设置
          </h2>
        </div>

        {/* 权限状态 */}
        <div className={`rounded-lg p-4 mb-6 ${
          permissionGranted 
            ? (actualTheme === 'dark' ? 'bg-green-900/30 border border-green-600' : 'bg-green-50 border border-green-200')
            : (actualTheme === 'dark' ? 'bg-yellow-900/30 border border-yellow-600' : 'bg-yellow-50 border border-yellow-200')
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {permissionGranted ? (
                <Bell size={20} className="text-green-500" />
              ) : (
                <BellOff size={20} className="text-yellow-500" />
              )}
              <div>
                <p className={`font-medium ${
                  permissionGranted 
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {permissionGranted ? '通知权限已授予' : '需要通知权限'}
                </p>
                <p className={`text-sm ${
                  permissionGranted 
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {permissionGranted 
                    ? '应用可以发送桌面通知'
                    : '点击按钮授予通知权限以接收音乐播放通知'
                  }
                </p>
              </div>
            </div>
            {!permissionGranted && (
              <HoverScale>
                <motion.button
                  onClick={handlePermissionRequest}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  授予权限
                </motion.button>
              </HoverScale>
            )}
          </div>
        </div>

        {/* 通知开关 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings size={20} className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
              <div>
                <p className={`font-medium ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  启用通知
                </p>
                <p className={`text-sm ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  总开关，控制所有通知
                </p>
              </div>
            </div>
            <motion.button
              onClick={() => updateSettings({ enabled: !settings.enabled })}
              whileTap={{ scale: 0.95 }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.enabled 
                  ? 'bg-blue-600' 
                  : (actualTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-300')
              }`}
              disabled={!permissionGranted}
            >
              <motion.div
                animate={{ x: settings.enabled ? 24 : 2 }}
                transition={{ duration: 0.2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
              />
            </motion.button>
          </div>

          {/* 歌曲切换通知 */}
          <div className={`flex items-center justify-between ${
            !settings.enabled ? 'opacity-50' : ''
          }`}>
            <div className="flex items-center space-x-3">
              <Music size={20} className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
              <div>
                <p className={`font-medium ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  歌曲切换通知
                </p>
                <p className={`text-sm ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  播放新歌曲时显示通知
                </p>
              </div>
            </div>
            <motion.button
              onClick={() => updateSettings({ showOnTrackChange: !settings.showOnTrackChange })}
              whileTap={{ scale: 0.95 }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.showOnTrackChange && settings.enabled
                  ? 'bg-blue-600' 
                  : (actualTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-300')
              }`}
              disabled={!settings.enabled || !permissionGranted}
            >
              <motion.div
                animate={{ x: settings.showOnTrackChange && settings.enabled ? 24 : 2 }}
                transition={{ duration: 0.2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
              />
            </motion.button>
          </div>

          {/* 播放/暂停通知 */}
          <div className={`flex items-center justify-between ${
            !settings.enabled ? 'opacity-50' : ''
          }`}>
            <div className="flex items-center space-x-3">
              <Play size={20} className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
              <div>
                <p className={`font-medium ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  播放状态通知
                </p>
                <p className={`text-sm ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  播放/暂停时显示通知
                </p>
              </div>
            </div>
            <motion.button
              onClick={() => updateSettings({ showOnPlayPause: !settings.showOnPlayPause })}
              whileTap={{ scale: 0.95 }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.showOnPlayPause && settings.enabled
                  ? 'bg-blue-600' 
                  : (actualTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-300')
              }`}
              disabled={!settings.enabled || !permissionGranted}
            >
              <motion.div
                animate={{ x: settings.showOnPlayPause && settings.enabled ? 24 : 2 }}
                transition={{ duration: 0.2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
              />
            </motion.button>
          </div>
        </div>

        {/* 测试按钮 */}
        {permissionGranted && settings.enabled && (
          <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
            <HoverScale>
              <motion.button
                onClick={handleTestNotification}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-3 rounded-lg transition-colors ${
                  actualTheme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                发送测试通知
              </motion.button>
            </HoverScale>
          </div>
        )}
      </div>
    </FadeIn>
  );
}; 