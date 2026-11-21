interface Item { ordinal: number; title: string; slug: string }

interface Props {
  views: readonly Item[];
  active: number;
  onSelect: (index: number) => void;
  tabIndex?: number;
}

export function ViewNavigation({ views, active, onSelect, tabIndex = 0 }: Props) {
  if (views.length <= 1) return null;
  return (
    <nav className="view-navigation" aria-label="Views inside this perspective">
      <span className="view-navigation-label">Views</span>
      <div className="view-navigation-tabs" role="tablist" aria-label="Choose a view">
        {views.map((view, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={index === active}
            className={`fluid-btn ${index === active ? 'is-active' : ''}`}
            key={view.slug}
            onClick={() => onSelect(index)}
            tabIndex={tabIndex}
          >
            {view.title}
          </button>
        ))}
      </div>
    </nav>
  );
}
