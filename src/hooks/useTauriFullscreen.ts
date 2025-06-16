import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

// 全屏模式类型
export type FullscreenMode = 'none' | 'element' | 'window' | 'both';

// 全屏状态接口
export interface FullscreenState {
  mode: FullscreenMode;
  isElementFullscreen: boolean;
  isWindowFullscreen: boolean;
  isTransitioning: boolean;
  error?: string;
}

// 全屏配置接口
export interface FullscreenConfig {
  preferredMode: 'element' | 'window' | 'both';
  enableAutoSync: boolean;
  transitionDelay: number;
  fallbackToElement: boolean;
  enableKeyboardShortcuts: boolean;
}

// 默认配置
const DEFAULT_CONFIG: FullscreenConfig = {
  preferredMode: 'both',
  enableAutoSync: true,
  transitionDelay: 100,
  fallbackToElement: true,
  enableKeyboardShortcuts: true
};

// Tauri全屏管理Hook
export const useTauriFullscreen = (
  containerRef: React.RefObject<HTMLElement>,
  config: Partial<FullscreenConfig> = {}
) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // 全屏状态
  const [fullscreenState, setFullscreenState] = useState<FullscreenState>({
    mode: 'none',
    isElementFullscreen: false,
    isWindowFullscreen: false,
    isTransitioning: false
  });

  // 事件监听器引用
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

  // 更新全屏状态
  const updateFullscreenState = useCallback((updates: Partial<FullscreenState>) => {
    setFullscreenState(prev => {
      const newState = { ...prev, ...updates };
      
      // 计算当前模式
      if (newState.isElementFullscreen && newState.isWindowFullscreen) {
        newState.mode = 'both';
      } else if (newState.isElementFullscreen) {
        newState.mode = 'element';
      } else if (newState.isWindowFullscreen) {
        newState.mode = 'window';
      } else {
        newState.mode = 'none';
      }
      
      return newState;
    });
  }, []);

  // 设置过渡状态
  const setTransitioning = useCallback((isTransitioning: boolean, delay = fullConfig.transitionDelay) => {
    updateFullscreenState({ isTransitioning });
    
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    if (isTransitioning && delay > 0) {
      transitionTimeoutRef.current = setTimeout(() => {
        updateFullscreenState({ isTransitioning: false });
      }, delay);
    }
  }, [fullConfig.transitionDelay, updateFullscreenState]);

  // 检查元素全屏状态
  const checkElementFullscreen = useCallback(() => {
    const isFullscreen = document.fullscreenElement === containerRef.current;
    updateFullscreenState({ isElementFullscreen: isFullscreen });
    return isFullscreen;
  }, [containerRef, updateFullscreenState]);

  // 检查窗口全屏状态
  const checkWindowFullscreen = useCallback(async () => {
    try {
      const window = getCurrentWindow();
      const isFullscreen = await window.isFullscreen();
      updateFullscreenState({ isWindowFullscreen: isFullscreen });
      return isFullscreen;
    } catch (error) {
      console.warn('Failed to check window fullscreen state:', error);
      return false;
    }
  }, [updateFullscreenState]);

  // 元素全屏控制
  const toggleElementFullscreen = useCallback(async (force?: boolean) => {
    if (!containerRef.current) {
      throw new Error('Container element not available');
    }

    setTransitioning(true);
    
    try {
      const isCurrentlyFullscreen = document.fullscreenElement === containerRef.current;
      const shouldEnter = force !== undefined ? force : !isCurrentlyFullscreen;

      if (shouldEnter && !isCurrentlyFullscreen) {
        // 进入元素全屏
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else {
          throw new Error('Element fullscreen not supported');
        }
      } else if (!shouldEnter && isCurrentlyFullscreen) {
        // 退出元素全屏
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else {
          throw new Error('Exit fullscreen not supported');
        }
      }
      
      // 检查最终状态
      setTimeout(checkElementFullscreen, 50);
      
    } catch (error) {
      console.error('Element fullscreen toggle failed:', error);
      updateFullscreenState({ error: `元素全屏失败: ${error}` });
      throw error;
    } finally {
      setTransitioning(false);
    }
  }, [containerRef, setTransitioning, checkElementFullscreen, updateFullscreenState]);

  // 窗口全屏控制
  const toggleWindowFullscreen = useCallback(async (force?: boolean) => {
    setTransitioning(true);
    
    try {
      const window = getCurrentWindow();
      const isCurrentlyFullscreen = await window.isFullscreen();
      const shouldEnter = force !== undefined ? force : !isCurrentlyFullscreen;

      if (shouldEnter && !isCurrentlyFullscreen) {
        // 进入窗口全屏
        await window.setFullscreen(true);
        console.log('Tauri window entered fullscreen');
      } else if (!shouldEnter && isCurrentlyFullscreen) {
        // 退出窗口全屏
        await window.setFullscreen(false);
        console.log('Tauri window exited fullscreen');
      }
      
      // 检查最终状态
      setTimeout(checkWindowFullscreen, 50);
      
    } catch (error) {
      console.error('Window fullscreen toggle failed:', error);
      updateFullscreenState({ error: `窗口全屏失败: ${error}` });
      throw error;
    } finally {
      setTransitioning(false);
    }
  }, [setTransitioning, checkWindowFullscreen, updateFullscreenState]);

  // 双重全屏控制
  const toggleBothFullscreen = useCallback(async (force?: boolean) => {
    const shouldEnter = force !== undefined ? force : fullscreenState.mode === 'none';
    
    setTransitioning(true);
    
    try {
      if (shouldEnter) {
        // 进入双重全屏 - 先窗口后元素
        await toggleWindowFullscreen(true);
        await new Promise(resolve => setTimeout(resolve, fullConfig.transitionDelay));
        await toggleElementFullscreen(true);
      } else {
        // 退出双重全屏 - 先元素后窗口
        await toggleElementFullscreen(false);
        await new Promise(resolve => setTimeout(resolve, fullConfig.transitionDelay));
        await toggleWindowFullscreen(false);
      }
    } catch (error) {
      console.error('Both fullscreen toggle failed:', error);
      updateFullscreenState({ error: `双重全屏失败: ${error}` });
      
      // 尝试回退策略
      if (fullConfig.fallbackToElement) {
        try {
          await toggleElementFullscreen(shouldEnter);
        } catch (fallbackError) {
          console.error('Fallback to element fullscreen failed:', fallbackError);
        }
      }
    } finally {
      setTransitioning(false);
    }
  }, [fullscreenState.mode, toggleWindowFullscreen, toggleElementFullscreen, fullConfig.transitionDelay, fullConfig.fallbackToElement, setTransitioning, updateFullscreenState]);

  // 智能全屏切换
  const toggleFullscreen = useCallback(async (mode?: FullscreenMode) => {
    const targetMode = mode || fullConfig.preferredMode;
    
    try {
      switch (targetMode) {
        case 'element':
          await toggleElementFullscreen();
          break;
        case 'window':
          await toggleWindowFullscreen();
          break;
        case 'both':
          await toggleBothFullscreen();
          break;
        default:
          // 退出所有全屏
          if (fullscreenState.isElementFullscreen) {
            await toggleElementFullscreen(false);
          }
          if (fullscreenState.isWindowFullscreen) {
            await toggleWindowFullscreen(false);
          }
      }
    } catch (error) {
      console.error('Smart fullscreen toggle failed:', error);
    }
  }, [fullConfig.preferredMode, toggleElementFullscreen, toggleWindowFullscreen, toggleBothFullscreen, fullscreenState]);

  // 退出所有全屏
  const exitAllFullscreen = useCallback(async () => {
    setTransitioning(true);
    
    try {
      const promises: Promise<void>[] = [];
      
      if (fullscreenState.isElementFullscreen) {
        promises.push(toggleElementFullscreen(false));
      }
      
      if (fullscreenState.isWindowFullscreen) {
        promises.push(toggleWindowFullscreen(false));
      }
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Exit all fullscreen failed:', error);
    } finally {
      setTransitioning(false);
    }
  }, [fullscreenState, toggleElementFullscreen, toggleWindowFullscreen, setTransitioning]);

  // 监听浏览器全屏变化事件
  useEffect(() => {
    const handleFullscreenChange = () => {
      checkElementFullscreen();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [checkElementFullscreen]);

  // 监听Tauri窗口事件
  useEffect(() => {
    if (!fullConfig.enableAutoSync) return;

    const setupTauriListeners = async () => {
      try {
        // 监听窗口尺寸变化事件
        const unlistenResize = await listen('tauri://resize', () => {
          // 延迟检查，确保状态已更新
          setTimeout(checkWindowFullscreen, 100);
        });
        
        // 监听窗口焦点变化事件
        const unlistenFocus = await listen('tauri://focus', () => {
          checkWindowFullscreen();
        });

        // 监听窗口模糊事件
        const unlistenBlur = await listen('tauri://blur', () => {
          checkWindowFullscreen();
        });

        unlistenRefs.current = [unlistenResize, unlistenFocus, unlistenBlur];
      } catch (error) {
        console.warn('Failed to setup Tauri event listeners:', error);
      }
    };

    setupTauriListeners();

    return () => {
      unlistenRefs.current.forEach(unlisten => {
        try {
          unlisten();
        } catch (error) {
          console.warn('Failed to unlisten Tauri event:', error);
        }
      });
      unlistenRefs.current = [];
    };
  }, [fullConfig.enableAutoSync, checkWindowFullscreen]);

  // 键盘快捷键支持
  useEffect(() => {
    if (!fullConfig.enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // F11 - 切换全屏
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      }
      
      // Escape - 退出全屏
      if (event.key === 'Escape' && fullscreenState.mode !== 'none') {
        event.preventDefault();
        exitAllFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullConfig.enableKeyboardShortcuts, toggleFullscreen, exitAllFullscreen, fullscreenState.mode]);

  // 初始状态检查
  useEffect(() => {
    checkElementFullscreen();
    checkWindowFullscreen();
  }, [checkElementFullscreen, checkWindowFullscreen]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 状态
    fullscreenState,
    isFullscreen: fullscreenState.mode !== 'none',
    isElementFullscreen: fullscreenState.isElementFullscreen,
    isWindowFullscreen: fullscreenState.isWindowFullscreen,
    isTransitioning: fullscreenState.isTransitioning,
    mode: fullscreenState.mode,
    error: fullscreenState.error,
    
    // 控制方法
    toggleFullscreen,
    toggleElementFullscreen,
    toggleWindowFullscreen,
    toggleBothFullscreen,
    exitAllFullscreen,
    
    // 状态检查方法
    checkElementFullscreen,
    checkWindowFullscreen,
    
    // 配置
    config: fullConfig
  };
}; 