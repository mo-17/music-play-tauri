import { useState, useEffect } from 'react';

interface ResponsiveSizes {
  buttonSize: number;
  iconSize: number;
  spacing: string;
  fontSize: string;
  controlBarHeight: string;
}

interface WindowSize {
  width: number;
  height: number;
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
}

interface GracefulDegradationConfig {
  enableAnimations: boolean;
  enableBlur: boolean;
  enableShadows: boolean;
  enableGradients: boolean;
  useSimplifiedUI: boolean;
  reduceMotion: boolean;
}

/**
 * 设备信息检测Hook
 */
export const useDeviceInfo = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: width > height ? 'landscape' : 'portrait'
    };
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        pixelRatio: window.devicePixelRatio || 1,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

/**
 * 优雅降级配置Hook
 */
export const useGracefulDegradation = (): GracefulDegradationConfig => {
  const [config, setConfig] = useState<GracefulDegradationConfig>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // 检测用户偏好
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    // 性能评估
    const isLowPerformance = width < 400 || height < 300 || pixelRatio < 1.5;
    const isVerySmall = width < 300 || height < 200;
    
    return {
      enableAnimations: !prefersReducedMotion && !isLowPerformance,
      enableBlur: !isLowPerformance && width >= 500,
      enableShadows: !prefersHighContrast && !isLowPerformance,
      enableGradients: !isLowPerformance && width >= 400,
      useSimplifiedUI: isVerySmall || isLowPerformance,
      reduceMotion: prefersReducedMotion || isLowPerformance
    };
  });

  useEffect(() => {
    const updateConfig = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = window.devicePixelRatio || 1;
      
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      const isLowPerformance = width < 400 || height < 300 || pixelRatio < 1.5;
      const isVerySmall = width < 300 || height < 200;
      
      setConfig({
        enableAnimations: !prefersReducedMotion && !isLowPerformance,
        enableBlur: !isLowPerformance && width >= 500,
        enableShadows: !prefersHighContrast && !isLowPerformance,
        enableGradients: !isLowPerformance && width >= 400,
        useSimplifiedUI: isVerySmall || isLowPerformance,
        reduceMotion: prefersReducedMotion || isLowPerformance
      });
    };

    window.addEventListener('resize', updateConfig);
    
    // 监听用户偏好变化
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    motionQuery.addEventListener('change', updateConfig);
    contrastQuery.addEventListener('change', updateConfig);
    
    return () => {
      window.removeEventListener('resize', updateConfig);
      motionQuery.removeEventListener('change', updateConfig);
      contrastQuery.removeEventListener('change', updateConfig);
    };
  }, []);

  return config;
};

/**
 * 响应式尺寸Hook - 专为Tauri桌面应用设计
 * 支持任意窗口尺寸，包括极小窗口（200x150px）
 */
export const useResponsiveSize = (): ResponsiveSizes => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 根据窗口宽度计算响应式尺寸
  const getResponsiveSizes = (width: number, height: number): ResponsiveSizes => {
    // 极小窗口 (< 300px)
    if (width < 300) {
      return {
        buttonSize: 28,
        iconSize: 14,
        spacing: 'space-x-1',
        fontSize: 'text-xs',
        controlBarHeight: 'h-12',
      };
    }
    
    // 小窗口 (300-500px)
    if (width < 500) {
      return {
        buttonSize: 32,
        iconSize: 16,
        spacing: 'space-x-1.5',
        fontSize: 'text-sm',
        controlBarHeight: 'h-14',
      };
    }
    
    // 中等窗口 (500-800px)
    if (width < 800) {
      return {
        buttonSize: 36,
        iconSize: 18,
        spacing: 'space-x-2',
        fontSize: 'text-sm',
        controlBarHeight: 'h-16',
      };
    }
    
    // 大窗口 (800-1200px)
    if (width < 1200) {
      return {
        buttonSize: 40,
        iconSize: 20,
        spacing: 'space-x-3',
        fontSize: 'text-base',
        controlBarHeight: 'h-18',
      };
    }
    
    // 超大窗口 (>= 1200px)
    return {
      buttonSize: 44,
      iconSize: 24,
      spacing: 'space-x-4',
      fontSize: 'text-lg',
      controlBarHeight: 'h-20',
    };
  };

  return getResponsiveSizes(windowSize.width, windowSize.height);
};

