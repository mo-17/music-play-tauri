import { useState, useEffect, useRef, useCallback } from 'react';

interface TouchState {
  isPressed: boolean;
  startTime: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
}

interface TouchGesture {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'pinch' | 'drag';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  duration: number;
  distance: number;
}

interface TouchOptimizationOptions {
  longPressDelay?: number;
  doubleTapDelay?: number;
  swipeThreshold?: number;
  dragThreshold?: number;
  enableHapticFeedback?: boolean;
  preventDefaultTouch?: boolean;
}

interface TouchHandlers {
  onTap?: (gesture: TouchGesture) => void;
  onDoubleTap?: (gesture: TouchGesture) => void;
  onLongPress?: (gesture: TouchGesture) => void;
  onSwipeLeft?: (gesture: TouchGesture) => void;
  onSwipeRight?: (gesture: TouchGesture) => void;
  onSwipeUp?: (gesture: TouchGesture) => void;
  onSwipeDown?: (gesture: TouchGesture) => void;
  onDragStart?: (gesture: TouchGesture) => void;
  onDragMove?: (gesture: TouchGesture) => void;
  onDragEnd?: (gesture: TouchGesture) => void;
}

/**
 * 触控优化Hook - 提供手势识别和触摸反馈
 */
export const useTouchOptimization = (
  options: TouchOptimizationOptions = {},
  handlers: TouchHandlers = {}
) => {
  const {
    longPressDelay = 500,
    doubleTapDelay = 300,
    swipeThreshold = 50,
    dragThreshold = 10,
    enableHapticFeedback = true,
    preventDefaultTouch = true
  } = options;

  const [touchState, setTouchState] = useState<TouchState>({
    isPressed: false,
    startTime: 0,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0
  });

  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const doubleTapTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef<number>(0);
  const tapCount = useRef<number>(0);

  // Haptic反馈
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback) return;
    
    // 在支持的设备上触发震动反馈
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [enableHapticFeedback]);

  // 计算手势信息
  const calculateGesture = useCallback((
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    startTime: number,
    endTime: number
  ): TouchGesture => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = endTime - startTime;

    let type: TouchGesture['type'] = 'tap';

    // 判断手势类型
    if (distance < dragThreshold) {
      if (duration > longPressDelay) {
        type = 'long-press';
      } else {
        type = 'tap';
      }
    } else if (distance > swipeThreshold) {
      const angle = Math.atan2(Math.abs(deltaY), Math.abs(deltaX)) * 180 / Math.PI;
      
      if (angle < 45) {
        // 水平滑动
        type = deltaX > 0 ? 'swipe-right' : 'swipe-left';
      } else {
        // 垂直滑动
        type = deltaY > 0 ? 'swipe-down' : 'swipe-up';
      }
    } else {
      type = 'drag';
    }

    return {
      type,
      startX,
      startY,
      endX,
      endY,
      deltaX,
      deltaY,
      duration,
      distance
    };
  }, [dragThreshold, swipeThreshold, longPressDelay]);

  // 处理触摸开始
  const handleTouchStart = useCallback((event: TouchEvent | React.TouchEvent) => {
    if (preventDefaultTouch) {
      event.preventDefault();
    }

    const touch = 'touches' in event ? event.touches[0] : event;
    const now = Date.now();

    setTouchState({
      isPressed: true,
      startTime: now,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0
    });

    setIsLongPressing(false);
    setIsDragging(false);

    // 设置长按定时器
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      triggerHapticFeedback('medium');
      
      const gesture = calculateGesture(
        touch.clientX,
        touch.clientY,
        touch.clientX,
        touch.clientY,
        now,
        Date.now()
      );
      
      handlers.onLongPress?.(gesture);
    }, longPressDelay);

    // 轻触反馈
    triggerHapticFeedback('light');
  }, [preventDefaultTouch, longPressDelay, triggerHapticFeedback, calculateGesture, handlers]);

  // 处理触摸移动
  const handleTouchMove = useCallback((event: TouchEvent | React.TouchEvent) => {
    if (preventDefaultTouch) {
      event.preventDefault();
    }

    const touch = 'touches' in event ? event.touches[0] : event;
    
    setTouchState(prev => {
      const deltaX = touch.clientX - prev.startX;
      const deltaY = touch.clientY - prev.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // 如果移动距离超过阈值，开始拖拽
      if (distance > dragThreshold && !isDragging) {
        setIsDragging(true);
        
        // 清除长按定时器
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        const gesture = calculateGesture(
          prev.startX,
          prev.startY,
          touch.clientX,
          touch.clientY,
          prev.startTime,
          Date.now()
        );
        
        handlers.onDragStart?.(gesture);
      }

      // 如果正在拖拽，触发拖拽移动事件
      if (isDragging) {
        const gesture = calculateGesture(
          prev.startX,
          prev.startY,
          touch.clientX,
          touch.clientY,
          prev.startTime,
          Date.now()
        );
        
        handlers.onDragMove?.(gesture);
      }

      return {
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX,
        deltaY
      };
    });
  }, [preventDefaultTouch, dragThreshold, isDragging, calculateGesture, handlers]);

  // 处理触摸结束
  const handleTouchEnd = useCallback((event: TouchEvent | React.TouchEvent) => {
    if (preventDefaultTouch) {
      event.preventDefault();
    }

    const now = Date.now();
    
    // 清除长按定时器
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    setTouchState(prev => {
      const gesture = calculateGesture(
        prev.startX,
        prev.startY,
        prev.currentX,
        prev.currentY,
        prev.startTime,
        now
      );

      // 处理拖拽结束
      if (isDragging) {
        setIsDragging(false);
        handlers.onDragEnd?.(gesture);
        triggerHapticFeedback('light');
      }
      // 处理长按
      else if (isLongPressing) {
        // 长按已经在定时器中处理
      }
      // 处理点击和双击
      else if (gesture.type === 'tap') {
        tapCount.current++;
        
        if (tapCount.current === 1) {
          // 等待可能的第二次点击
          doubleTapTimer.current = setTimeout(() => {
            handlers.onTap?.(gesture);
            tapCount.current = 0;
            triggerHapticFeedback('light');
          }, doubleTapDelay);
        } else if (tapCount.current === 2) {
          // 双击
          if (doubleTapTimer.current) {
            clearTimeout(doubleTapTimer.current);
            doubleTapTimer.current = null;
          }
          
          handlers.onDoubleTap?.(gesture);
          tapCount.current = 0;
          triggerHapticFeedback('medium');
        }
      }
      // 处理滑动手势
      else if (gesture.type.startsWith('swipe-')) {
        const direction = gesture.type.split('-')[1] as 'left' | 'right' | 'up' | 'down';
        
        switch (direction) {
          case 'left':
            handlers.onSwipeLeft?.(gesture);
            break;
          case 'right':
            handlers.onSwipeRight?.(gesture);
            break;
          case 'up':
            handlers.onSwipeUp?.(gesture);
            break;
          case 'down':
            handlers.onSwipeDown?.(gesture);
            break;
        }
        
        triggerHapticFeedback('medium');
      }

      return {
        ...prev,
        isPressed: false
      };
    });

    setIsLongPressing(false);
    setIsDragging(false);
  }, [
    preventDefaultTouch,
    isDragging,
    isLongPressing,
    doubleTapDelay,
    calculateGesture,
    handlers,
    triggerHapticFeedback
  ]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      if (doubleTapTimer.current) {
        clearTimeout(doubleTapTimer.current);
      }
    };
  }, []);

  // 返回触摸事件处理器和状态
  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    touchState: {
      isPressed: touchState.isPressed,
      isLongPressing,
      isDragging,
      deltaX: touchState.deltaX,
      deltaY: touchState.deltaY,
    },
    triggerHapticFeedback
  };
};

