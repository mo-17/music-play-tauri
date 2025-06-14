import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from 'lucide-react';

const PlayerControls: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [progress, setProgress] = useState(30);

  return (
    <div className="h-full flex items-center justify-between px-6">
      {/* Current Track Info */}
      <div className="flex items-center space-x-4 w-1/4">
        <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
          <span className="text-xs text-gray-400">♪</span>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-300">没有正在播放的音乐</p>
          <p className="text-xs text-gray-500">-</p>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex flex-col items-center w-2/4">
        {/* Control Buttons */}
        <div className="flex items-center space-x-4 mb-2">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Shuffle size={16} />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <SkipBack size={20} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <SkipForward size={20} />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Repeat size={16} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-2 w-full max-w-md">
          <span className="text-xs text-gray-400">0:00</span>
          <div className="flex-1 h-1 bg-gray-600 rounded-full">
            <div 
              className="h-1 bg-white rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">3:45</span>
        </div>
      </div>

      {/* Volume and Additional Controls */}
      <div className="flex items-center space-x-4 w-1/4 justify-end">
        <div className="flex items-center space-x-2">
          <Volume2 size={16} className="text-gray-400" />
          <div className="w-20 h-1 bg-gray-600 rounded-full">
            <div 
              className="h-1 bg-white rounded-full"
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;