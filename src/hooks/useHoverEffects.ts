import { useState, useCallback, useRef, useEffect } from 'react';

interface HoverState {
  isHovered: boolean;
  hoverStartTime: number;
  hoverDuration: number;
}

interface UseHoverOptions {
  delay?: number;
  hideDelay?: number;
  disabled?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

export const useHover = (options: UseHoverOptions = {}) => {
  const {
    delay = 0,
    hideDelay = 0,
    disabled = false,
    onHoverStart,
    onHoverEnd
  } = options;

  const [hoverState, setHoverState] = useState<HoverState>({
    isHovered: false,
    hoverStartTime: 0,
    hoverDuration: 0
  });

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;

    // 清除隐藏延时
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    startTimeRef.current = Date.now();

    if (delay > 0) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverState({
          isHovered: true,
          hoverStartTime: startTimeRef.current,
          hoverDuration: 0
        });
        onHoverStart?.();
      }, delay);
    } else {
      setHoverState({
        isHovered: true,
        hoverStartTime: startTimeRef.current,
        hoverDuration: 0
      });
      onHoverStart?.();
    }
  }, [delay, disabled, onHoverStart]);

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;

    // 清除悬停延时
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;

    if (hideDelay > 0) {
      hideTimeoutRef.current = setTimeout(() => {
        setHoverState(prev => ({
          ...prev,
          isHovered: false,
          hoverDuration: duration
        }));
        onHoverEnd?.();
      }, hideDelay);
    } else {
      setHoverState(prev => ({
        ...prev,
        isHovered: false,
        hoverDuration: duration
      }));
      onHoverEnd?.();
    }
  }, [hideDelay, disabled, onHoverEnd]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...hoverState,
    hoverProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave
    }
  };
};

// 视频播放器控制栏悬停Hook
export const useControlBarHover = (
  autoHideDelay: number = 3000,
  disabled: boolean = false
) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 重置隐藏定时器
  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    if (!disabled && !isHovered) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
    }
  }, [autoHideDelay, disabled, isHovered]);

  // 显示控制栏
  const showControls = useCallback(() => {
    setIsVisible(true);
    resetHideTimer();
  }, [resetHideTimer]);

  // 鼠标进入控制栏
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setIsVisible(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  // 鼠标离开控制栏
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    resetHideTimer();
  }, [resetHideTimer]);

  // 鼠标移动时显示控制栏
  const handleMouseMove = useCallback(() => {
    showControls();
  }, [showControls]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // 初始化隐藏定时器
  useEffect(() => {
    if (!disabled) {
      resetHideTimer();
    }
  }, [disabled, resetHideTimer]);

  return {
    isVisible,
    isHovered,
    showControls,
    controlBarProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave
    },
    containerProps: {
      onMouseMove: handleMouseMove
    }
  };
};

// 按钮悬停效果Hook
export const useButtonHover = (
  hoverScale: number = 1.05,
  animationDuration: number = 200
) => {
  const { isHovered, hoverProps } = useHover({
    delay: 50,
    hideDelay: 100
  });

  const buttonStyle = {
    transform: isHovered ? `scale(${hoverScale})` : 'scale(1)',
    transition: `transform ${animationDuration}ms ease-out`,
    cursor: 'pointer'
  };

  return {
    isHovered,
    buttonStyle,
    hoverProps
  };
};

// 进度条悬停效果Hook
export const useProgressBarHover = (
  onSeek?: (progress: number) => void,
  disabled: boolean = false
) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovered(true);
    }
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setHoverPosition(0);
    setPreviewTime(0);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!disabled && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const position = (event.clientX - rect.left) / rect.width;
      const clampedPosition = Math.max(0, Math.min(1, position));
      
      setHoverPosition(clampedPosition);
      setPreviewTime(clampedPosition);
    }
  }, [disabled]);

  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!disabled && onSeek && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const position = (event.clientX - rect.left) / rect.width;
      const clampedPosition = Math.max(0, Math.min(1, position));
      
      onSeek(clampedPosition);
    }
  }, [disabled, onSeek]);

  return {
    isHovered,
    hoverPosition,
    previewTime,
    progressBarRef,
    progressBarProps: {
      ref: progressBarRef,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onMouseMove: handleMouseMove,
      onClick: handleClick
    }
  };
};

// 音量控制悬停效果Hook
export const useVolumeHover = (
  onVolumeChange?: (volume: number) => void,
  disabled: boolean = false
) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovered(true);
    }
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setIsHovered(false);
    }
  }, [isDragging]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!disabled) {
      setIsDragging(true);
      handleVolumeChange(event);
    }
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleVolumeChange = useCallback((event: React.MouseEvent) => {
    if (!disabled && onVolumeChange && volumeBarRef.current) {
      const rect = volumeBarRef.current.getBoundingClientRect();
      const position = (event.clientY - rect.top) / rect.height;
      const volume = Math.max(0, Math.min(1, 1 - position)); // 反转Y轴
      
      onVolumeChange(volume);
    }
  }, [disabled, onVolumeChange]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging) {
      handleVolumeChange(event);
    }
  }, [isDragging, handleVolumeChange]);

  // 全局鼠标事件监听
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsHovered(false);
    };

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (isDragging && onVolumeChange && volumeBarRef.current) {
        const rect = volumeBarRef.current.getBoundingClientRect();
        const position = (event.clientY - rect.top) / rect.height;
        const volume = Math.max(0, Math.min(1, 1 - position));
        
        onVolumeChange(volume);
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, onVolumeChange]);

  return {
    isHovered,
    isDragging,
    volumeBarRef,
    volumeBarProps: {
      ref: volumeBarRef,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseMove: handleMouseMove
    }
  };
}; 