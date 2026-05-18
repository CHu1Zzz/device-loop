import { useState, useRef, useEffect } from 'react';

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

const SOURCE_PLACEHOLDERS = {
  xianyu: '🐟',
  xiaohongshu: '📕',
  tieba: '📋',
};

const CATEGORY_COLORS = {
  '制冷设备': 'bg-cyan-600',
  '烹饪设备': 'bg-orange-600',
  '清洗设备': 'bg-blue-600',
  '储存设备': 'bg-green-600',
  '其他设备': 'bg-gray-600',
  '未分类': 'bg-gray-500',
};

function formatPrice(price) {
  if (!price && price !== 0) return '价格面议';
  return `¥${Number(price).toLocaleString()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

function formatSourceUrl(item) {
  switch (item.source) {
    case 'xianyu':
      return item.url || `https://www.goofish.com/item/${item.external_id}`;
    case 'xiaohongshu':
      return item.url || `https://www.xiaohongshu.com/explore/${item.external_id}`;
    case 'tieba':
      return item.url || `https://tieba.baidu.com/p/${item.external_id}`;
    default:
      return item.url || '#';
  }
}

/**
 * 获取设备图片URL
 * images 可能是数组，也可能是JSON字符串
 */
function getImageUrl(item) {
  if (!item.images) return null;

  try {
    // 尝试解析 JSON 字符串
    if (typeof item.images === 'string') {
      const parsed = JSON.parse(item.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } else if (Array.isArray(item.images) && item.images.length > 0) {
      return item.images[0];
    }
  } catch (e) {
    // 忽略解析错误
  }

  return null;
}

export default function ItemCard({ item, showSubscribe }) {
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef(null);

  // 懒加载 - Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const imageUrl = getImageUrl(item);
  const hasValidImage = imageUrl && !imgError;

  return (
    <div className="bg-industrial-mid border border-industrial-light rounded-lg overflow-hidden hover:border-accent transition-colors">
      {/* 图片区域 */}
      <div className="relative w-full h-40 bg-industrial-dark overflow-hidden">
        {hasValidImage && isVisible ? (
          <>
            <img
              ref={imgRef}
              src={imageUrl}
              alt={item.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setIsLoaded(true)}
              onError={() => setImgError(true)}
            />
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-500 border-t-accent rounded-full animate-spin"></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span className="text-4xl">{SOURCE_PLACEHOLDERS[item.source] || '📦'}</span>
            <span className="text-xs text-gray-500">{SOURCE_LABELS[item.source] || item.source}</span>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <a
            href={formatSourceUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-medium line-clamp-2 hover:text-accent transition-colors"
          >
            {item.title}
          </a>
          <span className={`${SOURCE_COLORS[item.source] || 'bg-gray-500'} text-white text-xs px-2 py-0.5 rounded whitespace-nowrap`}>
            {SOURCE_LABELS[item.source] || item.source}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          <span className={`${CATEGORY_COLORS[item.category] || 'bg-gray-500'} text-white text-xs px-2 py-0.5 rounded`}>
            {item.category || '未分类'}
          </span>
          {item.location && (
            <span className="bg-industrial-dark text-gray-400 text-xs px-2 py-0.5 rounded">
              📍 {item.location}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-accent font-bold text-lg">
            {formatPrice(item.price)}
          </span>
          <span className="text-gray-500 text-xs">
            {formatDate(item.created_at || item.collected_at)}
          </span>
        </div>
        {showSubscribe && (
          <button
            onClick={() => showSubscribe(item)}
            className="mt-2 w-full py-1.5 bg-industrial-dark border border-industrial-light text-gray-300 text-sm rounded hover:border-accent hover:text-accent transition-colors"
          >
            订阅此设备
          </button>
        )}
      </div>
    </div>
  );
}