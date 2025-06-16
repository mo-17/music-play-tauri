import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen, emit, UnlistenFn } from '@tauri-apps/api/event';
import { LogicalSize, LogicalPosition } from '@tauri-apps/api/window';

// 通信配置接口
export interface CommunicationConfig {
  // API调用优化
  apiThrottleDelay: number;
  apiDebounceDelay: number;
  maxRetries: number;
  retryDelay: number;
  
  // 事件系统配置
  enableEventBatching: boolean;
  batchSize: number;
  batchDelay: number;
  
  // 缓存配置
  enableCaching: boolean;
  cacheExpiry: number;
  maxCacheSize: number;
  
  // 性能监控
  enablePerformanceMonitoring: boolean;
  performanceLogInterval: number;
}

// 默认配置
const DEFAULT_CONFIG: CommunicationConfig = {
  apiThrottleDelay: 100,
  apiDebounceDelay: 300,
  maxRetries: 3,
  retryDelay: 1000,
  
  enableEventBatching: true,
  batchSize: 10,
  batchDelay: 50,
  
  enableCaching: true,
  cacheExpiry: 5000,
  maxCacheSize: 100,
  
  enablePerformanceMonitoring: true,
  performanceLogInterval: 10000
};

// API调用统计接口
export interface ApiStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  throttledCalls: number;
  cachedCalls: number;
}

// 事件统计接口
export interface EventStats {
  totalEvents: number;
  batchedEvents: number;
  averageBatchSize: number;
  eventTypes: Record<string, number>;
}

// 缓存项接口
interface CacheItem<T> {
  data: T;
  timestamp: number;
  key: string;
}

// 事件批处理项接口
interface BatchedEvent {
  event: string;
  payload: any;
  timestamp: number;
}

