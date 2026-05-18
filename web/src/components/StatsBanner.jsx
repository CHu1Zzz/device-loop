import { useEffect, useState } from 'react';
import { fetchStats } from '../api/client';

const SOURCE_LABELS = {
  xianyu: '闲鱼',
  xiaohongshu: '小红书',
  tieba: '百度贴吧',
};

const SOURCE_COLORS = {
  xianyu: 'bg-orange-500',
  xiaohongshu: 'bg-red-500',
  tieba: 'bg-blue-500',
};

export default function StatsBanner({ onStatsLoaded }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then((res) => {
        setStats(res.data);
        onStatsLoaded?.(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-industrial-mid p-4 rounded-lg animate-pulse">
        <div className="h-6 bg-industrial-light rounded w-1/3"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-industrial-dark border border-industrial-light rounded-lg p-4">
      <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[120px]">
          <div className="text-gray-400 text-xs uppercase tracking-wide">总数量</div>
          <div className="text-2xl font-bold text-white">{stats.total_items}</div>
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="text-gray-400 text-xs uppercase tracking-wide">今日新增</div>
          <div className="text-2xl font-bold text-accent">{stats.today_new}</div>
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="text-gray-400 text-xs uppercase tracking-wide">数据来源</div>
          <div className="flex gap-2 mt-1">
            {Object.entries(stats.by_source || {}).map(([source, count]) => (
              <span
                key={source}
                className={`${SOURCE_COLORS[source] || 'bg-gray-500'} text-white text-xs px-2 py-0.5 rounded`}
              >
                {SOURCE_LABELS[source] || source}: {count}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="text-gray-400 text-xs uppercase tracking-wide">设备分类</div>
          <div className="text-sm text-gray-300 mt-1">
            {Object.keys(stats.by_category || {}).length} 个分类
          </div>
        </div>
      </div>
    </div>
  );
}