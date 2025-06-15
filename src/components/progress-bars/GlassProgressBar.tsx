import React, { useState } from 'react';

interface GlassProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  variant?: 'primary' | 'volume';
  className?: string;
}

export const GlassProgressBar: React.FC<GlassProgressBarProps> = ({
  value,
  max,
  onChange,
  disabled = false,
  variant = 'primary',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const percentage = max > 0 ? (value / max) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  const getTheme = () => {
    if (variant === 'primary') {
      return {
        track: 'rgba(255, 255, 255, 0.1)',
        progress: 'rgba(99, 102, 241, 0.8)',
        thumb: 'rgba(255, 255, 255, 0.9)',
        border: 'rgba(255, 255, 255, 0.2)'
      };
    } else {
      return {
        track: 'rgba(255, 255, 255, 0.1)',
        progress: 'rgba(16, 185, 129, 0.8)',
        thumb: 'rgba(16, 185, 129, 0.9)',
        border: 'rgba(255, 255, 255, 0.2)'
      };
    }
  };

  const theme = getTheme();

  return (
    <div 
      className={`relative group cursor-pointer py-3 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onClick={handleClick}
    >
      {/* 玻璃轨道 */}
      <div 
        className={`
          relative h-2 rounded-full transition-all duration-300 ease-out backdrop-blur-sm
          ${isHovered || isDragging ? 'h-3' : 'h-2'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ 
          backgroundColor: theme.track,
          border: `1px solid ${theme.border}`,
          boxShadow: `
            inset 0 1px 2px rgba(0, 0, 0, 0.1),
            0 1px 3px rgba(0, 0, 0, 0.1)
          `
        }}
      >
        {/* 进度条 */}
        <div 
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out backdrop-blur-sm"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: theme.progress,
            border: `1px solid ${theme.border}`,
            boxShadow: `
              inset 0 1px 2px rgba(255, 255, 255, 0.2),
              0 2px 8px rgba(99, 102, 241, 0.3)
            `
          }}
        />

        {/* 高光效果 */}
        <div 
          className="absolute left-0 top-0 h-1/2 rounded-t-full transition-all duration-300 ease-out"
          style={{ 
            width: `${percentage}%`,
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)'
          }}
        />
      </div>

      {/* 玻璃滑块 */}
      {(isHovered || isDragging) && (
        <div
          className="absolute top-1/2 w-5 h-5 rounded-full transition-all duration-200 ease-out transform -translate-y-1/2 -translate-x-1/2 backdrop-blur-sm"
          style={{
            left: `${percentage}%`,
            backgroundColor: theme.thumb,
            border: `2px solid ${theme.border}`,
            boxShadow: `
              inset 0 1px 2px rgba(255, 255, 255, 0.3),
              0 4px 12px rgba(0, 0, 0, 0.2),
              0 2px 6px rgba(99, 102, 241, 0.3)
            `
          }}
        >
          {/* 内部高光 */}
          <div 
            className="absolute top-1 left-1 w-2 h-2 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%)'
            }}
          />
        </div>
      )}
    </div>
  );
}; 