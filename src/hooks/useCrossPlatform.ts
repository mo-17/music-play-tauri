import { useState, useEffect, useMemo, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

// 平台类型定义
export type SupportedPlatform = 'windows' | 'macos' | 'linux' | 'unknown';

// 平台特定配置接口
export interface PlatformConfig {
  // 窗口控制
  windowControls: {
    showNativeControls: boolean;
    customTitleBar: boolean;
    titleBarHeight: number;
    controlsPosition: 'left' | 'right';
    closeButtonColor: string;
    minimizeButtonColor: string;
    maximizeButtonColor: string;
  };
  
  // UI风格
  uiStyle: {
    borderRadius: string;
    shadowStyle: string;
    accentColor: string;
    fontFamily: string;
    scrollbarStyle: 'native' | 'custom';
    animationDuration: number;
    focusRingStyle: string;
  };
  
  // 交互行为
  interaction: {
    doubleClickBehavior: 'maximize' | 'fullscreen' | 'none';
    rightClickBehavior: 'context' | 'none';
    keyboardShortcuts: Record<string, string>;
    mouseWheelBehavior: 'scroll' | 'zoom';
    touchSupport: boolean;
  };
  
  // 性能优化
  performance: {
    enableHardwareAcceleration: boolean;
    maxFrameRate: number;
    enableVSync: boolean;
    memoryOptimization: boolean;
  };
}

// 默认平台配置
const DEFAULT_CONFIGS: Record<SupportedPlatform, PlatformConfig> = {
  windows: {
    windowControls: {
      showNativeControls: false,
      customTitleBar: true,
      titleBarHeight: 32,
      controlsPosition: 'right',
      closeButtonColor: '#e81123',
      minimizeButtonColor: '#666666',
      maximizeButtonColor: '#666666'
    },
    uiStyle: {
      borderRadius: '0px',
      shadowStyle: '0 4px 8px rgba(0,0,0,0.15)',
      accentColor: '#0078d4',
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      scrollbarStyle: 'custom',
      animationDuration: 200,
      focusRingStyle: '2px solid #0078d4'
    },
    interaction: {
      doubleClickBehavior: 'maximize',
      rightClickBehavior: 'context',
      keyboardShortcuts: {
        'Alt+F4': 'close',
        'F11': 'fullscreen',
        'Win+Up': 'maximize',
        'Win+Down': 'minimize'
      },
      mouseWheelBehavior: 'scroll',
      touchSupport: true
    },
    performance: {
      enableHardwareAcceleration: true,
      maxFrameRate: 60,
      enableVSync: true,
      memoryOptimization: true
    }
  },
  
  macos: {
    windowControls: {
      showNativeControls: true,
      customTitleBar: false,
      titleBarHeight: 28,
      controlsPosition: 'left',
      closeButtonColor: '#ff5f57',
      minimizeButtonColor: '#ffbd2e',
      maximizeButtonColor: '#28ca42'
    },
    uiStyle: {
      borderRadius: '8px',
      shadowStyle: '0 8px 32px rgba(0,0,0,0.12)',
      accentColor: '#007aff',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      scrollbarStyle: 'native',
      animationDuration: 300,
      focusRingStyle: '3px solid rgba(0,122,255,0.3)'
    },
    interaction: {
      doubleClickBehavior: 'none',
      rightClickBehavior: 'context',
      keyboardShortcuts: {
        'Cmd+Q': 'close',
        'Cmd+M': 'minimize',
        'Cmd+Ctrl+F': 'fullscreen',
        'Cmd+W': 'close'
      },
      mouseWheelBehavior: 'scroll',
      touchSupport: true
    },
    performance: {
      enableHardwareAcceleration: true,
      maxFrameRate: 120,
      enableVSync: true,
      memoryOptimization: false
    }
  },
  
  linux: {
    windowControls: {
      showNativeControls: false,
      customTitleBar: true,
      titleBarHeight: 30,
      controlsPosition: 'right',
      closeButtonColor: '#cc241d',
      minimizeButtonColor: '#666666',
      maximizeButtonColor: '#666666'
    },
    uiStyle: {
      borderRadius: '4px',
      shadowStyle: '0 2px 8px rgba(0,0,0,0.2)',
      accentColor: '#4285f4',
      fontFamily: 'Ubuntu, system-ui, sans-serif',
      scrollbarStyle: 'custom',
      animationDuration: 150,
      focusRingStyle: '2px solid #4285f4'
    },
    interaction: {
      doubleClickBehavior: 'maximize',
      rightClickBehavior: 'context',
      keyboardShortcuts: {
        'Alt+F4': 'close',
        'F11': 'fullscreen',
        'Super+Up': 'maximize',
        'Super+Down': 'minimize'
      },
      mouseWheelBehavior: 'scroll',
      touchSupport: false
    },
    performance: {
      enableHardwareAcceleration: true,
      maxFrameRate: 60,
      enableVSync: false,
      memoryOptimization: true
    }
  },
  
  unknown: {
    windowControls: {
      showNativeControls: true,
      customTitleBar: false,
      titleBarHeight: 30,
      controlsPosition: 'right',
      closeButtonColor: '#666666',
      minimizeButtonColor: '#666666',
      maximizeButtonColor: '#666666'
    },
    uiStyle: {
      borderRadius: '4px',
      shadowStyle: '0 2px 4px rgba(0,0,0,0.1)',
      accentColor: '#007acc',
      fontFamily: 'system-ui, sans-serif',
      scrollbarStyle: 'native',
      animationDuration: 200,
      focusRingStyle: '2px solid #007acc'
    },
    interaction: {
      doubleClickBehavior: 'maximize',
      rightClickBehavior: 'context',
      keyboardShortcuts: {
        'F11': 'fullscreen',
        'Escape': 'exit-fullscreen'
      },
      mouseWheelBehavior: 'scroll',
      touchSupport: false
    },
    performance: {
      enableHardwareAcceleration: true,
      maxFrameRate: 60,
      enableVSync: true,
      memoryOptimization: true
    }
  }
};

// 平台检测状态接口
export interface PlatformState {
  platform: SupportedPlatform;
  version: string;
  arch: string;
  isDetected: boolean;
  config: PlatformConfig;
  capabilities: {
    hasNativeControls: boolean;
    supportsTransparency: boolean;
    supportsBlur: boolean;
    supportsHardwareAcceleration: boolean;
    supportsTouchInput: boolean;
  };
}

// 跨平台兼容性Hook
export const useCrossPlatform = (customConfig?: Partial<Record<SupportedPlatform, Partial<PlatformConfig>>>) => {
  const [platformState, setPlatformState] = useState<PlatformState>({
    platform: 'unknown',
    version: '',
    arch: '',
    isDetected: false,
    config: DEFAULT_CONFIGS.unknown,
    capabilities: {
      hasNativeControls: false,
      supportsTransparency: false,
      supportsBlur: false,
      supportsHardwareAcceleration: false,
      supportsTouchInput: false
    }
  });

  // 检测平台信息
  const detectPlatform = useCallback(async () => {
    try {
      const platformType = detectPlatformFromUserAgent();
      
      // 获取平台配置
      const baseConfig = DEFAULT_CONFIGS[platformType];
      const userConfig = customConfig?.[platformType] || {};
      const mergedConfig = mergeConfigs(baseConfig, userConfig);
      
      // 检测平台能力
      const capabilities = await detectCapabilities(platformType);
      
      setPlatformState({
        platform: platformType,
        version: await getOSVersion(),
        arch: await getArchitecture(),
        isDetected: true,
        config: mergedConfig,
        capabilities
      });
      
      console.log(`Platform detected: ${platformType}`, capabilities);
    } catch (error) {
      console.error('Failed to detect platform:', error);
      setPlatformState(prev => ({ ...prev, isDetected: true }));
    }
  }, [customConfig]);

  // 从User Agent检测平台
  const detectPlatformFromUserAgent = (): SupportedPlatform => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('win')) {
      return 'windows';
    } else if (userAgent.includes('mac')) {
      return 'macos';
    } else if (userAgent.includes('linux')) {
      return 'linux';
    } else {
      return 'unknown';
    }
  };

  // 合并配置
  const mergeConfigs = (base: PlatformConfig, custom: Partial<PlatformConfig>): PlatformConfig => {
    return {
      windowControls: { ...base.windowControls, ...custom.windowControls },
      uiStyle: { ...base.uiStyle, ...custom.uiStyle },
      interaction: { ...base.interaction, ...custom.interaction },
      performance: { ...base.performance, ...custom.performance }
    };
  };

  // 检测平台能力
  const detectCapabilities = async (platformType: SupportedPlatform) => {
    const capabilities = {
      hasNativeControls: platformType === 'macos',
      supportsTransparency: true,
      supportsBlur: platformType !== 'linux',
      supportsHardwareAcceleration: true,
      supportsTouchInput: platformType === 'windows' || platformType === 'macos'
    };

    // 检测触摸支持
    if (typeof window !== 'undefined') {
      capabilities.supportsTouchInput = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    return capabilities;
  };

  // 获取操作系统版本
  const getOSVersion = async (): Promise<string> => {
    try {
      // 这里可以使用Tauri的API获取更详细的版本信息
      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  // 获取架构信息
  const getArchitecture = async (): Promise<string> => {
    try {
      // 这里可以使用Tauri的API获取架构信息
      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  // 应用平台特定样式
  const applyPlatformStyles = useCallback(() => {
    if (!platformState.isDetected) return;

    const { config } = platformState;
    const root = document.documentElement;

    // 应用CSS变量
    root.style.setProperty('--platform-border-radius', config.uiStyle.borderRadius);
    root.style.setProperty('--platform-shadow', config.uiStyle.shadowStyle);
    root.style.setProperty('--platform-accent-color', config.uiStyle.accentColor);
    root.style.setProperty('--platform-font-family', config.uiStyle.fontFamily);
    root.style.setProperty('--platform-animation-duration', `${config.uiStyle.animationDuration}ms`);
    root.style.setProperty('--platform-focus-ring', config.uiStyle.focusRingStyle);
    root.style.setProperty('--platform-titlebar-height', `${config.windowControls.titleBarHeight}px`);

    // 添加平台特定类名
    document.body.classList.add(`platform-${platformState.platform}`);
    
    if (config.windowControls.customTitleBar) {
      document.body.classList.add('custom-titlebar');
    }
    
    if (config.uiStyle.scrollbarStyle === 'custom') {
      document.body.classList.add('custom-scrollbar');
    }
  }, [platformState]);

  // 获取平台特定的CSS类名
  const getPlatformClasses = useMemo(() => {
    if (!platformState.isDetected) return '';
    
    const classes = [
      `platform-${platformState.platform}`,
      platformState.config.windowControls.customTitleBar ? 'custom-titlebar' : 'native-titlebar',
      platformState.config.uiStyle.scrollbarStyle === 'custom' ? 'custom-scrollbar' : 'native-scrollbar',
      platformState.capabilities.supportsTouchInput ? 'touch-enabled' : 'touch-disabled'
    ];
    
    return classes.join(' ');
  }, [platformState]);

  // 处理平台特定的键盘事件
  const handlePlatformKeyboard = useCallback((event: KeyboardEvent, action: string) => {
    const { keyboardShortcuts } = platformState.config.interaction;
    
    // 构建快捷键字符串
    const modifiers = [];
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.metaKey) modifiers.push(platformState.platform === 'macos' ? 'Cmd' : 'Meta');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');
    
    const shortcut = [...modifiers, event.key].join('+');
    
    // 检查是否匹配平台快捷键
    if (keyboardShortcuts[shortcut] === action) {
      event.preventDefault();
      return true;
    }
    
    return false;
  }, [platformState]);

  // 获取平台特定的窗口控制配置
  const getWindowControlsConfig = useMemo(() => {
    return platformState.config.windowControls;
  }, [platformState.config.windowControls]);

  // 获取平台特定的性能配置
  const getPerformanceConfig = useMemo(() => {
    return platformState.config.performance;
  }, [platformState.config.performance]);

  // 检查平台能力
  const hasCapability = useCallback((capability: keyof PlatformState['capabilities']) => {
    return platformState.capabilities[capability];
  }, [platformState.capabilities]);

  // 初始化平台检测
  useEffect(() => {
    detectPlatform();
  }, [detectPlatform]);

  // 应用平台样式
  useEffect(() => {
    applyPlatformStyles();
  }, [applyPlatformStyles]);

  return {
    // 状态
    platform: platformState.platform,
    version: platformState.version,
    arch: platformState.arch,
    isDetected: platformState.isDetected,
    config: platformState.config,
    capabilities: platformState.capabilities,
    
    // 样式和类名
    platformClasses: getPlatformClasses,
    windowControlsConfig: getWindowControlsConfig,
    performanceConfig: getPerformanceConfig,
    
    // 方法
    handlePlatformKeyboard,
    hasCapability,
    applyPlatformStyles,
    
    // 平台检查
    isWindows: platformState.platform === 'windows',
    isMacOS: platformState.platform === 'macos',
    isLinux: platformState.platform === 'linux',
    isUnknown: platformState.platform === 'unknown'
  };
}; 