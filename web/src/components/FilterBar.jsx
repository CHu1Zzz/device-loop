import { useState, useEffect } from 'react';

const CATEGORIES = [
  { value: '', label: '全部分类' },
  { value: '制冷设备', label: '制冷设备' },
  { value: '烹饪设备', label: '烹饪设备' },
  { value: '清洗设备', label: '清洗设备' },
  { value: '储存设备', label: '储存设备' },
  { value: '其他设备', label: '其他设备' },
  { value: '未分类', label: '未分类' },
];

const SOURCES = [
  { value: '', label: '全部来源' },
  { value: 'xianyu', label: '闲鱼' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'tieba', label: '百度贴吧' },
];

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: '最新优先' },
  { value: 'created_at_asc', label: '最旧优先' },
  { value: 'price_asc', label: '价格升序' },
  { value: 'price_desc', label: '价格降序' },
];

export default function FilterBar({ onFilterChange, initialFilters = {} }) {
  const [keyword, setKeyword] = useState(initialFilters.keyword || '');
  const [category, setCategory] = useState(initialFilters.category || '');
  const [source, setSource] = useState(initialFilters.source || '');
  const [province, setProvince] = useState(initialFilters.province || '');
  const [priceMin, setPriceMin] = useState(initialFilters.price_min || '');
  const [priceMax, setPriceMax] = useState(initialFilters.price_max || '');
  const [sort, setSort] = useState(initialFilters.sort || 'created_at_desc');

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange?.({
        keyword,
        category,
        source,
        province,
        price_min: priceMin || undefined,
        price_max: priceMax || undefined,
        sort,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, category, source, province, priceMin, priceMax, sort]);

  const handleReset = () => {
    setKeyword('');
    setCategory('');
    setSource('');
    setProvince('');
    setPriceMin('');
    setPriceMax('');
    setSort('created_at_desc');
  };

  return (
    <div className="bg-industrial-mid border border-industrial-light rounded-lg p-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜索关键词..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-industrial-dark border border-industrial-light rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-industrial-dark border border-industrial-light rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="bg-industrial-dark border border-industrial-light rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="省份"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="w-24 bg-industrial-dark border border-industrial-light rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
        />
        <input
          type="number"
          placeholder="最低价"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          className="w-24 bg-industrial-dark border border-industrial-light rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
        />
        <input
          type="number"
          placeholder="最高价"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          className="w-24 bg-industrial-dark border border-industrial-light rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-industrial-dark border border-industrial-light rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-industrial-light text-gray-300 rounded hover:bg-industrial-dark transition-colors"
        >
          重置
        </button>
      </div>
    </div>
  );
}