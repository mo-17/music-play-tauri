import React from 'react';

interface CircularProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  color?: 'blue' | 'green' | 'red' | 'purple';
}

export const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  value,
  max,
  onChange,
  className = '',
  size = 'medium',
  color = 'blue'
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const sizes = {
    small: { width: 60, height: 60, strokeWidth: 4, fontSize: '10px' },
    medium: { width: 80, height: 80, strokeWidth: 6, fontSize: '12px' },
    large: { width: 100, height: 100, strokeWidth: 8, fontSize: '14px' }
  };
  
  const currentSize = sizes[size];
  const radius = (currentSize.width - currentSize.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const normalizedAngle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
    const newPercentage = (normalizedAngle / (2 * Math.PI)) * 100;
    const newValue = (newPercentage / 100) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  const colorSchemes = {
    blue: {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      glow: 'rgba(59, 130, 246, 0.4)',
      text: '#3b82f6'
    },
    green: {
      primary: '#10b981',
      secondary: '#059669',
      glow: 'rgba(16, 185, 129, 0.4)',
      text: '#10b981'
    },
    red: {
      primary: '#ef4444',
      secondary: '#dc2626',
      glow: 'rgba(239, 68, 68, 0.4)',
      text: '#ef4444'
    },
    purple: {
      primary: '#a855f7',
      secondary: '#7c3aed',
      glow: 'rgba(168, 85, 247, 0.4)',
      text: '#a855f7'
    }
  };

  const scheme = colorSchemes[color];

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <style>{`
        @keyframes rotate-${color} {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow-${color} {
          0%, 100% { filter: drop-shadow(0 0 5px ${scheme.glow}); }
          50% { filter: drop-shadow(0 0 15px ${scheme.glow}) drop-shadow(0 0 25px ${scheme.glow}); }
        }
        .circular-progress-${color} {
          animation: pulse-glow-${color} 2s ease-in-out infinite;
        }
      `}</style>
      
      <div 
        className="relative cursor-pointer"
        onClick={handleClick}
        style={{ 
          width: currentSize.width, 
          height: currentSize.height 
        }}
      >
        <svg
          className={`circular-progress-${color} transform -rotate-90`}
          width={currentSize.width}
          height={currentSize.height}
        >
          {/* 背景圆环 */}
          <circle
            cx={currentSize.width / 2}
            cy={currentSize.height / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={currentSize.strokeWidth}
            fill="transparent"
          />
          
          {/* 进度圆环 */}
          <circle
            cx={currentSize.width / 2}
            cy={currentSize.height / 2}
            r={radius}
            stroke={`url(#gradient-${color})`}
            strokeWidth={currentSize.strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.3s ease-out',
              filter: `drop-shadow(0 0 8px ${scheme.glow})`
            }}
          />
          
          {/* 渐变定义 */}
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={scheme.primary} />
              <stop offset="100%" stopColor={scheme.secondary} />
            </linearGradient>
          </defs>
        </svg>
        
        {/* 中心文本 */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            fontSize: currentSize.fontSize,
            color: scheme.text,
            fontWeight: 'bold'
          }}
        >
          {Math.round(percentage)}%
        </div>
        
        {/* 进度指示点 */}
        {percentage > 0 && (
          <div
            className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{
              background: scheme.primary,
              boxShadow: `0 0 8px ${scheme.glow}`,
              left: currentSize.width / 2 + Math.cos((percentage / 100) * 2 * Math.PI - Math.PI / 2) * radius,
              top: currentSize.height / 2 + Math.sin((percentage / 100) * 2 * Math.PI - Math.PI / 2) * radius
            }}
          />
        )}
      </div>
    </div>
  );
}; 