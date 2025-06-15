import React, { useState } from 'react';

interface MinimalProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  variant?: 'primary' | 'volume';
  className?: string;
}

export const MinimalProgressBar: React.FC<MinimalProgressBarProps> = ({
  value,
  max,
  onChange,
  disabled = false,
  variant = 'primary',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const percentage = max > 0 ? (value / max) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  const getColors = () => {
    if (variant === 'primary') {
      return {
        active: '#ffffff',
        inactive: '#4b5563',
        thumb: '#ffffff'
      };
    } else {
      return {
        active: '#10b981',
        inactive: '#4b5563',
        thumb: '#10b981'
      };
    }
  };

  const colors = getColors();

  return (
    <div 
      className={`relative group cursor-pointer py-2 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* 背景线条 */}
      <div 
        className={`
          relative h-0.5 rounded-full transition-all duration-300 ease-out
          ${isHovered ? 'h-1' : 'h-0.5'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ backgroundColor: colors.inactive }}
      >
        {/* 进度线条 */}
        <div 
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: colors.active,
            boxShadow: isHovered ? `0 0 8px ${colors.active}40` : 'none'
          }}
        />
      </div>

      {/* 滑块 - 只在悬停时显示 */}
      {isHovered && (
        <div
          className="absolute top-1/2 w-3 h-3 rounded-full transition-all duration-200 ease-out transform -translate-y-1/2 -translate-x-1/2"
          style={{
            left: `${percentage}%`,
            backgroundColor: colors.thumb,
            boxShadow: `0 0 12px ${colors.thumb}60, 0 2px 4px rgba(0, 0, 0, 0.2)`
          }}
        />
      )}
    </div>
  );
}; 