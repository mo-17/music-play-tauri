import React from 'react';

interface Neon2ProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  height?: 'thin' | 'medium' | 'thick';
  color?: 'blue' | 'cyan' | 'purple' | 'green' | 'orange' | 'red';
}

export const Neon2ProgressBar: React.FC<Neon2ProgressBarProps> = ({
  value,
  max,
  onChange,
  className = '',
  height = 'medium',
  color = 'cyan'
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const heightClasses = {
    thin: 'h-3',
    medium: 'h-4',
    thick: 'h-5'
  };
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    onChange(Math.max(0, Math.min(max, newValue)));
  };

  // 电路板风格霓虹颜色配置
  const neonColors = {
    cyan: {
      primary: '#00ffff',
      secondary: '#00ccff',
      tertiary: '#0099cc',
      rgb: '0, 255, 255',
      darkRgb: '0, 204, 255',
      accent: '#66ffff'
    },
    blue: {
      primary: '#0080ff',
      secondary: '#0066ff',
      tertiary: '#004dcc',
      rgb: '0, 128, 255',
      darkRgb: '0, 102, 255',
      accent: '#66a3ff'
    },
    purple: {
      primary: '#cc00ff',
      secondary: '#9900cc',
      tertiary: '#660099',
      rgb: '204, 0, 255',
      darkRgb: '153, 0, 204',
      accent: '#e066ff'
    },
    green: {
      primary: '#00ff66',
      secondary: '#00cc52',
      tertiary: '#009943',
      rgb: '0, 255, 102',
      darkRgb: '0, 204, 82',
      accent: '#66ff99'
    },
    orange: {
      primary: '#ff6600',
      secondary: '#ff5200',
      tertiary: '#cc4200',
      rgb: '255, 102, 0',
      darkRgb: '255, 82, 0',
      accent: '#ff9966'
    },
    red: {
      primary: '#ff0066',
      secondary: '#cc0052',
      tertiary: '#99003d',
      rgb: '255, 0, 102',
      darkRgb: '204, 0, 82',
      accent: '#ff6699'
    }
  };

  const colorConfig = neonColors[color];

  // 电路板背景轨道样式
  const trackStyle = {
    background: `
      linear-gradient(90deg, 
        rgba(5, 5, 15, 0.95) 0%, 
        rgba(10, 15, 25, 0.95) 20%, 
        rgba(15, 20, 35, 0.95) 40%, 
        rgba(20, 25, 40, 0.95) 60%, 
        rgba(15, 20, 35, 0.95) 80%, 
        rgba(5, 5, 15, 0.95) 100%
      ),
      repeating-linear-gradient(90deg, 
        transparent 0px, 
        transparent 8px, 
        rgba(${colorConfig.darkRgb}, 0.1) 8px, 
        rgba(${colorConfig.darkRgb}, 0.1) 10px
      )
    `,
    border: `2px solid rgba(${colorConfig.rgb}, 0.4)`,
    borderRadius: '12px',
    boxShadow: `
      0 0 4px rgba(${colorConfig.rgb}, 0.4),
      0 0 8px rgba(${colorConfig.rgb}, 0.2),
      inset 0 0 12px rgba(0, 0, 0, 0.9),
      inset 0 2px 0 rgba(${colorConfig.darkRgb}, 0.3),
      inset 0 -2px 0 rgba(0, 0, 0, 0.8)
    `,
    overflow: 'hidden' as const,
    position: 'relative' as const
  };

  // 主进度条样式 - 电路流光效果
  const progressStyle = {
    width: `${percentage}%`,
    height: '100%',
    background: `
      linear-gradient(90deg, 
        ${colorConfig.tertiary} 0%, 
        ${colorConfig.secondary} 25%, 
        ${colorConfig.primary} 50%, 
        ${colorConfig.secondary} 75%, 
        ${colorConfig.tertiary} 100%
      ),
      repeating-linear-gradient(90deg, 
        transparent 0px, 
        transparent 4px, 
        rgba(255, 255, 255, 0.2) 4px, 
        rgba(255, 255, 255, 0.2) 6px
      )
    `,
    borderRadius: '8px',
    position: 'relative' as const,
    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: `
      0 0 6px rgba(${colorConfig.rgb}, 0.9),
      0 0 12px rgba(${colorConfig.rgb}, 0.7),
      0 0 18px rgba(${colorConfig.rgb}, 0.5),
      0 0 24px rgba(${colorConfig.rgb}, 0.3),
      inset 0 0 8px rgba(255, 255, 255, 0.3),
      inset 0 2px 0 rgba(255, 255, 255, 0.5),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3)
    `,
    animation: 'neonFlow 3s ease-in-out infinite, neonPulse2 2s ease-in-out infinite alternate'
  };

  // 数据流光带效果
  const dataStreamStyle = {
    position: 'absolute' as const,
    top: '0',
    left: '0',
    width: `${percentage}%`,
    height: '100%',
    background: `
      linear-gradient(90deg, 
        transparent 0%, 
        rgba(${colorConfig.rgb}, 0.3) 20%, 
        rgba(${colorConfig.rgb}, 0.6) 40%, 
        rgba(${colorConfig.rgb}, 0.8) 60%, 
        rgba(${colorConfig.rgb}, 0.6) 80%, 
        transparent 100%
      )
    `,
    borderRadius: '8px',
    animation: 'dataFlow 2s linear infinite',
    pointerEvents: 'none' as const
  };

  // 扫描线效果
  const scanLineStyle = {
    position: 'absolute' as const,
    top: '0',
    left: '0',
    width: '100%',
    height: '1px',
    background: `linear-gradient(90deg, 
      transparent 0%, 
      rgba(${colorConfig.rgb}, 0.8) 50%, 
      transparent 100%
    )`,
    animation: 'scanLine 4s ease-in-out infinite',
    pointerEvents: 'none' as const
  };

  return (
    <>
      {/* CSS 动画定义 */}
      <style>{`
        @keyframes neonPulse2 {
          0% {
            box-shadow: 
              0 0 6px rgba(${colorConfig.rgb}, 0.9),
              0 0 12px rgba(${colorConfig.rgb}, 0.7),
              0 0 18px rgba(${colorConfig.rgb}, 0.5),
              0 0 24px rgba(${colorConfig.rgb}, 0.3),
              inset 0 0 8px rgba(255, 255, 255, 0.3),
              inset 0 2px 0 rgba(255, 255, 255, 0.5),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3);
          }
          100% {
            box-shadow: 
              0 0 8px rgba(${colorConfig.rgb}, 1),
              0 0 16px rgba(${colorConfig.rgb}, 0.9),
              0 0 24px rgba(${colorConfig.rgb}, 0.7),
              0 0 32px rgba(${colorConfig.rgb}, 0.5),
              inset 0 0 10px rgba(255, 255, 255, 0.4),
              inset 0 2px 0 rgba(255, 255, 255, 0.6),
              inset 0 -1px 0 rgba(0, 0, 0, 0.4);
          }
        }
        
        @keyframes neonFlow {
          0%, 100% {
            background-size: 200% 100%;
            background-position: 0% 50%;
          }
          50% {
            background-size: 200% 100%;
            background-position: 100% 50%;
          }
        }
        
        @keyframes dataFlow {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        @keyframes scanLine {
          0%, 100% {
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        @keyframes circuitGlow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
      
      <div 
        className={`relative cursor-pointer w-full ${heightClasses[height]} ${className}`}
        onClick={handleClick}
        style={trackStyle}
      >
        {/* 扫描线 */}
        <div style={scanLineStyle} />
        
        {/* 电路点阵背景 */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: `
              radial-gradient(circle at 10% 50%, rgba(${colorConfig.rgb}, 0.2) 1px, transparent 2px),
              radial-gradient(circle at 30% 50%, rgba(${colorConfig.rgb}, 0.2) 1px, transparent 2px),
              radial-gradient(circle at 50% 50%, rgba(${colorConfig.rgb}, 0.2) 1px, transparent 2px),
              radial-gradient(circle at 70% 50%, rgba(${colorConfig.rgb}, 0.2) 1px, transparent 2px),
              radial-gradient(circle at 90% 50%, rgba(${colorConfig.rgb}, 0.2) 1px, transparent 2px)
            `,
            backgroundSize: '20% 100%',
            animation: 'circuitGlow 3s ease-in-out infinite',
            pointerEvents: 'none'
          }}
        />
        
        {/* 主进度条 */}
        <div style={progressStyle}>
          {/* 数据流效果 */}
          <div style={dataStreamStyle} />
          
          {/* 顶部高光 */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '50%',
              background: `linear-gradient(180deg, 
                rgba(255, 255, 255, 0.6) 0%, 
                rgba(255, 255, 255, 0.3) 50%, 
                transparent 100%
              )`,
              borderRadius: '8px 8px 0 0'
            }}
          />
          
          {/* 进度末端发光指示器 */}
          {percentage > 0 && (
            <>
              {/* 主指示器 */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-3px',
                  width: '8px',
                  height: '8px',
                  background: colorConfig.primary,
                  borderRadius: '50%',
                  transform: 'translateY(-50%)',
                  boxShadow: `
                    0 0 6px rgba(${colorConfig.rgb}, 1),
                    0 0 12px rgba(${colorConfig.rgb}, 0.8),
                    0 0 18px rgba(${colorConfig.rgb}, 0.6),
                    0 0 24px rgba(${colorConfig.rgb}, 0.4)
                  `,
                  animation: 'neonPulse2 1s ease-in-out infinite alternate',
                  border: `1px solid ${colorConfig.accent}`
                }}
              />
              
              {/* 外圈指示器 */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-6px',
                  width: '14px',
                  height: '14px',
                  border: `2px solid rgba(${colorConfig.rgb}, 0.6)`,
                  borderRadius: '50%',
                  transform: 'translateY(-50%)',
                  animation: 'neonPulse2 1.5s ease-in-out infinite alternate reverse',
                  pointerEvents: 'none'
                }}
              />
            </>
          )}
        </div>
        
        {/* 外部光场 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            width: `${Math.min(percentage + 10, 100)}%`,
            height: '300%',
            transform: 'translateY(-50%)',
            background: `
              radial-gradient(ellipse at right center, 
                rgba(${colorConfig.rgb}, 0.15) 0%, 
                rgba(${colorConfig.rgb}, 0.08) 40%, 
                rgba(${colorConfig.rgb}, 0.03) 70%, 
                transparent 100%
              )
            `,
            borderRadius: '50%',
            filter: 'blur(6px)',
            pointerEvents: 'none',
            animation: 'neonFlow 4s ease-in-out infinite'
          }}
        />
      </div>
    </>
  );
};