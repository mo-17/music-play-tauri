import React from 'react';
import '../styles/animations.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  type?: 'spinner' | 'dots' | 'pulse';
  className?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  type = 'spinner',
  className = '',
  message
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-6 h-6';
      case 'large':
        return 'w-16 h-16';
      default:
        return 'w-10 h-10';
    }
  };

  const renderSpinner = () => (
    <div className={`loading-spinner ${getSizeClasses()} ${className}`} />
  );

  const renderDots = () => (
    <div className={`buffering-dots ${className}`}>
      <div className="buffering-dot" />
      <div className="buffering-dot" />
      <div className="buffering-dot" />
    </div>
  );

  const renderPulse = () => (
    <div className={`${getSizeClasses()} ${className}`}>
      <div className="w-full h-full bg-cyan-400 rounded-full animate-pulse" />
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {renderContent()}
      {message && (
        <span className="text-white text-sm opacity-75 animate-pulse">
          {message}
        </span>
      )}
    </div>
  );
}; 