/**
 * 触摸友好的按钮样式Hook
 */
export const useTouchFriendlyStyles = (isPressed: boolean = false) => {
  return {
    minHeight: '44px',
    minWidth: '44px',
    touchAction: 'manipulation' as const,
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    WebkitTouchCallout: 'none' as const,
    WebkitTapHighlightColor: 'transparent',
    transform: isPressed ? 'scale(0.95)' : 'scale(1)',
    transition: 'transform 0.1s ease-out, background-color 0.2s ease-out',
    cursor: 'pointer'
  } as React.CSSProperties;
};

/**
 * 进度条触摸拖拽Hook
 */
export const useProgressBarTouch = (
  value: number,
  max: number,
  onChange: (value: number) => void,
  containerRef: React.RefObject<HTMLElement>
) => {
  const [isDragging, setIsDragging] = useState(false);

  const calculateProgress = useCallback((clientX: number) => {
    if (!containerRef.current) return value;
    
    const rect = containerRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return percentage * max;
  }, [max, value, containerRef]);

  const touchHandlers = useTouchOptimization(
    {
      dragThreshold: 5,
      enableHapticFeedback: true,
      preventDefaultTouch: true
    },
    {
      onDragStart: (gesture) => {
        setIsDragging(true);
        const newValue = calculateProgress(gesture.startX);
        onChange(newValue);
      },
      onDragMove: (gesture) => {
        if (isDragging) {
          const newValue = calculateProgress(gesture.endX);
          onChange(newValue);
        }
      },
      onDragEnd: () => {
        setIsDragging(false);
      },
      onTap: (gesture) => {
        const newValue = calculateProgress(gesture.startX);
        onChange(newValue);
      }
    }
  );

  return {
    ...touchHandlers,
    isDragging
  };
};