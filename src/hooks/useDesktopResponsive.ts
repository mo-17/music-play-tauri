import { useState, useEffect, useCallback, useMemo } from 'react';

// 桌面端响应式断点定义
export interface DesktopBreakpoints {
  micro: number;      // 极小窗口 (< 300px)
  tiny: number;       // 超小窗口 (300-480px)
  small: number;      // 小窗口 (480-768px)
  medium: number;     // 中等窗口 (768-1024px)
  large: number;      // 大窗口 (1024-1440px)
  xlarge: number;     // 超大窗口 (> 1440px)
}

// 默认断点配置
const DEFAULT_BREAKPOINTS: DesktopBreakpoints = {
  micro: 300,
  tiny: 480,
  small: 768,
  medium: 1024,
  large: 1440,
  xlarge: 1920
};

// 窗口尺寸类型
export type WindowSizeType = 'micro' | 'tiny' | 'small' | 'medium' | 'large' | 'xlarge';

// 布局配置接口
export interface LayoutConfig {
  showControls: boolean;
  showInfo: boolean;
  showProgress: boolean;
  showVolume: boolean;
  showFullscreen: boolean;
  showPlaybackRate: boolean;
  controlsPosition: 'bottom' | 'overlay' | 'minimal';
  fontSize: 'xs' | 'sm' | 'base' | 'lg';
  iconSize: number;
  padding: number;
  minHeight: number;
}

// 极小窗口特殊处理配置
export interface MicroWindowConfig {
  enabled: boolean;
  minWidth: number;
  minHeight: number;
  hideElements: string[];
  compactMode: boolean;
  overlayControls: boolean;
}

// Hook返回值接口
export interface DesktopResponsiveState {
  windowSize: { width: number; height: number };
  sizeType: WindowSizeType;
  layoutConfig: LayoutConfig;
  microWindowConfig: MicroWindowConfig;
  isExtremelySmall: boolean;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
  
  // 响应式样式类
  containerClasses: string;
  controlsClasses: string;
  textClasses: string;
  iconClasses: string;
  
  // 布局控制方法
  updateLayout: (config: Partial<LayoutConfig>) => void;
  resetLayout: () => void;
  getResponsiveValue: <T>(values: Record<WindowSizeType, T>) => T;
}

// 获取窗口尺寸类型
function getWindowSizeType(width: number, breakpoints: DesktopBreakpoints): WindowSizeType {
  if (width < breakpoints.micro) return 'micro';
  if (width < breakpoints.tiny) return 'tiny';
  if (width < breakpoints.small) return 'small';
  if (width < breakpoints.medium) return 'medium';
  if (width < breakpoints.large) return 'large';
  return 'xlarge';
}

// 获取默认布局配置
function getDefaultLayoutConfig(sizeType: WindowSizeType): LayoutConfig {
  const configs: Record<WindowSizeType, LayoutConfig> = {
    micro: {
      showControls: true,
      showInfo: false,
      showProgress: true,
      showVolume: false,
      showFullscreen: true,
      showPlaybackRate: false,
      controlsPosition: 'overlay',
      fontSize: 'xs',
      iconSize: 16,
      padding: 4,
      minHeight: 120
    },
    tiny: {
      showControls: true,
      showInfo: false,
      showProgress: true,
      showVolume: true,
      showFullscreen: true,
      showPlaybackRate: false,
      controlsPosition: 'overlay',
      fontSize: 'xs',
      iconSize: 18,
      padding: 6,
      minHeight: 150
    },
    small: {
      showControls: true,
      showInfo: true,
      showProgress: true,
      showVolume: true,
      showFullscreen: true,
      showPlaybackRate: false,
      controlsPosition: 'bottom',
      fontSize: 'sm',
      iconSize: 20,
      padding: 8,
      minHeight: 200
    },
    medium: {
      showControls: true,
      showInfo: true,
      showProgress: true,
      showVolume: true,
      showFullscreen: true,
      showPlaybackRate: true,
      controlsPosition: 'bottom',
      fontSize: 'base',
      iconSize: 24,
      padding: 12,
      minHeight: 300
    },
    large: {
      showControls: true,
      showInfo: true,
      showProgress: true,
      showVolume: true,
      showFullscreen: true,
      showPlaybackRate: true,
      controlsPosition: 'bottom',
      fontSize: 'base',
      iconSize: 24,
      padding: 16,
      minHeight: 400
    },
    xlarge: {
      showControls: true,
      showInfo: true,
      showProgress: true,
      showVolume: true,
      showFullscreen: true,
      showPlaybackRate: true,
      controlsPosition: 'bottom',
      fontSize: 'lg',
      iconSize: 28,
      padding: 20,
      minHeight: 500
    }
  };
  
  return configs[sizeType];
}

// 获取极小窗口配置
function getMicroWindowConfig(width: number, height: number): MicroWindowConfig {
  const isExtremelySmall = width < 250 || height < 150;
  
  return {
    enabled: width < 300 || height < 200,
    minWidth: Math.max(200, width),
    minHeight: Math.max(150, height),
    hideElements: isExtremelySmall 
      ? ['info', 'volume', 'playbackRate', 'time'] 
      : ['info', 'playbackRate'],
    compactMode: true,
    overlayControls: true
  };
}

