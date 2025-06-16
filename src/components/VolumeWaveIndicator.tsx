import React, { useEffect, useState } from 'react';
import '../styles/animations.css';

interface VolumeWaveIndicatorProps {
  volume: number;
  isMuted: boolean;
  isVisible: boolean;
  className?: string;
}

export const VolumeWaveIndicator: React.FC<VolumeWaveIndicatorProps> = ({
  volume,
  isMuted,
  isVisible,
  className = ''
}) => {
  const [animationKey, setAnimationKey] = useState(0);

  // 当音量变化时重新触发动画
  useEffect(() => {
    if (isVisible && !isMuted) {
      setAnimationKey(prev => prev + 1);
    }
  }, [volume, isVisible, isMuted]);

  if (!isVisible || isMuted) {
    return null;
  }

  // 根据音量计算波形高度
  const getBarHeight = (index: number) => {
    const baseHeight = 8;
    const maxHeight = 24;
    const volumeMultiplier = volume;
    
    // 创建波形效果
    const wavePattern = [0.6, 0.8, 1.0, 0.8, 0.6];
    const heightMultiplier = wavePattern[index] || 0.6;
    
    return Math.max(baseHeight, (baseHeight + (maxHeight - baseHeight) * volumeMultiplier * heightMultiplier));
  };

  return (
    <div className={`volume-wave ${className}`} key={animationKey}>
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className="volume-bar"
          style={{
            height: `${getBarHeight(index)}px`,
            animationDelay: `${index * 0.1}s`
          }}
        />
      ))}
    </div>
  );
}; 