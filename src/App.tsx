import { useEffect, useState, type CSSProperties } from 'react';
import config from '../meditations.config.json';
import { ChapterMarkdown } from './components/ChapterMarkdown';
import { PerspectiveNavigation } from './components/PerspectiveNavigation';
import { ViewNavigation } from './components/ViewNavigation';
import { perspectives } from './exposition';
import { ExhibitionCanvas } from './scene/ExhibitionCanvas';

const theme = {
  '--color-base': config.palette.base,
  '--color-highlight': config.palette.highlight,
  '--color-surface': config.palette.surface,
  '--color-text': config.palette.text,
} as CSSProperties;
const clamp = (index: number, size: number) => Math.max(0, Math.min(size - 1, index));
function fromUrl() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('perspective') ?? params.get('chapter');
  const perspective = Math.max(0, perspectives.findIndex(entry => entry.slug === slug));
  const viewSlug = params.get('view');
  const view = Math.max(0, perspectives[perspective]?.views.findIndex(item => item.slug === viewSlug) ?? 0);
  return { perspective, view };
}

export function App() {
  const [active, setActive] = useState(fromUrl);
  const [fallback, setFallback] = useState(false);
  const title = config.title.trim() || config.id.replace(/^MDT-/, '').replaceAll('-', ' ');
  const perspective = perspectives[active.perspective];
  const view = perspective?.views[active.view] ?? perspective?.views[0];
  const viewCount = perspective?.views.length ?? 0;

  function navigate(perspectiveIndex: number, viewIndex = 0, push = true) {
    const selected = perspectives[clamp(perspectiveIndex, perspectives.length)];
    if (!selected) return;
    const nextPerspective = clamp(perspectiveIndex, perspectives.length);
    const nextView = clamp(viewIndex, selected.views.length);
    setActive({ perspective: nextPerspective, view: nextView });
    const url = new URL(window.location.href);
    url.searchParams.delete('chapter');
    url.searchParams.set('perspective', selected.slug);
    if (selected.views[nextView]) url.searchParams.set('view', selected.views[nextView].slug);
    else url.searchParams.delete('view');
    if (push) window.history.pushState(null, '', url);
  }

  useEffect(() => { document.title = title + ' · Meditations'; }, [title]);
  useEffect(() => {
    const onPop = () => setActive(fromUrl());
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey ||
          event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'ArrowRight') navigate(active.perspective + 1);
      else if (event.key === 'ArrowLeft') navigate(active.perspective - 1);
      else if (event.key === 'ArrowDown') navigate(active.perspective, active.view + 1);
      else if (event.key === 'ArrowUp') navigate(active.perspective, active.view - 1);
      else return;
      event.preventDefault();
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('keydown', onKey); };
  }, [active]);

  return (
    <main className="exhibition" style={theme}>
      <div className="exhibition-visual" aria-hidden="true">
        {fallback ? <div className="sculpture-fallback" /> : (
          <ExhibitionCanvas onUnavailable={() => setFallback(true)}
            perspectiveCount={perspectives.length} perspectiveIndex={active.perspective}
            viewIndex={active.view} />
        )}
      </div>
      <div className="exhibition-vignette" aria-hidden="true" />
      <header className="exhibition-header">
        <span className="exhibition-brand">MEDITATIONS</span>
        <span className="exhibition-index">{title} / {config.id}</span>
      </header>
      {perspective && view ? (
        <section className="exhibition-chapter"
          aria-label={'Perspective ' + perspective.number + ': ' + perspective.title +
            ', view ' + view.ordinal + ': ' + view.title}>
          <p className="exhibition-kicker">
            PERSPECTIVE {String(perspective.number).padStart(2, '0')} / {perspectives.length}
            {' · '}VIEW {view.ordinal} / {viewCount}
          </p>
          <ChapterMarkdown markdown={view.markdown} onChapterLink={file => {
            const index = perspectives.findIndex(item => item.file === file);
            if (index < 0) return false;
            navigate(index);
            return true;
          }} />
        </section>
      ) : (
        <section className="exhibition-story" aria-labelledby="exhibition-title">
          <p className="exhibition-kicker">AN INTERACTIVE EXHIBITION</p>
          <h1 id="exhibition-title">{title}</h1>
          <p className="exhibition-concept">Add a numbered Markdown chapter in exposition/, then run skiplet generate perspectives.</p>
        </section>
      )}
      <div className="exhibition-controls">
        <ViewNavigation views={perspective?.views ?? []} active={active.view}
          onSelect={index => navigate(active.perspective, index)} />
        <PerspectiveNavigation perspectives={perspectives} active={active.perspective}
          onSelect={index => navigate(index)} />
      </div>
      <footer className="exhibition-footer">
        <span>EXPOSITION → PERSPECTIVES → VIEWS</span>
        <span>{fallback ? '2D fallback' : 'PROCEDURAL 3D STUDY'}</span>
      </footer>
    </main>
  );
}
