import React from 'react';
import { Music } from 'lucide-react';

const MainPlayback: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      {/* Album Art Placeholder */}
      <div className="w-64 h-64 bg-gray-700 rounded-lg mb-8 flex items-center justify-center">
        <Music size={80} className="text-gray-500" />
      </div>

      {/* Track Info */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">选择一首歌曲</h1>
        <p className="text-gray-400">从音乐库中选择音乐开始播放</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
          浏览音乐库
        </button>
        <button className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors">
          导入音乐文件夹
        </button>
      </div>
    </div>
  );
};

export default MainPlayback;