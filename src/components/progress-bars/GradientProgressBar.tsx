import React from 'react';

interface GradientProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  variant?: 'rainbow' | 'sunset' | 'ocean' | 'forest';
}

export const GradientProgressBar: React.FC<GradientProgressBarProps> = ({
  value,
  max,
  onChange,
  className = '',
  variant = 'rainbow'
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  const gradients = {
    rainbow: {
      background: 'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff)',
      glow: 'rgba(255, 0, 255, 0.4)',
      shadow: '0 0 20px rgba(255, 0, 255, 0.3)'
    },
    sunset: {
      background: 'linear-gradient(90deg, #ff6b6b, #ffa500, #ffeb3b, #ff9800, #f44336)',
      glow: 'rgba(255, 107, 107, 0.4)',
      shadow: '0 0 20px rgba(255, 107, 107, 0.3)'
    },
    ocean: {
      background: 'linear-gradient(90deg, #00bcd4, #2196f3, #3f51b5, #673ab7, #9c27b0)',
      glow: 'rgba(0, 188, 212, 0.4)',
      shadow: '0 0 20px rgba(0, 188, 212, 0.3)'
    },
    forest: {
      background: 'linear-gradient(90deg, #4caf50, #8bc34a, #cddc39, #ffeb3b, #ffc107)',
      glow: 'rgba(76, 175, 80, 0.4)',
      shadow: '0 0 20px rgba(76, 175, 80, 0.3)'
    }
  };

  const currentGradient = gradients[variant];

  return (
    <div className={`relative w-full h-3 ${className}`}>
      <style>{`
        @keyframes gradient-shift-${variant} {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes sparkle-${variant} {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        .gradient-animation-${variant} {
          background-size: 200% 200%;
          animation: gradient-shift-${variant} 3s ease-in-out infinite;
        }
        .sparkle-${variant} {
          animation: sparkle-${variant} 2s ease-in-out infinite;
        }
      `}</style>
      
      <div 
        className="relative w-full h-full bg-gray-800 rounded-full cursor-pointer overflow-hidden"
        onClick={handleClick}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* 进度填充 */}
        <div 
          className={`gradient-animation-${variant} absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out`}
          style={{
            width: `${percentage}%`,
            background: currentGradient.background,
            boxShadow: currentGradient.shadow
          }}
        >
          {/* 闪烁效果 */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
              animation: `shimmer-${variant} 2s ease-in-out infinite`
            }}
          />
        </div>
        
        {/* 顶部高光 */}
        <div 
          className="absolute top-0 left-0 w-full h-1 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)'
          }}
        />
        
        {/* 星光效果 */}
        {percentage > 20 && (
          <div 
            className={`sparkle-${variant} absolute top-1/2 w-1 h-1 rounded-full transform -translate-y-1/2`}
            style={{
              left: `${percentage * 0.3}%`,
              background: '#ffffff',
              boxShadow: '0 0 4px #ffffff'
            }}
          />
        )}
        {percentage > 50 && (
          <div 
            className={`sparkle-${variant} absolute top-1/2 w-1 h-1 rounded-full transform -translate-y-1/2`}
            style={{
              left: `${percentage * 0.6}%`,
              background: '#ffffff',
              boxShadow: '0 0 4px #ffffff',
              animationDelay: '0.5s'
            }}
          />
        )}
        {percentage > 80 && (
          <div 
            className={`sparkle-${variant} absolute top-1/2 w-1 h-1 rounded-full transform -translate-y-1/2`}
            style={{
              left: `${percentage * 0.9}%`,
              background: '#ffffff',
              boxShadow: '0 0 4px #ffffff',
              animationDelay: '1s'
            }}
          />
        )}
      </div>
      
      <style>{`
        @keyframes shimmer-${variant} {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}; 