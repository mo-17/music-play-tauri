import React, { useRef, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';

export const AudioTest: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [testFilePath, setTestFilePath] = useState('');
  const [audioSrc, setAudioSrc] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAudio = async () => {
    if (!testFilePath) {
      addLog('请先输入文件路径');
      return;
    }

    try {
      const convertedSrc = convertFileSrc(testFilePath);
      setAudioSrc(convertedSrc);
      addLog(`原始路径: ${testFilePath}`);
      addLog(`转换后URL: ${convertedSrc}`);

      if (audioRef.current) {
        audioRef.current.src = convertedSrc;
        audioRef.current.load();

        audioRef.current.onloadedmetadata = () => {
          addLog(`音频元数据加载完成，时长: ${audioRef.current?.duration}秒`);
        };

        audioRef.current.oncanplay = () => {
          addLog('音频可以播放');
        };

        audioRef.current.onerror = (error) => {
          addLog(`音频错误: ${error}`);
        };

        audioRef.current.onplay = () => {
          addLog('音频开始播放');
        };

        audioRef.current.onpause = () => {
          addLog('音频暂停');
        };
      }
    } catch (error) {
      addLog(`错误: ${error}`);
    }
  };

  const playAudio = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        addLog('调用play()成功');
      } catch (error) {
        addLog(`播放失败: ${error}`);
      }
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      addLog('调用pause()');
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">音频播放测试</h3>
      
      <div className="mb-4">
        <input
          type="text"
          value={testFilePath}
          onChange={(e) => setTestFilePath(e.target.value)}
          placeholder="输入音频文件路径，例如: /Users/huangzhibin/Music/QQ音乐/test.mp3"
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4 space-x-2">
        <button onClick={testAudio} className="px-4 py-2 bg-blue-500 text-white rounded">
          加载音频
        </button>
        <button onClick={playAudio} className="px-4 py-2 bg-green-500 text-white rounded">
          播放
        </button>
        <button onClick={pauseAudio} className="px-4 py-2 bg-red-500 text-white rounded">
          暂停
        </button>
      </div>

      {audioSrc && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">转换后的URL:</p>
          <p className="text-xs break-all bg-gray-200 p-2 rounded">{audioSrc}</p>
        </div>
      )}

      <div className="mb-4">
        <h4 className="font-semibold mb-2">日志:</h4>
        <div className="bg-black text-green-400 p-2 rounded h-40 overflow-y-auto text-xs">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>

      <audio
        ref={audioRef}
        controls
        className="w-full"
        preload="metadata"
      />
    </div>
  );
};