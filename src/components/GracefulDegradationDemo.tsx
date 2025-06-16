import React, { useState } from 'react';
import { 
  useDeviceInfo, 
  useGracefulDegradation, 
  getGracefulDegradationClasses,
  getAccessibilityProps 
} from '../hooks/useResponsiveSize';
import { Play, Pause, Volume2, Settings } from 'lucide-react';

interface DegradationTestProps {
  title: string;
  description: string;
}

export const GracefulDegradationDemo: React.FC<DegradationTestProps> = ({
  title,
  description
}) => {
  const deviceInfo = useDeviceInfo();
  const gracefulConfig = useGracefulDegradation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const accessibilityProps = getAccessibilityProps(deviceInfo);

  return (
    <div className="p-6 space-y-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-gray-300 mb-6">{description}</p>

        {/* 设备信息显示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">设备信息</h3>
            <ul className="space-y-1 text-sm">
              <li>类型: {deviceInfo.isMobile ? '移动设备' : deviceInfo.isTablet ? '平板' : '桌面'}</li>
              <li>触摸支持: {deviceInfo.hasTouch ? '是' : '否'}</li>
              <li>像素比: {deviceInfo.pixelRatio}</li>
              <li>方向: {deviceInfo.orientation === 'portrait' ? '竖屏' : '横屏'}</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">优雅降级配置</h3>
            <ul className="space-y-1 text-sm">
              <li>动画: {gracefulConfig.enableAnimations ? '启用' : '禁用'}</li>
              <li>模糊: {gracefulConfig.enableBlur ? '启用' : '禁用'}</li>
              <li>阴影: {gracefulConfig.enableShadows ? '启用' : '禁用'}</li>
              <li>渐变: {gracefulConfig.enableGradients ? '启用' : '禁用'}</li>
              <li>简化UI: {gracefulConfig.useSimplifiedUI ? '是' : '否'}</li>
              <li>减少动效: {gracefulConfig.reduceMotion ? '是' : '否'}</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">窗口信息</h3>
            <ul className="space-y-1 text-sm">
              <li>宽度: {window.innerWidth}px</li>
              <li>高度: {window.innerHeight}px</li>
              <li>比例: {(window.innerWidth / window.innerHeight).toFixed(2)}</li>
            </ul>
          </div>
        </div>

        {/* 优雅降级测试区域 */}
        <div className="space-y-6">
          {/* 按钮测试 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">按钮优雅降级测试</h3>
            <div className="flex flex-wrap gap-4">
              <button
                className={getGracefulDegradationClasses(
                  gracefulConfig,
                  "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm border border-blue-500/30"
                )}
                onClick={() => setIsPlaying(!isPlaying)}
                {...accessibilityProps}
                aria-label={isPlaying ? '暂停播放' : '开始播放'}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                <span className="ml-2">{isPlaying ? '暂停' : '播放'}</span>
              </button>

              <button
                className={getGracefulDegradationClasses(
                  gracefulConfig,
                  "bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm border border-green-500/30"
                )}
                {...accessibilityProps}
                aria-label="音量控制"
              >
                <Volume2 size={20} />
                <span className="ml-2">音量 {Math.round(volume * 100)}%</span>
              </button>

              <button
                className={getGracefulDegradationClasses(
                  gracefulConfig,
                  "bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm border border-gray-500/30"
                )}
                {...accessibilityProps}
                aria-label="设置"
              >
                <Settings size={20} />
                <span className="ml-2">设置</span>
              </button>
            </div>
          </div>

          {/* 进度条测试 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">进度条优雅降级测试</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">音量控制</label>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className={getGracefulDegradationClasses(
                      gracefulConfig,
                      "w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    )}
                    {...accessibilityProps}
                    aria-label="音量滑块"
                  />
                  <div 
                    className={getGracefulDegradationClasses(
                      gracefulConfig,
                      "absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg pointer-events-none"
                    )}
                    style={{ width: `${volume * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 卡片测试 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">卡片优雅降级测试</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={getGracefulDegradationClasses(
                    gracefulConfig,
                    "bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-4 rounded-lg border border-purple-500/30 backdrop-blur-sm shadow-lg hover:shadow-xl"
                  )}
                  {...accessibilityProps}
                >
                  <h4 className="text-lg font-semibold mb-2">测试卡片 {i}</h4>
                  <p className="text-gray-300 text-sm">
                    这是一个测试卡片，用于验证优雅降级功能在不同设备和性能条件下的表现。
                  </p>
                  <div className="mt-4">
                    <button
                      className={getGracefulDegradationClasses(
                        gracefulConfig,
                        "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
                      )}
                      {...accessibilityProps}
                      aria-label={`测试按钮 ${i}`}
                    >
                      测试按钮
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 性能指标 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">性能指标</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-2xl font-bold text-green-400">
                  {gracefulConfig.enableAnimations ? '✓' : '✗'}
                </div>
                <div className="text-sm">动画</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-2xl font-bold text-blue-400">
                  {gracefulConfig.enableBlur ? '✓' : '✗'}
                </div>
                <div className="text-sm">模糊</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-2xl font-bold text-purple-400">
                  {gracefulConfig.enableShadows ? '✓' : '✗'}
                </div>
                <div className="text-sm">阴影</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-2xl font-bold text-yellow-400">
                  {gracefulConfig.enableGradients ? '✓' : '✗'}
                </div>
                <div className="text-sm">渐变</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 自定义样式 */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e40af;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e40af;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}; 