import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
import App from './App.tsx';
import { AppErrorBoundary } from './components/Common/AppErrorBoundary';
import './index.css';

// Initialize Vercel Web Analytics
inject();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('NASSIB root element #root is missing from index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
