import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './perspectives/styles/app.css';
import './perspectives/styles/views.css';
import './perspectives/styles/interior.css';
import './libraries/styles/controls.css';
import './libraries/styles/annotated-scenes.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
