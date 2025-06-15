import React, { useState, useMemo } from 'react';
import { 
  History, 
  Calendar, 
  Play, 
  Trash2, 
  Search, 
  Video,
  BarChart3,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlaylist } from '../contexts/VideoPlaylistContext';
import { 
  PlaybackHistoryItem, 
  VideoFile
} from '../types/video';

interface PlaybackHistoryProps {
  onVideoSelect?: (video: VideoFile) => void;
  className?: string;
}

const PlaybackHistory: React.FC<PlaybackHistoryProps> = ({
  onVideoSelect,
  className = ''
}) => {
  const { getPlaybackHistory } = useVideoPlaylist();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'frequency' | 'duration'>('recent');
  const [showStats, setShowStats] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // 获取播放历史
  const historyItems = getPlaybackHistory();

  // 过滤和排序历史记录
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = historyItems;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.video_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.playlist_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 时间段过滤
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (filterPeriod) {
      case 'today':
        filtered = filtered.filter(item => new Date(item.played_at) >= today);
        break;
      case 'week':
        filtered = filtered.filter(item => new Date(item.played_at) >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(item => new Date(item.played_at) >= monthAgo);
        break;
    }

    // 日期过滤
    if (selectedDate) {
      const selectedDay = new Date(selectedDate);
      const nextDay = new Date(selectedDay.getTime() + 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.played_at);
        return itemDate >= selectedDay && itemDate < nextDay;
      });
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.played_at).getTime() - new Date(a.played_at).getTime();
        case 'frequency':
          // 这里需要计算播放频率，暂时按播放时间排序
          return new Date(b.played_at).getTime() - new Date(a.played_at).getTime();
        case 'duration':
          return b.duration_played - a.duration_played;
        default:
          return 0;
      }
    });

    return filtered;
  }, [historyItems, searchTerm, filterPeriod, sortBy, selectedDate]);

  // 计算统计数据
  const stats = useMemo(() => {
    const totalPlayTime = historyItems.reduce((total, item) => total + item.duration_played, 0);
    const uniqueVideos = new Set(historyItems.map(item => item.video_id)).size;
    const averageCompletion = historyItems.length > 0 
      ? historyItems.reduce((total, item) => total + item.completion_percentage, 0) / historyItems.length 
      : 0;

    // 最常播放的视频
    const videoPlayCounts = historyItems.reduce((counts, item) => {
      counts[item.video_id] = (counts[item.video_id] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const mostPlayedVideoId = Object.entries(videoPlayCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    const mostPlayedVideo = mostPlayedVideoId 
      ? historyItems.find(item => item.video_id === mostPlayedVideoId)
      : null;

    return {
      totalPlayTime,
      uniqueVideos,
      averageCompletion,
      totalSessions: historyItems.length,
      mostPlayedVideo
    };
  }, [historyItems]);

  // 按日期分组历史记录
  const groupedHistory = useMemo(() => {
    const groups: Record<string, PlaybackHistoryItem[]> = {};
    
    filteredAndSortedHistory.forEach(item => {
      const date = new Date(item.played_at).toLocaleDateString('zh-CN');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    return groups;
  }, [filteredAndSortedHistory]);

  // 播放视频
  const handlePlayVideo = (item: PlaybackHistoryItem) => {
    // 这里需要根据video_id找到对应的VideoFile对象
    // 暂时使用模拟数据
    const videoFile: VideoFile = {
      id: item.video_id,
      title: item.video_title,
      file_path: '', // 需要从实际数据源获取
      duration: 0, // 需要从实际数据源获取
      file_size: 0,
      format: '',
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString()
    };
    
    onVideoSelect?.(videoFile);
  };

  // 清除历史记录
  const handleClearHistory = () => {
    if (confirm('确定要清除所有播放历史吗？此操作不可撤销。')) {
      // 这里需要实现清除历史的功能
      console.log('Clear history');
    }
  };

  // 删除单个历史记录
  const handleDeleteHistoryItem = (item: PlaybackHistoryItem) => {
    if (confirm('确定要删除这条播放记录吗？')) {
      // 这里需要实现删除单个历史记录的功能
      console.log('Delete history item:', item);
    }
  };

  // 格式化播放时间
  const formatPlayTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
    return `${Math.round(seconds / 3600)}小时`;
  };

  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}小时前`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}天前`;
    } else {
      return date.toLocaleString('zh-CN');
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* 头部 */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History size={24} className="text-gray-400" />
            <h2 className="text-xl font-semibold text-white">播放历史</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="统计信息"
            >
              <BarChart3 size={16} />
            </button>
            
            <button
              onClick={handleClearHistory}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="清除历史"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* 搜索和过滤 */}
        <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-3">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索播放历史..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">全部时间</option>
              <option value="today">今天</option>
              <option value="week">最近一周</option>
              <option value="month">最近一月</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="recent">最近播放</option>
              <option value="frequency">播放频率</option>
              <option value="duration">播放时长</option>
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-700 p-6 overflow-hidden"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">
                  {formatPlayTime(stats.totalPlayTime)}
                </div>
                <div className="text-sm text-gray-400">总播放时长</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{stats.uniqueVideos}</div>
                <div className="text-sm text-gray-400">不同视频</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{stats.totalSessions}</div>
                <div className="text-sm text-gray-400">播放次数</div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">
                  {Math.round(stats.averageCompletion)}%
                </div>
                <div className="text-sm text-gray-400">平均完成度</div>
              </div>
            </div>

            {stats.mostPlayedVideo && (
              <div className="mt-4 bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">最常播放</div>
                <div className="flex items-center space-x-3">
                  <Video size={16} className="text-gray-400" />
                  <span className="text-white font-medium">{stats.mostPlayedVideo.video_title}</span>
                  <span className="text-gray-400 text-sm">
                    来自 {stats.mostPlayedVideo.playlist_name}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 历史记录列表 */}
      <div className="p-6">
        {Object.keys(groupedHistory).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar size={16} className="text-gray-400" />
                  <h3 className="text-lg font-medium text-white">{date}</h3>
                  <span className="text-sm text-gray-400">({items.length} 次播放)</span>
                </div>
                
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <motion.div
                      key={`${item.video_id}-${item.played_at}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      {/* 播放按钮 */}
                      <button
                        onClick={() => handlePlayVideo(item)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <Play size={16} />
                      </button>

                      {/* 视频信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">
                          {item.video_title}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span>来自 {item.playlist_name}</span>
                          <span>•</span>
                          <span>播放了 {formatPlayTime(item.duration_played)}</span>
                          <span>•</span>
                          <span>{Math.round(item.completion_percentage)}% 完成</span>
                        </div>
                      </div>

                      {/* 播放时间 */}
                      <div className="text-sm text-gray-400">
                        {formatDateTime(item.played_at)}
                      </div>

                      {/* 删除按钮 */}
                      <button
                        onClick={() => handleDeleteHistoryItem(item)}
                        className="p-2 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <History size={64} className="mx-auto mb-4 text-gray-500 opacity-50" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {searchTerm || filterPeriod !== 'all' || selectedDate ? '没有找到播放记录' : '还没有播放历史'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterPeriod !== 'all' || selectedDate 
                ? '尝试调整搜索条件或时间范围' 
                : '开始播放视频后，这里会显示您的播放历史'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaybackHistory; 