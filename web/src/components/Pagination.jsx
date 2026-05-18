/**
 * 分页组件
 * 支持页码按钮和省略号
 */
export default function Pagination({ pagination, onPageChange }) {
  const { page, total_pages, total } = pagination;

  if (total_pages <= 1) return null;

  // 生成页码数组
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (total_pages <= maxVisible) {
      // 全部显示
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      // 首尾各保留2个，当前页附近显示
      // 始终显示前2页
      pages.push(1);
      if (total_pages > 1) pages.push(2);

      // 如果当前页 > 4，添加省略号
      if (page > 4) {
        pages.push('...');
      }

      // 当前页附近的页码
      for (let i = Math.max(3, page - 1); i <= Math.min(total_pages - 2, page + 1); i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      // 如果当前页 < total_pages - 3，添加省略号
      if (page < total_pages - 3) {
        pages.push('...');
      }

      // 始终显示最后2页
      if (!pages.includes(total_pages - 1)) {
        pages.push(total_pages - 1);
      }
      if (!pages.includes(total_pages)) {
        pages.push(total_pages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center items-center gap-1 py-6">
      {/* 上一页 */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 bg-industrial-mid border border-industrial-light text-white rounded disabled:opacity-40 hover:bg-industrial-light transition-colors text-sm"
      >
        上一页
      </button>

      {/* 页码 */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[36px] h-9 px-2 rounded text-sm transition-colors ${
                p === page
                  ? 'bg-accent text-white'
                  : 'bg-industrial-mid border border-industrial-light text-white hover:bg-industrial-light'
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      {/* 下一页 */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= total_pages}
        className="px-3 py-1.5 bg-industrial-mid border border-industrial-light text-white rounded disabled:opacity-40 hover:bg-industrial-light transition-colors text-sm"
      >
        下一页
      </button>

      {/* 统计信息 */}
      <span className="ml-4 text-gray-500 text-sm">
        共 {total} 条，第 {page}/{total_pages} 页
      </span>
    </div>
  );
}