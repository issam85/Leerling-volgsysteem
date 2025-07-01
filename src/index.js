import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Zorg dat Tailwind hier geïmporteerd/geconfigureerd is
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { setupGlobalErrorHandling } from './utils/errorHandling';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import performanceMonitor from './utils/performanceMonitor';

// Initialize global error handling
setupGlobalErrorHandling();

// Start performance monitoring
performanceMonitor.startMeasure('app-render');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// End performance monitoring after render
setTimeout(() => {
  performanceMonitor.endMeasure('app-render');
}, 100);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('[PWA] Service worker registered successfully - app ready for offline use');
  },
  onUpdate: (registration) => {
    console.log('[PWA] New version available - update notification shown');
  }
});