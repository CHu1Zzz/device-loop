/**
 * 侧边导航栏
 */
export default function Sidebar({ currentView, onViewChange }) {
  const views = [
    { id: 'list', label: '列表视图', icon: '📋' },
    { id: 'kanban', label: '看板视图', icon: '📊' },
  ];

  return (
    <div className="flex flex-col gap-1">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
            currentView === view.id
              ? 'bg-accent text-white'
              : 'text-gray-400 hover:bg-industrial-mid hover:text-white'
          }`}
        >
          <span>{view.icon}</span>
          <span>{view.label}</span>
        </button>
      ))}
    </div>
  );
}