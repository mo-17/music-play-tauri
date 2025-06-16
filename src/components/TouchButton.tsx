import React, { useState } from 'react';
import { 
  useDeviceInfo,
  useGracefulDegradation,
  getGracefulDegradationClasses,
  getAccessibilityProps,
  getResponsiveButtonClasses
} from '../hooks/useResponsiveSize';
import { useTouchFriendlyStyles } from '../hooks/useTouchOptimization';

interface TouchButtonProps {
  id: string;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
  onPressedChange?: (id: string, isPressed: boolean) => void;
}

export const TouchButton: React.FC<TouchButtonProps> = ({ 
  id, 
  onClick, 
  disabled = false, 
  title, 
  children, 
  className = '', 
  variant = 'secondary',
  onPressedChange 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const deviceInfo = useDeviceInfo();
  const gracefulConfig = useGracefulDegradation();
  const styles = useTouchFriendlyStyles(isPressed);
  const buttonClasses = getResponsiveButtonClasses(window.innerWidth);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('TouchButton clicked:', {
      id,
      disabled,
      hasOnClick: !!onClick,
    });
    
    if (!disabled && onClick) {
      try {
        onClick();
        console.log('TouchButton onClick executed successfully for:', id);
      } catch (error) {
        console.error('TouchButton onClick error for:', id, error);
      }
    } else {
      console.log('TouchButton click blocked:', {
        id,
        reason: disabled ? 'disabled' : 'no onClick function'
      });
    }
  };

  const handlePressedChange = (pressed: boolean) => {
    setIsPressed(pressed);
    onPressedChange?.(id, pressed);
  };
  
  const baseClasses = `text-white hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed ${buttonClasses} rounded-md`;
  const variantClasses = variant === 'primary' 
    ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 play-button'
    : 'hover:bg-white/10 active:bg-white/20';
  const animationClasses = 'button-interactive animate-on-hover animate-on-click gpu-accelerated';
  
  // 应用优雅降级
  const finalClasses = getGracefulDegradationClasses(
    gracefulConfig,
    `${baseClasses} ${variantClasses} ${animationClasses} ${className}`
  );
  
  // 获取可访问性属性
  const accessibilityProps = getAccessibilityProps(deviceInfo);
  
  // 合并样式
  const combinedStyle = {
    ...styles,
    ...(accessibilityProps.style || {})
  };
  
  return (
    <button
      disabled={disabled}
      title={title}
      className={finalClasses}
      style={combinedStyle}
      onMouseDown={() => handlePressedChange(true)}
      onMouseUp={() => handlePressedChange(false)}
      onMouseLeave={() => handlePressedChange(false)}
      onClick={handleClick}
      {...(accessibilityProps['data-touch-device'] && { 'data-touch-device': accessibilityProps['data-touch-device'] })}
      {...(accessibilityProps['data-high-dpi'] && { 'data-high-dpi': accessibilityProps['data-high-dpi'] })}
      {...(accessibilityProps['data-mobile-device'] && { 'data-mobile-device': accessibilityProps['data-mobile-device'] })}
      // 可访问性增强
      aria-label={title}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </button>
  );
}; 