/**
 * 获取响应式按钮类名
 */
export const getResponsiveButtonClasses = (width: number): string => {
  if (width < 300) {
    return 'p-1 min-w-[28px] min-h-[28px]';
  }
  if (width < 500) {
    return 'p-1.5 min-w-[32px] min-h-[32px]';
  }
  if (width < 800) {
    return 'p-2 min-w-[36px] min-h-[36px]';
  }
  if (width < 1200) {
    return 'p-2.5 min-w-[40px] min-h-[40px]';
  }
  return 'p-3 min-w-[44px] min-h-[44px]';
};

/**
 * 获取响应式进度条高度
 */
export const getResponsiveProgressBarHeight = (width: number): 'thin' | 'medium' | 'thick' => {
  if (width < 500) return 'thin';
  if (width < 800) return 'medium';
  return 'thick';
};

/**
 * 获取响应式容器间距
 */
export const getResponsiveSpacing = (width: number): {
  container: string;
  controls: string;
  sections: string;
} => {
  if (width < 300) {
    return {
      container: 'p-1',
      controls: 'space-x-1',
      sections: 'space-x-1',
    };
  }
  if (width < 500) {
    return {
      container: 'p-2',
      controls: 'space-x-1.5',
      sections: 'space-x-2',
    };
  }
  if (width < 800) {
    return {
      container: 'p-3',
      controls: 'space-x-2',
      sections: 'space-x-3',
    };
  }
  if (width < 1200) {
    return {
      container: 'p-4',
      controls: 'space-x-3',
      sections: 'space-x-4',
    };
  }
  return {
    container: 'p-4',
    controls: 'space-x-4',
    sections: 'space-x-6',
  };
};

/**
 * 获取优雅降级的CSS类名
 */
export const getGracefulDegradationClasses = (
  config: GracefulDegradationConfig,
  baseClasses: string = ''
): string => {
  let classes = baseClasses;
  
  // 动画控制
  if (!config.enableAnimations) {
    classes += ' transition-none';
  } else if (config.reduceMotion) {
    classes += ' transition-opacity duration-200';
  } else {
    classes += ' transition-all duration-300';
  }
  
  // 模糊效果
  if (!config.enableBlur) {
    classes = classes.replace(/backdrop-blur-\w+/g, '');
  }
  
  // 阴影效果
  if (!config.enableShadows) {
    classes = classes.replace(/shadow-\w+/g, '');
  }
  
  // 渐变效果
  if (!config.enableGradients) {
    classes = classes.replace(/bg-gradient-\w+/g, 'bg-black/80');
  }
  
  return classes.trim();
};

/**
 * 获取可访问性增强的属性
 */
export const getAccessibilityProps = (deviceInfo: DeviceInfo): {
  'data-touch-device'?: string;
  'data-high-dpi'?: string;
  'data-mobile-device'?: string;
  style?: React.CSSProperties;
} => {
  const props: {
    'data-touch-device'?: string;
    'data-high-dpi'?: string;
    'data-mobile-device'?: string;
    style?: React.CSSProperties;
  } = {};
  
  // 触摸设备优化
  if (deviceInfo.hasTouch) {
    props['data-touch-device'] = 'true';
    props.style = {
      touchAction: 'manipulation' as const,
      WebkitTouchCallout: 'none' as const,
      WebkitUserSelect: 'none' as const,
      userSelect: 'none' as const
    };
  }
  
  // 高DPI屏幕优化
  if (deviceInfo.pixelRatio > 1.5) {
    props['data-high-dpi'] = 'true';
  }
  
  // 移动设备优化
  if (deviceInfo.isMobile) {
    props['data-mobile-device'] = 'true';
  }
  
  return props;
};