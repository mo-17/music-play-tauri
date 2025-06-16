import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Play, Image, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface ThumbnailTestProps {
  onClose: () => void;
}

const ThumbnailTest: React.FC<ThumbnailTestProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const selectVideoFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: '视频文件',
          extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v']
        }]
      });

      if (selected && typeof selected === 'string') {
        setSelectedFile(selected);
        setResult('');
        setError('');
      }
    } catch (err) {
      setError('选择文件失败: ' + String(err));
    }
  };

  const testThumbnailGeneration = async () => {
    if (!selectedFile) {
      setError('请先选择一个视频文件');
      return;
    }

    setIsGenerating(true);
    setResult('');
    setError('');

    try {
      const result = await invoke<string>('test_thumbnail_generation', {
        filePath: selectedFile
      });
      setResult(result);
    } catch (err) {
      setError('缩略图生成失败: ' + String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCustomThumbnail = async () => {
    if (!selectedFile) {
      setError('请先选择一个视频文件');
      return;
    }

    setIsGenerating(true);
    setResult('');
    setError('');

    try {
      await invoke('generate_video_thumbnail', {
        filePath: selectedFile,
        outputPath: 'custom_thumbnail.jpg',
        width: 320,
        height: 180,
        timestamp: 0.2 // 20%位置
      });
      setResult('自定义缩略图生成成功: custom_thumbnail.jpg');
    } catch (err) {
      setError('自定义缩略图生成失败: ' + String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Image className="mr-2" size={24} />
            缩略图生成测试
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* 文件选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              选择视频文件
            </label>
            <div className="flex space-x-3">
              <button
                onClick={selectVideoFile}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
              >
                <Play className="mr-2" size={16} />
                选择视频文件
              </button>
            </div>
            {selectedFile && (
              <div className="mt-2 p-3 bg-gray-700 rounded text-sm text-gray-300">
                已选择: {selectedFile}
              </div>
            )}
          </div>

          {/* 测试按钮 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={testThumbnailGeneration}
              disabled={!selectedFile || isGenerating}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center justify-center"
            >
              {isGenerating ? (
                <Loader className="mr-2 animate-spin" size={16} />
              ) : (
                <Image className="mr-2" size={16} />
              )}
              测试缩略图生成
            </button>

            <button
              onClick={generateCustomThumbnail}
              disabled={!selectedFile || isGenerating}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center justify-center"
            >
              {isGenerating ? (
                <Loader className="mr-2 animate-spin" size={16} />
              ) : (
                <Image className="mr-2" size={16} />
              )}
              生成自定义缩略图
            </button>
          </div>

          {/* 结果显示 */}
          {result && (
            <div className="p-4 bg-green-900/50 border border-green-500 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="text-green-400 mr-3 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <h4 className="text-green-400 font-medium mb-1">成功</h4>
                  <p className="text-green-300 text-sm">{result}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="text-red-400 mr-3 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <h4 className="text-red-400 font-medium mb-1">错误</h4>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 说明信息 */}
          <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">测试说明</h4>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>• 测试缩略图生成：使用新的异步生成器，包含错误处理和降级机制</li>
              <li>• 生成自定义缩略图：在视频20%位置生成320x180分辨率的缩略图</li>
              <li>• 如果FFmpeg失败，系统会自动生成降级缩略图</li>
              <li>• 生成的缩略图保存在应用根目录</li>
            </ul>
          </div>

          {/* 技术信息 */}
          <div className="p-4 bg-gray-700/50 rounded-lg">
            <h4 className="text-gray-300 font-medium mb-2">技术特性</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
              <div>
                <strong className="text-gray-300">安全特性:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Panic捕获防止崩溃</li>
                  <li>• 内存边界检查</li>
                  <li>• 超时保护(30秒)</li>
                  <li>• 自动重试机制(3次)</li>
                </ul>
              </div>
              <div>
                <strong className="text-gray-300">性能优化:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• 异步处理不阻塞UI</li>
                  <li>• 独立线程运行FFmpeg</li>
                  <li>• 智能降级处理</li>
                  <li>• 批量生成支持</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailTest; 