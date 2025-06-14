import React from 'react';
import { Play, Pause, Music, Plus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { HoverScale, TapRipple } from './AnimatedComponents';
import { CompactPlayButton } from './AnimatedPlayButton';

interface Track {
  title: string;
  artist: string;
  album: string;
  duration: number;
  file_path: string;
}

interface TrackCardProps {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onAddToPlaylist: () => void;
  formatDuration: (seconds: number) => string;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  index,
  isCurrentTrack,
  isPlaying,
  onPlay,
  onPause,
  onAddToPlaylist,
  formatDuration
}) => {
  const { actualTheme } = useTheme();
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  return (
    <HoverScale scale={1.02} className="w-full">
      <div className={`p-4 rounded-lg border transition-all duration-200 ${
        isCurrentTrack
          ? actualTheme === 'dark'
            ? 'bg-gray-700/50 border-blue-500/50'
            : 'bg-blue-50 border-blue-200'
          : actualTheme === 'dark'
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
            : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}>
      <div className="flex items-center space-x-4">
        {/* Track Number & Album Art */}
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
            actualTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
          }`}>
            <Music size={20} className={`transition-colors ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm truncate transition-colors ${
            isCurrentTrack 
              ? 'text-blue-500' 
              : actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {track.title}
          </div>
          <div className={`text-sm truncate transition-colors ${
            actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {track.artist}
          </div>
          <div className={`text-xs truncate transition-colors ${
            actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {track.album} • {formatDuration(track.duration)}
          </div>
        </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <CompactPlayButton
              isPlaying={isCurrentlyPlaying}
              onClick={isCurrentlyPlaying ? onPause : onPlay}
            />
            <TapRipple>
              <button
                onClick={onAddToPlaylist}
                className={`p-2 rounded-full transition-colors ${
                  actualTheme === 'dark'
                    ? 'text-gray-400 hover:text-green-400 hover:bg-gray-600'
                    : 'text-gray-500 hover:text-green-600 hover:bg-gray-100'
                }`}
                title="添加到播放列表"
              >
                <Plus size={18} />
              </button>
            </TapRipple>
          </div>
        </div>
      </div>
    </HoverScale>
  );
}; 