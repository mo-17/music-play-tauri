import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  RotateCw,
  RotateCcw,
  Settings,
  Copy,
  Download,
  Info,
  Bookmark,
  Share2
} from 'lucide-react';

interface ContextMenuItem {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
  onClick?: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  className?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = memo(({
  items,
  visible,
  position,
  onClose,
  className = ''
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenuVisible, setSubmenuVisible] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

  // 处理点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  // 调整菜单位置避免超出屏幕
  const adjustPosition = useCallback((x: number, y: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // 右边界检查
    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10;
    }

    // 下边界检查
    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10;
    }

    // 左边界检查
    if (adjustedX < 10) {
      adjustedX = 10;
    }

    // 上边界检查
    if (adjustedY < 10) {
      adjustedY = 10;
    }

    return { x: adjustedX, y: adjustedY };
  }, []);

  // 处理菜单项点击
  const handleItemClick = useCallback((item: ContextMenuItem) => {
    if (item.disabled) return;

    if (item.submenu) {
      setSubmenuVisible(submenuVisible === item.id ? null : item.id);
    } else {
      item.onClick?.();
      onClose();
    }
  }, [submenuVisible, onClose]);

  // 处理子菜单鼠标悬停
  const handleSubmenuHover = useCallback((item: ContextMenuItem, event: React.MouseEvent) => {
    if (item.submenu) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setSubmenuPosition({
        x: rect.right + 5,
        y: rect.top
      });
      setSubmenuVisible(item.id);
    }
  }, []);

  // 渲染菜单项
  const renderMenuItem = useCallback((item: ContextMenuItem, index: number) => {
    if (item.separator) {
      return <div key={`separator-${index}`} className="h-px bg-gray-600 my-1" />;
    }

    return (
      <div
        key={item.id}
        className={`
          flex items-center justify-between px-3 py-2 text-sm cursor-pointer
          transition-colors duration-150
          ${item.disabled 
            ? 'text-gray-500 cursor-not-allowed' 
            : 'text-white hover:bg-gray-700 active:bg-gray-600'
          }
          ${item.submenu ? 'relative' : ''}
        `}
        onClick={() => handleItemClick(item)}
        onMouseEnter={(e) => handleSubmenuHover(item, e)}
      >
        <div className="flex items-center space-x-3">
          {item.icon && (
            <span className="flex-shrink-0 w-4 h-4">
              {item.icon}
            </span>
          )}
          <span>{item.label}</span>
        </div>

        <div className="flex items-center space-x-2">
          {item.shortcut && (
            <span className="text-xs text-gray-400 font-mono">
              {item.shortcut}
            </span>
          )}
          {item.submenu && (
            <span className="text-gray-400">▶</span>
          )}
        </div>
      </div>
    );
  }, [handleItemClick, handleSubmenuHover]);

  if (!visible) return null;

  return (
    <>
      <div
        ref={menuRef}
        className={`
          fixed z-50 min-w-[200px] bg-gray-800 border border-gray-600 
          rounded-lg shadow-xl backdrop-blur-sm py-1
          ${className}
        `}
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {items.map(renderMenuItem)}
      </div>

      {/* 子菜单 */}
      {submenuVisible && (
        <div
          className="fixed z-51 min-w-[180px] bg-gray-800 border border-gray-600 
                     rounded-lg shadow-xl backdrop-blur-sm py-1"
          style={{
            left: submenuPosition.x,
            top: submenuPosition.y,
          }}
        >
          {items
            .find(item => item.id === submenuVisible)
            ?.submenu?.map(renderMenuItem)}
        </div>
      )}
    </>
  );
});

ContextMenu.displayName = 'ContextMenu';

// 视频播放器专用的右键菜单Hook
export const useVideoContextMenu = (
  isPlaying: boolean,
  isMuted: boolean,
  isFullscreen: boolean,
  onPlay: () => void,
  onPause: () => void,
  onMute: () => void,
  onUnmute: () => void,
  onFullscreen: () => void,
  onExitFullscreen: () => void,
  onCopyVideoUrl?: () => void,
  onDownload?: () => void,
  onShowInfo?: () => void
) => {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    position: { x: 0, y: 0 }
  });

  // 创建菜单项
  const menuItems: ContextMenuItem[] = [
    {
      id: 'playback',
      label: isPlaying ? '暂停' : '播放',
      icon: isPlaying ? <Pause size={16} /> : <Play size={16} />,
      shortcut: 'Space',
      onClick: isPlaying ? onPause : onPlay
    },
    {
      id: 'separator1',
      separator: true
    },
    {
      id: 'volume',
      label: isMuted ? '取消静音' : '静音',
      icon: isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />,
      shortcut: 'M',
      onClick: isMuted ? onUnmute : onMute
    },
    {
      id: 'fullscreen',
      label: isFullscreen ? '退出全屏' : '全屏',
      icon: isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />,
      shortcut: 'F',
      onClick: isFullscreen ? onExitFullscreen : onFullscreen
    },
    {
      id: 'separator2',
      separator: true
    },
    {
      id: 'rotate',
      label: '旋转',
      icon: <RotateCw size={16} />,
      submenu: [
        {
          id: 'rotate-cw',
          label: '顺时针旋转',
          icon: <RotateCw size={16} />,
          shortcut: 'R',
          onClick: () => console.log('Rotate clockwise')
        },
        {
          id: 'rotate-ccw',
          label: '逆时针旋转',
          icon: <RotateCcw size={16} />,
          shortcut: 'Shift+R',
          onClick: () => console.log('Rotate counter-clockwise')
        }
      ]
    },
    {
      id: 'separator3',
      separator: true
    },
    {
      id: 'copy',
      label: '复制视频链接',
      icon: <Copy size={16} />,
      shortcut: 'Ctrl+C',
      onClick: onCopyVideoUrl,
      disabled: !onCopyVideoUrl
    },
    {
      id: 'download',
      label: '下载视频',
      icon: <Download size={16} />,
      onClick: onDownload,
      disabled: !onDownload
    },
    {
      id: 'bookmark',
      label: '添加书签',
      icon: <Bookmark size={16} />,
      onClick: () => console.log('Add bookmark')
    },
    {
      id: 'share',
      label: '分享',
      icon: <Share2 size={16} />,
      onClick: () => console.log('Share video')
    },
    {
      id: 'separator4',
      separator: true
    },
    {
      id: 'info',
      label: '视频信息',
      icon: <Info size={16} />,
      onClick: onShowInfo,
      disabled: !onShowInfo
    },
    {
      id: 'settings',
      label: '设置',
      icon: <Settings size={16} />,
      onClick: () => console.log('Open settings')
    }
  ];

  // 显示右键菜单
  const showContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      position: { x: event.clientX, y: event.clientY }
    });
  }, []);

  // 隐藏右键菜单
  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    contextMenu,
    menuItems,
    showContextMenu,
    hideContextMenu
  };
}; 