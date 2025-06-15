import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Calendar, 
  Video, 
  Play,
  Target,
  Award,
  Activity,
  Zap
} from 'lucide-react';
import { useVideoPlaylist } from '../contexts/VideoPlaylistContext';
import { 
  formatDuration 
} from '../types/video';

interface PlaybackStatsProps {
  className?: string;
}

interface VideoStats {
  videoId: string;
  videoTitle: string;
  playCount: number;
  totalDuration: number;
  averageCompletion: number;
  lastPlayed: string;
  playlistName?: string;
}

interface PlaylistStats {
  playlistId: string;
  playlistName: string;
  playCount: number;
  totalDuration: number;
  uniqueVideos: number;
  averageCompletion: number;
  lastPlayed: string;
}

interface DailyStats {
  date: string;
  playCount: number;
  totalDuration: number;
  uniqueVideos: number;
}

const PlaybackStats: React.FC<PlaybackStatsProps> = ({ className = '' }) => {
  const { getPlaybackHistory } = useVideoPlaylist();
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'playlists' | 'trends'>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  // const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview'])); // 为将来功能预留

  const historyItems = getPlaybackHistory();

  // 根据时间范围过滤数据
  const filteredHistory = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return historyItems;
    }

    return historyItems.filter(item => new Date(item.played_at) >= startDate);
  }, [historyItems, timeRange]);

  // 计算总体统计
  const overviewStats = useMemo(() => {
    const totalPlayTime = filteredHistory.reduce((total, item) => total + item.duration_played, 0);
    const uniqueVideos = new Set(filteredHistory.map(item => item.video_id)).size;
    const uniquePlaylists = new Set(filteredHistory.map(item => item.playlist_id)).size;
    const averageCompletion = filteredHistory.length > 0 
      ? filteredHistory.reduce((total, item) => total + item.completion_percentage, 0) / filteredHistory.length 
      : 0;

    const averageSessionLength = filteredHistory.length > 0 
      ? totalPlayTime / filteredHistory.length 
      : 0;

    // 计算连续播放天数
    const playDates = [...new Set(filteredHistory.map(item => 
      new Date(item.played_at).toDateString()
    ))].sort();

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < playDates.length; i++) {
      const prevDate = new Date(playDates[i - 1]);
      const currDate = new Date(playDates[i]);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    // 检查当前连续天数
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    if (playDates.includes(today) || playDates.includes(yesterday)) {
      currentStreak = 1;
      for (let i = playDates.length - 2; i >= 0; i--) {
        const prevDate = new Date(playDates[i]);
        const nextDate = new Date(playDates[i + 1]);
        const diffDays = (nextDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return {
      totalPlayTime,
      totalSessions: filteredHistory.length,
      uniqueVideos,
      uniquePlaylists,
      averageCompletion,
      averageSessionLength,
      activeDays: playDates.length,
      currentStreak,
      maxStreak
    };
  }, [filteredHistory]);

  // 计算视频统计
  const videoStats = useMemo(() => {
    const videoMap = new Map<string, VideoStats>();

    filteredHistory.forEach(item => {
      const existing = videoMap.get(item.video_id);
      if (existing) {
        existing.playCount++;
        existing.totalDuration += item.duration_played;
        existing.averageCompletion = (existing.averageCompletion + item.completion_percentage) / 2;
        if (new Date(item.played_at) > new Date(existing.lastPlayed)) {
          existing.lastPlayed = item.played_at;
        }
      } else {
        videoMap.set(item.video_id, {
          videoId: item.video_id,
          videoTitle: item.video_title,
          playCount: 1,
          totalDuration: item.duration_played,
          averageCompletion: item.completion_percentage,
          lastPlayed: item.played_at,
          playlistName: item.playlist_name
        });
      }
    });

    return Array.from(videoMap.values())
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10);
  }, [filteredHistory]);

  // 计算播放列表统计
  const playlistStats = useMemo(() => {
    const playlistMap = new Map<string, PlaylistStats>();

    filteredHistory.forEach(item => {
      const existing = playlistMap.get(item.playlist_id);
      if (existing) {
        existing.playCount++;
        existing.totalDuration += item.duration_played;
        existing.averageCompletion = (existing.averageCompletion + item.completion_percentage) / 2;
        if (new Date(item.played_at) > new Date(existing.lastPlayed)) {
          existing.lastPlayed = item.played_at;
        }
      } else {
        playlistMap.set(item.playlist_id, {
          playlistId: item.playlist_id,
          playlistName: item.playlist_name || '未知播放列表',
          playCount: 1,
          totalDuration: item.duration_played,
          uniqueVideos: 1,
          averageCompletion: item.completion_percentage,
          lastPlayed: item.played_at
        });
      }
    });

    // 计算每个播放列表的唯一视频数
    playlistMap.forEach((stats, playlistId) => {
      const uniqueVideos = new Set(
        filteredHistory
          .filter(item => item.playlist_id === playlistId)
          .map(item => item.video_id)
      ).size;
      stats.uniqueVideos = uniqueVideos;
    });

    return Array.from(playlistMap.values())
      .sort((a, b) => b.playCount - a.playCount);
  }, [filteredHistory]);

  // 计算每日趋势
  const dailyTrends = useMemo(() => {
    const dailyMap = new Map<string, DailyStats>();

    filteredHistory.forEach(item => {
      const date = new Date(item.played_at).toLocaleDateString('zh-CN');
      const existing = dailyMap.get(date);
      if (existing) {
        existing.playCount++;
        existing.totalDuration += item.duration_played;
      } else {
        dailyMap.set(date, {
          date,
          playCount: 1,
          totalDuration: item.duration_played,
          uniqueVideos: 1
        });
      }
    });

    // 计算每日唯一视频数
    dailyMap.forEach((stats, date) => {
      const uniqueVideos = new Set(
        filteredHistory
          .filter(item => new Date(item.played_at).toLocaleDateString('zh-CN') === date)
          .map(item => item.video_id)
      ).size;
      stats.uniqueVideos = uniqueVideos;
    });

    return Array.from(dailyMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredHistory]);

  // 切换展开状态 - 暂时未使用，为将来功能预留
  // const toggleSection = (section: string) => {
  //   const newExpanded = new Set(expandedSections);
  //   if (newExpanded.has(section)) {
  //     newExpanded.delete(section);
  //   } else {
  //     newExpanded.add(section);
  //   }
  //   setExpandedSections(newExpanded);
  // };

  // 格式化时间范围标签
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'week': return '最近一周';
      case 'month': return '最近一月';
      case 'year': return '最近一年';
      default: return '全部时间';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* 头部 */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 size={24} className="text-gray-400" />
            <h2 className="text-xl font-semibold text-white">播放统计</h2>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="week">最近一周</option>
            <option value="month">最近一月</option>
            <option value="year">最近一年</option>
            <option value="all">全部时间</option>
          </select>
        </div>

        {/* 标签页 */}
        <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
          {[
            { key: 'overview', label: '总览', icon: Activity },
            { key: 'videos', label: '视频', icon: Video },
            { key: 'playlists', label: '播放列表', icon: Play },
            { key: 'trends', label: '趋势', icon: TrendingUp }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-colors ${
                activeTab === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 核心指标 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock size={16} className="text-blue-400" />
                  <span className="text-sm text-gray-400">总播放时长</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatDuration(overviewStats.totalPlayTime)}
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Play size={16} className="text-green-400" />
                  <span className="text-sm text-gray-400">播放次数</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {overviewStats.totalSessions}
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Video size={16} className="text-purple-400" />
                  <span className="text-sm text-gray-400">不同视频</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {overviewStats.uniqueVideos}
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target size={16} className="text-orange-400" />
                  <span className="text-sm text-gray-400">平均完成度</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {Math.round(overviewStats.averageCompletion)}%
                </div>
              </div>
            </div>

            {/* 成就指标 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap size={16} className="text-yellow-400" />
                  <span className="text-sm text-gray-400">当前连续天数</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {overviewStats.currentStreak} 天
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Award size={16} className="text-red-400" />
                  <span className="text-sm text-gray-400">最长连续天数</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {overviewStats.maxStreak} 天
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar size={16} className="text-cyan-400" />
                  <span className="text-sm text-gray-400">活跃天数</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {overviewStats.activeDays} 天
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              最常播放的视频 ({getTimeRangeLabel()})
            </h3>
            <div className="space-y-3">
              {videoStats.map((video, index) => (
                <div key={video.videoId} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{video.videoTitle}</div>
                        <div className="text-sm text-gray-400">
                          来自 {video.playlistName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{video.playCount} 次播放</div>
                      <div className="text-sm text-gray-400">
                        {formatDuration(video.totalDuration)} • {Math.round(video.averageCompletion)}% 完成
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'playlists' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              播放列表统计 ({getTimeRangeLabel()})
            </h3>
            <div className="space-y-3">
              {playlistStats.map((playlist, index) => (
                <div key={playlist.playlistId} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{playlist.playlistName}</div>
                        <div className="text-sm text-gray-400">
                          {playlist.uniqueVideos} 个不同视频
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{playlist.playCount} 次播放</div>
                      <div className="text-sm text-gray-400">
                        {formatDuration(playlist.totalDuration)} • {Math.round(playlist.averageCompletion)}% 完成
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              每日播放趋势 ({getTimeRangeLabel()})
            </h3>
            <div className="space-y-2">
              {dailyTrends.slice(-14).map((day) => (
                <div key={day.date} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-medium">{day.date}</div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{day.playCount} 次播放</span>
                      <span>{day.uniqueVideos} 个视频</span>
                      <span>{formatDuration(day.totalDuration)}</span>
                    </div>
                  </div>
                  
                  {/* 简单的进度条 */}
                  <div className="mt-2 bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (day.playCount / Math.max(...dailyTrends.map(d => d.playCount))) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaybackStats; 