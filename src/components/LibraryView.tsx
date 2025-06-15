import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import FileBrowser from './FileBrowser';
import { Play, Pause, Music, Plus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { TrackCard } from './TrackCard';
import { AnimatedList, AnimatedListItem } from './AnimatedComponents';

interface Track {
  title: string;
  artist: string;
  album: string;
  duration: number;
  file_path: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  created_at: string;
  updated_at: string;
}

interface LibraryViewProps {
  onTrackSelect?: (track: Track) => void;
  currentTrack?: Track;
  isPlaying?: boolean;
  onPlayResume?: () => void;
  onPause?: () => void;
  onPlaylistUpdate?: (tracks: Track[]) => void;
}

interface MusicLibrary {
  tracks: Track[];
  last_scanned_paths: string[];
  last_updated: string;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onTrackSelect,
  currentTrack,
  isPlaying,
  onPlayResume,
  onPause,
  onPlaylistUpdate
}) => {
  const { actualTheme } = useTheme();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'album'>('title');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  // 组件加载时自动加载保存的音乐库
  useEffect(() => {
    const loadSavedLibrary = async () => {
      try {
        setLoading(true);
        const savedLibrary = await invoke<MusicLibrary>('get_saved_library');
        if (savedLibrary && savedLibrary.tracks && savedLibrary.tracks.length > 0) {
          console.log('加载保存的音乐库:', savedLibrary.tracks.length, '首歌曲');
          setTracks(savedLibrary.tracks);
          onPlaylistUpdate?.(savedLibrary.tracks);
        }
      } catch (err) {
        console.error('加载保存的音乐库失败:', err);
        // 不显示错误，因为可能是第一次使用
      } finally {
        setLoading(false);
      }
    };

    loadSavedLibrary();
  }, []);

  // 处理文件夹扫描完成
  const handleScanComplete = (scannedTracks: any) => {
    console.log('LibraryView: Scan completed with', scannedTracks.length, 'tracks');
    // 确保数据格式正确
    const tracks = Array.isArray(scannedTracks) ? scannedTracks.filter(track => 
      track && typeof track === 'object' && track.file_path
    ) : [];
    setTracks(tracks);
    onPlaylistUpdate?.(tracks);
  };

  // 清除音乐库
  const clearLibrary = async () => {
    try {
      setLoading(true);
      await invoke('clear_library');
      setTracks([]);
      console.log('音乐库已清除');
    } catch (err) {
      console.error('清除音乐库失败:', err);
      setError('清除音乐库失败');
    } finally {
      setLoading(false);
    }
  };

  // 播放指定曲目
  const playTrack = async (track: Track) => {
    try {
      console.log('LibraryView: Playing track:', track.title);
      
      const isCurrentTrack = currentTrack?.file_path === track.file_path;
      
      if (isCurrentTrack) {
        // 如果是当前曲目，通知PlaybackControls恢复播放
        console.log('LibraryView: Resuming current track via callback');
        onPlayResume?.();
      } else {
        // 如果是新曲目，选择曲目让PlaybackControls处理
        console.log('LibraryView: Selecting new track');
        onTrackSelect?.(track);
      }
      
      console.log('LibraryView: Play action completed');
    } catch (error) {
      console.error('Failed to play track:', error);
      setError('播放失败');
    }
  };

  // 暂停播放
  const pauseTrack = async () => {
    try {
      console.log('LibraryView: Pausing track via callback');
      onPause?.();
      console.log('LibraryView: Pause callback sent');
    } catch (error) {
      console.error('Failed to pause track:', error);
    }
  };

  // 加载播放列表
  const loadPlaylists = async () => {
    try {
      const result = await invoke<Playlist[]>('get_playlists');
      setPlaylists(result);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    }
  };

  // 添加歌曲到播放列表
  const addToPlaylist = async (playlistId: string, track: Track) => {
    try {
      await invoke('add_track_to_playlist', {
        playlistId,
        track: {
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: track.duration,
          file_path: track.file_path
        }
      });
      setShowPlaylistModal(false);
      setSelectedTrack(null);
      // 可以显示成功消息
    } catch (err) {
      console.error('Failed to add track to playlist:', err);
      setError('添加到播放列表失败');
    }
  };

  // 打开添加到播放列表的模态框
  const openAddToPlaylistModal = async (track: Track) => {
    setSelectedTrack(track);
    await loadPlaylists();
    setShowPlaylistModal(true);
  };

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 过滤和排序曲目
  const filteredAndSortedTracks = tracks
    .filter(track => 
      track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.album.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'album':
          return a.album.localeCompare(b.album);
        default:
          return 0;
      }
    });

  return (
    <div className="flex-1 p-6 pb-24"> {/* 底部留出播放控制栏空间 */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-3xl font-bold transition-colors ${
            actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            音乐库
          </h1>
          {tracks.length > 0 && (
            <button
              onClick={clearLibrary}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? '清除中...' : '清除音乐库'}
            </button>
          )}
        </div>
        
        {/* 文件浏览器 */}
        <div className="mb-6">
          <FileBrowser onScanComplete={handleScanComplete} />
        </div>

        {/* 搜索和排序控件 */}
        {tracks.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索歌曲、艺术家或专辑..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:border-blue-500 ${
                  actualTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'title' | 'artist' | 'album')}
                className={`px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:border-blue-500 ${
                  actualTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="title">按标题排序</option>
                <option value="artist">按艺术家排序</option>
                <option value="album">按专辑排序</option>
              </select>
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* 曲目列表 */}
        {tracks.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className={`hidden md:block rounded-lg overflow-hidden transition-colors ${
              actualTheme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className={`transition-colors ${
                  actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      #
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      标题
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      艺术家
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      专辑
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      时长
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className={`transition-colors ${
                  actualTheme === 'dark' ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'
                }`}>
                  {filteredAndSortedTracks.map((track, index) => {
                    const isCurrentTrack = currentTrack?.file_path === track.file_path;
                                          const isCurrentlyPlaying = isCurrentTrack && isPlaying;
                      
                      // 调试日志
                      if (isCurrentTrack) {
                        console.log('LibraryView: Current track:', track.title, 'isPlaying:', isPlaying, 'isCurrentlyPlaying:', isCurrentlyPlaying);
                      }
                    
                    return (
                      <tr 
                        key={track.file_path}
                        className={`transition-colors ${
                          actualTheme === 'dark'
                            ? `hover:bg-gray-700 ${isCurrentTrack ? 'bg-gray-700/50' : ''}`
                            : `hover:bg-gray-50 ${isCurrentTrack ? 'bg-blue-50' : ''}`
                        }`}
                      >
                        <td className={`px-4 py-3 text-sm transition-colors ${
                          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                              actualTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                            }`}>
                              <Music size={16} className={`transition-colors ${
                                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                            </div>
                            <div>
                              <div className={`text-sm font-medium transition-colors ${
                                isCurrentTrack 
                                  ? 'text-blue-500' 
                                  : actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {track.title}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-sm transition-colors ${
                          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {track.artist}
                        </td>
                        <td className={`px-4 py-3 text-sm transition-colors ${
                          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {track.album}
                        </td>
                        <td className={`px-4 py-3 text-sm transition-colors ${
                          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {formatDuration(track.duration)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                if (isCurrentlyPlaying) {
                                  pauseTrack();
                                } else {
                                  playTrack(track);
                                }
                              }}
                              className={`transition-colors ${
                                actualTheme === 'dark'
                                  ? 'text-gray-400 hover:text-white'
                                  : 'text-gray-500 hover:text-gray-900'
                              }`}
                            >
                              {isCurrentlyPlaying ? (
                                <Pause size={16} />
                              ) : (
                                <Play size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => openAddToPlaylistModal(track)}
                              className={`transition-colors ${
                                actualTheme === 'dark'
                                  ? 'text-gray-400 hover:text-green-400'
                                  : 'text-gray-500 hover:text-green-600'
                              }`}
                              title="添加到播放列表"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
              {/* 统计信息 */}
              <div className={`px-4 py-3 text-sm transition-colors ${
                actualTheme === 'dark' 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-gray-50 text-gray-600'
              }`}>
                显示 {filteredAndSortedTracks.length} 首歌曲，共 {tracks.length} 首
              </div>
            </div>

            {/* Mobile Card View */}
            <AnimatedList className="md:hidden space-y-3">
              {filteredAndSortedTracks.map((track, index) => {
                const isCurrentTrack = currentTrack?.file_path === track.file_path;
                const isCurrentlyPlaying = isCurrentTrack && isPlaying;
                
                return (
                  <AnimatedListItem key={track.file_path}>
                    <TrackCard
                      track={track}
                      index={index}
                      isCurrentTrack={isCurrentTrack}
                      isPlaying={isPlaying || false}
                      onPlay={() => playTrack(track)}
                      onPause={pauseTrack}
                      onAddToPlaylist={() => openAddToPlaylistModal(track)}
                      formatDuration={formatDuration}
                    />
                  </AnimatedListItem>
                );
              })}
              
              {/* Mobile Statistics */}
              <div className={`p-4 rounded-lg text-center text-sm transition-colors ${
                actualTheme === 'dark' 
                  ? 'bg-gray-800 text-gray-300' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                显示 {filteredAndSortedTracks.length} 首歌曲，共 {tracks.length} 首
              </div>
            </AnimatedList>
          </>
        ) : (
          <div className="text-center py-12">
            <Music size={48} className={`mx-auto mb-4 transition-colors ${
              actualTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-lg mb-2 transition-colors ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              还没有音乐文件
            </p>
            <p className={`transition-colors ${
              actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              请使用上面的文件浏览器选择包含音乐文件的文件夹
            </p>
          </div>
        )}

        {/* 添加到播放列表模态框 */}
        {showPlaylistModal && selectedTrack && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">添加到播放列表</h3>
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-2">选择播放列表：</p>
                <p className="text-sm text-gray-400">
                  <span className="font-medium">{selectedTrack.title}</span> - {selectedTrack.artist}
                </p>
              </div>
              
              {playlists.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => addToPlaylist(playlist.id, selectedTrack)}
                      className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-white">{playlist.name}</div>
                      {playlist.description && (
                        <div className="text-sm text-gray-400">{playlist.description}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {playlist.tracks.length} 首歌曲
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">还没有播放列表</p>
                  <button
                    onClick={() => {
                      setShowPlaylistModal(false);
                      // 这里可以导航到播放列表页面
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    创建第一个播放列表
                  </button>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};