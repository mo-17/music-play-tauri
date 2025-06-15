import React from 'react';

interface LiquidProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  color?: 'blue' | 'green' | 'purple' | 'cyan';
}

export const LiquidProgressBar: React.FC<LiquidProgressBarProps> = ({
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
      secondary: '#1e40af',
      light: '#93c5fd',
      glow: 'rgba(59, 130, 246, 0.4)'
    },
    green: {
      primary: '#10b981',
      secondary: '#047857',
      light: '#6ee7b7',
      glow: 'rgba(16, 185, 129, 0.4)'
    },
    purple: {
      primary: '#a855f7',
      secondary: '#6b21a8',
      light: '#c4b5fd',
      glow: 'rgba(168, 85, 247, 0.4)'
    },
    cyan: {
      primary: '#06b6d4',
      secondary: '#0e7490',
      light: '#67e8f9',
      glow: 'rgba(6, 182, 212, 0.4)'
    }
  };

  const scheme = colorSchemes[color];

  return (
    <div className={`relative w-full h-6 ${className}`}>
      <style>{`
        @keyframes liquid-wave-${color} {
          0% { transform: translateX(-100%) rotate(0deg); }
          100% { transform: translateX(100%) rotate(360deg); }
        }
        @keyframes liquid-bubble-${color} {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-10px) scale(1.2); opacity: 1; }
        }
        @keyframes liquid-flow-${color} {
          0% { transform: translateX(-50px); }
          100% { transform: translateX(50px); }
        }
        .liquid-wave-${color} {
          animation: liquid-wave-${color} 4s linear infinite;
        }
        .liquid-bubble-${color} {
          animation: liquid-bubble-${color} 3s ease-in-out infinite;
        }
        .liquid-flow-${color} {
          animation: liquid-flow-${color} 2s ease-in-out infinite alternate;
        }
      `}</style>
      
      <div 
        className="relative w-full h-full bg-gray-800 rounded-full cursor-pointer overflow-hidden"
        onClick={handleClick}
        style={{
          border: `2px solid ${scheme.primary}`,
          boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px ${scheme.glow}`
        }}
      >
        {/* 液体填充 */}
        <div 
          className="absolute bottom-0 left-0 rounded-full transition-all duration-500 ease-out overflow-hidden"
          style={{
            width: '100%',
            height: `${percentage}%`,
            background: `linear-gradient(180deg, ${scheme.light} 0%, ${scheme.primary} 50%, ${scheme.secondary} 100%)`,
            boxShadow: `0 0 20px ${scheme.glow}`
          }}
        >
          {/* 液体波浪效果 */}
          <div 
            className={`liquid-wave-${color} absolute -top-2 left-0 w-full h-4`}
            style={{
              background: `radial-gradient(ellipse at center, ${scheme.light} 0%, transparent 70%)`,
              opacity: 0.6
            }}
          />
          
          {/* 液体流动效果 */}
          <div 
            className={`liquid-flow-${color} absolute top-1/2 left-0 w-full h-1 transform -translate-y-1/2`}
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${scheme.light} 50%, transparent 100%)`,
              opacity: 0.8
            }}
          />
          
          {/* 气泡效果 */}
          {percentage > 20 && (
            <div 
              className={`liquid-bubble-${color} absolute w-1 h-1 rounded-full`}
              style={{
                left: '20%',
                top: '30%',
                background: scheme.light,
                boxShadow: `0 0 4px ${scheme.glow}`
              }}
            />
          )}
          {percentage > 50 && (
            <div 
              className={`liquid-bubble-${color} absolute w-1.5 h-1.5 rounded-full`}
              style={{
                left: '60%',
                top: '20%',
                background: scheme.light,
                boxShadow: `0 0 4px ${scheme.glow}`,
                animationDelay: '1s'
              }}
            />
          )}
          {percentage > 80 && (
            <div 
              className={`liquid-bubble-${color} absolute w-0.5 h-0.5 rounded-full`}
              style={{
                left: '80%',
                top: '40%',
                background: scheme.light,
                boxShadow: `0 0 4px ${scheme.glow}`,
                animationDelay: '2s'
              }}
            />
          )}
        </div>
        
        {/* 表面反射效果 */}
        <div 
          className="absolute top-0 left-0 w-full h-2 rounded-full"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)'
          }}
        />
        
        {/* 进度文本 */}
        <div 
          className="absolute inset-0 flex items-center justify-center text-xs font-bold"
          style={{
            color: percentage > 50 ? 'white' : scheme.primary,
            textShadow: percentage > 50 ? '0 1px 2px rgba(0, 0, 0, 0.5)' : 'none'
          }}
        >
          {Math.round(percentage)}%
        </div>
      </div>
    </div>
  );
}; 