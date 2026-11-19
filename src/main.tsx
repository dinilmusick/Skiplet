import React from 'react';
import { createRoot } from 'react-dom/client';
import config from '../meditations.config.json';
import './style.css';

type ThemeStyle = React.CSSProperties & Record<`--${string}`, string>;

const theme: ThemeStyle = {
  '--color-base': config.palette.base,
  '--color-highlight': config.palette.highlight,
  '--color-surface': config.palette.surface,
  '--color-text': config.palette.text,
};

function App() {
  return <main style={theme}>
    <p className="eyebrow">MEDITATIONS / SKIPLET</p>
    <h1>Make an idea tangible.</h1>
    <p>Choose a concept, emotion, art direction, and palette in meditations.config.json.</p>
    <div className="orb" aria-hidden="true" />
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
