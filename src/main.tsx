import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  return <main><p className="eyebrow">MEDITATIONS / SKIPLET</p><h1>Make an idea tangible.</h1><p>Choose a concept, emotion, art direction, and palette in meditations.config.json.</p><div className="orb" aria-hidden="true" /></main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
