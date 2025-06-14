import React from 'react';
import { Settings, Bell, Palette, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationSettings } from './NotificationSettings';
import { FadeIn, AnimatedList, AnimatedListItem } from './AnimatedComponents';

export const SettingsView: React.FC = () => {
  const { actualTheme } = useTheme();

  return (
    <div className="flex-1 p-6 pb-24"> {/* 底部留出播放控制栏空间 */}
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="flex items-center space-x-3 mb-8">
            <Settings size={32} className={actualTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
            <h1 className={`text-3xl font-bold ${
              actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              设置
            </h1>
          </div>
        </FadeIn>

        <AnimatedList className="space-y-8">
          {/* 通知设置 */}
          <AnimatedListItem>
            <NotificationSettings />
          </AnimatedListItem>

          {/* 主题设置 */}
          <AnimatedListItem>
            <div className={`rounded-lg p-6 ${
              actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <Palette size={24} className={actualTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'} />
                <h2 className={`text-xl font-bold ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  主题设置
                </h2>
              </div>
              <p className={`${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                主题切换按钮位于侧边栏底部，支持浅色、深色和系统主题。
              </p>
            </div>
          </AnimatedListItem>

          {/* 关于信息 */}
          <AnimatedListItem>
            <div className={`rounded-lg p-6 ${
              actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <Info size={24} className={actualTheme === 'dark' ? 'text-green-400' : 'text-green-600'} />
                <h2 className={`text-xl font-bold ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  关于
                </h2>
              </div>
              <div className={`space-y-2 ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <p><strong>音乐播放器</strong> v1.0.0</p>
                <p>基于 Tauri + React + TypeScript 构建的跨平台音乐播放器</p>
                <p>支持 MP3、FLAC、WAV 等多种音频格式</p>
                <p>具备响应式设计、主题切换、桌面通知等功能</p>
              </div>
            </div>
          </AnimatedListItem>
        </AnimatedList>
      </div>
    </div>
  );
}; 