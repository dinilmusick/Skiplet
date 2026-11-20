import { useEffect, useState, type CSSProperties } from 'react';
import config from '../meditations.config.json';
import { ChapterMarkdown } from './components/ChapterMarkdown';
import { chapters } from './exposition';
import { ExhibitionCanvas } from './scene/ExhibitionCanvas';

type PaletteStyle = CSSProperties & Record<`--color-${string}`, string>;
const theme: PaletteStyle = {
  '--color-base': config.palette.base,
  '--color-highlight': config.palette.highlight,
  '--color-surface': config.palette.surface,
  '--color-text': config.palette.text,
};
const clamp = (value: number) => Math.max(0, Math.min(chapters.length - 1, value));
const fromUrl = () => {
  const slug = new URLSearchParams(window.location.search).get('chapter');
  return Math.max(0, chapters.findIndex(entry => entry.slug === slug));
};

export function App() {
  const [active, setActive] = useState(fromUrl);
  const [fallback, setFallback] = useState(false);
  const title = config.title.trim() || config.id.replace(/^MDT-/, '').replaceAll('-', ' ');
  const page = chapters[active];

  function navigate(index: number, push = true) {
    const target = chapters[clamp(index)];
    if (!target) return;
    setActive(clamp(index));
    const url = new URL(window.location.href);
    url.searchParams.set('chapter', target.slug);
    if (push) window.history.pushState(null, '', url);
  }

  useEffect(() => { document.title = title + ' · Meditations'; }, [title]);
  useEffect(() => {
    const onPop = () => setActive(fromUrl());
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement) return;
      if (event.key === 'ArrowRight') { navigate(active + 1); event.preventDefault(); }
      if (event.key === 'ArrowLeft') { navigate(active - 1); event.preventDefault(); }
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('keydown', onKey); };
  }, [active]);

  return (
    <main className="exhibition" style={theme}>
      <div className="exhibition-visual" aria-hidden="true">
        {fallback ? <div className="sculpture-fallback" /> : (
          <ExhibitionCanvas onUnavailable={() => setFallback(true)} />
        )}
      </div>
      <div className="exhibition-vignette" aria-hidden="true" />
      <header className="exhibition-header">
        <span className="exhibition-brand">MEDITATIONS</span>
        <span className="exhibition-index">{title} / {config.id}</span>
      </header>
      {page ? (
        <article className="exhibition-chapter" key={page.slug} aria-label={`Chapter ${page.number}: ${page.title}`}>
          <p className="exhibition-kicker">CHAPTER {String(page.number).padStart(2, '0')} / {chapters.length}</p>
          <ChapterMarkdown markdown={page.markdown} onChapterLink={file => {
            const next = chapters.findIndex(chapter => chapter.file === file);
            if (next < 0) return false;
            navigate(next);
            return true;
          }} />
        </article>
      ) : (
        <section className="exhibition-story" aria-labelledby="exhibition-title">
          <p className="exhibition-kicker">AN INTERACTIVE EXHIBITION</p>
          <h1 id="exhibition-title">{title}</h1>
          <p className="exhibition-concept">Add a numbered Markdown chapter in exposition/, then run skiplet generate pages.</p>
        </section>
      )}
      <nav className="chapter-navigation" aria-label="Exhibition chapters">
        <button type="button" aria-label="Previous chapter" disabled={active <= 0} onClick={() => navigate(active - 1)}>←</button>
        <div className="chapter-navigation-tabs" role="tablist" aria-label="Choose a chapter">
          {chapters.map((chapter, index) => (
            <button type="button" role="tab" aria-selected={index === active} key={chapter.slug}
              className={index === active ? 'is-active' : ''} onClick={() => navigate(index)}>
              {String(chapter.number).padStart(2, '0')} <span>{chapter.title}</span>
            </button>
          ))}
        </div>
        <button type="button" aria-label="Next chapter" disabled={active >= chapters.length - 1} onClick={() => navigate(active + 1)}>→</button>
      </nav>
      <footer className="exhibition-footer">
        <span>EXPOSITION → EXPERIENCE</span>
        <span>{fallback ? '2D fallback' : 'PROCEDURAL 3D STUDY'}</span>
      </footer>
    </main>
  );
}
