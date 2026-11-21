import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',
  // Prevent multiple React dispatchers after dependency reoptimization.
  resolve: { dedupe: ['react', 'react-dom'] },
  // Pre-bundle related React entry points together to avoid browserHash churn.
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-dom/client',
      'react/jsx-runtime', 'react/jsx-dev-runtime', 'three',
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    // In restricted/embedded browsers the HMR socket can become stale.
    // Opt in only when the environment supports stable hot reloads.
    hmr: mode === 'dev-hmr',
  },
}));
