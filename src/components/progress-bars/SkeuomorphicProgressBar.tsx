import React from 'react';

interface SkeuomorphicProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  variant?: 'metal' | 'wood' | 'leather' | 'glass';
}

export const SkeuomorphicProgressBar: React.FC<SkeuomorphicProgressBarProps> = ({
  value,
  max,
  onChange,
  className = '',
  variant = 'metal'
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  const variants = {
    metal: {
      track: {
        background: 'linear-gradient(180deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)',
        border: '2px solid #718096',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6), 0 1px 2px rgba(255, 255, 255, 0.1)'
      },
      fill: {
        background: 'linear-gradient(180deg, #4299e1 0%, #3182ce 50%, #2b77cb 100%)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 1px 3px rgba(0, 0, 0, 0.3)'
      },
      highlight: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%)'
    },
    wood: {
      track: {
        background: 'linear-gradient(180deg, #d69e2e 0%, #b7791f 50%, #975a16 100%)',
        border: '2px solid #744210',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(255, 255, 255, 0.1)'
      },
      fill: {
        background: 'linear-gradient(180deg, #48bb78 0%, #38a169 50%, #2f855a 100%)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3)'
      },
      highlight: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%)'
    },
    leather: {
      track: {
        background: 'linear-gradient(180deg, #8b4513 0%, #654321 50%, #4a2c17 100%)',
        border: '2px solid #3e2723',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(255, 255, 255, 0.1)'
      },
      fill: {
        background: 'linear-gradient(180deg, #e53e3e 0%, #c53030 50%, #9c2626 100%)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 1px 3px rgba(0, 0, 0, 0.4)'
      },
      highlight: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, transparent 50%)'
    },
    glass: {
      track: {
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.2)'
      },
      fill: {
        background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.8) 0%, rgba(29, 78, 216, 0.9) 100%)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)'
      },
      highlight: 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 30%)'
    }
  };

  const currentVariant = variants[variant];

  return (
    <div className={`relative w-full h-6 ${className}`}>
      <div 
        className="relative w-full h-full rounded-lg cursor-pointer overflow-hidden"
        onClick={handleClick}
        style={{
          ...currentVariant.track,
          position: 'relative'
        }}
      >
        {/* 纹理效果 */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: variant === 'wood' 
              ? 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
              : variant === 'leather'
              ? 'radial-gradient(circle at 25% 25%, rgba(0,0,0,0.1) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.1) 1px, transparent 1px)'
              : variant === 'metal'
              ? 'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.05) 2px)'
              : 'none',
            backgroundSize: variant === 'wood' ? '8px 8px' : variant === 'leather' ? '6px 6px' : '4px 4px'
          }}
        />
        
        {/* 进度填充 */}
        <div 
          className="absolute top-1 left-1 bottom-1 rounded-md transition-all duration-300 ease-out"
          style={{
            width: `calc(${percentage}% - 8px)`,
            ...currentVariant.fill
          }}
        >
          {/* 内部高光 */}
          <div 
            className="absolute top-0 left-0 w-full h-1/2 rounded-t-md"
            style={{
              background: currentVariant.highlight
            }}
          />
          
          {/* 进度指示器 */}
          {percentage > 5 && (
            <div 
              className="absolute right-1 top-1/2 w-1 h-3 transform -translate-y-1/2 rounded-sm"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
            />
          )}
        </div>
        
        {/* 顶部高光 */}
        <div 
          className="absolute top-0 left-0 w-full h-1 rounded-t-lg"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)'
          }}
        />
        
        {/* 底部阴影 */}
        <div 
          className="absolute bottom-0 left-0 w-full h-1 rounded-b-lg"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%)'
          }}
        />
        
        {/* 刻度标记 */}
        <div className="absolute inset-0 flex items-center">
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={i}
              className="h-2 w-px"
              style={{
                marginLeft: i === 0 ? '0' : 'calc(10% - 1px)',
                background: i % 5 === 0 
                  ? 'rgba(255, 255, 255, 0.4)' 
                  : 'rgba(255, 255, 255, 0.2)',
                height: i % 5 === 0 ? '8px' : '4px'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* 进度标签 */}
      <div 
        className="absolute -bottom-6 text-xs font-medium transition-all duration-300"
        style={{
          left: `${Math.min(95, Math.max(5, percentage))}%`,
          transform: 'translateX(-50%)',
          color: '#a0aec0'
        }}
      >
        {Math.round(percentage)}%
      </div>
    </div>
  );
}; 