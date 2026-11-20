import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './libraries/styles/app.css';
import './libraries/styles/views.css';
import './libraries/styles/interior.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
