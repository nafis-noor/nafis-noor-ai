import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initScrollPerformance } from './utils/performance';
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize iOS Safari passive scroll listeners & 100ms debouncing
try {
  initScrollPerformance();
} catch (e) {
  console.warn('Performance initialization note:', e);
}

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  console.error('Fatal: #root element not found in DOM.');
}
