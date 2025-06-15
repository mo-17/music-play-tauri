import React from 'react';

interface ParticleProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  color?: 'gold' | 'silver' | 'emerald' | 'ruby';
}

export const ParticleProgressBar: React.FC<ParticleProgressBarProps> = ({
  value,
  max,
  onChange,
  className = '',
  color = 'gold'
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  const colorSchemes = {
    gold: {
      primary: '#f59e0b',
      secondary: '#d97706',
      particle: '#fbbf24',
      glow: 'rgba(245, 158, 11, 0.6)',
      trail: 'rgba(251, 191, 36, 0.3)'
    },
    silver: {
      primary: '#6b7280',
      secondary: '#4b5563',
      particle: '#9ca3af',
      glow: 'rgba(156, 163, 175, 0.6)',
      trail: 'rgba(156, 163, 175, 0.3)'
    },
    emerald: {
      primary: '#10b981',
      secondary: '#059669',
      particle: '#34d399',
      glow: 'rgba(52, 211, 153, 0.6)',
      trail: 'rgba(52, 211, 153, 0.3)'
    },
    ruby: {
      primary: '#dc2626',
      secondary: '#b91c1c',
      particle: '#f87171',
      glow: 'rgba(248, 113, 113, 0.6)',
      trail: 'rgba(248, 113, 113, 0.3)'
    }
  };

  const scheme = colorSchemes[color];

  // 生成粒子位置
  const particles = Array.from({ length: Math.floor(percentage / 5) }, (_, i) => ({
    id: i,
    left: Math.random() * percentage,
    delay: Math.random() * 2,
    size: Math.random() * 2 + 1
  }));

  return (
    <div className={`relative w-full h-4 ${className}`}>
      <style>{`
        @keyframes particle-float-${color} {
          0%, 100% { 
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
          50% { 
            transform: translateY(-8px) scale(1.2);
            opacity: 1;
          }
        }
        @keyframes particle-sparkle-${color} {
          0%, 100% { 
            box-shadow: 0 0 4px ${scheme.glow};
          }
          50% { 
            box-shadow: 0 0 12px ${scheme.glow}, 0 0 20px ${scheme.glow};
          }
        }
        @keyframes trail-flow-${color} {
          0% { transform: translateX(-20px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(20px); opacity: 0; }
        }
        .particle-${color} {
          animation: particle-float-${color} 3s ease-in-out infinite, particle-sparkle-${color} 2s ease-in-out infinite;
        }
        .trail-${color} {
          animation: trail-flow-${color} 2s ease-in-out infinite;
        }
      `}</style>
      
      <div 
        className="relative w-full h-full bg-gray-800 rounded-full cursor-pointer overflow-hidden"
        onClick={handleClick}
        style={{
          border: `1px solid ${scheme.primary}`,
          boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.3)`
        }}
      >
        {/* 进度填充 */}
        <div 
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${scheme.secondary}, ${scheme.primary})`,
            boxShadow: `0 0 15px ${scheme.glow}`
          }}
        >
          {/* 粒子轨迹 */}
          <div 
            className={`trail-${color} absolute inset-0 rounded-full`}
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${scheme.trail} 50%, transparent 100%)`,
            }}
          />
        </div>
        
        {/* 粒子效果 */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`particle-${color} absolute top-1/2 rounded-full transform -translate-y-1/2`}
            style={{
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: scheme.particle,
              animationDelay: `${particle.delay}s`,
              boxShadow: `0 0 4px ${scheme.glow}`
            }}
          />
        ))}
        
        {/* 发光边缘 */}
        {percentage > 0 && (
          <div 
            className="absolute top-0 h-full w-1 rounded-r-full"
            style={{
              left: `${percentage}%`,
              background: scheme.particle,
              boxShadow: `0 0 8px ${scheme.glow}, 0 0 16px ${scheme.glow}`,
              transform: 'translateX(-50%)'
            }}
          />
        )}
        
        {/* 顶部高光 */}
        <div 
          className="absolute top-0 left-0 w-full h-1 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)'
          }}
        />
        
        {/* 星光爆发效果 */}
        {percentage > 75 && (
          <div 
            className="absolute top-1/2 transform -translate-y-1/2"
            style={{
              left: `${percentage - 5}%`,
              width: '8px',
              height: '8px'
            }}
          >
            <div 
              className="absolute inset-0"
              style={{
                background: scheme.particle,
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                animation: `particle-sparkle-${color} 1s ease-in-out infinite`
              }}
            />
          </div>
        )}
      </div>
      
      {/* 进度数值 */}
      <div 
        className="absolute -top-6 text-xs font-bold transition-all duration-300"
        style={{
          left: `${Math.min(95, Math.max(5, percentage))}%`,
          transform: 'translateX(-50%)',
          color: scheme.primary,
          textShadow: `0 0 4px ${scheme.glow}`
        }}
      >
        {Math.round(percentage)}%
      </div>
    </div>
  );
}; 