import React, { useState, useEffect } from 'react';
import { X, Save, Tag, FileText, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoPlaylistItem, formatDuration } from '../types/video';

interface PlaylistEditorProps {
  item: VideoPlaylistItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemId: string, updates: Partial<VideoPlaylistItem>) => void;
}

const PlaylistEditor: React.FC<PlaylistEditorProps> = ({
  item,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    custom_title: '',
    notes: ''
  });

  // 当item变化时更新表单数据
  useEffect(() => {
    if (item) {
      setFormData({
        custom_title: item.custom_title || '',
        notes: item.notes || ''
      });
    }
  }, [item]);

  const handleSave = () => {
    if (!item) return;

    const updates: Partial<VideoPlaylistItem> = {
      custom_title: formData.custom_title.trim() || undefined,
      notes: formData.notes.trim() || undefined
    };

    onSave(item.id, updates);
    onClose();
  };

  const handleClose = () => {
    setFormData({
      custom_title: '',
      notes: ''
    });
    onClose();
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">编辑播放列表项</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 视频信息预览 */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                {/* 缩略图 */}
                <div className="w-20 h-15 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                  {item.video.thumbnail_path ? (
                    <img
                      src={item.video.thumbnail_path}
                      alt={item.video.title}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs text-center">
                      无缩略图
                    </div>
                  )}
                </div>

                {/* 视频详情 */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate mb-1">
                    {item.video.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>{item.video.format?.toUpperCase()}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{formatDuration(item.video.duration)}</span>
                    </span>
                  </div>
                  {item.video.resolution && (
                    <div className="text-xs text-gray-400 mt-1">
                      {item.video.resolution.width}x{item.video.resolution.height}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 编辑表单 */}
            <div className="space-y-4">
              {/* 自定义标题 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  自定义标题
                </label>
                <input
                  type="text"
                  value={formData.custom_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_title: e.target.value }))}
                  placeholder={item.video.title}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  留空则使用原始视频标题
                </p>
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  备注
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="添加关于这个视频的备注..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>

              {/* 播放统计（只读） */}
              <div className="bg-gray-700 rounded-lg p-3">
                <h5 className="text-sm font-medium text-gray-300 mb-2">播放统计</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">播放次数:</span>
                    <span className="text-white ml-2">{item.play_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">添加时间:</span>
                    <span className="text-white ml-2">
                      {new Date(item.added_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  {item.last_played && (
                    <div className="col-span-2">
                      <span className="text-gray-400">上次播放:</span>
                      <span className="text-white ml-2">
                        {new Date(item.last_played).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Save size={16} />
                <span>保存</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlaylistEditor; 