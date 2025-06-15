import React, { useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { MinimalProgressBar } from './MinimalProgressBar';
import { NeonProgressBar } from './NeonProgressBar';
import { GlassProgressBar } from './GlassProgressBar';
import { WaveProgressBar } from './WaveProgressBar';
import { PulseProgressBar } from './PulseProgressBar';
import { GradientProgressBar } from './GradientProgressBar';
import { SegmentedProgressBar } from './SegmentedProgressBar';
import { CircularProgressBar } from './CircularProgressBar';
import { LiquidProgressBar } from './LiquidProgressBar';
import { SkeuomorphicProgressBar } from './SkeuomorphicProgressBar';
import { ParticleProgressBar } from './ParticleProgressBar';
import { DigitalProgressBar } from './DigitalProgressBar';
import { VintageProgressBar } from './VintageProgressBar';
import { Neon2ProgressBar } from './Neon2ProgressBar';
import { NeonProgressBar as Neon3ProgressBar } from './Neon3ProgressBar';
import './ProgressBarDemo.css';

export const ProgressBarDemo: React.FC = () => {
  const [progressValue, setProgressValue] = useState(45);
  const [volumeValue, setVolumeValue] = useState(0.7);

  return (
    <div className="min-h-screen bg-gray-900 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🎵 精美进度条风格大全
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    color="cyan"
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
                    color="purple"
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

          {/* 方案5：波浪动画风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案5：波浪动画风格
            </h2>
            <p className="text-gray-400 mb-6">
              特点：流动波浪、动态效果、海洋主题、视觉冲击力强
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <WaveProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    color="blue"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <WaveProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    color="green"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案6：脉冲动画风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案6：脉冲动画风格
            </h2>
            <p className="text-gray-400 mb-6">
              特点：心跳脉冲、呼吸效果、生命力感、医疗主题
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <PulseProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    color="red"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <PulseProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    color="pink"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案7：多彩渐变风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案7：多彩渐变风格
            </h2>
            <p className="text-gray-400 mb-6">
              特点：彩虹渐变、星光效果、梦幻色彩、艺术感强
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <GradientProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    variant="rainbow"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <GradientProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    variant="sunset"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案8：分段式风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案8：分段式风格
            </h2>
            <p className="text-gray-400 mb-6">
              特点：分段显示、精确控制、游戏风格、清晰易读
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <SegmentedProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    segments={10}
                    color="blue"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <SegmentedProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    segments={5}
                    color="green"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案9：圆形进度条 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案9：圆形进度条
            </h2>
            <p className="text-gray-400 mb-6">
              特点：圆形设计、空间节省、仪表盘风格、现代感强
            </p>
            
            <div className="flex items-center justify-around">
              <div className="text-center">
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <CircularProgressBar
                  value={progressValue}
                  max={100}
                  onChange={setProgressValue}
                  size="large"
                  color="blue"
                />
              </div>
              
              <div className="text-center">
                <label className="text-sm text-gray-300 mb-2 block">音量</label>
                <CircularProgressBar
                  value={volumeValue}
                  max={1}
                  onChange={setVolumeValue}
                  size="medium"
                  color="green"
                />
              </div>
            </div>
          </div>

          {/* 方案10：液体波动风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案10：液体波动风格
            </h2>
            <p className="text-gray-400 mb-6">
              特点：液体效果、气泡动画、真实物理、沉浸感强
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <LiquidProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    color="blue"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <LiquidProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    color="cyan"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案11：拟物化风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案11：拟物化风格
            </h2>
            <p className="text-gray-400 mb-6">
              特点：真实材质、立体效果、怀旧感、质感丰富
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <SkeuomorphicProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    variant="metal"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <SkeuomorphicProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    variant="wood"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案12：粒子效果风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案12：粒子效果风格
            </h2>
            <p className="text-gray-400 mb-6">
              特点：粒子动画、星光轨迹、魔法效果、奇幻感强
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <ParticleProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    color="gold"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <ParticleProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    color="emerald"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案13：数字风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案13：数字风格
            </h2>
            <p className="text-gray-400 mb-6">
              特点：科技感、字符动画、黑客风格、程序员最爱
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <DigitalProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    variant="matrix"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <DigitalProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    variant="terminal"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案14：复古风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案14：复古风格
            </h2>
            <p className="text-gray-400 mb-6">
              特点：怀旧设计、复古色彩、蒸汽朋克、时代感强
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <VintageProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    theme="steampunk"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <VintageProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    theme="neon-80s"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案15：电路板霓虹风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案15：电路板霓虹风格 (新)
            </h2>
            <p className="text-gray-400 mb-6">
              特点：电路板纹理、数据流动画、扫描线效果、硬核科技感
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <Neon2ProgressBar
                    value={progressValue}
                    max={100}
                    onChange={setProgressValue}
                    color="cyan"
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 min-w-[40px]">3:45</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">音量控制</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">🔊</span>
                  <Neon2ProgressBar
                    value={volumeValue}
                    max={1}
                    onChange={setVolumeValue}
                    color="orange"
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 方案16：交互式霓虹风格 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              方案16：交互式霓虹风格 (新)
            </h2>
            <p className="text-gray-400 mb-6">
              特点：智能交互、悬停放大、拖拽支持、动态光效、滑块指示器
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">播放进度</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 min-w-[40px]">1:23</span>
                  <Neon3ProgressBar
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
                  <Neon3ProgressBar
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
        </div>

        {/* 控制面板 */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">🎛️ 实时调节控制台</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
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
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* 推荐说明 */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">💡 风格选择指南</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
            <div>
              <h4 className="font-semibold text-white mb-2">🎯 推荐用途</h4>
              <ul className="space-y-1">
                <li><strong>现代应用</strong>：方案1、4、5、16</li>
                <li><strong>游戏界面</strong>：方案3、6、8、12、15</li>
                <li><strong>音乐播放器</strong>：方案7、9、10、16</li>
                <li><strong>专业软件</strong>：方案2、11、13</li>
                <li><strong>创意项目</strong>：方案14、12、7</li>
                <li><strong>科技产品</strong>：方案15、3、13</li>
                <li><strong>交互重点应用</strong>：方案16、1</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">🎨 风格特色</h4>
              <ul className="space-y-1">
                <li><strong>简约风</strong>：方案2（极简线条）</li>
                <li><strong>科技风</strong>：方案3、13、15（霓虹、数字、电路）</li>
                <li><strong>艺术风</strong>：方案7、12（渐变、粒子）</li>
                <li><strong>真实感</strong>：方案10、11（液体、拟物）</li>
                <li><strong>怀旧风</strong>：方案14（复古主题）</li>
                <li><strong>硬核科技</strong>：方案15（电路板风格）</li>
                <li><strong>交互式</strong>：方案16（智能响应、拖拽操作）</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};