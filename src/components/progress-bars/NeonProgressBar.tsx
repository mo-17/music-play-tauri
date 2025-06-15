import React from 'react';

interface NeonProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  height?: 'thin' | 'medium' | 'thick';
  color?: 'blue' | 'cyan' | 'purple' | 'green' | 'pink' | 'red';
}

export const NeonProgressBar: React.FC<NeonProgressBarProps> = ({
  value,
  max,
  onChange,
  className = '',
  height = 'medium',
  color = 'cyan'
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const heightClasses = {
    thin: 'h-2',
    medium: 'h-3',
    thick: 'h-4'
  };
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  // 霓虹颜色配置
  const neonColors = {
    cyan: {
      primary: '#00ffff',
      secondary: '#00d4ff',
      rgb: '0, 255, 255',
      darkRgb: '0, 150, 200'
    },
    blue: {
      primary: '#0080ff',
      secondary: '#0066cc',
      rgb: '0, 128, 255',
      darkRgb: '0, 102, 204'
    },
    purple: {
      primary: '#ff00ff',
      secondary: '#cc00cc',
      rgb: '255, 0, 255',
      darkRgb: '204, 0, 204'
    },
    green: {
      primary: '#00ff80',
      secondary: '#00cc66',
      rgb: '0, 255, 128',
      darkRgb: '0, 204, 102'
    },
    pink: {
      primary: '#ff0080',
      secondary: '#cc0066',
      rgb: '255, 0, 128',
      darkRgb: '204, 0, 102'
    },
    red: {
      primary: '#ff0040',
      secondary: '#cc0033',
      rgb: '255, 0, 64',
      darkRgb: '204, 0, 51'
    }
  };

  const colorConfig = neonColors[color];

  // 轨道样式
  const trackStyle = {
    background: `
      linear-gradient(90deg, 
        rgba(0, 0, 0, 0.9) 0%, 
        rgba(10, 10, 20, 0.9) 25%, 
        rgba(15, 15, 30, 0.9) 50%, 
        rgba(10, 10, 20, 0.9) 75%, 
        rgba(0, 0, 0, 0.9) 100%
      )
    `,
    border: `1px solid rgba(${colorConfig.darkRgb}, 0.3)`,
    borderRadius: '9999px',
    boxShadow: `
      0 0 2px rgba(${colorConfig.rgb}, 0.3),
      inset 0 0 8px rgba(0, 0, 0, 0.8),
      inset 0 1px 0 rgba(${colorConfig.darkRgb}, 0.2)
    `,
    overflow: 'hidden' as const,
    position: 'relative' as const
  };

  // 进度条样式
  const progressStyle = {
    width: `${percentage}%`,
    height: '100%',
    background: `
      linear-gradient(90deg, 
        ${colorConfig.secondary} 0%, 
        ${colorConfig.primary} 50%, 
        ${colorConfig.secondary} 100%
      )
    `,
    borderRadius: '9999px',
    position: 'relative' as const,
    transition: 'width 0.3s ease-out',
    boxShadow: `
      0 0 4px rgba(${colorConfig.rgb}, 0.8),
      0 0 8px rgba(${colorConfig.rgb}, 0.6),
      0 0 12px rgba(${colorConfig.rgb}, 0.4),
      0 0 20px rgba(${colorConfig.rgb}, 0.3),
      inset 0 0 6px rgba(255, 255, 255, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.4)
    `,
    // 霓虹闪烁动画
    animation: 'neonPulse 2s ease-in-out infinite alternate'
  };

  // 发光轨迹效果
  const glowTrailStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '0',
    width: `${percentage}%`,
    height: '150%',
    transform: 'translateY(-50%)',
    background: `
      linear-gradient(90deg, 
        transparent 0%, 
        rgba(${colorConfig.rgb}, 0.1) 50%, 
        rgba(${colorConfig.rgb}, 0.2) 100%
      )
    `,
    borderRadius: '9999px',
    filter: 'blur(2px)',
    animation: 'neonGlow 3s ease-in-out infinite',
    pointerEvents: 'none' as const
  };

  return (
    <>
      {/* CSS 动画定义 */}
      <style>{`
        @keyframes neonPulse {
          0% {
            box-shadow: 
              0 0 4px rgba(${colorConfig.rgb}, 0.8),
              0 0 8px rgba(${colorConfig.rgb}, 0.6),
              0 0 12px rgba(${colorConfig.rgb}, 0.4),
              0 0 20px rgba(${colorConfig.rgb}, 0.3),
              inset 0 0 6px rgba(255, 255, 255, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
          }
          100% {
            box-shadow: 
              0 0 6px rgba(${colorConfig.rgb}, 1),
              0 0 12px rgba(${colorConfig.rgb}, 0.8),
              0 0 18px rgba(${colorConfig.rgb}, 0.6),
              0 0 30px rgba(${colorConfig.rgb}, 0.4),
              inset 0 0 8px rgba(255, 255, 255, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
          }
        }
        
        @keyframes neonGlow {
          0%, 100% {
            opacity: 0.3;
            transform: translateY(-50%) scale(1);
          }
          50% {
            opacity: 0.6;
            transform: translateY(-50%) scale(1.05);
          }
        }
        
        @keyframes neonFlicker {
          0%, 98%, 100% {
            opacity: 1;
          }
          99% {
            opacity: 0.8;
          }
        }
      `}</style>
      
      <div 
        className={`relative cursor-pointer w-full ${heightClasses[height]} ${className}`}
        onClick={handleClick}
        style={trackStyle}
      >
        {/* 背景发光轨迹 */}
        <div style={glowTrailStyle} />
        
        {/* 主进度条 */}
        <div style={progressStyle}>
          {/* 内部高光 */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '40%',
              background: `linear-gradient(90deg, 
                transparent 0%, 
                rgba(255, 255, 255, 0.6) 50%, 
                transparent 100%
              )`,
              borderRadius: '9999px 9999px 0 0',
              animation: 'neonFlicker 4s ease-in-out infinite'
            }}
          />
          
          {/* 末端发光点 */}
          {percentage > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: '-2px',
                width: '6px',
                height: '6px',
                background: colorConfig.primary,
                borderRadius: '50%',
                transform: 'translateY(-50%)',
                boxShadow: `
                  0 0 4px rgba(${colorConfig.rgb}, 1),
                  0 0 8px rgba(${colorConfig.rgb}, 0.8),
                  0 0 12px rgba(${colorConfig.rgb}, 0.6)
                `,
                animation: 'neonPulse 1.5s ease-in-out infinite alternate'
              }}
            />
          )}
        </div>
        
        {/* 外部光晕 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            width: `${percentage}%`,
            height: '200%',
            transform: 'translateY(-50%)',
            background: `
              radial-gradient(ellipse at center, 
                rgba(${colorConfig.rgb}, 0.1) 0%, 
                rgba(${colorConfig.rgb}, 0.05) 50%, 
                transparent 100%
              )
            `,
            borderRadius: '9999px',
            filter: 'blur(4px)',
            pointerEvents: 'none',
            animation: 'neonGlow 2.5s ease-in-out infinite'
          }}
        />
      </div>
    </>
  );
};