import React, { useState, useRef, useCallback } from 'react';

interface NeonProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  variant?: 'primary' | 'volume';
  className?: string;
}

export const NeonProgressBar: React.FC<NeonProgressBarProps> = ({
  value,
  max,
  onChange,
  disabled = false,
  variant = 'primary',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const percentage = max > 0 ? (value / max) * 100 : 0;

  const updateValue = useCallback((clientX: number) => {
    if (!containerRef.current || disabled) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const newValue = (clickX / rect.width) * max;
    const clampedValue = Math.max(0, Math.min(max, newValue));
    onChange(clampedValue);
  }, [max, onChange, disabled]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    updateValue(e.clientX);
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateValue(e.clientX);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateValue, disabled]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled || isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    updateValue(e.clientX);
  }, [updateValue, disabled, isDragging]);

  const getTheme = () => {
    if (variant === 'primary') {
      return {
        primary: '#00ffff',
        secondary: '#ff00ff',
        glow: 'cyan',
        track: '#1a1a2e'
      };
    } else {
      return {
        primary: '#00ff88',
        secondary: '#88ff00',
        glow: 'lime',
        track: '#1a1a2e'
      };
    }
  };

  const theme = getTheme();

  return (
    <div 
      ref={containerRef}
      className={`relative group cursor-pointer py-4 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* 外层发光轨道 */}
      <div 
        className={`
          relative h-2 rounded-full transition-all duration-300 ease-out
          ${isHovered || isDragging ? 'h-3' : 'h-2'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ 
          backgroundColor: theme.track,
          boxShadow: `inset 0 0 10px rgba(0, 0, 0, 0.5)`
        }}
      >
        {/* 进度条 */}
        <div 
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out"
          style={{ 
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
            boxShadow: `
              0 0 10px ${theme.primary}80,
              0 0 20px ${theme.primary}40,
              0 0 30px ${theme.primary}20,
              inset 0 0 10px rgba(255, 255, 255, 0.2)
            `
          }}
        />

        {/* 动态光效 */}
        {(isHovered || isDragging) && (
          <div 
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ 
              width: `${percentage}%`,
              background: `linear-gradient(90deg, transparent, ${theme.primary}60, transparent)`,
              opacity: isDragging ? 1 : 0.6,
              animation: isDragging ? 'none' : 'pulse 2s ease-in-out infinite'
            }}
          />
        )}
      </div>

      {/* 滑块 */}
      <div
        className={`
          absolute top-1/2 w-4 h-4 rounded-full transition-all duration-200 ease-out transform -translate-y-1/2 -translate-x-1/2
          ${isHovered || isDragging ? 'w-5 h-5 opacity-100' : 'w-3 h-3 opacity-0'}
          ${isDragging ? 'scale-110' : ''}
        `}
        style={{
          left: `${percentage}%`,
          background: `radial-gradient(circle, ${theme.primary}, ${theme.secondary})`,
          boxShadow: `
            0 0 15px ${theme.primary}80,
            0 0 25px ${theme.primary}40,
            0 0 35px ${theme.primary}20,
            inset 0 0 8px rgba(255, 255, 255, 0.3)
          `,
          border: `1px solid ${theme.primary}80`,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}; 