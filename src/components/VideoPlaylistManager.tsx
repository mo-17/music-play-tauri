import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  List, 
  Edit2, 
  Trash2, 
  Video, 
  Play, 
  MoreVertical, 
  X, 
  ChevronDown, 
  ChevronUp,
  Heart,
  HeartOff,
  Copy,
  Shuffle,
  Repeat,
  Repeat1,
  Tag,
  Clock,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlaylist } from '../contexts/VideoPlaylistContext';
import { 
  VideoPlaylist, 
  VideoFile, 
  CreatePlaylistParams, 
  UpdatePlaylistParams,
  RepeatMode,
  formatDuration,
  getPlaylistDisplayInfo
} from '../types/video';

interface VideoPlaylistManagerProps {
  onVideoSelect?: (video: VideoFile) => void;
  onPlaylistPlay?: (playlist: VideoPlaylist, startIndex?: number) => void;
  currentVideo?: VideoFile | null;
  isPlaying?: boolean;
  availableVideos?: VideoFile[];
}

const VideoPlaylistManager: React.FC<VideoPlaylistManagerProps> = ({
  onVideoSelect,
  onPlaylistPlay,
  currentVideo,
  isPlaying,
  availableVideos = []
}) => {
  const {
    state,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    duplicatePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    reorderPlaylistItems,
    playPlaylist,
    toggleShuffle,
    setRepeatMode
  } = useVideoPlaylist();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<VideoPlaylist | null>(null);
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'duration'>('updated');
  const [filterFavorites, setFilterFavorites] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    is_public: false
  });

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

  // 过滤和排序播放列表
  const filteredAndSortedPlaylists = React.useMemo(() => {
    let filtered = state.playlists;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(playlist =>
        playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        playlist.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        playlist.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 收藏过滤
    if (filterFavorites) {
      filtered = filtered.filter(playlist => playlist.is_favorite);
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'duration':
          return b.total_duration - a.total_duration;
        default:
          return 0;
      }
    });

    return filtered;
  }, [state.playlists, searchTerm, sortBy, filterFavorites]);

  // 创建播放列表
  const handleCreatePlaylist = async () => {
    if (!formData.name.trim()) return;

    try {
      const params: CreatePlaylistParams = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        tags: formData.tags,
        is_public: formData.is_public
      };

      await createPlaylist(params);
      resetForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create playlist:', error);
    }
  };

  // 更新播放列表
  const handleUpdatePlaylist = async () => {
    if (!selectedPlaylist || !formData.name.trim()) return;

    try {
      const updates: UpdatePlaylistParams = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        tags: formData.tags,
        is_public: formData.is_public
      };

      await updatePlaylist(selectedPlaylist.id, updates);
      resetForm();
      setShowEditModal(false);
      setSelectedPlaylist(null);
    } catch (error) {
      console.error('Failed to update playlist:', error);
    }
  };

  // 删除播放列表
  const handleDeletePlaylist = async (playlist: VideoPlaylist) => {
    if (!confirm(`确定要删除播放列表"${playlist.name}"吗？`)) return;

    try {
      await deletePlaylist(playlist.id);
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    }
  };

  // 复制播放列表
  const handleDuplicatePlaylist = async (playlist: VideoPlaylist) => {
    try {
      await duplicatePlaylist(playlist.id);
    } catch (error) {
      console.error('Failed to duplicate playlist:', error);
    }
  };

  // 切换收藏状态
  const toggleFavorite = async (playlist: VideoPlaylist) => {
    try {
      await updatePlaylist(playlist.id, { is_favorite: !playlist.is_favorite });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // 播放视频
  const handlePlayVideo = async (video: VideoFile, playlist: VideoPlaylist, index: number) => {
    try {
      console.log('VideoPlaylistManager: handlePlayVideo called');
      console.log('VideoPlaylistManager: Video:', video.title);
      console.log('VideoPlaylistManager: Playlist:', playlist.name);
      console.log('VideoPlaylistManager: Index:', index);
      console.log('VideoPlaylistManager: onVideoSelect callback:', typeof onVideoSelect);
      console.log('VideoPlaylistManager: onPlaylistPlay callback:', typeof onPlaylistPlay);
      
      onVideoSelect?.(video);
      onPlaylistPlay?.(playlist, index);
      await playPlaylist(playlist, index);
      
      console.log('VideoPlaylistManager: handlePlayVideo completed successfully');
    } catch (error) {
      console.error('VideoPlaylistManager: Failed to play video:', error);
    }
  };

  // 播放整个播放列表
  const handlePlayPlaylist = async (playlist: VideoPlaylist) => {
    if (playlist.items.length === 0) return;
    
    try {
      onPlaylistPlay?.(playlist, 0);
      await playPlaylist(playlist, 0);
    } catch (error) {
      console.error('Failed to play playlist:', error);
    }
  };

  // 添加视频到播放列表
  const handleAddVideoToPlaylist = async (video: VideoFile) => {
    if (!selectedPlaylist) return;

    try {
      await addVideoToPlaylist(selectedPlaylist.id, video);
    } catch (error) {
      console.error('Failed to add video to playlist:', error);
    }
  };

  // 从播放列表移除视频
  const handleRemoveVideo = async (playlistId: string, itemId: string) => {
    try {
      await removeVideoFromPlaylist(playlistId, itemId);
    } catch (error) {
      console.error('Failed to remove video from playlist:', error);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tags: [],
      is_public: false
    });
  };

  // 打开编辑模态框
  const openEditModal = (playlist: VideoPlaylist) => {
    setSelectedPlaylist(playlist);
    setFormData({
      name: playlist.name,
      description: playlist.description || '',
      tags: playlist.tags,
      is_public: playlist.is_public
    });
    setShowEditModal(true);
  };

  // 打开添加视频模态框
  const openAddVideoModal = (playlist: VideoPlaylist) => {
    setSelectedPlaylist(playlist);
    setShowAddVideoModal(true);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 添加标签
  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  // 移除标签
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="flex-1 p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">视频播放列表</h1>
            <p className="text-gray-400">
              {state.playlists.length} 个播放列表 • 
              {state.playlists.reduce((total, p) => total + p.items.length, 0)} 个视频
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Plus size={16} />
              <span>新建播放列表</span>
            </button>
          </div>
        </div>

        {/* 搜索和过滤 */}
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索播放列表..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="updated">最近更新</option>
              <option value="created">创建时间</option>
              <option value="name">名称</option>
              <option value="duration">时长</option>
            </select>
            
            <button
              onClick={() => setFilterFavorites(!filterFavorites)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                filterFavorites 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              <Heart size={16} />
              <span>收藏</span>
            </button>
          </div>
        </div>

        {/* 播放控制状态 */}
        {state.playbackState.current_playlist_id && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">正在播放</div>
                <div className="text-white font-medium">
                  {state.playlists.find(p => p.id === state.playbackState.current_playlist_id)?.name}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleShuffle}
                  className={`p-2 rounded-lg transition-colors ${
                    state.playbackState.shuffle_enabled
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Shuffle size={16} />
                </button>
                
                <button
                  onClick={() => {
                    const modes = [RepeatMode.OFF, RepeatMode.ALL, RepeatMode.ONE];
                    const currentIndex = modes.indexOf(state.playbackState.repeat_mode);
                    const nextMode = modes[(currentIndex + 1) % modes.length];
                    setRepeatMode(nextMode);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    state.playbackState.repeat_mode !== RepeatMode.OFF
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {state.playbackState.repeat_mode === RepeatMode.ONE ? (
                    <Repeat1 size={16} />
                  ) : (
                    <Repeat size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200"
          >
            {state.error}
          </motion.div>
        )}

        {/* 加载状态 */}
        {state.isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400">加载中...</div>
          </div>
        )}

        {/* 播放列表网格 */}
        {!state.isLoading && filteredAndSortedPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredAndSortedPlaylists.map((playlist) => (
                <motion.div
                  key={playlist.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors"
                >
                  {/* 播放列表头部 */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-xl font-semibold text-white truncate">{playlist.name}</h3>
                        {playlist.is_favorite && (
                          <Heart size={16} className="text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      {playlist.description && (
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">{playlist.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                        <span>{getPlaylistDisplayInfo(playlist)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        <span>创建于 {formatDate(playlist.created_at)}</span>
                      </div>
                      
                      {/* 标签 */}
                      {playlist.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {playlist.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {playlist.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                              +{playlist.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex flex-col space-y-1 ml-2">
                      <button
                        onClick={() => toggleFavorite(playlist)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        {playlist.is_favorite ? <Heart size={16} /> : <HeartOff size={16} />}
                      </button>
                      
                      <div className="relative group">
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors">
                          <MoreVertical size={16} />
                        </button>
                        
                        {/* 下拉菜单 */}
                        <div className="absolute right-0 top-full mt-1 bg-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[120px]">
                          <button
                            onClick={() => openEditModal(playlist)}
                            className="w-full px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-600 rounded-t-lg transition-colors flex items-center space-x-2"
                          >
                            <Edit2 size={14} />
                            <span>编辑</span>
                          </button>
                          <button
                            onClick={() => handleDuplicatePlaylist(playlist)}
                            className="w-full px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-600 transition-colors flex items-center space-x-2"
                          >
                            <Copy size={14} />
                            <span>复制</span>
                          </button>
                          <button
                            onClick={() => openAddVideoModal(playlist)}
                            className="w-full px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-600 transition-colors flex items-center space-x-2"
                          >
                            <Plus size={14} />
                            <span>添加视频</span>
                          </button>
                          <button
                            onClick={() => handleDeletePlaylist(playlist)}
                            className="w-full px-3 py-2 text-left text-gray-300 hover:text-red-400 hover:bg-gray-600 rounded-b-lg transition-colors flex items-center space-x-2"
                          >
                            <Trash2 size={14} />
                            <span>删除</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 播放按钮 */}
                  {playlist.items.length > 0 && (
                    <button
                      onClick={() => handlePlayPlaylist(playlist)}
                      className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Play size={16} />
                      <span>播放全部</span>
                    </button>
                  )}

                  {/* 视频列表 */}
                  {playlist.items.length > 0 ? (
                    <div className="space-y-2">
                      {/* 显示的视频 */}
                      {(expandedPlaylists.has(playlist.id) ? playlist.items : playlist.items.slice(0, 3)).map((item, index) => {
                        const isCurrentVideo = currentVideo?.id === item.video.id;
                        const isCurrentlyPlaying = isCurrentVideo && isPlaying;
                        
                        return (
                          <div 
                            key={item.id}
                            className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer ${
                              isCurrentVideo ? 'bg-gray-600/50' : ''
                            }`}
                            onClick={() => handlePlayVideo(item.video, playlist, index)}
                          >
                            <button className="p-1 text-gray-400 hover:text-white">
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
                                isCurrentVideo ? 'text-blue-400' : 'text-white'
                              }`}>
                                {item.custom_title || item.video.title}
                              </div>
                              <div className="text-xs text-gray-400 truncate">
                                {item.video.format?.toUpperCase()} • {formatDuration(item.video.duration)}
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveVideo(playlist.id, item.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                      
                      {/* 展开/收起按钮 */}
                      {playlist.items.length > 3 && (
                        <button
                          onClick={() => togglePlaylistExpanded(playlist.id)}
                          className="w-full text-center text-gray-400 hover:text-white text-sm py-2 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          {expandedPlaylists.has(playlist.id) ? (
                            <>
                              <span>收起</span>
                              <ChevronUp size={16} />
                            </>
                          ) : (
                            <>
                              <span>还有 {playlist.items.length - 3} 个视频</span>
                              <ChevronDown size={16} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <Video size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无视频</p>
                      <button
                        onClick={() => openAddVideoModal(playlist)}
                        className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        添加视频
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : !state.isLoading && (
          /* 空状态 */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <List size={64} className="text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {searchTerm || filterFavorites ? '没有找到播放列表' : '还没有视频播放列表'}
              </h2>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterFavorites 
                  ? '尝试调整搜索条件或过滤器' 
                  : '创建您的第一个视频播放列表来组织您的视频'
                }
              </p>
              {!searchTerm && !filterFavorites && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  创建播放列表
                </button>
              )}
            </div>
          </div>
        )}

        {/* 创建播放列表模态框 */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">创建视频播放列表</h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      播放列表名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="输入播放列表名称"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      描述（可选）
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="输入播放列表描述"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      标签（可选）
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded-full flex items-center space-x-1"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-gray-400 hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="输入标签后按回车添加"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={formData.is_public}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_public" className="text-sm text-gray-300">
                      公开播放列表
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={!formData.name.trim() || state.isLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    创建
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 编辑播放列表模态框 */}
        <AnimatePresence>
          {showEditModal && selectedPlaylist && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">编辑播放列表</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedPlaylist(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      播放列表名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="输入播放列表名称"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      描述（可选）
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="输入播放列表描述"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      标签（可选）
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded-full flex items-center space-x-1"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-gray-400 hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="输入标签后按回车添加"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit_is_public"
                      checked={formData.is_public}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="edit_is_public" className="text-sm text-gray-300">
                      公开播放列表
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedPlaylist(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpdatePlaylist}
                    disabled={!formData.name.trim() || state.isLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    保存
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 添加视频模态框 */}
        <AnimatePresence>
          {showAddVideoModal && selectedPlaylist && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    添加视频到 "{selectedPlaylist.name}"
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddVideoModal(false);
                      setSelectedPlaylist(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="overflow-y-auto max-h-96">
                  {availableVideos.length > 0 ? (
                    <div className="space-y-2">
                      {availableVideos
                        .filter(video => !selectedPlaylist.items.some(item => item.video.id === video.id))
                        .map((video) => (
                          <div
                            key={video.id}
                            className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">{video.title}</div>
                              <div className="text-gray-400 text-sm">
                                {video.format?.toUpperCase()} • {formatDuration(video.duration)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddVideoToPlaylist(video)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors flex items-center space-x-1"
                            >
                              <Plus size={14} />
                              <span>添加</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Video size={48} className="mx-auto mb-4 opacity-50" />
                      <p>没有可添加的视频</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowAddVideoModal(false);
                      setSelectedPlaylist(null);
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VideoPlaylistManager; 