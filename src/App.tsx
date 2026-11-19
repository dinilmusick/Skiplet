import { useEffect, useState, type CSSProperties } from 'react';
import config from '../meditations.config.json';
import { ExhibitionCanvas } from './scene/ExhibitionCanvas';

type PaletteStyle = CSSProperties & Record<`--color-${string}`, string>;

const theme: PaletteStyle = {
  '--color-base': config.palette.base,
  '--color-highlight': config.palette.highlight,
  '--color-surface': config.palette.surface,
  '--color-text': config.palette.text,
};

export function App() {
  const [fallback, setFallback] = useState(false);
  const title = config.title.trim() || config.id.replace(/^MDT-/, '').replaceAll('-', ' ');
  const concept = config.concept.trim();

  useEffect(() => {
    document.title = title + ' · Meditations';
  }, [title]);

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
        <span className="exhibition-index">SKIPLET / {config.id}</span>
      </header>
      <section className="exhibition-story" aria-labelledby="exhibition-title">
        <p className="exhibition-kicker">AN INTERACTIVE EXHIBITION</p>
        <h1 id="exhibition-title">{title}</h1>
        <p className="exhibition-concept">{concept}</p>
        <span className="exhibition-rule" aria-hidden="true" />
      </section>
      <footer className="exhibition-footer">
        <span>IDEA → FORM → EXPERIENCE</span>
        <span>{fallback ? '2D fallback' : 'PROCEDURAL 3D STUDY'}</span>
      </footer>
    </main>
  );
}
