import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, Music, Loader2, AlertCircle } from 'lucide-react';
import { LoadingSpinner, FadeIn } from './AnimatedComponents';
import { useTheme } from '../contexts/ThemeContext';

interface Track {
  path: string;
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  duration: number;
}

interface LibraryTrack {
  title: string;
  artist: string;
  album: string;
  duration: number;
  file_path: string;
}

interface FileBrowserProps {
  onScanComplete?: (tracks: LibraryTrack[]) => void;
}

const FileBrowser: React.FC<FileBrowserProps> = ({ onScanComplete }) => {
  const { actualTheme } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedFiles, setScannedFiles] = useState<string[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const selectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择音乐文件夹',
      });

      if (selected) {
        setSelectedFolder(selected as string);
        setError(null);
      }
    } catch (err) {
      setError('选择文件夹时出错：' + String(err));
    }
  };

  const scanFiles = async () => {
    if (!selectedFolder) {
      setError('请先选择一个文件夹');
      return;
    }

    setIsScanning(true);
    setError(null);
    setWarnings([]);
    setScannedFiles([]);
    setTracks([]);
    setScanProgress({ current: 0, total: 0 });

    try {
      // 调用 Tauri 后端的 scan_music_files 命令
      const files: string[] = await invoke('scan_music_files', {
        path: selectedFolder,
      });

      setScannedFiles(files);
      setScanProgress({ current: 0, total: files.length });

      if (files.length > 0) {
        // 获取文件的元数据
        try {
          const tracksData: Track[] = await invoke('get_metadata_for_files', {
            files: files,
          });

          setTracks(tracksData);
          
          // 检查是否有文件处理失败（duration为0可能表示处理失败）
          const failedFiles = tracksData.filter(track => 
            track.duration === 0 && 
            track.artist === 'Unknown Artist'
          );
          
          if (failedFiles.length > 0) {
            setWarnings(failedFiles.map(track => 
              `文件 ${track.path.split('/').pop()} 可能已损坏或格式不支持`
            ));
          }

          // 调用回调函数，传递扫描到的曲目
          const libraryTracks = tracksData.map(track => ({
            title: track.title || track.path.split('/').pop() || 'Unknown',
            artist: track.artist || 'Unknown Artist',
            album: track.album || 'Unknown Album',
            duration: track.duration,
            file_path: track.path
          }));
          
          onScanComplete?.(libraryTracks);
          
          // 保存音乐库数据到后端
          try {
            await invoke('save_library', {
              tracks: libraryTracks,
              scannedPaths: [selectedFolder]
            });
            console.log('音乐库数据已保存');
          } catch (saveError) {
            console.error('保存音乐库数据失败:', saveError);
            // 不显示错误给用户，因为扫描本身是成功的
          }
        } catch (metadataError) {
          // 如果元数据提取完全失败，仍然显示文件列表
          setError('部分文件元数据提取失败：' + String(metadataError));
          // 创建基本的track列表
          const basicTracks = files.map(file => ({
            path: file,
            title: file.split('/').pop() || 'Unknown',
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            genre: 'Unknown',
            year: undefined,
            duration: 0
          }));
          setTracks(basicTracks);
        }
      }
    } catch (err) {
      setError('扫描文件时出错：' + String(err));
    } finally {
      setIsScanning(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6">
      <h2 className={`text-2xl font-bold mb-6 ${
        actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>文件浏览器</h2>

      {/* 文件夹选择区域 */}
      <div className={`rounded-lg p-6 mb-6 ${
        actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={selectFolder}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
          >
            <FolderOpen size={20} />
            <span>选择文件夹</span>
          </button>
          
          {selectedFolder && (
            <button
              onClick={scanFiles}
              disabled={isScanning}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
            >
              {isScanning ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Music size={20} />
              )}
              <span>{isScanning ? '扫描中...' : '扫描音乐文件'}</span>
            </button>
          )}
        </div>

        {selectedFolder && (
          <div className={`text-sm ${
            actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <strong>选中的文件夹：</strong> {selectedFolder}
          </div>
        )}
      </div>

      {/* 扫描进度显示 */}
      {isScanning && (
        <FadeIn>
          <div className={`rounded-lg p-6 mb-6 ${
            actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className="flex items-center justify-center space-x-4">
              <LoadingSpinner size={48} />
              <div className="text-center">
                <div className={`text-lg font-medium ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  正在扫描音乐文件...
                </div>
                {scanProgress.total > 0 && (
                  <div className={`text-sm mt-2 ${
                    actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    已发现 {scannedFiles.length} 个音乐文件
                  </div>
                )}
                <div className={`w-64 h-2 rounded-full mt-3 ${
                  actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                }`}>
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ 
                      width: scanProgress.total > 0 
                        ? `${(scannedFiles.length / scanProgress.total) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6 flex items-center space-x-2">
          <AlertCircle size={20} className="text-red-400" />
          <span className="text-red-200">{error}</span>
        </div>
      )}

      {/* 警告信息 */}
      {warnings.length > 0 && (
        <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle size={20} className="text-yellow-400" />
            <span className="text-yellow-200 font-medium">警告：部分文件处理失败</span>
          </div>
          <ul className="text-yellow-200 text-sm space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 扫描结果 */}
      {scannedFiles.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            扫描结果：找到 {scannedFiles.length} 个音频文件
          </h3>

          {tracks.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tracks.map((track, index) => (
                <div
                  key={index}
                  className="bg-gray-700 rounded p-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {track.title || track.path.split('/').pop() || '未知标题'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {track.artist || '未知艺术家'} - {track.album || '未知专辑'}
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatDuration(track.duration)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Loader2 size={32} className="animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-gray-400">正在加载元数据...</p>
            </div>
          )}
        </div>
      )}

      {/* 空状态 */}
      {!selectedFolder && !isScanning && scannedFiles.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen size={64} className="text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">选择音乐文件夹开始</h3>
          <p className="text-gray-400">点击"选择文件夹"按钮来浏览您的音乐收藏</p>
        </div>
      )}
    </div>
  );
};

export default FileBrowser;