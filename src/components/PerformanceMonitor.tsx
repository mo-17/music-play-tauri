import React, { useState, useEffect, useRef, memo } from 'react';
import { Activity, Clock, Cpu, MemoryStick, Zap } from 'lucide-react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage: number;
  componentMountTime: number;
  reRenderReasons: string[];
}

interface PerformanceMonitorProps {
  componentName: string;
  isVisible?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = memo(({
  componentName,
  isVisible = false,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
    componentMountTime: Date.now(),
    reRenderReasons: []
  });

  const renderTimesRef = useRef<number[]>([]);
  const lastPropsRef = useRef<any>({});
  const renderStartTimeRef = useRef<number>(0);

  // 监控渲染性能
  useEffect(() => {
    const renderStartTime = performance.now();
    renderStartTimeRef.current = renderStartTime;

    return () => {
      const renderEndTime = performance.now();
      const renderTime = renderEndTime - renderStartTime;
      
      renderTimesRef.current.push(renderTime);
      
      // 保持最近100次渲染的记录
      if (renderTimesRef.current.length > 100) {
        renderTimesRef.current.shift();
      }

      const averageRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;

      setMetrics(prev => {
        const newMetrics = {
          ...prev,
          renderCount: prev.renderCount + 1,
          lastRenderTime: renderTime,
          averageRenderTime
        };
        
        onMetricsUpdate?.(newMetrics);
        return newMetrics;
      });
    };
  });

  // 监控内存使用
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memInfo.usedJSHeapSize / 1024 / 1024 // MB
        }));
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 2000);

    return () => clearInterval(interval);
  }, []);

  // 格式化数字
  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals);
  };

  // 格式化时间
  const formatTime = (ms: number) => {
    if (ms < 1) return `${formatNumber(ms * 1000, 1)}μs`;
    if (ms < 1000) return `${formatNumber(ms, 2)}ms`;
    return `${formatNumber(ms / 1000, 2)}s`;
  };

  // 获取性能等级颜色
  const getPerformanceColor = (renderTime: number) => {
    if (renderTime < 16) return 'text-green-500'; // 60fps
    if (renderTime < 33) return 'text-yellow-500'; // 30fps
    return 'text-red-500'; // <30fps
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg backdrop-blur-sm border border-white/20 z-50 min-w-[280px]">
      <div className="flex items-center space-x-2 mb-3">
        <Activity size={16} className="text-cyan-400" />
        <h3 className="text-sm font-semibold">性能监控 - {componentName}</h3>
      </div>

      <div className="space-y-2 text-xs">
        {/* 渲染次数 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap size={12} className="text-blue-400" />
            <span>渲染次数:</span>
          </div>
          <span className="font-mono">{metrics.renderCount}</span>
        </div>

        {/* 最后渲染时间 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock size={12} className="text-green-400" />
            <span>最后渲染:</span>
          </div>
          <span className={`font-mono ${getPerformanceColor(metrics.lastRenderTime)}`}>
            {formatTime(metrics.lastRenderTime)}
          </span>
        </div>

        {/* 平均渲染时间 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu size={12} className="text-yellow-400" />
            <span>平均渲染:</span>
          </div>
          <span className={`font-mono ${getPerformanceColor(metrics.averageRenderTime)}`}>
            {formatTime(metrics.averageRenderTime)}
          </span>
        </div>

        {/* 内存使用 */}
        {metrics.memoryUsage > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MemoryStick size={12} className="text-purple-400" />
              <span>内存使用:</span>
            </div>
            <span className="font-mono">
              {formatNumber(metrics.memoryUsage)} MB
            </span>
          </div>
        )}

        {/* 运行时间 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock size={12} className="text-gray-400" />
            <span>运行时间:</span>
          </div>
          <span className="font-mono">
            {formatTime(Date.now() - metrics.componentMountTime)}
          </span>
        </div>

        {/* 性能指标 */}
        <div className="mt-3 pt-2 border-t border-white/20">
          <div className="text-xs text-gray-400 mb-1">性能指标:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={`font-mono ${getPerformanceColor(metrics.lastRenderTime)}`}>
                {metrics.lastRenderTime > 0 ? Math.round(1000 / metrics.lastRenderTime) : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>状态:</span>
              <span className={`font-mono ${getPerformanceColor(metrics.averageRenderTime)}`}>
                {metrics.averageRenderTime < 16 ? '优秀' : 
                 metrics.averageRenderTime < 33 ? '良好' : '需优化'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

// 性能监控Hook
export const usePerformanceMonitor = (componentName: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const PerformanceComponent = memo(() => (
    <PerformanceMonitor
      componentName={componentName}
      isVisible={isVisible}
      onMetricsUpdate={setMetrics}
    />
  ));

  return {
    metrics,
    isVisible,
    toggleVisibility,
    PerformanceComponent
  };
}; 