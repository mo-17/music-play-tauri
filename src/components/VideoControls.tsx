import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  MoreHorizontal,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { NeonProgressBar } from './progress-bars';
import { TouchButton } from './TouchButton';
import { 
  useResponsiveSize, 
  getResponsiveButtonClasses,
  getResponsiveProgressBarHeight, 
  getResponsiveSpacing
} from '../hooks/useResponsiveSize';
import { useTouchOptimization, useTouchFriendlyStyles, useProgressBarTouch } from '../hooks/useTouchOptimization';
import '../styles/animations.css';

interface VideoControlsProps {
  // 播放状态
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  
  // 控制函数
  onPlayPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onFullscreenToggle: () => void;
  onSkip: (seconds: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  
  // 显示控制
  showControls: boolean;
  className?: string;
}

interface ControlGroup {
  id: string;
  priority: number; // 1=最高优先级，数字越大优先级越低
  minWidth: number; // 显示此组所需的最小宽度
  controls: React.ReactNode[];
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  onPlayPause,
  onStop,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onPlaybackRateChange,
  onFullscreenToggle,
  onSkip,
  onPrevious,
  onNext,
  showControls,
  className = ''
}) => {
  const responsiveSizes = useResponsiveSize();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showSecondaryControls, setShowSecondaryControls] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical' | 'compact'>('horizontal');
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  
  // 进度条容器引用
  const progressBarRef = useRef<HTMLDivElement>(null);

  // 监听窗口尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 根据窗口宽度确定布局模式
  useEffect(() => {
    if (windowWidth < 400) {
      setLayoutMode('compact');
    } else if (windowWidth < 600) {
      setLayoutMode('vertical');
    } else {
      setLayoutMode('horizontal');
    }
  }, [windowWidth]);

  const progressBarHeight = getResponsiveProgressBarHeight(windowWidth);
  const spacing = getResponsiveSpacing(windowWidth);
  
  // 进度条触控拖拽
  const progressBarTouch = useProgressBarTouch(
    currentTime,
    duration,
    onSeek,
    progressBarRef
  );
  
  // 主视频区域手势控制
  const videoGestures = useTouchOptimization(
    {
      longPressDelay: 500,
      doubleTapDelay: 300,
      swipeThreshold: 50,
      enableHapticFeedback: true
    },
    {
      onDoubleTap: () => {
        onPlayPause();
      },
      onSwipeLeft: () => {
        onSkip(-10);
      },
      onSwipeRight: () => {
        onSkip(10);
      },
      onSwipeUp: (gesture) => {
        // 向上滑动增加音量
        const volumeIncrease = Math.abs(gesture.deltaY) / 200;
        const newVolume = Math.min(1, volume + volumeIncrease);
        onVolumeChange(newVolume);
      },
      onSwipeDown: (gesture) => {
        // 向下滑动减少音量
        const volumeDecrease = Math.abs(gesture.deltaY) / 200;
        const newVolume = Math.max(0, volume - volumeDecrease);
        onVolumeChange(newVolume);
      },
      onLongPress: () => {
        // 长按显示更多选项
        setShowSecondaryControls(!showSecondaryControls);
      }
    }
  );

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

  // 带动画的时间显示组件
  const AnimatedTimeDisplay: React.FC<{ time: number }> = ({ time }) => {
    const [prevTime, setPrevTime] = useState(time);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
      if (Math.floor(time) !== Math.floor(prevTime)) {
        setIsUpdating(true);
        const timer = setTimeout(() => {
          setIsUpdating(false);
          setPrevTime(time);
        }, 150);
        return () => clearTimeout(timer);
      }
    }, [time, prevTime]);

    return (
      <span className={`time-digit ${isUpdating ? 'updating' : ''}`}>
        {formatTime(time)}
      </span>
    );
  };
  
  // 处理按钮按压状态的回调
  const handleButtonPressedChange = (id: string, isPressed: boolean) => {
    setPressedButton(isPressed ? id : null);
  };

  // 定义控制组
  const getControlGroups = (): ControlGroup[] => {
    return [
      // 核心播放控制 - 最高优先级
      {
        id: 'core-playback',
        priority: 1,
        minWidth: 200,
        controls: [
          <TouchButton
            key="previous"
            id="previous"
            onClick={onPrevious || (() => {})}
            disabled={!onPrevious}
            title="上一个视频"
            onPressedChange={handleButtonPressedChange}
          >
            <SkipBack size={responsiveSizes.iconSize} />
          </TouchButton>,
          
          <TouchButton
            key="play-pause"
            id="play-pause"
            onClick={onPlayPause}
            title={isPlaying ? '暂停' : '播放'}
            variant="primary"
            onPressedChange={handleButtonPressedChange}
          >
            {isPlaying ? <Pause size={responsiveSizes.iconSize + 2} /> : <Play size={responsiveSizes.iconSize + 2} />}
          </TouchButton>,
          
          <TouchButton
            key="next"
            id="next"
            onClick={onNext || (() => {})}
            disabled={!onNext}
            title="下一个视频"
            onPressedChange={handleButtonPressedChange}
          >
            <SkipForward size={responsiveSizes.iconSize} />
          </TouchButton>
        ]
      },
      
      // 跳转控制
      {
        id: 'seek-controls',
        priority: 2,
        minWidth: 300,
        controls: [
          <TouchButton
            key="rewind"
            id="rewind"
            onClick={() => onSkip(-10)}
            title="快退10秒"
            onPressedChange={handleButtonPressedChange}
          >
            <RotateCcw size={responsiveSizes.iconSize} />
          </TouchButton>,
          
          <TouchButton
            key="forward"
            id="forward"
            onClick={() => onSkip(10)}
            title="快进10秒"
            onPressedChange={handleButtonPressedChange}
          >
            <RotateCw size={responsiveSizes.iconSize} />
          </TouchButton>
        ]
      },
      
      // 音量控制
      {
        id: 'volume-controls',
        priority: 3,
        minWidth: 400,
        controls: [
          <TouchButton
            key="mute"
            id="mute"
            onClick={onMuteToggle}
            title={isMuted ? '取消静音' : '静音'}
            onPressedChange={handleButtonPressedChange}
          >
            {isMuted ? <VolumeX size={responsiveSizes.iconSize} /> : <Volume2 size={responsiveSizes.iconSize} />}
          </TouchButton>,
          
          ...(windowWidth >= 500 ? [
            <div key="volume-slider" className={windowWidth < 600 ? 'w-12' : 'w-20'}>
              <NeonProgressBar
                value={isMuted ? 0 : volume}
                max={1}
                onChange={onVolumeChange}
                height={progressBarHeight}
                color="cyan"
              />
            </div>
          ] : [])
        ]
      },
      
      // 次要控制
      {
        id: 'secondary-controls',
        priority: 4,
        minWidth: 400, // 降低显示阈值，让停止按钮更容易显示
        controls: [
          <TouchButton
            key="stop"
            id="stop"
            onClick={onStop}
            title="停止"
            onPressedChange={handleButtonPressedChange}
          >
            <Square size={responsiveSizes.iconSize} />
          </TouchButton>,
          
          ...(windowWidth >= 600 ? [
            <select
              key="playback-rate"
              value={playbackRate}
              onChange={(e) => onPlaybackRateChange(Number(e.target.value))}
              className={`bg-black/50 text-white ${responsiveSizes.fontSize} rounded px-2 py-1 border border-white/30 ${windowWidth < 700 ? 'w-16' : 'w-auto'}`}
              title="播放速度"
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          ] : [])
        ]
      },
      
      // 全屏控制 - 始终显示
      {
        id: 'fullscreen-control',
        priority: 1,
        minWidth: 0,
        controls: [
          <TouchButton
            key="fullscreen"
            id="fullscreen"
            onClick={onFullscreenToggle}
            title={isFullscreen ? '退出全屏' : '全屏'}
            onPressedChange={handleButtonPressedChange}
          >
            {isFullscreen ? <Minimize size={responsiveSizes.iconSize} /> : <Maximize size={responsiveSizes.iconSize} />}
          </TouchButton>
        ]
      }
    ];
  };

  // 根据窗口宽度过滤显示的控制组
  const getVisibleControls = () => {
    const controlGroups = getControlGroups();
    const visibleGroups = controlGroups.filter(group => windowWidth >= group.minWidth);
    
    // 按优先级排序
    visibleGroups.sort((a, b) => a.priority - b.priority);
    
    return visibleGroups;
  };

  // 渲染进度条
  const renderProgressBar = () => (
    <div className={`mb-2 ${windowWidth < 300 ? 'mb-1' : 'mb-2'}`}>
      <div className={`flex items-center ${spacing.controls} text-white ${responsiveSizes.fontSize}`}>
        {windowWidth >= 300 && (
          <span className="min-w-[3rem] text-right">
            <AnimatedTimeDisplay time={currentTime} />
          </span>
        )}
        <div 
          ref={progressBarRef}
          className="flex-1 relative mx-2 py-2 progress-bar gpu-accelerated" 
          style={{ touchAction: 'pan-x' }}
          {...progressBarTouch.touchHandlers}
        >
          <NeonProgressBar
            value={currentTime}
            max={duration || 0}
            onChange={onSeek}
            height={progressBarHeight}
            color="cyan"
            className={`progress-fill ${progressBarTouch.isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
          />
          {/* 触控拖拽指示器 */}
          {progressBarTouch.isDragging && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none panel-slide-in">
              <AnimatedTimeDisplay time={currentTime} />
            </div>
          )}
        </div>
        {windowWidth >= 300 && (
          <span className="min-w-[3rem]">
            <AnimatedTimeDisplay time={duration} />
          </span>
        )}
      </div>
    </div>
  );

  // 渲染水平布局
  const renderHorizontalLayout = () => {
    const visibleControls = getVisibleControls();
    const leftControls = visibleControls.filter(group => 
      ['core-playback', 'seek-controls'].includes(group.id)
    );
    const rightControls = visibleControls.filter(group => 
      ['volume-controls', 'secondary-controls', 'fullscreen-control'].includes(group.id)
    );

    return (
      <div className="flex items-center justify-between">
        <div className={`flex items-center ${spacing.controls}`}>
          {leftControls.map(group => 
            group.controls.map((control, index) => (
              <React.Fragment key={`${group.id}-${index}`}>
                {control}
              </React.Fragment>
            ))
          )}
        </div>
        
        <div className={`flex items-center ${spacing.sections}`}>
          {rightControls.map(group => 
            group.controls.map((control, index) => (
              <React.Fragment key={`${group.id}-${index}`}>
                {control}
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    );
  };

  // 渲染垂直布局
  const renderVerticalLayout = () => {
    const visibleControls = getVisibleControls();
    const primaryControls = visibleControls.filter(group => 
      ['core-playback', 'fullscreen-control'].includes(group.id)
    );
    const secondaryControls = visibleControls.filter(group => 
      !['core-playback', 'fullscreen-control'].includes(group.id)
    );

    return (
      <div className="space-y-2">
        {/* 主要控制 */}
        <div className="flex items-center justify-center">
          <div className={`flex items-center ${spacing.controls}`}>
            {primaryControls.map(group => 
              group.controls.map((control, index) => (
                <React.Fragment key={`${group.id}-${index}`}>
                  {control}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
        
        {/* 次要控制 */}
        {secondaryControls.length > 0 && (
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${spacing.controls}`}>
              {secondaryControls.map(group => 
                group.controls.map((control, index) => (
                  <React.Fragment key={`${group.id}-${index}`}>
                    {control}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染紧凑布局
  const renderCompactLayout = () => {
    const coreControls = getControlGroups().find(group => group.id === 'core-playback');
    const fullscreenControl = getControlGroups().find(group => group.id === 'fullscreen-control');
    const hasSecondaryControls = windowWidth >= 250;

    return (
      <div className="space-y-2">
        {/* 核心控制 */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${spacing.controls}`}>
            {coreControls?.controls.map((control, index) => (
              <React.Fragment key={`core-${index}`}>
                {control}
              </React.Fragment>
            ))}
          </div>
          
          <div className="flex items-center space-x-1">
            {fullscreenControl?.controls[0]}
            
            {/* 更多选项按钮 */}
            {hasSecondaryControls && (
              <TouchButton
                id="more-options"
                onClick={() => setShowSecondaryControls(!showSecondaryControls)}
                title="更多选项"
                onPressedChange={handleButtonPressedChange}
              >
                <MoreHorizontal size={responsiveSizes.iconSize} />
              </TouchButton>
            )}
          </div>
        </div>
        
        {/* 可折叠的次要控制 */}
        {showSecondaryControls && hasSecondaryControls && (
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${spacing.controls}`}>
              <TouchButton
                id="compact-mute"
                onClick={onMuteToggle}
                title={isMuted ? '取消静音' : '静音'}
                onPressedChange={handleButtonPressedChange}
              >
                {isMuted ? <VolumeX size={responsiveSizes.iconSize} /> : <Volume2 size={responsiveSizes.iconSize} />}
              </TouchButton>
              
              <TouchButton
                id="compact-rewind"
                onClick={() => onSkip(-10)}
                title="快退10秒"
                onPressedChange={handleButtonPressedChange}
              >
                <RotateCcw size={responsiveSizes.iconSize} />
              </TouchButton>
              
              <TouchButton
                id="compact-forward"
                onClick={() => onSkip(10)}
                title="快进10秒"
                onPressedChange={handleButtonPressedChange}
              >
                <RotateCw size={responsiveSizes.iconSize} />
              </TouchButton>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 根据布局模式渲染控制栏
  const renderControls = () => {
    switch (layoutMode) {
      case 'compact':
        return renderCompactLayout();
      case 'vertical':
        return renderVerticalLayout();
      default:
        return renderHorizontalLayout();
    } 
  };
  // useEffect(() => {
  //   console.log('showControls', showControls);
  //   if (showControls) {
  //     onPlayPause();
  //   }
  // }, [showControls]);
  return (
    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent ${spacing.container} ${
      showControls ? 'controls-enter-active' : 'controls-exit-active'
    } gpu-accelerated ${className}`}>
      {/* 进度条 */}
      {renderProgressBar()}
      
      {/* 控制按钮 */}
      {renderControls()}
    </div>
  );
};