import React from 'react';

interface WaveProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  color?: 'blue' | 'purple' | 'green' | 'orange';
}

export const WaveProgressBar: React.FC<WaveProgressBarProps> = ({
  value,
  max,
  onChange,
  className = '',
  color = 'blue'
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  const colorSchemes = {
    blue: {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      glow: 'rgba(59, 130, 246, 0.4)'
    },
    purple: {
      primary: '#a855f7',
      secondary: '#7c3aed',
      glow: 'rgba(168, 85, 247, 0.4)'
    },
    green: {
      primary: '#10b981',
      secondary: '#059669',
      glow: 'rgba(16, 185, 129, 0.4)'
    },
    orange: {
      primary: '#f59e0b',
      secondary: '#d97706',
      glow: 'rgba(245, 158, 11, 0.4)'
    }
  };

  const scheme = colorSchemes[color];

  return (
    <div className={`relative w-full h-3 ${className}`}>
      <style>{`
        @keyframes wave-${color} {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .wave-animation-${color} {
          animation: wave-${color} 2s ease-in-out infinite;
        }
      `}</style>
      
      <div 
        className="relative w-full h-full bg-gray-700 rounded-full cursor-pointer overflow-hidden"
        onClick={handleClick}
        style={{
          boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.3)`
        }}
      >
        {/* 背景波浪效果 */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${scheme.glow} 50%, transparent 100%)`,
          }}
        >
          <div 
            className={`wave-animation-${color} w-full h-full`}
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${scheme.primary} 50%, transparent 100%)`,
            }}
          />
        </div>
        
        {/* 进度填充 */}
        <div 
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out overflow-hidden"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${scheme.primary}, ${scheme.secondary})`,
            boxShadow: `0 0 10px ${scheme.glow}, 0 0 20px ${scheme.glow}`
          }}
        >
          {/* 内部波浪动画 */}
          <div 
            className={`wave-animation-${color} absolute inset-0 opacity-30`}
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)`,
            }}
          />
        </div>
        
        {/* 高光效果 */}
        <div 
          className="absolute top-0 left-0 w-full h-1 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)'
          }}
        />
      </div>
    </div>
  );
}; 