import React from 'react';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface MobileNavProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isSidebarOpen,
  onToggleSidebar
}) => {
  const { actualTheme } = useTheme();

  return (
    <div className={`md:hidden flex items-center justify-between p-4 border-b transition-colors ${
      actualTheme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      {/* Logo/Title */}
      <h1 className={`text-lg font-bold transition-colors ${
        actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        音乐播放器
      </h1>

      {/* Hamburger Menu Button */}
      <button
        onClick={onToggleSidebar}
        className={`p-2 rounded-lg transition-colors ${
          actualTheme === 'dark'
            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
        aria-label="Toggle navigation menu"
      >
        {isSidebarOpen ? (
          <X size={24} />
        ) : (
          <Menu size={24} />
        )}
      </button>
    </div>
  );
}; 