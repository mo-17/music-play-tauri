import React from 'react';

interface VintageProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  theme?: 'retro' | 'steampunk' | 'art-deco' | 'neon-80s';
}

export const VintageProgressBar: React.FC<VintageProgressBarProps> = ({
  value,
  max,
  onChange,
  className = '',
  theme = 'retro'
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  const themes = {
    retro: {
      track: {
        background: 'linear-gradient(180deg, #8b4513 0%, #654321 50%, #4a2c17 100%)',
        border: '3px solid #d2691e',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6), 0 2px 4px rgba(210, 105, 30, 0.3)'
      },
      fill: {
        background: 'linear-gradient(180deg, #ffd700 0%, #ffb347 50%, #ff8c00 100%)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 2px 4px rgba(255, 140, 0, 0.4)'
      },
      accent: '#ffd700',
      text: '#4a2c17'
    },
    steampunk: {
      track: {
        background: 'linear-gradient(180deg, #8b7355 0%, #6b5b47 50%, #4a3f35 100%)',
        border: '3px solid #cd853f',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6), 0 2px 4px rgba(205, 133, 63, 0.3)'
      },
      fill: {
        background: 'linear-gradient(180deg, #b8860b 0%, #daa520 50%, #cd853f 100%)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 2px 4px rgba(184, 134, 11, 0.4)'
      },
      accent: '#daa520',
      text: '#4a3f35'
    },
    'art-deco': {
      track: {
        background: 'linear-gradient(180deg, #2f2f2f 0%, #1a1a1a 50%, #0d0d0d 100%)',
        border: '2px solid #c0c0c0',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(192, 192, 192, 0.3)'
      },
      fill: {
        background: 'linear-gradient(180deg, #ffd700 0%, #ffb347 25%, #ff6347 50%, #dc143c 75%, #8b0000 100%)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 2px 4px rgba(255, 215, 0, 0.4)'
      },
      accent: '#ffd700',
      text: '#0d0d0d'
    },
    'neon-80s': {
      track: {
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        border: '2px solid #e94560',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6), 0 0 10px rgba(233, 69, 96, 0.5)'
      },
      fill: {
        background: 'linear-gradient(90deg, #ff006e 0%, #fb5607 25%, #ffbe0b 50%, #8338ec 75%, #3a86ff 100%)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 0 15px rgba(255, 0, 110, 0.6)'
      },
      accent: '#ff006e',
      text: '#1a1a2e'
    }
  };

  const currentTheme = themes[theme];

  return (
    <div className={`relative w-full h-8 ${className}`}>
      <style>{`
        @keyframes vintage-glow-${theme} {
          0%, 100% { 
            filter: brightness(1) contrast(1);
          }
          50% { 
            filter: brightness(1.1) contrast(1.1);
          }
        }
        @keyframes vintage-flicker-${theme} {
          0%, 98%, 100% { opacity: 1; }
          99% { opacity: 0.8; }
        }
        @keyframes vintage-scan-${theme} {
          0% { transform: translateX(-100%) scaleX(0.5); }
          50% { transform: translateX(0%) scaleX(1); }
          100% { transform: translateX(100%) scaleX(0.5); }
        }
        .vintage-glow-${theme} {
          animation: vintage-glow-${theme} 3s ease-in-out infinite;
        }
        .vintage-flicker-${theme} {
          animation: vintage-flicker-${theme} 4s ease-in-out infinite;
        }
        .vintage-scan-${theme} {
          animation: vintage-scan-${theme} 5s ease-in-out infinite;
        }
      `}</style>
      
      <div 
        className={`vintage-flicker-${theme} relative w-full h-full rounded-lg cursor-pointer overflow-hidden`}
        onClick={handleClick}
        style={{
          ...currentTheme.track,
          fontFamily: theme === 'art-deco' ? 'serif' : theme === 'neon-80s' ? 'monospace' : 'sans-serif'
        }}
      >
        {/* 装饰边框 */}
        <div 
          className="absolute inset-1 rounded-md"
          style={{
            border: `1px solid ${currentTheme.accent}`,
            opacity: 0.6
          }}
        />
        
        {/* 背景纹理 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: theme === 'steampunk' 
              ? 'radial-gradient(circle at 25% 25%, rgba(205, 133, 63, 0.3) 2px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(205, 133, 63, 0.3) 1px, transparent 1px)'
              : theme === 'art-deco'
              ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(192, 192, 192, 0.1) 10px, rgba(192, 192, 192, 0.1) 20px)'
              : theme === 'neon-80s'
              ? 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(233, 69, 96, 0.1) 2px, rgba(233, 69, 96, 0.1) 4px)'
              : 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(210, 105, 30, 0.1) 5px, rgba(210, 105, 30, 0.1) 10px)',
            backgroundSize: theme === 'steampunk' ? '20px 20px' : theme === 'art-deco' ? '40px 40px' : '8px 8px'
          }}
        />
        
        {/* 进度填充 */}
        <div 
          className={`vintage-glow-${theme} absolute top-2 left-2 bottom-2 rounded-md transition-all duration-500 ease-out overflow-hidden`}
          style={{
            width: `calc(${percentage}% - 16px)`,
            ...currentTheme.fill
          }}
        >
          {/* 扫描线效果 */}
          <div 
            className={`vintage-scan-${theme} absolute inset-0 w-8`}
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)`,
              opacity: 0.7
            }}
          />
          
          {/* 内部装饰 */}
          <div 
            className="absolute top-1 left-1 right-1 h-1 rounded-sm"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)'
            }}
          />
        </div>
        
        {/* 刻度标记 */}
        <div className="absolute inset-0 flex items-center justify-between px-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex flex-col items-center"
              style={{ opacity: 0.7 }}
            >
              <div 
                className="w-px bg-current"
                style={{
                  height: i % 2 === 0 ? '12px' : '8px',
                  color: currentTheme.accent
                }}
              />
              {i % 2 === 0 && (
                <div 
                  className="text-xs mt-1"
                  style={{
                    color: currentTheme.accent,
                    fontSize: '8px'
                  }}
                >
                  {i * 20}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* 进度指针 */}
        {percentage > 0 && (
          <div 
            className={`vintage-flicker-${theme} absolute top-0 bottom-0 flex items-center`}
            style={{
              left: `${Math.max(8, percentage)}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div 
              className="w-0 h-0"
              style={{
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: `8px solid ${currentTheme.accent}`,
                filter: `drop-shadow(0 0 4px ${currentTheme.accent})`
              }}
            />
          </div>
        )}
        
        {/* 标题装饰 */}
        <div 
          className="absolute -top-5 left-0 text-xs font-bold"
          style={{
            color: currentTheme.accent,
            textShadow: `0 0 4px ${currentTheme.accent}`,
            letterSpacing: '1px'
          }}
        >
          {theme === 'steampunk' ? 'STEAM GAUGE' : 
           theme === 'art-deco' ? 'PROGRESS METER' :
           theme === 'neon-80s' ? 'SYSTEM STATUS' : 'PROGRESS BAR'}
        </div>
        
        {/* 数值显示 */}
        <div 
          className="absolute -bottom-5 right-0 text-xs font-bold"
          style={{
            color: currentTheme.accent,
            textShadow: `0 0 4px ${currentTheme.accent}`
          }}
        >
          {Math.round(percentage)}%
        </div>
      </div>
    </div>
  );
}; 