import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import ItemCard from '../components/ItemCard';
import StatsBanner from '../components/StatsBanner';
import SubscribeModal from '../components/SubscribeModal';
import Pagination from '../components/Pagination';
import { fetchItems } from '../api/client';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [subscribeItem, setSubscribeItem] = useState(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [stats, setStats] = useState(null);

  const getFiltersFromUrl = useCallback(() => ({
    keyword: searchParams.get('keyword') || '',
    category: searchParams.get('category') || '',
    source: searchParams.get('source') || '',
    province: searchParams.get('province') || '',
    price_min: searchParams.get('price_min') || '',
    price_max: searchParams.get('price_max') || '',
    sort: searchParams.get('sort') || 'created_at_desc',
    page: parseInt(searchParams.get('page') || '1', 10),
  }), [searchParams]);

  const loadItems = useCallback(async (filters) => {
    setLoading(true);
    try {
      const res = await fetchItems(filters);
      setItems(res.data.items || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 });
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const filters = getFiltersFromUrl();
    loadItems(filters);
  }, [getFiltersFromUrl, loadItems]);

  const handleFilterChange = (filters) => {
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && key !== 'page') {
        newParams.set(key, value);
      }
    });
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const filters = getFiltersFromUrl();
    filters.page = newPage;
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && key !== 'page') {
        newParams.set(key, value);
      }
    });
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribeClick = (item) => {
    setSubscribeItem(item);
    setShowSubscribeModal(true);
  };

  const handleStatsLoaded = (statsData) => {
    setStats(statsData);
  };

  const filters = getFiltersFromUrl();

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="bg-industrial-dark border-b border-industrial-light sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏪</span>
            <h1 className="text-white font-bold text-lg">二手餐饮设备</h1>
          </div>
          <button
            onClick={() => setShowSubscribeModal(true)}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors text-sm"
          >
            邮件订阅
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <StatsBanner onStatsLoaded={handleStatsLoaded} />
        <FilterBar onFilterChange={handleFilterChange} initialFilters={filters} />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-industrial-mid rounded-lg overflow-hidden animate-pulse">
                <div className="h-40 bg-industrial-dark"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-industrial-dark rounded w-3/4"></div>
                  <div className="h-4 bg-industrial-dark rounded w-1/2"></div>
                  <div className="h-6 bg-industrial-dark rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-gray-400">暂无数据</div>
            <button
              onClick={() => loadItems(filters)}
              className="mt-4 px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors"
            >
              刷新
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  showSubscribe={handleSubscribeClick}
                />
              ))}
            </div>

            {pagination.total_pages > 1 && (
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-industrial-dark border-t border-industrial-light py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          二手餐饮设备信息聚合平台 | 数据来源：闲鱼、小红书、百度贴吧
        </div>
      </footer>

      <SubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => {
          setShowSubscribeModal(false);
          setSubscribeItem(null);
        }}
        item={subscribeItem}
      />
    </div>
  );
}