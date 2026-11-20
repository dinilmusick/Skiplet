interface Item { number: number; slug: string; title: string }
interface Props {
  perspectives: readonly Item[];
  active: number;
  onSelect: (index: number) => void;
}
export function PerspectiveNavigation({ perspectives, active, onSelect }: Props) {
  return (
    <nav className="chapter-navigation" aria-label="Exhibition perspectives">
      <button type="button" aria-label="Previous perspective" disabled={active <= 0}
        onClick={() => onSelect(active - 1)}>←</button>
      <div className="chapter-navigation-tabs" role="tablist" aria-label="Choose a perspective">
        {perspectives.map((item, index) => (
          <button type="button" role="tab" aria-selected={index === active} key={item.slug}
            className={index === active ? 'is-active' : ''} onClick={() => onSelect(index)}>
            {String(item.number).padStart(2, '0')} <span>{item.title}</span>
          </button>
        ))}
      </div>
      <button type="button" aria-label="Next perspective"
        disabled={active >= perspectives.length - 1}
        onClick={() => onSelect(active + 1)}>→</button>
    </nav>
  );
}
