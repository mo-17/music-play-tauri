import React from 'react';

interface SegmentedProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  segments?: number;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = ({
  value,
  max,
  onChange,
  className = '',
  segments = 10,
  color = 'blue'
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const activeSegments = Math.floor((percentage / 100) * segments);
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  const colorSchemes = {
    blue: {
      active: '#3b82f6',
      inactive: '#1e293b',
      glow: 'rgba(59, 130, 246, 0.5)',
      border: '#1d4ed8'
    },
    green: {
      active: '#10b981',
      inactive: '#1e293b',
      glow: 'rgba(16, 185, 129, 0.5)',
      border: '#059669'
    },
    purple: {
      active: '#a855f7',
      inactive: '#1e293b',
      glow: 'rgba(168, 85, 247, 0.5)',
      border: '#7c3aed'
    },
    orange: {
      active: '#f59e0b',
      inactive: '#1e293b',
      glow: 'rgba(245, 158, 11, 0.5)',
      border: '#d97706'
    }
  };

  const scheme = colorSchemes[color];

  return (
    <div className={`relative w-full h-4 ${className}`}>
      <style>{`
        @keyframes segment-fill-${color} {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes segment-glow-${color} {
          0%, 100% { box-shadow: 0 0 5px ${scheme.glow}; }
          50% { box-shadow: 0 0 15px ${scheme.glow}, 0 0 25px ${scheme.glow}; }
        }
        .segment-active-${color} {
          animation: segment-glow-${color} 2s ease-in-out infinite;
        }
      `}</style>
      
      <div 
        className="flex w-full h-full gap-1 cursor-pointer"
        onClick={handleClick}
      >
        {Array.from({ length: segments }, (_, index) => {
          const isActive = index < activeSegments;
          const isPartial = index === activeSegments && percentage % (100 / segments) > 0;
          const partialWidth = isPartial ? ((percentage % (100 / segments)) / (100 / segments)) * 100 : 100;
          
          return (
            <div
              key={index}
              className="flex-1 h-full rounded-sm relative overflow-hidden"
              style={{
                backgroundColor: scheme.inactive,
                border: `1px solid ${isActive ? scheme.border : 'rgba(255, 255, 255, 0.1)'}`
              }}
            >
              {/* 活跃段填充 */}
              {(isActive || isPartial) && (
                <div
                  className={`h-full rounded-sm transition-all duration-300 ease-out ${isActive ? `segment-active-${color}` : ''}`}
                  style={{
                    width: isPartial ? `${partialWidth}%` : '100%',
                    background: `linear-gradient(45deg, ${scheme.active}, ${scheme.border})`,
                    boxShadow: `0 0 8px ${scheme.glow}`,
                    transformOrigin: 'left center'
                  }}
                >
                  {/* 内部高光 */}
                  <div 
                    className="absolute top-0 left-0 w-full h-1 rounded-sm"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)'
                    }}
                  />
                </div>
              )}
              
              {/* 分段标记 */}
              <div 
                className="absolute bottom-0 left-1/2 w-0.5 h-1 transform -translate-x-1/2"
                style={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'
                }}
              />
            </div>
          );
        })}
      </div>
      
      {/* 进度百分比显示 */}
      <div 
        className="absolute -top-6 text-xs font-medium transition-all duration-300"
        style={{
          left: `${Math.min(95, Math.max(5, percentage))}%`,
          transform: 'translateX(-50%)',
          color: scheme.active
        }}
      >
        {Math.round(percentage)}%
      </div>
    </div>
  );
}; 