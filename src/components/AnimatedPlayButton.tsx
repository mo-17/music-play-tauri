import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedPlayButtonProps {
  isPlaying: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
  className?: string;
}

export const AnimatedPlayButton: React.FC<AnimatedPlayButtonProps> = ({
  isPlaying,
  onClick,
  disabled = false,
  size = 'medium',
  variant = 'primary',
  className = ''
}) => {
  const { actualTheme } = useTheme();

  // 尺寸配置
  const sizeConfig = {
    small: { button: 'p-2', icon: 16, ripple: 'w-8 h-8' },
    medium: { button: 'p-3', icon: 20, ripple: 'w-12 h-12' },
    large: { button: 'p-4', icon: 24, ripple: 'w-16 h-16' }
  };

  const config = sizeConfig[size];

  // 主题配置
  const getButtonStyles = () => {
    if (variant === 'primary') {
      return actualTheme === 'dark'
        ? 'bg-white text-black hover:bg-gray-200'
        : 'bg-gray-900 text-white hover:bg-gray-700';
    } else {
      return actualTheme === 'dark'
        ? 'bg-gray-700 text-white hover:bg-gray-600'
        : 'bg-gray-200 text-gray-900 hover:bg-gray-300';
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* 播放状态指示环 */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`absolute inset-0 ${config.ripple} rounded-full border-2 border-blue-500`}
          >
            {/* 脉冲动画 */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-full h-full rounded-full border-2 border-blue-400 opacity-50"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主按钮 */}
      <motion.button
        onClick={onClick}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        transition={{ duration: 0.2 }}
        className={`
          relative z-10 rounded-full transition-all duration-200 
          ${config.button} ${getButtonStyles()}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
      >
        {/* 图标切换动画 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isPlaying ? 'pause' : 'play'}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {isPlaying ? (
              <Pause size={config.icon} />
            ) : (
              <Play size={config.icon} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* 点击波纹效果 */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white opacity-0"
          whileTap={{ 
            scale: [0, 1.5], 
            opacity: [0.3, 0],
            transition: { duration: 0.4 }
          }}
        />
      </motion.button>

      {/* 音频波形指示器（仅在播放时显示） */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  scaleY: [0.3, 1, 0.3],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut'
                }}
                className={`w-1 h-3 rounded-full ${
                  actualTheme === 'dark' ? 'bg-blue-400' : 'bg-blue-600'
                }`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 简化版播放按钮（用于列表项等紧凑空间）
export const CompactPlayButton: React.FC<{
  isPlaying: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ isPlaying, onClick, disabled = false, className = '' }) => {
  const { actualTheme } = useTheme();

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      transition={{ duration: 0.15 }}
      className={`
        p-2 rounded-full transition-colors duration-200
        ${actualTheme === 'dark'
          ? 'text-gray-400 hover:text-white hover:bg-gray-600'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isPlaying ? 'pause' : 'play'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}; 