import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  target?: HTMLElement | null;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const {
    enabled = true,
    target = null,
    preventDefault = true
  } = options;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const activeElement = document.activeElement;
    
    // 如果焦点在输入框中，不处理快捷键
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable') === 'true'
    )) {
      return;
    }

    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
      const altMatch = !!shortcut.altKey === event.altKey;
      const metaMatch = !!shortcut.metaKey === event.metaKey;

      return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
    });

    if (matchingShortcut) {
      if (preventDefault || matchingShortcut.preventDefault !== false) {
        event.preventDefault();
        event.stopPropagation();
      }
      matchingShortcut.action();
    }
  }, [enabled, preventDefault]);

  useEffect(() => {
    const targetElement = target || document;
    
    const keydownHandler = (event: Event) => {
      handleKeyDown(event as KeyboardEvent);
    };
    
    if (enabled) {
      targetElement.addEventListener('keydown', keydownHandler);
    }

    return () => {
      targetElement.removeEventListener('keydown', keydownHandler);
    };
  }, [enabled, target, handleKeyDown]);

  return {
    shortcuts: shortcutsRef.current
  };
};

// 视频播放器专用的键盘快捷键Hook
export const useVideoPlayerShortcuts = (
  isPlaying: boolean,
  isMuted: boolean,
  isFullscreen: boolean,
  volume: number,
  currentTime: number,
  duration: number,
  onPlay: () => void,
  onPause: () => void,
  onMute: () => void,
  onUnmute: () => void,
  onVolumeChange: (volume: number) => void,
  onSeek: (time: number) => void,
  onFullscreen: () => void,
  onExitFullscreen: () => void,
  onSpeedChange?: (speed: number) => void,
  enabled: boolean = true
) => {
  const shortcuts: KeyboardShortcut[] = [
    // 播放/暂停
    {
      key: ' ',
      action: isPlaying ? onPause : onPlay,
      description: '播放/暂停'
    },
    {
      key: 'k',
      action: isPlaying ? onPause : onPlay,
      description: '播放/暂停 (K)'
    },

    // 音量控制
    {
      key: 'm',
      action: isMuted ? onUnmute : onMute,
      description: '静音/取消静音'
    },
    {
      key: 'ArrowUp',
      action: () => onVolumeChange(Math.min(1, volume + 0.1)),
      description: '音量增加 10%'
    },
    {
      key: 'ArrowDown',
      action: () => onVolumeChange(Math.max(0, volume - 0.1)),
      description: '音量减少 10%'
    },

    // 进度控制
    {
      key: 'ArrowLeft',
      action: () => onSeek(Math.max(0, currentTime - 10)),
      description: '后退 10 秒'
    },
    {
      key: 'ArrowRight',
      action: () => onSeek(Math.min(duration, currentTime + 10)),
      description: '前进 10 秒'
    },
    {
      key: 'j',
      action: () => onSeek(Math.max(0, currentTime - 10)),
      description: '后退 10 秒 (J)'
    },
    {
      key: 'l',
      action: () => onSeek(Math.min(duration, currentTime + 10)),
      description: '前进 10 秒 (L)'
    },

    // 大幅跳转
    {
      key: 'ArrowLeft',
      shiftKey: true,
      action: () => onSeek(Math.max(0, currentTime - 60)),
      description: '后退 1 分钟'
    },
    {
      key: 'ArrowRight',
      shiftKey: true,
      action: () => onSeek(Math.min(duration, currentTime + 60)),
      description: '前进 1 分钟'
    },

    // 全屏控制
    {
      key: 'f',
      action: isFullscreen ? onExitFullscreen : onFullscreen,
      description: '全屏/退出全屏'
    },
    {
      key: 'Escape',
      action: isFullscreen ? onExitFullscreen : () => {},
      description: '退出全屏'
    },

    // 跳转到特定位置
    {
      key: '0',
      action: () => onSeek(0),
      description: '跳转到开始'
    },
    {
      key: '1',
      action: () => onSeek(duration * 0.1),
      description: '跳转到 10%'
    },
    {
      key: '2',
      action: () => onSeek(duration * 0.2),
      description: '跳转到 20%'
    },
    {
      key: '3',
      action: () => onSeek(duration * 0.3),
      description: '跳转到 30%'
    },
    {
      key: '4',
      action: () => onSeek(duration * 0.4),
      description: '跳转到 40%'
    },
    {
      key: '5',
      action: () => onSeek(duration * 0.5),
      description: '跳转到 50%'
    },
    {
      key: '6',
      action: () => onSeek(duration * 0.6),
      description: '跳转到 60%'
    },
    {
      key: '7',
      action: () => onSeek(duration * 0.7),
      description: '跳转到 70%'
    },
    {
      key: '8',
      action: () => onSeek(duration * 0.8),
      description: '跳转到 80%'
    },
    {
      key: '9',
      action: () => onSeek(duration * 0.9),
      description: '跳转到 90%'
    },

    // 播放速度控制（如果支持）
    ...(onSpeedChange ? [
      {
        key: '<',
        shiftKey: true,
        action: () => onSpeedChange(0.5),
        description: '播放速度 0.5x'
      },
      {
        key: '>',
        shiftKey: true,
        action: () => onSpeedChange(2),
        description: '播放速度 2x'
      },
      {
        key: '=',
        action: () => onSpeedChange(1),
        description: '正常播放速度'
      }
    ] : [])
  ];

  useKeyboardShortcuts(shortcuts, { enabled });

  return {
    shortcuts
  };
};

// 快捷键帮助Hook
export const useShortcutHelp = () => {
  const getShortcutDisplay = useCallback((shortcut: KeyboardShortcut) => {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.metaKey) parts.push('Cmd');
    
    // 特殊键名映射
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Escape': 'Esc'
    };
    
    const displayKey = keyMap[shortcut.key] || shortcut.key.toUpperCase();
    parts.push(displayKey);
    
    return parts.join(' + ');
  }, []);

  const formatShortcutsForDisplay = useCallback((shortcuts: KeyboardShortcut[]) => {
    return shortcuts.map(shortcut => ({
      key: getShortcutDisplay(shortcut),
      description: shortcut.description
    }));
  }, [getShortcutDisplay]);

  return {
    getShortcutDisplay,
    formatShortcutsForDisplay
  };
}; 