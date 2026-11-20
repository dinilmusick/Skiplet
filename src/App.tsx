import { useEffect, useState, type CSSProperties } from 'react';
import config from '../meditations.config.json';
import { Carousel3D } from './libraries/components/Carousel3D';
import { PerspectiveNavigation } from './libraries/components/PerspectiveNavigation';
import { carouselElements, carouselVisuals } from './perspectives/carouselAssets';
import { perspectives, perspectiveComponents } from './perspectives';

const theme = {
  '--color-base': config.palette.base, '--color-highlight': config.palette.highlight,
  '--color-surface': config.palette.surface, '--color-text': config.palette.text,
} as CSSProperties;
const clamp = (n: number, count: number) => Math.max(0, Math.min(count - 1, n));
function fromUrl() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('perspective') ?? params.get('chapter');
  const index = perspectives.findIndex(p => p.slug === slug);
  const perspective = Math.max(0, index);
  const view = Math.max(0, perspectives[perspective]?.views.findIndex(
    v => v.slug === params.get('view')) ?? 0);
  return { perspective, view, inside: index >= 0 };
}
export function App() {
  const [active, setActive] = useState(fromUrl);
  const [fallback, setFallback] = useState(false);
  const title = config.title.trim() || config.id.replace(/^MDT-/, '').replaceAll('-', ' ');
  const item = carouselElements[active.perspective];
  const perspective = perspectives[active.perspective];
  const Perspective = perspectiveComponents[active.perspective];
  function navigate(index: number, view = 0, inside = active.inside, push = true) {
    const nextIndex = clamp(index, perspectives.length);
    const selected = perspectives[nextIndex];
    if (!selected) return;
    const nextView = clamp(view, selected.views.length);
    setActive({ perspective: nextIndex, view: nextView, inside });
    const url = new URL(window.location.href);
    url.searchParams.delete('chapter');
    if (inside) {
      url.searchParams.set('perspective', selected.slug);
      if (selected.views[nextView]) url.searchParams.set('view', selected.views[nextView].slug);
    } else {
      url.searchParams.delete('perspective'); url.searchParams.delete('view');
    }
    if (push) window.history.pushState(null, '', url);
  }
  const enter = (index: number) => navigate(index, 0, true);
  const exit = () => navigate(active.perspective, 0, false);
  function activate(item: (typeof carouselElements)[number]) {
    const destination = new URL(item.destination, window.location.href);
    const slug = destination.searchParams.get('perspective');
    const index = perspectives.findIndex(p => p.slug === slug);
    if (index < 0) { window.location.assign(destination.href); return; }
    const view = perspectives[index].views.findIndex(v => v.slug === destination.searchParams.get('view'));
    navigate(index, Math.max(0, view), true);
  }
  useEffect(() => { document.title = title + ' · Meditations'; }, [title]);
  useEffect(() => {
    const onPop = () => setActive(fromUrl());
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey ||
          event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'Escape' && active.inside) exit();
      else if (event.key === 'Enter' && !active.inside) enter(active.perspective);
      else if (!active.inside && event.key === 'ArrowRight') navigate(active.perspective + 1, 0, false);
      else if (!active.inside && event.key === 'ArrowLeft') navigate(active.perspective - 1, 0, false);
      else if (active.inside && event.key === 'ArrowDown') navigate(active.perspective, active.view + 1, true);
      else if (active.inside && event.key === 'ArrowUp') navigate(active.perspective, active.view - 1, true);
      else return;
      event.preventDefault();
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('keydown', onKey); };
  }, [active]);
  return <main className="exhibition" style={theme}>
    <header className="exhibition-header">
      <span className="exhibition-brand">MEDITATIONS</span><span className="exhibition-index">{title} / {config.id}</span>
    </header>
    {active.inside && perspective && Perspective ? <Perspective
      perspective={perspective} activeView={active.view}
      onSelectView={index => navigate(active.perspective, index, true)}
      onChapterLink={file => {
        const index = perspectives.findIndex(p => p.file === file);
        if (index < 0) return false;
        navigate(index, 0, true); return true;
      }} onBack={exit} /> : <>
      <div className="exhibition-visual" aria-hidden="true">
        {fallback ? <div className="sculpture-fallback" /> : <Carousel3D
          elements={carouselElements} visuals={carouselVisuals} activeIndex={active.perspective}
          onActivate={activate} onUnavailable={() => setFallback(true)} />}
      </div>
      <div className="exhibition-vignette" aria-hidden="true" />
      <section className="exhibition-story" aria-label="Meditation perspectives">
        <p className="exhibition-kicker">PERSPECTIVE {active.perspective + 1} / {perspectives.length}</p>
        <h1>{item?.title ?? title}</h1>
        <p className="exhibition-concept">{item?.subtitle ?? 'Explore the Meditation.'}</p>
        {item && <button className="exhibition-enter" type="button" onClick={() => activate(item)}>
          Enter perspective</button>}
      </section>
      <PerspectiveNavigation perspectives={perspectives} active={active.perspective}
        onSelect={index => navigate(index, 0, false)} />
    </>}
    <footer className="exhibition-footer"><span>MEDITATION → PERSPECTIVES → VIEWS</span>
      <span>{fallback ? '2D fallback' : '3D CAROUSEL'}</span></footer>
  </main>;
}
