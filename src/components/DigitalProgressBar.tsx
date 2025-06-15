import React from 'react';

interface DigitalProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  variant?: 'matrix' | 'terminal' | 'circuit' | 'binary';
}

export const DigitalProgressBar: React.FC<DigitalProgressBarProps> = ({
  value,
  max,
  onChange,
  className = '',
  variant = 'matrix'
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  const variants = {
    matrix: {
      primary: '#00ff41',
      secondary: '#008f11',
      bg: '#0d1117',
      text: '#00ff41',
      glow: 'rgba(0, 255, 65, 0.5)',
      chars: '01'
    },
    terminal: {
      primary: '#00ff00',
      secondary: '#00cc00',
      bg: '#000000',
      text: '#00ff00',
      glow: 'rgba(0, 255, 0, 0.5)',
      chars: '>#'
    },
    circuit: {
      primary: '#00d4ff',
      secondary: '#0099cc',
      bg: '#0a0a0a',
      text: '#00d4ff',
      glow: 'rgba(0, 212, 255, 0.5)',
      chars: '━┃'
    },
    binary: {
      primary: '#ff6b35',
      secondary: '#cc5429',
      bg: '#1a1a1a',
      text: '#ff6b35',
      glow: 'rgba(255, 107, 53, 0.5)',
      chars: '01'
    }
  };

  const currentVariant = variants[variant];

  // 生成随机字符
  const generateChars = (count: number) => {
    return Array.from({ length: count }, () => 
      currentVariant.chars[Math.floor(Math.random() * currentVariant.chars.length)]
    );
  };

  const backgroundChars = generateChars(50);
  const progressChars = generateChars(Math.floor(percentage / 2));

  return (
    <div className={`relative w-full h-8 ${className}`}>
      <style>{`
        @keyframes digital-flicker-${variant} {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes digital-scan-${variant} {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes char-change-${variant} {
          0%, 90% { opacity: 1; }
          95% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        .digital-flicker-${variant} {
          animation: digital-flicker-${variant} 2s ease-in-out infinite;
        }
        .digital-scan-${variant} {
          animation: digital-scan-${variant} 3s linear infinite;
        }
        .char-animation-${variant} {
          animation: char-change-${variant} 4s ease-in-out infinite;
        }
      `}</style>
      
      <div 
        className="relative w-full h-full rounded cursor-pointer overflow-hidden font-mono"
        onClick={handleClick}
        style={{
          backgroundColor: currentVariant.bg,
          border: `1px solid ${currentVariant.primary}`,
          boxShadow: `inset 0 0 10px rgba(0, 0, 0, 0.5), 0 0 10px ${currentVariant.glow}`
        }}
      >
        {/* 背景字符 */}
        <div className="absolute inset-0 flex items-center justify-start overflow-hidden">
          <div 
            className="flex text-xs opacity-20"
            style={{ color: currentVariant.primary }}
          >
            {backgroundChars.map((char, i) => (
              <span
                key={i}
                className={`char-animation-${variant}`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  marginRight: '2px'
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>
        
        {/* 进度填充 */}
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-300 ease-out overflow-hidden"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${currentVariant.secondary}, ${currentVariant.primary})`,
            boxShadow: `0 0 15px ${currentVariant.glow}`
          }}
        >
          {/* 进度字符 */}
          <div className="absolute inset-0 flex items-center justify-start">
            <div 
              className={`digital-flicker-${variant} flex text-xs font-bold`}
              style={{ color: currentVariant.bg, mixBlendMode: 'difference' }}
            >
              {progressChars.map((char, i) => (
                <span
                  key={i}
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    marginRight: '2px'
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
          
          {/* 扫描线效果 */}
          <div 
            className={`digital-scan-${variant} absolute inset-0 w-4`}
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${currentVariant.primary} 50%, transparent 100%)`,
              opacity: 0.6
            }}
          />
        </div>
        
        {/* 边框发光效果 */}
        <div 
          className={`digital-flicker-${variant} absolute inset-0 rounded pointer-events-none`}
          style={{
            border: `1px solid ${currentVariant.primary}`,
            boxShadow: `inset 0 0 5px ${currentVariant.glow}`
          }}
        />
        
        {/* 进度指示器 */}
        {percentage > 0 && (
          <div 
            className={`digital-flicker-${variant} absolute top-0 bottom-0 w-0.5`}
            style={{
              left: `${percentage}%`,
              background: currentVariant.primary,
              boxShadow: `0 0 8px ${currentVariant.glow}`,
              transform: 'translateX(-50%)'
            }}
          />
        )}
        
        {/* 数字显示 */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: percentage > 50 ? currentVariant.bg : currentVariant.primary,
            textShadow: percentage > 50 ? 'none' : `0 0 4px ${currentVariant.glow}`,
            mixBlendMode: percentage > 50 ? 'difference' : 'normal'
          }}
        >
          {String(Math.round(percentage)).padStart(3, '0')}%
        </div>
        
        {/* 角落装饰 */}
        <div 
          className="absolute top-0 left-0 w-2 h-2"
          style={{
            borderTop: `2px solid ${currentVariant.primary}`,
            borderLeft: `2px solid ${currentVariant.primary}`,
            opacity: 0.7
          }}
        />
        <div 
          className="absolute top-0 right-0 w-2 h-2"
          style={{
            borderTop: `2px solid ${currentVariant.primary}`,
            borderRight: `2px solid ${currentVariant.primary}`,
            opacity: 0.7
          }}
        />
        <div 
          className="absolute bottom-0 left-0 w-2 h-2"
          style={{
            borderBottom: `2px solid ${currentVariant.primary}`,
            borderLeft: `2px solid ${currentVariant.primary}`,
            opacity: 0.7
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-2 h-2"
          style={{
            borderBottom: `2px solid ${currentVariant.primary}`,
            borderRight: `2px solid ${currentVariant.primary}`,
            opacity: 0.7
          }}
        />
      </div>
    </div>
  );
}; 