import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Info,
  X
} from 'lucide-react';
import { 
  useDeviceInfo, 
  useGracefulDegradation, 
  getGracefulDegradationClasses 
} from '../hooks/useResponsiveSize';

interface FullscreenUIProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  videoTitle: string;
  videoResolution?: { width: number; height: number };
  showControls: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onFullscreenExit: () => void;
  onSkip: (seconds: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export const FullscreenUI: React.FC<FullscreenUIProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  videoTitle,
  videoResolution,
  showControls,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onPlaybackRateChange,
  onFullscreenExit,
  onSkip,
  onPrevious,
  onNext
}) => {
  const deviceInfo = useDeviceInfo();
  const gracefulConfig = useGracefulDegradation();
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 进度条拖拽处理
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleProgressClick(e);
  };

  // 播放速度选项
  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div className={getGracefulDegradationClasses(
      gracefulConfig,
      `absolute inset-0 flex flex-col justify-between pointer-events-none fullscreen-controls ${
        showControls ? 'visible' : 'hidden'
      }`
    )}>
      {/* 顶部信息栏 */}
      <div className="pointer-events-auto fullscreen-animate-slide-down">
        <div className={getGracefulDegradationClasses(
          gracefulConfig,
          "fullscreen-gradient-top p-6"
        )}>
          <div className="flex items-start justify-between">
            {/* 视频信息 */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white truncate mb-2">
                {videoTitle}
              </h1>
              {videoResolution && (
                <div className="flex items-center space-x-4 text-white/80">
                  <span className="text-sm">
                    {videoResolution.width}x{videoResolution.height}
                  </span>
                  <span className="text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <span className="text-sm">
                    {playbackRate}x 速度
                  </span>
                </div>
              )}
            </div>

            {/* 顶部控制按钮 */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className={getGracefulDegradationClasses(
                  gracefulConfig,
                  "fullscreen-button p-3 text-white hover:text-cyan-400 rounded-lg fullscreen-text-shadow"
                )}
                title="视频信息"
              >
                <Info size={24} />
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={getGracefulDegradationClasses(
                  gracefulConfig,
                  "fullscreen-button p-3 text-white hover:text-cyan-400 rounded-lg fullscreen-text-shadow"
                )}
                title="设置"
              >
                <Settings size={24} />
              </button>
              
              <button
                onClick={onFullscreenExit}
                className={getGracefulDegradationClasses(
                  gracefulConfig,
                  "fullscreen-button p-3 text-white hover:text-red-400 rounded-lg fullscreen-text-shadow"
                )}
                title="退出全屏 (ESC)"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 中央播放控制 */}
      <div className="pointer-events-auto flex items-center justify-center fullscreen-animate-in">
        <div className="flex items-center space-x-6">
          {/* 上一个 */}
          {onPrevious && (
            <button
              onClick={onPrevious}
              className={getGracefulDegradationClasses(
                gracefulConfig,
                "fullscreen-button p-4 text-white hover:text-cyan-400 rounded-full"
              )}
              title="上一个"
            >
              <SkipBack size={32} />
            </button>
          )}

          {/* 快退 */}
          <button
            onClick={() => onSkip(-10)}
            className={getGracefulDegradationClasses(
              gracefulConfig,
              "fullscreen-button p-4 text-white hover:text-cyan-400 rounded-full"
            )}
            title="快退 10秒"
          >
            <RotateCcw size={28} />
          </button>

          {/* 播放/暂停 */}
          <button
            onClick={onPlayPause}
            className={getGracefulDegradationClasses(
              gracefulConfig,
              "fullscreen-button p-6 text-white hover:text-cyan-400 rounded-full border-2 border-cyan-500/50"
            )}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause size={40} /> : <Play size={40} />}
          </button>

          {/* 快进 */}
          <button
            onClick={() => onSkip(10)}
            className={getGracefulDegradationClasses(
              gracefulConfig,
              "fullscreen-button p-4 text-white hover:text-cyan-400 rounded-full"
            )}
            title="快进 10秒"
          >
            <RotateCw size={28} />
          </button>

          {/* 下一个 */}
          {onNext && (
            <button
              onClick={onNext}
              className={getGracefulDegradationClasses(
                gracefulConfig,
                "fullscreen-button p-4 text-white hover:text-cyan-400 rounded-full"
              )}
              title="下一个"
            >
              <SkipForward size={32} />
            </button>
          )}
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="pointer-events-auto fullscreen-animate-slide-up">
        <div className={getGracefulDegradationClasses(
          gracefulConfig,
          "fullscreen-gradient-bottom p-6"
        )}>
          {/* 进度条 */}
          <div className="mb-4">
            <div
              className="relative fullscreen-progress cursor-pointer group"
              onClick={handleProgressClick}
              onMouseMove={handleProgressDrag}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              {/* 已播放进度 */}
              <div
                className={getGracefulDegradationClasses(
                  gracefulConfig,
                  "fullscreen-progress-fill"
                )}
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              
              {/* 进度拖拽点 */}
              <div
                className={getGracefulDegradationClasses(
                  gracefulConfig,
                  "fullscreen-progress-thumb"
                )}
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>

          {/* 底部控制按钮 */}
          <div className="flex items-center justify-between">
            {/* 左侧控制 */}
            <div className="flex items-center space-x-4">
              {/* 音量控制 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={onMuteToggle}
                  className={getGracefulDegradationClasses(
                    gracefulConfig,
                    "fullscreen-button p-2 text-white hover:text-cyan-400 rounded"
                  )}
                  title={isMuted ? '取消静音' : '静音'}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                
                <div className="w-24">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="fullscreen-volume-slider w-full cursor-pointer"
                  />
                </div>
                
                <span className="text-white/80 text-sm min-w-[3rem]">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            {/* 中央时间显示 */}
            <div className="text-white text-lg font-mono fullscreen-text-shadow">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* 右侧控制 */}
            <div className="flex items-center space-x-4">
              {/* 播放速度 */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={getGracefulDegradationClasses(
                    gracefulConfig,
                    "fullscreen-button px-3 py-1 text-white hover:text-cyan-400 rounded text-sm"
                  )}
                  title="播放速度"
                >
                  {playbackRate}x
                </button>
              </div>

              {/* 退出全屏 */}
              <button
                onClick={onFullscreenExit}
                className={getGracefulDegradationClasses(
                  gracefulConfig,
                  "fullscreen-button p-2 text-white hover:text-cyan-400 rounded"
                )}
                title="退出全屏"
              >
                <Minimize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="absolute bottom-20 right-6 pointer-events-auto">
          <div className={getGracefulDegradationClasses(
            gracefulConfig,
            "fullscreen-panel p-4 min-w-[200px] fullscreen-animate-slide-up"
          )}>
            <h3 className="text-white font-semibold mb-3 fullscreen-text-shadow">播放速度</h3>
            <div className="space-y-2">
              {playbackRates.map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    onPlaybackRateChange(rate);
                    setShowSettings(false);
                  }}
                  className={getGracefulDegradationClasses(
                    gracefulConfig,
                    `fullscreen-button w-full text-left px-3 py-2 rounded text-white ${
                      playbackRate === rate ? 'bg-cyan-600' : ''
                    }`
                  )}
                >
                  {rate}x {rate === 1 ? '(正常)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 信息面板 */}
      {showInfo && (
        <div className="absolute top-20 left-6 pointer-events-auto">
          <div className={getGracefulDegradationClasses(
            gracefulConfig,
            "fullscreen-panel p-4 min-w-[300px] fullscreen-animate-slide-down"
          )}>
            <h3 className="text-white font-semibold mb-3 fullscreen-text-shadow">视频信息</h3>
            <div className="space-y-2 text-white/80 text-sm">
              <div>标题: {videoTitle}</div>
              {videoResolution && (
                <div>分辨率: {videoResolution.width}x{videoResolution.height}</div>
              )}
              <div>时长: {formatTime(duration)}</div>
              <div>当前时间: {formatTime(currentTime)}</div>
              <div>播放速度: {playbackRate}x</div>
              <div>音量: {Math.round((isMuted ? 0 : volume) * 100)}%</div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}; 