import React, { useState, useEffect } from 'react';
import { Plus, List, Edit2, Trash2, Music, Play, X, ChevronDown, ChevronUp } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useTheme } from '../contexts/ThemeContext';

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

interface PlaylistViewProps {
  onTrackSelect?: (track: Track) => void;
  onPlaylistUpdate?: (tracks: Track[]) => void;
  currentTrack?: Track;
  isPlaying?: boolean;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({
  onTrackSelect,
  onPlaylistUpdate,
  currentTrack,
  isPlaying
}) => {
  const { actualTheme } = useTheme();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set());

  // 切换播放列表展开状态
  const togglePlaylistExpanded = (playlistId: string) => {
    const newExpanded = new Set(expandedPlaylists);
    if (newExpanded.has(playlistId)) {
      newExpanded.delete(playlistId);
    } else {
      newExpanded.add(playlistId);
    }
    setExpandedPlaylists(newExpanded);
  };

  // 加载播放列表
  const loadPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<Playlist[]>('get_playlists');
      setPlaylists(result);
    } catch (err) {
      console.error('Failed to load playlists:', err);
      setError('加载播放列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建播放列表
  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      setLoading(true);
      await invoke('create_playlist', {
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim() || undefined
      });
      
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowCreateModal(false);
      await loadPlaylists();
    } catch (err) {
      console.error('Failed to create playlist:', err);
      setError('创建播放列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除播放列表
  const deletePlaylist = async (id: string) => {
    if (!confirm('确定要删除这个播放列表吗？')) return;

    try {
      setLoading(true);
      await invoke('delete_playlist', { id });
      await loadPlaylists();
    } catch (err) {
      console.error('Failed to delete playlist:', err);
      setError('删除播放列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新播放列表信息
  const updatePlaylist = async () => {
    if (!selectedPlaylist || !newPlaylistName.trim()) return;

    try {
      setLoading(true);
      await invoke('update_playlist_info', {
        id: selectedPlaylist.id,
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim() || undefined
      });
      
      setShowEditModal(false);
      setSelectedPlaylist(null);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      await loadPlaylists();
    } catch (err) {
      console.error('Failed to update playlist:', err);
      setError('更新播放列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 播放曲目
  const playTrack = async (track: Track, playlistTracks: Track[]) => {
    console.log('PlaylistView: Playing track:', track.title);
    try {
      // 先选择曲目
      onTrackSelect?.(track);
      // 更新播放列表状态
      onPlaylistUpdate?.(playlistTracks);
      // 然后自动播放
      await invoke('play_audio', { filePath: track.file_path });
      console.log('PlaylistView: Track started playing');
    } catch (err) {
      console.error('Failed to play track:', err);
      setError('播放失败');
    }
  };

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 打开编辑模态框
  const openEditModal = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setNewPlaylistName(playlist.name);
    setNewPlaylistDescription(playlist.description);
    setShowEditModal(true);
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 pb-24 min-h-full">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-bold transition-colors ${
              actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>播放列表</h1>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>新建播放列表</span>
            </button>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* 加载状态 */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className={`transition-colors ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>加载中...</div>
            </div>
          )}

          {/* 播放列表列表 */}
          {!loading && playlists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist) => (
                <div key={playlist.id} className={`rounded-lg p-6 transition-colors ${
                  actualTheme === 'dark' 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}>
                  {/* 播放列表头部 */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className={`text-xl font-semibold mb-1 transition-colors ${
                        actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{playlist.name}</h3>
                      {playlist.description && (
                        <p className={`text-sm mb-2 transition-colors ${
                          actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>{playlist.description}</p>
                      )}
                      <p className={`text-xs transition-colors ${
                        actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {playlist.tracks.length} 首歌曲 • 创建于 {formatDate(playlist.created_at)}
                      </p>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(playlist)}
                        className={`p-2 rounded-lg transition-colors ${
                          actualTheme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deletePlaylist(playlist.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          actualTheme === 'dark'
                            ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600'
                            : 'text-gray-500 hover:text-red-500 hover:bg-gray-100'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 曲目列表 */}
                  {playlist.tracks.length > 0 ? (
                    <div className="space-y-2">
                      {/* 显示的曲目 */}
                      {(expandedPlaylists.has(playlist.id) ? playlist.tracks : playlist.tracks.slice(0, 3)).map((track, index) => {
                        const isCurrentTrack = currentTrack?.file_path === track.file_path;
                        const isCurrentlyPlaying = isCurrentTrack && isPlaying;
                        
                        return (
                          <div 
                            key={index}
                            className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer ${
                              actualTheme === 'dark'
                                ? `hover:bg-gray-600 ${isCurrentTrack ? 'bg-gray-600/50' : ''}`
                                : `hover:bg-gray-100 ${isCurrentTrack ? 'bg-blue-50' : ''}`
                            }`}
                            onClick={() => playTrack(track, playlist.tracks)}
                          >
                            <button className={`p-1 transition-colors ${
                              actualTheme === 'dark'
                                ? 'text-gray-400 hover:text-white'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}>
                              {isCurrentlyPlaying ? (
                                <div className="w-4 h-4 flex items-center justify-center">
                                  <div className="w-1 h-3 bg-blue-400 animate-pulse mr-0.5"></div>
                                  <div className="w-1 h-2 bg-blue-400 animate-pulse mr-0.5"></div>
                                  <div className="w-1 h-4 bg-blue-400 animate-pulse"></div>
                                </div>
                              ) : (
                                <Play size={16} />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${
                                isCurrentTrack 
                                  ? 'text-blue-400' 
                                  : actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {track.title}
                              </div>
                              <div className={`text-xs truncate transition-colors ${
                                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {track.artist}
                              </div>
                            </div>
                            <div className={`text-xs transition-colors ${
                              actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              {formatDuration(track.duration)}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* 展开/收起按钮 */}
                      {playlist.tracks.length > 3 && (
                        <button
                          onClick={() => togglePlaylistExpanded(playlist.id)}
                          className={`w-full text-center text-sm py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                            actualTheme === 'dark'
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                        >
                          {expandedPlaylists.has(playlist.id) ? (
                            <>
                              <span>收起</span>
                              <ChevronUp size={16} />
                            </>
                          ) : (
                            <>
                              <span>还有 {playlist.tracks.length - 3} 首歌曲</span>
                              <ChevronDown size={16} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={`text-center py-4 transition-colors ${
                      actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      <Music size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无歌曲</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : !loading && (
            /* 空状态 */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <List size={64} className={`mx-auto mb-4 transition-colors ${
                  actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <h2 className={`text-xl font-semibold mb-2 transition-colors ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>还没有播放列表</h2>
                <p className={`mb-6 transition-colors ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>创建您的第一个播放列表来组织您的音乐</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  创建播放列表
                </button>
              </div>
            </div>
          )}

          {/* 创建播放列表模态框 */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`rounded-lg p-6 w-full max-w-md mx-4 transition-colors ${
                actualTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold transition-colors ${
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>创建播放列表</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={`transition-colors ${
                      actualTheme === 'dark' 
                        ? 'text-gray-400 hover:text-white' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      播放列表名称 *
                    </label>
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 transition-colors ${
                        actualTheme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="输入播放列表名称"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      描述（可选）
                    </label>
                    <textarea
                      value={newPlaylistDescription}
                      onChange={(e) => setNewPlaylistDescription(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 resize-none transition-colors ${
                        actualTheme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="输入播放列表描述"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={`px-4 py-2 transition-colors ${
                      actualTheme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    取消
                  </button>
                  <button
                    onClick={createPlaylist}
                    disabled={!newPlaylistName.trim() || loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    创建
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 编辑播放列表模态框 */}
          {showEditModal && selectedPlaylist && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`rounded-lg p-6 w-full max-w-md mx-4 transition-colors ${
                actualTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold transition-colors ${
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>编辑播放列表</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className={`transition-colors ${
                      actualTheme === 'dark' 
                        ? 'text-gray-400 hover:text-white' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      播放列表名称 *
                    </label>
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 transition-colors ${
                        actualTheme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="输入播放列表名称"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      描述（可选）
                    </label>
                    <textarea
                      value={newPlaylistDescription}
                      onChange={(e) => setNewPlaylistDescription(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 resize-none transition-colors ${
                        actualTheme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="输入播放列表描述"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className={`px-4 py-2 transition-colors ${
                      actualTheme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    取消
                  </button>
                  <button
                    onClick={updatePlaylist}
                    disabled={!newPlaylistName.trim() || loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistView;