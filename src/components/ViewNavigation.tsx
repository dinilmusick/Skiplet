interface Item { ordinal: number; title: string; slug: string }
interface Props {
  views: readonly Item[];
  active: number;
  onSelect: (index: number) => void;
}
export function ViewNavigation({ views, active, onSelect }: Props) {
  if (views.length <= 1) return null;
  return (
    <nav className="view-navigation" aria-label="Views inside this perspective">
      <span className="view-navigation-label">CAMERA VIEWS</span>
      <div className="view-navigation-tabs" role="tablist" aria-label="Choose a view">
        {views.map((view, index) => (
          <button type="button" role="tab" aria-selected={index === active}
            className={index === active ? 'is-active' : ''} key={view.slug}
            onClick={() => onSelect(index)}>{view.title}</button>
        ))}
      </div>
    </nav>
  );
}
