import React, { useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { MinimalProgressBar } from './MinimalProgressBar';
import { NeonProgressBar } from './NeonProgressBar';
import { GlassProgressBar } from './GlassProgressBar';

export const ProgressBarDemo: React.FC = () => {
  const [progressValue, setProgressValue] = useState(45);
  const [volumeValue, setVolumeValue] = useState(0.7);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          🎵 进度条风格预览
        </h1>
        
        <div className="space-y-12">
          {/* 方案1：现代渐变风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案1：现代渐变风格 (推荐)
            </h2>
            <p className="text-gray-400 mb-6">
              特点：渐变色彩、发光效果、动态交互、进度提示
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <ProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    variant="primary"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <ProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    variant="volume"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案2：极简线条风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案2：极简线条风格
            </h2>
            <p className="text-gray-400 mb-6">
              特点：简洁优雅、细线条、悬停显示滑块、适合极简界面
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <MinimalProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    variant="primary"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <MinimalProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    variant="volume"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案3：霓虹发光风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案3：霓虹发光风格
            </h2>
            <p className="text-gray-400 mb-6">
              特点：赛博朋克风格、霓虹发光、动态光效、未来感十足
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <NeonProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    variant="primary"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <NeonProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    variant="volume"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案4：玻璃拟态风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案4：玻璃拟态风格
            </h2>
            <p className="text-gray-400 mb-6">
              特点：毛玻璃效果、半透明、高光反射、现代苹果风格
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <GlassProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    variant="primary"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <GlassProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    variant="volume"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 控制面板 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">实时调节</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  播放进度: {progressValue}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressValue}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  音量: {Math.round(volumeValue * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volumeValue}
                  onChange={(e) => setVolumeValue(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* 推荐说明 */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">💡 选择建议</h3>
            <ul className="space-y-2 text-gray-300">
              <li><strong>方案1 (现代渐变)</strong>：最推荐，平衡了美观性和实用性</li>
              <li><strong>方案2 (极简线条)</strong>：适合喜欢简洁风格的用户</li>
              <li><strong>方案3 (霓虹发光)</strong>：适合游戏或科技主题应用</li>
              <li><strong>方案4 (玻璃拟态)</strong>：适合现代、高端的设计风格</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 