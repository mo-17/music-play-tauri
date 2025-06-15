import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaType } from '../contexts/MediaTypeContext';
import { MediaType, getMediaTypeInfo } from '../types/media';
import './MediaTypeSwitcher.css';

interface MediaTypeSwitcherProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'button' | 'toggle' | 'tabs';
  showLabels?: boolean;
  disabled?: boolean;
  onSwitch?: (type: MediaType) => void;
}

export const MediaTypeSwitcher: React.FC<MediaTypeSwitcherProps> = ({
  className = '',
  size = 'medium',
  variant = 'toggle',
  showLabels = true,
  disabled = false,
  onSwitch
}) => {
  const { 
    state, 
    switchMediaType, 
    toggleMediaType, 
    getCurrentTypeInfo,
    isAudioMode,
    isVideoMode 
  } = useMediaType();

  const currentInfo = getCurrentTypeInfo();
  const audioInfo = getMediaTypeInfo(MediaType.AUDIO);
  const videoInfo = getMediaTypeInfo(MediaType.VIDEO);

  const handleSwitch = (type: MediaType) => {
    if (!disabled && type !== state.currentType) {
      switchMediaType(type);
      onSwitch?.(type);
    }
  };

  const handleToggle = () => {
    if (!disabled) {
      toggleMediaType();
      const nextType = isAudioMode ? MediaType.VIDEO : MediaType.AUDIO;
      onSwitch?.(nextType);
    }
  };

  // 按钮变体
  if (variant === 'button') {
    return (
      <motion.button
        className={`media-type-switcher media-type-button ${size} ${className} ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        aria-label={`切换到${isAudioMode ? '视频' : '音频'}模式`}
        title={`当前：${currentInfo.label}，点击切换到${isAudioMode ? videoInfo.label : audioInfo.label}`}
      >
        <motion.div
          className="media-type-icon"
          key={state.currentType}
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: 90, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentInfo.icon}
        </motion.div>
        {showLabels && (
          <motion.span
            className="media-type-label"
            key={`${state.currentType}-label`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {currentInfo.label}
          </motion.span>
        )}
        <AnimatePresence>
          {state.isTransitioning && (
            <motion.div
              className="transition-indicator"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  // 标签页变体
  if (variant === 'tabs') {
    return (
      <div className={`media-type-switcher media-type-tabs ${size} ${className} ${disabled ? 'disabled' : ''}`}>
        <div className="tabs-container" role="tablist">
          <motion.button
            className={`tab-button ${isAudioMode ? 'active' : ''}`}
            onClick={() => handleSwitch(MediaType.AUDIO)}
            disabled={disabled}
            role="tab"
            aria-selected={isAudioMode}
            aria-label={audioInfo.label}
            whileHover={!disabled ? { y: -2 } : {}}
            whileTap={!disabled ? { y: 0 } : {}}
          >
            <span className="tab-icon">{audioInfo.icon}</span>
            {showLabels && <span className="tab-label">{audioInfo.label}</span>}
          </motion.button>
          
          <motion.button
            className={`tab-button ${isVideoMode ? 'active' : ''}`}
            onClick={() => handleSwitch(MediaType.VIDEO)}
            disabled={disabled}
            role="tab"
            aria-selected={isVideoMode}
            aria-label={videoInfo.label}
            whileHover={!disabled ? { y: -2 } : {}}
            whileTap={!disabled ? { y: 0 } : {}}
          >
            <span className="tab-icon">{videoInfo.icon}</span>
            {showLabels && <span className="tab-label">{videoInfo.label}</span>}
          </motion.button>
          
          <motion.div
            className="tab-indicator"
            layoutId="tab-indicator"
            initial={false}
            animate={{
              x: isAudioMode ? 0 : '100%'
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>
    );
  }

  // 默认切换开关变体
  return (
    <div className={`media-type-switcher media-type-toggle ${size} ${className} ${disabled ? 'disabled' : ''}`}>
      <motion.div
        className="toggle-container"
        whileHover={!disabled ? { scale: 1.02 } : {}}
      >
        <button
          className={`toggle-option ${isAudioMode ? 'active' : ''}`}
          onClick={() => handleSwitch(MediaType.AUDIO)}
          disabled={disabled}
          aria-label={audioInfo.label}
          title={audioInfo.description}
        >
          <motion.div
            className="option-content"
            animate={{ 
              scale: isAudioMode ? 1.1 : 1,
              opacity: isAudioMode ? 1 : 0.7
            }}
            transition={{ duration: 0.2 }}
          >
            <span className="option-icon">{audioInfo.icon}</span>
            {showLabels && <span className="option-label">{audioInfo.label}</span>}
          </motion.div>
        </button>

        <motion.div
          className="toggle-slider"
          animate={{
            x: isAudioMode ? 0 : '100%'
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        />

        <button
          className={`toggle-option ${isVideoMode ? 'active' : ''}`}
          onClick={() => handleSwitch(MediaType.VIDEO)}
          disabled={disabled}
          aria-label={videoInfo.label}
          title={videoInfo.description}
        >
          <motion.div
            className="option-content"
            animate={{ 
              scale: isVideoMode ? 1.1 : 1,
              opacity: isVideoMode ? 1 : 0.7
            }}
            transition={{ duration: 0.2 }}
          >
            <span className="option-icon">{videoInfo.icon}</span>
            {showLabels && <span className="option-label">{videoInfo.label}</span>}
          </motion.div>
        </button>
      </motion.div>

      <AnimatePresence>
        {state.isTransitioning && (
          <motion.div
            className="transition-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="transition-spinner" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MediaTypeSwitcher; 