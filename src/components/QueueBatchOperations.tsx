import React, { useState, useCallback } from 'react';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Download, 
  Share2, 
  Copy, 
  Shuffle,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoPlaylistItem, VideoFile } from '../types/video';

interface QueueBatchOperationsProps {
  items: VideoPlaylistItem[];
  selectedItems: Set<string>;
  onSelectionChange: (selectedItems: Set<string>) => void;
  onBatchRemove: (itemIds: string[]) => void;
  onBatchMove: (itemIds: string[], direction: 'up' | 'down') => void;
  onBatchShuffle: (itemIds: string[]) => void;
  onBatchExport: (itemIds: string[]) => void;
  className?: string;
}

const QueueBatchOperations: React.FC<QueueBatchOperationsProps> = ({
  items,
  selectedItems,
  onSelectionChange,
  onBatchRemove,
  onBatchMove,
  onBatchShuffle,
  onBatchExport,
  className = ''
}) => {
  const [showOperations, setShowOperations] = useState(false);

  // 全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === items.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map(item => item.id)));
    }
  }, [items, selectedItems, onSelectionChange]);

  // 切换单个项目选择
  const handleToggleItem = useCallback((itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    onSelectionChange(newSelection);
  }, [selectedItems, onSelectionChange]);

  // 批量移除
  const handleBatchRemove = useCallback(() => {
    if (selectedItems.size === 0) return;
    
    if (confirm(`确定要移除选中的 ${selectedItems.size} 个视频吗？`)) {
      onBatchRemove(Array.from(selectedItems));
      onSelectionChange(new Set());
    }
  }, [selectedItems, onBatchRemove, onSelectionChange]);

  // 批量上移
  const handleBatchMoveUp = useCallback(() => {
    if (selectedItems.size === 0) return;
    onBatchMove(Array.from(selectedItems), 'up');
  }, [selectedItems, onBatchMove]);

  // 批量下移
  const handleBatchMoveDown = useCallback(() => {
    if (selectedItems.size === 0) return;
    onBatchMove(Array.from(selectedItems), 'down');
  }, [selectedItems, onBatchMove]);

  // 批量随机排序
  const handleBatchShuffle = useCallback(() => {
    if (selectedItems.size === 0) return;
    onBatchShuffle(Array.from(selectedItems));
  }, [selectedItems, onBatchShuffle]);

  // 批量导出
  const handleBatchExport = useCallback(() => {
    if (selectedItems.size === 0) return;
    onBatchExport(Array.from(selectedItems));
  }, [selectedItems, onBatchExport]);

  // 清除选择
  const handleClearSelection = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const isAllSelected = selectedItems.size === items.length && items.length > 0;
  const isPartialSelected = selectedItems.size > 0 && selectedItems.size < items.length;
  const hasSelection = selectedItems.size > 0;

  return (
    <div className={`bg-gray-800 border-b border-gray-700 ${className}`}>
      {/* 选择控制栏 */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3">
          {/* 全选复选框 */}
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare size={16} className="text-blue-400" />
            ) : isPartialSelected ? (
              <div className="w-4 h-4 bg-blue-400 rounded-sm flex items-center justify-center">
                <div className="w-2 h-0.5 bg-white"></div>
              </div>
            ) : (
              <Square size={16} />
            )}
            <span className="text-sm">
              {hasSelection ? `已选择 ${selectedItems.size} 项` : '全选'}
            </span>
          </button>

          {/* 选择统计 */}
          {hasSelection && (
            <span className="text-xs text-gray-500">
              共 {items.length} 项
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 批量操作按钮 */}
          {hasSelection && (
            <>
              <button
                onClick={() => setShowOperations(!showOperations)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="更多操作"
              >
                <MoreHorizontal size={16} />
              </button>
              
              <button
                onClick={handleClearSelection}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="清除选择"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 批量操作面板 */}
      <AnimatePresence>
        {hasSelection && showOperations && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-700 p-3 overflow-hidden"
          >
            <div className="flex flex-wrap gap-2">
              {/* 移动操作 */}
              <button
                onClick={handleBatchMoveUp}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
              >
                <ArrowUp size={14} />
                <span>上移</span>
              </button>
              
              <button
                onClick={handleBatchMoveDown}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
              >
                <ArrowDown size={14} />
                <span>下移</span>
              </button>

              {/* 随机排序 */}
              <button
                onClick={handleBatchShuffle}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
              >
                <Shuffle size={14} />
                <span>随机排序</span>
              </button>

              {/* 导出 */}
              <button
                onClick={handleBatchExport}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
              >
                <Download size={14} />
                <span>导出</span>
              </button>

              {/* 复制 */}
              <button
                onClick={() => {
                  const selectedVideos = items
                    .filter(item => selectedItems.has(item.id))
                    .map(item => item.video.title)
                    .join('\n');
                  navigator.clipboard.writeText(selectedVideos);
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
              >
                <Copy size={14} />
                <span>复制标题</span>
              </button>

              {/* 分享 */}
              <button
                onClick={() => {
                  // 这里可以实现分享功能
                  console.log('Share selected items:', Array.from(selectedItems));
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
              >
                <Share2 size={14} />
                <span>分享</span>
              </button>

              {/* 移除 */}
              <button
                onClick={handleBatchRemove}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                <Trash2 size={14} />
                <span>移除</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快捷操作提示 */}
      {hasSelection && !showOperations && (
        <div className="px-3 pb-3">
          <div className="text-xs text-gray-500 flex items-center space-x-4">
            <span>快捷键:</span>
            <span>Delete - 删除</span>
            <span>Ctrl+A - 全选</span>
            <span>Escape - 取消选择</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueBatchOperations; 