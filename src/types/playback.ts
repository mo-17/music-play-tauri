// 播放模式枚举
export enum PlaybackMode {
  SEQUENCE = 'sequence',      // 顺序播放
  LOOP_LIST = 'loop_list',    // 列表循环
  LOOP_SINGLE = 'loop_single', // 单曲循环
  SHUFFLE = 'shuffle'         // 随机播放
}

// 播放模式显示信息
export interface PlaybackModeInfo {
  mode: PlaybackMode;
  label: string;
  icon: string;
  description: string;
}

// 播放模式配置
export const PLAYBACK_MODES: PlaybackModeInfo[] = [
  {
    mode: PlaybackMode.SEQUENCE,
    label: '顺序播放',
    icon: 'list-ordered',
    description: '按顺序播放，播放完最后一首停止'
  },
  {
    mode: PlaybackMode.LOOP_LIST,
    label: '列表循环',
    icon: 'repeat',
    description: '播放完列表后重新开始'
  },
  {
    mode: PlaybackMode.LOOP_SINGLE,
    label: '单曲循环',
    icon: 'repeat-1',
    description: '重复播放当前歌曲'
  },
  {
    mode: PlaybackMode.SHUFFLE,
    label: '随机播放',
    icon: 'shuffle',
    description: '随机顺序播放列表中的歌曲'
  }
];

// 获取下一个播放模式
export const getNextPlaybackMode = (currentMode: PlaybackMode): PlaybackMode => {
  const modes = Object.values(PlaybackMode);
  const currentIndex = modes.indexOf(currentMode);
  return modes[(currentIndex + 1) % modes.length];
};

// 获取播放模式信息
export const getPlaybackModeInfo = (mode: PlaybackMode): PlaybackModeInfo => {
  return PLAYBACK_MODES.find(m => m.mode === mode) || PLAYBACK_MODES[0];
}; 