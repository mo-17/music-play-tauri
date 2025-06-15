import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Music, Video, List, Settings, TestTube, Palette } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { useMediaType } from '../contexts/MediaTypeContext';
import MediaTypeSwitcher from './MediaTypeSwitcher';
import { motion } from 'framer-motion';
import { FadeIn, AnimatedList, AnimatedListItem } from './AnimatedComponents';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { actualTheme } = useTheme();
  const { isAudioMode, isVideoMode } = useMediaType();

  const navItems = [
    { path: '/', icon: Home, label: '主页' },
    { path: '/library', icon: Music, label: '音乐库', mediaType: 'audio' },
    { path: '/videos', icon: Video, label: '视频库', mediaType: 'video' },
    { path: '/playlists', icon: List, label: '音频播放列表', mediaType: 'audio' },
    { path: '/video-playlists', icon: List, label: '视频播放列表', mediaType: 'video' },
    { path: '/test', icon: TestTube, label: '音频测试', mediaType: 'audio' },
    { path: '/progress-bar-demo', icon: Palette, label: '进度条样式' },
  ];

  // 根据当前媒体类型过滤导航项
  const filteredNavItems = navItems.filter(item => {
    if (!item.mediaType) return true; // 通用项目始终显示
    if (item.mediaType === 'audio' && isAudioMode) return true;
    if (item.mediaType === 'video' && isVideoMode) return true;
    return false;
  });

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col p-4"
    >
      {/* Logo/Title */}
      <FadeIn delay={0.1}>
        <div className="mb-8">
          <motion.h1 
            className={`text-xl font-bold transition-colors ${
              actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            音乐播放器
          </motion.h1>
        </div>
      </FadeIn>

      {/* Media Type Switcher */}
      <FadeIn delay={0.2}>
        <div className="mb-6">
          <MediaTypeSwitcher 
            variant="tabs" 
            size="small" 
            className="w-full"
          />
        </div>
      </FadeIn>

      {/* Navigation */}
      <nav className="flex-1">
        <AnimatedList>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <AnimatedListItem key={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="mb-2"
                >
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : actualTheme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <motion.div
                      animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <Icon size={20} />
                    </motion.div>
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>
              </AnimatedListItem>
            );
          })}
        </AnimatedList>
      </nav>

      {/* Theme Toggle and Settings at bottom */}
      <FadeIn delay={0.3}>
        <div className="mt-auto space-y-3">
          {/* Theme Toggle */}
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
          
          {/* Settings */}
          <motion.div
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              to="/settings"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                actualTheme === 'dark'
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Settings size={20} />
              <span>设置</span>
            </Link>
          </motion.div>
        </div>
      </FadeIn>
    </motion.div>
  );
};

export default Sidebar;