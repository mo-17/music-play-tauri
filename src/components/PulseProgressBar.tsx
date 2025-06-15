import React from 'react';

interface PulseProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  color?: 'red' | 'pink' | 'indigo' | 'teal';
}

export const PulseProgressBar: React.FC<PulseProgressBarProps> = ({
  value,
  max,
  onChange,
  className = '',
  color = 'red'
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  const colorSchemes = {
    red: {
      primary: '#ef4444',
      secondary: '#dc2626',
      glow: 'rgba(239, 68, 68, 0.6)',
      pulse: 'rgba(239, 68, 68, 0.3)'
    },
    pink: {
      primary: '#ec4899',
      secondary: '#db2777',
      glow: 'rgba(236, 72, 153, 0.6)',
      pulse: 'rgba(236, 72, 153, 0.3)'
    },
    indigo: {
      primary: '#6366f1',
      secondary: '#4f46e5',
      glow: 'rgba(99, 102, 241, 0.6)',
      pulse: 'rgba(99, 102, 241, 0.3)'
    },
    teal: {
      primary: '#14b8a6',
      secondary: '#0d9488',
      glow: 'rgba(20, 184, 166, 0.6)',
      pulse: 'rgba(20, 184, 166, 0.3)'
    }
  };

  const scheme = colorSchemes[color];

  return (
    <div className={`relative w-full h-4 ${className}`}>
      <style>{`
        @keyframes pulse-${color} {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
        @keyframes glow-${color} {
          0%, 100% { 
            box-shadow: 0 0 5px ${scheme.glow}, 0 0 10px ${scheme.glow}, 0 0 15px ${scheme.glow};
          }
          50% { 
            box-shadow: 0 0 10px ${scheme.glow}, 0 0 20px ${scheme.glow}, 0 0 30px ${scheme.glow};
          }
        }
        .pulse-animation-${color} {
          animation: pulse-${color} 1.5s ease-in-out infinite;
        }
        .glow-animation-${color} {
          animation: glow-${color} 2s ease-in-out infinite;
        }
      `}</style>
      
      <div 
        className="relative w-full h-full bg-gray-800 rounded-lg cursor-pointer overflow-hidden"
        onClick={handleClick}
        style={{
          border: `1px solid ${scheme.pulse}`,
          boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.4)`
        }}
      >
        {/* 脉冲背景 */}
        <div 
          className={`pulse-animation-${color} absolute inset-0 opacity-10`}
          style={{
            background: `radial-gradient(circle, ${scheme.primary} 0%, transparent 70%)`,
          }}
        />
        
        {/* 进度填充 */}
        <div 
          className={`glow-animation-${color} absolute top-0 left-0 h-full rounded-lg transition-all duration-500 ease-out`}
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(45deg, ${scheme.primary}, ${scheme.secondary}, ${scheme.primary})`,
            backgroundSize: '200% 200%',
            animation: `glow-${color} 2s ease-in-out infinite, shimmer-${color} 3s ease-in-out infinite`
          }}
        >
          {/* 内部脉冲效果 */}
          <div 
            className={`pulse-animation-${color} absolute inset-0 rounded-lg`}
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)`,
            }}
          />
        </div>
        
        {/* 顶部高光 */}
        <div 
          className="absolute top-0 left-0 w-full h-1 rounded-t-lg"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)'
          }}
        />
        
        {/* 脉冲圆点指示器 */}
        {percentage > 0 && (
          <div 
            className={`pulse-animation-${color} absolute top-1/2 w-2 h-2 rounded-full transform -translate-y-1/2`}
            style={{
              left: `${Math.max(4, percentage)}%`,
              background: scheme.primary,
              boxShadow: `0 0 8px ${scheme.glow}`,
              marginLeft: '-4px'
            }}
          />
        )}
      </div>
      
      <style>{`
        @keyframes shimmer-${color} {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}; 