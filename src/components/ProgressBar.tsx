import React, { useState } from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  variant?: 'primary' | 'volume';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  onChange,
  disabled = false,
  variant = 'primary',
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const percentage = max > 0 ? (value / max) * 100 : 0;

  const handleMouseDown = () => {
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  const getTrackStyle = () => {
    if (variant === 'primary') {
      return {
        background: `linear-gradient(90deg, 
          #6366f1 0%, 
          #8b5cf6 ${percentage}%, 
          #374151 ${percentage}%, 
          #374151 100%)`
      };
    } else {
      return {
        background: `linear-gradient(90deg, 
          #10b981 0%, 
          #34d399 ${percentage}%, 
          #374151 ${percentage}%, 
          #374151 100%)`
      };
    }
  };

  const getThumbStyle = () => {
    const baseStyle = {
      left: `${percentage}%`,
      transform: 'translateX(-50%)',
    };

    if (variant === 'primary') {
      return {
        ...baseStyle,
        background: isDragging 
          ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' 
          : 'linear-gradient(135deg, #a855f7, #7c3aed)',
        boxShadow: isDragging 
          ? '0 0 20px rgba(139, 92, 246, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3)' 
          : isHovered 
            ? '0 0 15px rgba(139, 92, 246, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)' 
            : '0 2px 6px rgba(0, 0, 0, 0.2)',
      };
    } else {
      return {
        ...baseStyle,
        background: isDragging 
          ? 'linear-gradient(135deg, #34d399, #10b981)' 
          : 'linear-gradient(135deg, #6ee7b7, #34d399)',
        boxShadow: isDragging 
          ? '0 0 20px rgba(52, 211, 153, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3)' 
          : isHovered 
            ? '0 0 15px rgba(52, 211, 153, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)' 
            : '0 2px 6px rgba(0, 0, 0, 0.2)',
      };
    }
  };

  return (
    <div 
      className={`relative group cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
    >
      {/* 进度条轨道 */}
      <div 
        className={`
          relative h-2 rounded-full transition-all duration-200 ease-out
          ${isHovered || isDragging ? 'h-3' : 'h-2'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={getTrackStyle()}
      >
        {/* 发光效果 */}
        {(isHovered || isDragging) && (
          <div 
            className="absolute inset-0 rounded-full blur-sm opacity-60"
            style={{
              background: variant === 'primary' 
                ? `linear-gradient(90deg, #6366f1 0%, #8b5cf6 ${percentage}%, transparent ${percentage}%)`
                : `linear-gradient(90deg, #10b981 0%, #34d399 ${percentage}%, transparent ${percentage}%)`
            }}
          />
        )}
      </div>

      {/* 滑块 */}
      <div
        className={`
          absolute top-1/2 w-4 h-4 rounded-full transition-all duration-200 ease-out
          ${isHovered || isDragging ? 'w-5 h-5' : 'w-4 h-4'}
          ${isDragging ? 'scale-110' : ''}
          ${disabled ? 'opacity-50' : ''}
        `}
        style={{
          ...getThumbStyle(),
          marginTop: isHovered || isDragging ? '-10px' : '-8px',
        }}
      />

      {/* 进度指示器 */}
      {isDragging && (
        <div 
          className="absolute -top-8 left-0 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg"
          style={{ left: `${percentage}%` }}
        >
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}; 