// Tauri通信优化Hook
export const useTauriCommunication = (config: Partial<CommunicationConfig> = {}) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // 状态管理
  const [isConnected, setIsConnected] = useState(true);
  const [apiStats, setApiStats] = useState<ApiStats>({
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    averageResponseTime: 0,
    throttledCalls: 0,
    cachedCalls: 0
  });
  const [eventStats, setEventStats] = useState<EventStats>({
    totalEvents: 0,
    batchedEvents: 0,
    averageBatchSize: 0,
    eventTypes: {}
  });

  // 引用管理
  const cacheRef = useRef<Map<string, CacheItem<any>>>(new Map());
  const throttleRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const debounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const eventBatchRef = useRef<BatchedEvent[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const unlistenersRef = useRef<UnlistenFn[]>([]);
  const responseTimesRef = useRef<number[]>([]);

  // 缓存管理
  const getFromCache = useCallback(<T>(key: string): T | null => {
    if (!fullConfig.enableCaching) return null;
    
    const item = cacheRef.current.get(key);
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > fullConfig.cacheExpiry;
    if (isExpired) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return item.data;
  }, [fullConfig.enableCaching, fullConfig.cacheExpiry]);

  const setToCache = useCallback(<T>(key: string, data: T): void => {
    if (!fullConfig.enableCaching) return;
    
    // 清理过期缓存
    if (cacheRef.current.size >= fullConfig.maxCacheSize) {
      const now = Date.now();
      for (const [cacheKey, item] of cacheRef.current.entries()) {
        if (now - item.timestamp > fullConfig.cacheExpiry) {
          cacheRef.current.delete(cacheKey);
        }
      }
      
      // 如果还是太大，删除最旧的项
      if (cacheRef.current.size >= fullConfig.maxCacheSize) {
        const oldestKey = Array.from(cacheRef.current.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
        cacheRef.current.delete(oldestKey);
      }
    }
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      key
    });
  }, [fullConfig.enableCaching, fullConfig.maxCacheSize, fullConfig.cacheExpiry]);

  // 节流API调用
  const throttledApiCall = useCallback(<T>(
    key: string,
    apiCall: () => Promise<T>,
    delay = fullConfig.apiThrottleDelay
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const existingTimeout = throttleRef.current.get(key);
      if (existingTimeout) {
        setApiStats(prev => ({ ...prev, throttledCalls: prev.throttledCalls + 1 }));
        return;
      }

      const timeout = setTimeout(async () => {
        throttleRef.current.delete(key);
        try {
          const startTime = Date.now();
          const result = await apiCall();
          const responseTime = Date.now() - startTime;
          
          // 更新统计
          responseTimesRef.current.push(responseTime);
          if (responseTimesRef.current.length > 100) {
            responseTimesRef.current = responseTimesRef.current.slice(-50);
          }
          
          setApiStats(prev => ({
            ...prev,
            totalCalls: prev.totalCalls + 1,
            successfulCalls: prev.successfulCalls + 1,
            averageResponseTime: responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length
          }));
          
          resolve(result);
        } catch (error) {
          setApiStats(prev => ({
            ...prev,
            totalCalls: prev.totalCalls + 1,
            failedCalls: prev.failedCalls + 1
          }));
          reject(error);
        }
      }, delay);

      throttleRef.current.set(key, timeout);
    });
  }, [fullConfig.apiThrottleDelay]);

  // 防抖API调用
  const debouncedApiCall = useCallback(<T>(
    key: string,
    apiCall: () => Promise<T>,
    delay = fullConfig.apiDebounceDelay
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const existingTimeout = debounceRef.current.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(async () => {
        debounceRef.current.delete(key);
        try {
          const startTime = Date.now();
          const result = await apiCall();
          const responseTime = Date.now() - startTime;
          
          responseTimesRef.current.push(responseTime);
          if (responseTimesRef.current.length > 100) {
            responseTimesRef.current = responseTimesRef.current.slice(-50);
          }
          
          setApiStats(prev => ({
            ...prev,
            totalCalls: prev.totalCalls + 1,
            successfulCalls: prev.successfulCalls + 1,
            averageResponseTime: responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length
          }));
          
          resolve(result);
        } catch (error) {
          setApiStats(prev => ({
            ...prev,
            totalCalls: prev.totalCalls + 1,
            failedCalls: prev.failedCalls + 1
          }));
          reject(error);
        }
      }, delay);

      debounceRef.current.set(key, timeout);
    });
  }, [fullConfig.apiDebounceDelay]);

  // 带缓存的API调用
  const cachedApiCall = useCallback(async <T>(
    key: string,
    apiCall: () => Promise<T>,
    forceRefresh = false
  ): Promise<T> => {
    if (!forceRefresh) {
      const cached = getFromCache<T>(key);
      if (cached !== null) {
        setApiStats(prev => ({ ...prev, cachedCalls: prev.cachedCalls + 1 }));
        return cached;
      }
    }

    const result = await apiCall();
    setToCache(key, result);
    return result;
  }, [getFromCache, setToCache]);

  // 重试机制的API调用
  const retryApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    maxRetries = fullConfig.maxRetries,
    delay = fullConfig.retryDelay
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError!;
  }, [fullConfig.maxRetries, fullConfig.retryDelay]);

  // 事件批处理
  const processBatch = useCallback(() => {
    if (eventBatchRef.current.length === 0) return;
    
    const batch = [...eventBatchRef.current];
    eventBatchRef.current = [];
    
    // 按事件类型分组
    const groupedEvents = batch.reduce((groups, event) => {
      if (!groups[event.event]) {
        groups[event.event] = [];
      }
      groups[event.event].push(event.payload);
      return groups;
    }, {} as Record<string, any[]>);
    
    // 发送批处理事件
    Object.entries(groupedEvents).forEach(([eventType, payloads]) => {
      emit(`batch_${eventType}`, {
        events: payloads,
        count: payloads.length,
        timestamp: Date.now()
      });
    });
    
    // 更新统计
    setEventStats(prev => ({
      ...prev,
      batchedEvents: prev.batchedEvents + batch.length,
      averageBatchSize: (prev.averageBatchSize + batch.length) / 2
    }));
  }, []);

  // 批量事件发送
  const batchedEmit = useCallback((event: string, payload: any) => {
    if (!fullConfig.enableEventBatching) {
      emit(event, payload);
      setEventStats(prev => ({
        ...prev,
        totalEvents: prev.totalEvents + 1,
        eventTypes: {
          ...prev.eventTypes,
          [event]: (prev.eventTypes[event] || 0) + 1
        }
      }));
      return;
    }
    
    eventBatchRef.current.push({
      event,
      payload,
      timestamp: Date.now()
    });
    
    setEventStats(prev => ({
      ...prev,
      totalEvents: prev.totalEvents + 1,
      eventTypes: {
        ...prev.eventTypes,
        [event]: (prev.eventTypes[event] || 0) + 1
      }
    }));
    
    // 如果达到批处理大小或设置了延时，处理批次
    if (eventBatchRef.current.length >= fullConfig.batchSize) {
      processBatch();
    } else if (!batchTimeoutRef.current) {
      batchTimeoutRef.current = setTimeout(() => {
        processBatch();
        batchTimeoutRef.current = undefined;
      }, fullConfig.batchDelay);
    }
  }, [fullConfig.enableEventBatching, fullConfig.batchSize, fullConfig.batchDelay, processBatch]);

  // 优化的窗口API调用
  const optimizedWindowApi = useMemo(() => ({
    // 获取窗口状态（带缓存）
    getWindowState: () => cachedApiCall('window_state', async () => {
      const window = getCurrentWindow();
      const [isFullscreen, isMaximized, isMinimized, size, position] = await Promise.all([
        window.isFullscreen(),
        window.isMaximized(),
        window.isMinimized(),
        window.innerSize(),
        window.innerPosition()
      ]);
      
      return {
        isFullscreen,
        isMaximized,
        isMinimized,
        size,
        position,
        timestamp: Date.now()
      };
    }),
    
    // 节流的窗口尺寸设置
    setWindowSize: (width: number, height: number) => 
      throttledApiCall('set_window_size', async () => {
        const window = getCurrentWindow();
        await window.setSize(new LogicalSize(width, height));
      }),
    
    // 防抖的窗口位置设置
    setWindowPosition: (x: number, y: number) =>
      debouncedApiCall('set_window_position', async () => {
        const window = getCurrentWindow();
        await window.setPosition(new LogicalPosition(x, y));
      }),
    
    // 带重试的全屏切换
    toggleFullscreen: (fullscreen: boolean) =>
      retryApiCall(async () => {
        const window = getCurrentWindow();
        await window.setFullscreen(fullscreen);
      }),
    
    // 带重试的窗口最大化
    toggleMaximize: (maximize: boolean) =>
      retryApiCall(async () => {
        const window = getCurrentWindow();
        if (maximize) {
          await window.maximize();
        } else {
          await window.unmaximize();
        }
      })
  }), [cachedApiCall, throttledApiCall, debouncedApiCall, retryApiCall]);

  // 监听窗口事件
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        const unlisteners = await Promise.all([
          listen('tauri://resize', (event) => {
            batchedEmit('window_resize', event.payload);
          }),
          listen('tauri://move', (event) => {
            batchedEmit('window_move', event.payload);
          }),
          listen('tauri://focus', () => {
            batchedEmit('window_focus', { timestamp: Date.now() });
          }),
          listen('tauri://blur', () => {
            batchedEmit('window_blur', { timestamp: Date.now() });
          })
        ]);
        
        unlistenersRef.current = unlisteners;
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to setup Tauri event listeners:', error);
        setIsConnected(false);
      }
    };

    setupEventListeners();

    return () => {
      unlistenersRef.current.forEach(unlisten => {
        try {
          unlisten();
        } catch (error) {
          console.warn('Failed to unlisten Tauri event:', error);
        }
      });
      unlistenersRef.current = [];
    };
  }, [batchedEmit]);

  // 性能监控
  useEffect(() => {
    if (!fullConfig.enablePerformanceMonitoring) return;

    const interval = setInterval(() => {
      console.log('Tauri Communication Stats:', {
        api: apiStats,
        events: eventStats,
        cache: {
          size: cacheRef.current.size,
          maxSize: fullConfig.maxCacheSize
        },
        isConnected
      });
    }, fullConfig.performanceLogInterval);

    return () => clearInterval(interval);
  }, [fullConfig.enablePerformanceMonitoring, fullConfig.performanceLogInterval, apiStats, eventStats, isConnected, fullConfig.maxCacheSize]);

  // 清理函数
  useEffect(() => {
    return () => {
      // 清理所有定时器
      throttleRef.current.forEach(timeout => clearTimeout(timeout));
      debounceRef.current.forEach(timeout => clearTimeout(timeout));
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      // 处理剩余的批处理事件
      if (eventBatchRef.current.length > 0) {
        processBatch();
      }
    };
  }, [processBatch]);

  return {
    // 状态
    isConnected,
    apiStats,
    eventStats,
    
    // 优化的API调用方法
    throttledApiCall,
    debouncedApiCall,
    cachedApiCall,
    retryApiCall,
    
    // 事件系统
    batchedEmit,
    
    // 窗口API
    windowApi: optimizedWindowApi,
    
    // 缓存管理
    getFromCache,
    setToCache,
    clearCache: () => cacheRef.current.clear(),
    
    // 配置
    config: fullConfig
  };
}; 