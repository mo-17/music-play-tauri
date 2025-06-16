import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow, LogicalSize, PhysicalSize, LogicalPosition } from '@tauri-apps/api/window';

interface WindowState {
  isFullscreen: boolean;
  isMaximized: boolean;
  isMinimized: boolean;
  isFocused: boolean;
  isVisible: boolean;
  size: {
    width: number;
    height: number;
  };
  position: {
    x: number;
    y: number;
  };
  scaleFactor: number;
}

interface WindowControls {
  toggleFullscreen: () => Promise<void>;
  maximize: () => Promise<void>;
  minimize: () => Promise<void>;
  unmaximize: () => Promise<void>;
  show: () => Promise<void>;
  hide: () => Promise<void>;
  focus: () => Promise<void>;
  setSize: (width: number, height: number) => Promise<void>;
  setPosition: (x: number, y: number) => Promise<void>;
  center: () => Promise<void>;
  setResizable: (resizable: boolean) => Promise<void>;
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>;
}

interface UseTauriWindowOptions {
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onMaximizeChange?: (isMaximized: boolean) => void;
  onMinimizeChange?: (isMinimized: boolean) => void;
  onFocusChange?: (isFocused: boolean) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  enableAutoSync?: boolean;
  syncInterval?: number;
}

export const useTauriWindow = (options: UseTauriWindowOptions = {}) => {
  const {
    onFullscreenChange,
    onMaximizeChange,
    onMinimizeChange,
    onFocusChange,
    onSizeChange,
    onPositionChange,
    enableAutoSync = true,
    syncInterval = 1000
  } = options;

  const [windowState, setWindowState] = useState<WindowState>({
    isFullscreen: false,
    isMaximized: false,
    isMinimized: false,
    isFocused: true,
    isVisible: true,
    size: { width: 800, height: 600 },
    position: { x: 0, y: 0 },
    scaleFactor: 1.0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unlistenersRef = useRef<Array<() => void>>([]);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 获取当前窗口状态
  const syncWindowState = useCallback(async () => {
    try {
      const window = getCurrentWindow();
      
      const [
        isFullscreen,
        isMaximized,
        isMinimized,
        isFocused,
        isVisible,
        size,
        position,
        scaleFactor
      ] = await Promise.all([
        window.isFullscreen(),
        window.isMaximized(),
        window.isMinimized(),
        window.isFocused(),
        window.isVisible(),
        window.innerSize(),
        window.innerPosition(),
        window.scaleFactor()
      ]);

      const newState: WindowState = {
        isFullscreen,
        isMaximized,
        isMinimized,
        isFocused,
        isVisible,
        size: {
          width: size.width,
          height: size.height
        },
        position: {
          x: position.x,
          y: position.y
        },
        scaleFactor
      };

      setWindowState(prevState => {
        // 检查状态变化并触发回调
        if (prevState.isFullscreen !== newState.isFullscreen) {
          onFullscreenChange?.(newState.isFullscreen);
        }
        if (prevState.isMaximized !== newState.isMaximized) {
          onMaximizeChange?.(newState.isMaximized);
        }
        if (prevState.isMinimized !== newState.isMinimized) {
          onMinimizeChange?.(newState.isMinimized);
        }
        if (prevState.isFocused !== newState.isFocused) {
          onFocusChange?.(newState.isFocused);
        }
        if (prevState.size.width !== newState.size.width || 
            prevState.size.height !== newState.size.height) {
          onSizeChange?.(newState.size);
        }
        if (prevState.position.x !== newState.position.x || 
            prevState.position.y !== newState.position.y) {
          onPositionChange?.(newState.position);
        }

        return newState;
      });

      setError(null);
    } catch (err) {
      console.error('Failed to sync window state:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [onFullscreenChange, onMaximizeChange, onMinimizeChange, onFocusChange, onSizeChange, onPositionChange]);

  // 窗口控制函数
  const windowControls: WindowControls = {
    toggleFullscreen: useCallback(async () => {
      try {
        const window = getCurrentWindow();
        const isCurrentlyFullscreen = await window.isFullscreen();
        
        if (isCurrentlyFullscreen) {
          await window.setFullscreen(false);
        } else {
          await window.setFullscreen(true);
        }
        
        // 立即同步状态
        await syncWindowState();
      } catch (err) {
        console.error('Failed to toggle fullscreen:', err);
        setError(err instanceof Error ? err.message : 'Failed to toggle fullscreen');
      }
    }, [syncWindowState]),

    maximize: useCallback(async () => {
      try {
        const window = getCurrentWindow();
        await window.maximize();
        await syncWindowState();
      } catch (err) {
        console.error('Failed to maximize window:', err);
        setError(err instanceof Error ? err.message : 'Failed to maximize window');
      }
    }, [syncWindowState]),

    minimize: useCallback(async () => {
      try {
        const window = getCurrentWindow();
        await window.minimize();
        await syncWindowState();
      } catch (err) {
        console.error('Failed to minimize window:', err);
        setError(err instanceof Error ? err.message : 'Failed to minimize window');
      }
    }, [syncWindowState]),

    unmaximize: useCallback(async () => {
      try {
        const window = getCurrentWindow();
        await window.unmaximize();
        await syncWindowState();
      } catch (err) {
        console.error('Failed to unmaximize window:', err);
        setError(err instanceof Error ? err.message : 'Failed to unmaximize window');
      }
    }, [syncWindowState]),

    show: useCallback(async () => {
      try {
        const window = getCurrentWindow();
        await window.show();
        await syncWindowState();
      } catch (err) {
        console.error('Failed to show window:', err);
        setError(err instanceof Error ? err.message : 'Failed to show window');
      }
    }, [syncWindowState]),

    hide: useCallback(async () => {
      try {
        const window = getCurrentWindow();
        await window.hide();
        await syncWindowState();
      } catch (err) {
        console.error('Failed to hide window:', err);
        setError(err instanceof Error ? err.message : 'Failed to hide window');
      }
    }, [syncWindowState]),

    focus: useCallback(async () => {
      try {
        const window = getCurrentWindow();
        await window.setFocus();
        await syncWindowState();
      } catch (err) {
        console.error('Failed to focus window:', err);
        setError(err instanceof Error ? err.message : 'Failed to focus window');
      }
    }, [syncWindowState]),

    setSize: useCallback(async (width: number, height: number) => {
      try {
        const window = getCurrentWindow();
        await window.setSize(new LogicalSize(width, height));
        await syncWindowState();
      } catch (err) {
        console.error('Failed to set window size:', err);
        setError(err instanceof Error ? err.message : 'Failed to set window size');
      }
    }, [syncWindowState]),

    setPosition: useCallback(async (x: number, y: number) => {
      try {
        const window = getCurrentWindow();
        await window.setPosition(new LogicalPosition(x, y));
        await syncWindowState();
      } catch (err) {
        console.error('Failed to set window position:', err);
        setError(err instanceof Error ? err.message : 'Failed to set window position');
      }
    }, [syncWindowState]),

    center: useCallback(async () => {
      try {
        const window = getCurrentWindow();
        await window.center();
        await syncWindowState();
      } catch (err) {
        console.error('Failed to center window:', err);
        setError(err instanceof Error ? err.message : 'Failed to center window');
      }
    }, [syncWindowState]),

    setResizable: useCallback(async (resizable: boolean) => {
      try {
        const window = getCurrentWindow();
        await window.setResizable(resizable);
        await syncWindowState();
      } catch (err) {
        console.error('Failed to set window resizable:', err);
        setError(err instanceof Error ? err.message : 'Failed to set window resizable');
      }
    }, [syncWindowState]),

    setAlwaysOnTop: useCallback(async (alwaysOnTop: boolean) => {
      try {
        const window = getCurrentWindow();
        await window.setAlwaysOnTop(alwaysOnTop);
        await syncWindowState();
      } catch (err) {
        console.error('Failed to set always on top:', err);
        setError(err instanceof Error ? err.message : 'Failed to set always on top');
      }
    }, [syncWindowState])
  };

  // 设置事件监听器
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        const window = getCurrentWindow();
        
        // 监听窗口事件
        const unlisteners = await Promise.all([
          window.listen('tauri://resize', syncWindowState),
          window.listen('tauri://move', syncWindowState),
          window.listen('tauri://focus', syncWindowState),
          window.listen('tauri://blur', syncWindowState),
          window.listen('tauri://scale-change', syncWindowState),
          window.listen('tauri://menu', syncWindowState),
          window.listen('tauri://close-requested', syncWindowState)
        ]);

        unlistenersRef.current = unlisteners;
        
        // 初始同步
        await syncWindowState();
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to setup window event listeners:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup window listeners');
        setIsLoading(false);
      }
    };

    setupEventListeners();

    return () => {
      // 清理事件监听器
      unlistenersRef.current.forEach(unlisten => {
        try {
          unlisten();
        } catch (err) {
          console.error('Failed to cleanup window listener:', err);
        }
      });
      unlistenersRef.current = [];
    };
  }, [syncWindowState]);

  // 自动同步定时器
  useEffect(() => {
    if (enableAutoSync && syncInterval > 0) {
      syncIntervalRef.current = setInterval(syncWindowState, syncInterval);
      
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
          syncIntervalRef.current = null;
        }
      };
    }
  }, [enableAutoSync, syncInterval, syncWindowState]);

  // 页面可见性变化监听
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 页面变为可见时同步状态
        syncWindowState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncWindowState]);

  return {
    windowState,
    windowControls,
    isLoading,
    error,
    syncWindowState
  };
}; 