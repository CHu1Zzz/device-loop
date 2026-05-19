import { useState, useEffect } from 'react';
import { fetchItems } from '../api/client';
import ItemCard from './ItemCard';

const STATUS_COLUMNS = [
  { id: 'active', label: '待联系', icon: '📞', color: 'border-blue-500' },
  { id: 'contacted', label: '已联系', icon: '📞', color: 'border-yellow-500' },
  { id: 'viewing', label: '看货中', icon: '👀', color: 'border-orange-500' },
  { id: 'negotiating', label: '谈价中', icon: '💰', color: 'border-purple-500' },
  { id: 'completed', label: '已成交', icon: '✅', color: 'border-green-500' },
];

const STATUS_TRANSITIONS = {
  active: ['contacted', 'invalid'],
  contacted: ['viewing', 'active', 'invalid'],
  viewing: ['negotiating', 'contacted', 'invalid'],
  negotiating: ['completed', 'viewing', 'invalid'],
  completed: [],
  invalid: [],
};

const INVALID_REASONS = [
  '旧帖',
  '不是卖货',
  '已转完',
  '价格太高',
  '太远',
  '非餐饮设备',
];

export default function KanbanBoard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('active');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetchItems({ status: '', page_size: 100, sort: 'score_desc' });
      // 过滤掉已经标记为无效的
      const activeItems = (res.data.items || []).filter(item => item.status !== 'invalid');
      setItems(activeItems);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:3000/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setItems(items.map(item =>
          item.id === itemId ? { ...item, status: newStatus } : item
        ));
      }
    } catch (err) {
      console.error('更新状态失败:', err);
    }
  };

  const handleInvalid = async (itemId, reason) => {
    try {
      const res = await fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, reason }),
      });

      if (res.ok) {
        setItems(items.filter(item => item.id !== itemId));
      }
    } catch (err) {
      console.error('提交反馈失败:', err);
    }
  };

  const getItemsByStatus = (status) => {
    return items.filter(item => item.status === status || (item.status === 'active' && status === 'active'));
  };

  const showInvalidModal = (itemId) => {
    const reason = window.prompt(`无效原因（${INVALID_REASONS.join(', ')}）:`);
    if (reason && INVALID_REASONS.includes(reason)) {
      handleInvalid(itemId, reason);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-gray-500 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 状态切换标签 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUS_COLUMNS.map(col => {
          const count = getItemsByStatus(col.id).length;
          return (
            <button
              key={col.id}
              onClick={() => setFilterStatus(col.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded whitespace-nowrap text-sm transition-colors ${
                filterStatus === col.id
                  ? `bg-industrial-mid border ${col.color} border-2 text-white`
                  : 'bg-industrial-dark text-gray-400 hover:text-white'
              }`}
            >
              <span>{col.icon}</span>
              <span>{col.label}</span>
              <span className="ml-1 bg-industrial-light px-1.5 rounded text-xs">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 当前状态的卡片列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {getItemsByStatus(filterStatus).map(item => (
          <KanbanCard
            key={item.id}
            item={item}
            onStatusChange={handleStatusChange}
            onInvalid={() => showInvalidModal(item.id)}
            availableTransitions={STATUS_TRANSITIONS[item.status] || STATUS_TRANSITIONS.active}
          />
        ))}
      </div>

      {getItemsByStatus(filterStatus).length === 0 && (
        <div className="text-center py-12 text-gray-400">
          暂无数据
        </div>
      )}
    </div>
  );
}

/**
 * 看板卡片组件
 */
function KanbanCard({ item, onStatusChange, onInvalid, availableTransitions }) {
  const [showMenu, setShowMenu] = useState(false);

  const getNextStatusLabel = (status) => {
    const labels = {
      active: '已联系',
      contacted: '看货中',
      viewing: '谈价中',
      negotiating: '已成交',
      invalid: '无效',
    };
    return labels[status] || status;
  };

  return (
    <div className="relative">
      <ItemCard item={item} />

      {/* 操作按钮区域 */}
      <div className="absolute bottom-2 right-2 flex gap-1">
        {availableTransitions.map(status => (
          <button
            key={status}
            onClick={() => onStatusChange(item.id, status)}
            className="px-2 py-1 bg-accent hover:bg-accent-hover text-white text-xs rounded transition-colors"
          >
            {getNextStatusLabel(status)}
          </button>
        ))}
        <button
          onClick={onInvalid}
          className="px-2 py-1 bg-industrial-dark hover:bg-red-900 text-gray-400 hover:text-red-400 text-xs rounded transition-colors"
        >
          无效
        </button>
      </div>
    </div>
  );
}