// 桌面端响应式适配Hook
export function useDesktopResponsive(
  customBreakpoints?: Partial<DesktopBreakpoints>,
  initialConfig?: Partial<LayoutConfig>
): DesktopResponsiveState {
  const breakpoints = useMemo(() => ({
    ...DEFAULT_BREAKPOINTS,
    ...customBreakpoints
  }), [customBreakpoints]);

  const [windowSize, setWindowSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }));

  const [customLayoutConfig, setCustomLayoutConfig] = useState<Partial<LayoutConfig>>(
    initialConfig || {}
  );

  // 计算当前窗口尺寸类型
  const sizeType = useMemo(() => 
    getWindowSizeType(windowSize.width, breakpoints), 
    [windowSize.width, breakpoints]
  );

  // 计算布局配置
  const layoutConfig = useMemo(() => ({
    ...getDefaultLayoutConfig(sizeType),
    ...customLayoutConfig
  }), [sizeType, customLayoutConfig]);

  // 计算极小窗口配置
  const microWindowConfig = useMemo(() => 
    getMicroWindowConfig(windowSize.width, windowSize.height),
    [windowSize.width, windowSize.height]
  );

  // 计算窗口属性
  const windowProperties = useMemo(() => {
    const aspectRatio = windowSize.width / windowSize.height;
    const isExtremelySmall = windowSize.width < 250 || windowSize.height < 150;
    
    let orientation: 'landscape' | 'portrait' | 'square';
    if (aspectRatio > 1.2) orientation = 'landscape';
    else if (aspectRatio < 0.8) orientation = 'portrait';
    else orientation = 'square';

    return {
      aspectRatio,
      isExtremelySmall,
      orientation
    };
  }, [windowSize]);

  // 响应式样式类
  const responsiveClasses = useMemo(() => {
    const baseClasses = {
      micro: 'text-xs p-1',
      tiny: 'text-xs p-1.5',
      small: 'text-sm p-2',
      medium: 'text-base p-3',
      large: 'text-base p-4',
      xlarge: 'text-lg p-5'
    };

    const controlsClasses = {
      micro: 'h-8 gap-1',
      tiny: 'h-10 gap-1.5',
      small: 'h-12 gap-2',
      medium: 'h-14 gap-3',
      large: 'h-16 gap-4',
      xlarge: 'h-18 gap-5'
    };

    const textClasses = {
      micro: 'text-xs leading-tight',
      tiny: 'text-xs leading-tight',
      small: 'text-sm leading-normal',
      medium: 'text-base leading-normal',
      large: 'text-base leading-relaxed',
      xlarge: 'text-lg leading-relaxed'
    };

    const iconClasses = {
      micro: 'w-4 h-4',
      tiny: 'w-4 h-4',
      small: 'w-5 h-5',
      medium: 'w-6 h-6',
      large: 'w-6 h-6',
      xlarge: 'w-7 h-7'
    };

    return {
      containerClasses: `${baseClasses[sizeType]} ${
        microWindowConfig.enabled ? 'micro-window' : ''
      } ${windowProperties.isExtremelySmall ? 'extremely-small' : ''}`,
      controlsClasses: controlsClasses[sizeType],
      textClasses: textClasses[sizeType],
      iconClasses: iconClasses[sizeType]
    };
  }, [sizeType, microWindowConfig.enabled, windowProperties.isExtremelySmall]);

  // 窗口尺寸变化监听
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // 防抖处理，避免频繁更新
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // 更新布局配置
  const updateLayout = useCallback((config: Partial<LayoutConfig>) => {
    setCustomLayoutConfig(prev => ({ ...prev, ...config }));
  }, []);

  // 重置布局配置
  const resetLayout = useCallback(() => {
    setCustomLayoutConfig({});
  }, []);

  // 获取响应式值
  const getResponsiveValue = useCallback(<T>(values: Record<WindowSizeType, T>): T => {
    return values[sizeType];
  }, [sizeType]);

  return {
    windowSize,
    sizeType,
    layoutConfig,
    microWindowConfig,
    isExtremelySmall: windowProperties.isExtremelySmall,
    aspectRatio: windowProperties.aspectRatio,
    orientation: windowProperties.orientation,
    
    containerClasses: responsiveClasses.containerClasses,
    controlsClasses: responsiveClasses.controlsClasses,
    textClasses: responsiveClasses.textClasses,
    iconClasses: responsiveClasses.iconClasses,
    
    updateLayout,
    resetLayout,
    getResponsiveValue
  };
}

// 多显示器环境处理Hook
export function useMultiDisplaySupport() {
  const [displayInfo, setDisplayInfo] = useState({
    screenCount: 1,
    currentScreen: 0,
    screenBounds: { x: 0, y: 0, width: window.screen.width, height: window.screen.height },
    scaleFactor: window.devicePixelRatio || 1
  });

  useEffect(() => {
    // 检测显示器变化
    const handleDisplayChange = () => {
      setDisplayInfo(prev => ({
        ...prev,
        scaleFactor: window.devicePixelRatio || 1,
        screenBounds: {
          x: (window.screen as any).availLeft || 0,
          y: (window.screen as any).availTop || 0,
          width: window.screen.availWidth,
          height: window.screen.availHeight
        }
      }));
    };

    // 监听设备像素比变化（显示器切换）
    const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mediaQuery.addEventListener('change', handleDisplayChange);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayChange);
    };
  }, []);

  return displayInfo;
}

// 窗口拖拽行为优化Hook
export function useWindowDragOptimization() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });

  const handleDragStart = useCallback((event: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragStartPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleMouseUp = () => handleDragEnd();
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging, handleDragEnd]);

  return {
    isDragging,
    dragStartPosition,
    handleDragStart,
    handleDragEnd
  };
} 